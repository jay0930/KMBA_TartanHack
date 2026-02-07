import asyncio
import base64
import io
import json
import logging
import os
from uuid import UUID

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, field_validator
from dedalus_labs import AsyncDedalus, DedalusRunner
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build as google_build
from google.oauth2.credentials import Credentials

from db import (
    test_connection,
    get_or_create_diary,
    save_diary as db_save_diary,
    save_timeline_events,
    get_active_timeline,
    add_manual_event,
    soft_delete_event,
    update_spending,
    save_thumb as db_save_thumb,
    get_diary_by_id as db_get_diary_by_id,
    get_diary_history as db_get_diary_history,
    save_calendar_events as db_save_calendar_events,
    save_calendar_as_timeline,
    get_calendar_events as db_get_calendar_events,
    delete_calendar_events as db_delete_calendar_events,
    save_photo_event as db_save_photo_event,
    save_photos as db_save_photos,
    get_photos as db_get_photos,
    upload_photo_to_storage,
    delete_diary as db_delete_diary,
    get_user as db_get_user,
    create_or_update_user as db_create_or_update_user,
    save_google_token as db_save_google_token,
    get_google_token as db_get_google_token,
)

logger = logging.getLogger("dayflow")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://kmbatartanhack-production.up.railway.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ─────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return consistent JSON error format for unhandled exceptions."""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail},
        )
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
    )


# ── Simple Auth (hackathon mode) ─────────────────────────────────


def _validate_uuid(value: str, field_name: str) -> str:
    """Validate that a string is a valid UUID."""
    try:
        UUID(value)
        return value
    except (ValueError, AttributeError):
        raise HTTPException(status_code=422, detail=f"Invalid UUID for {field_name}: {value}")


async def get_current_user(request: Request) -> str:
    """Extract user_id from X-User-Id header (hackathon simple auth)."""
    user_id = request.headers.get("X-User-Id", "")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    return user_id


# ── Dedalus client ──────────────────────────────────────────────────
dedalus_client = AsyncDedalus()  # uses DEDALUS_API_KEY env var
runner = DedalusRunner(dedalus_client)


# ── Google Calendar OAuth ─────────────────────────────────────────
GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
DEFAULT_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID", "primary")


def _get_google_flow() -> Flow:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars required")
    return Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{BACKEND_URL}/api/auth/google/callback"],
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=f"{BACKEND_URL}/api/auth/google/callback",
    )


async def _load_user_credentials(user_id: str) -> Credentials | None:
    """Load Google OAuth credentials from DB for a user."""
    token_data = await db_get_google_token(user_id)
    if not token_data:
        return None
    try:
        creds = Credentials.from_authorized_user_info(token_data, GOOGLE_SCOPES)
        if creds and creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
            await db_save_google_token(user_id, json.loads(creds.to_json()))
        return creds
    except Exception:
        return None


async def _save_user_credentials(user_id: str, creds: Credentials) -> None:
    """Persist Google OAuth credentials to DB for a user."""
    await db_save_google_token(user_id, json.loads(creds.to_json()))


# ── Request models ──────────────────────────────────────────────────

class TimelineEvent(BaseModel):
    time: str
    emoji: str | None = None
    title: str
    description: str | None = None
    spending: float = 0
    category: str | None = None
    source: str | None = None


class DiaryOutput(BaseModel):
    diary_text: str | None = None
    spending_insight: str | None = None
    tomorrow_suggestion: str | None = None
    total_spending: float = 0
    thumb_event_id: str | None = None
    diary_preview: str | None = None
    primary_emoji: str | None = None
    photo_url: str | None = None
    timeline: list[TimelineEvent] = []


class SaveDiaryRequest(BaseModel):
    diary: DiaryOutput
    date: str


class UpdateSpendingRequest(BaseModel):
    event_id: str

    @field_validator("event_id")
    @classmethod
    def validate_event_id(cls, v: str) -> str:
        UUID(v)
        return v

    spending: float


class ThumbRequest(BaseModel):
    diary_id: str
    event_id: str

    @field_validator("diary_id", "event_id")
    @classmethod
    def validate_uuids(cls, v: str) -> str:
        UUID(v)
        return v


class PhotoRecord(BaseModel):
    url: str
    thumbnail_url: str | None = None
    ai_analysis: str | None = None
    extracted_time: str | None = None
    extracted_location: str | None = None


class SavePhotosRequest(BaseModel):
    diary_id: str

    @field_validator("diary_id")
    @classmethod
    def validate_diary_id(cls, v: str) -> str:
        UUID(v)
        return v

    photos: list[PhotoRecord]


class CalendarEvent(BaseModel):
    title: str
    description: str | None = None
    start_time: str          # ISO 8601
    end_time: str | None = None
    location: str | None = None
    all_day: bool = False
    calendar_id: str | None = None  # Google event ID for dedup


class ManualEventRequest(BaseModel):
    diary_id: str

    @field_validator("diary_id")
    @classmethod
    def validate_diary_id(cls, v: str) -> str:
        UUID(v)
        return v

    event: TimelineEvent


class SaveCalendarRequest(BaseModel):
    date: str
    events: list[CalendarEvent]
    diary_id: str | None = None


class UserProfile(BaseModel):
    email: str | None = None
    name: str | None = None
    gender: str | None = None
    age: int | None = None
    calendar_url: str | None = None
    photo_url: str | None = None


# ── Public Endpoints (no auth) ─────────────────────────────────────

@app.get("/api/test-db")
async def test_db():
    """Quick smoke-test: verify Supabase connectivity."""
    try:
        result = await test_connection()
        return result
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ── Google OAuth (public — auth flow itself) ────────────────────────

@app.get("/api/auth/google")
async def google_auth_start(user_id: str = Query(...)):
    """Start Google OAuth flow — redirects user to Google consent screen.
    Passes user_id through OAuth state so we can associate the token on callback.
    """
    flow = _get_google_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=user_id,
    )
    return RedirectResponse(url=auth_url)


@app.get("/api/auth/google/callback")
async def google_auth_callback(code: str = Query(...), state: str = Query(default="")):
    """Handle Google OAuth callback — exchange code for token, save to DB, redirect."""
    try:
        flow = _get_google_flow()
        logger.info("Google OAuth callback: exchanging code for token (user_id=%s)", state)
        flow.fetch_token(code=code)
        creds = flow.credentials
        logger.info("Google OAuth: token exchange successful")

        # state contains the user_id passed from the auth start
        user_id = state
        if user_id:
            await _save_user_credentials(user_id, creds)
            logger.info("Google OAuth: credentials saved for user %s", user_id)

        return RedirectResponse(url=f"{FRONTEND_URL}/input?calendar=connected")
    except Exception as e:
        logger.warning("Google OAuth callback error: %s: %s", type(e).__name__, e)
        # Redirect to frontend with error instead of showing raw JSON
        return RedirectResponse(url=f"{FRONTEND_URL}/input?calendar=error")


@app.get("/api/auth/google/status")
async def google_auth_status(user_id: str = Query(...)):
    """Check if Google Calendar is authenticated for a user."""
    creds = await _load_user_credentials(user_id)
    if creds and creds.valid:
        return {"connected": True}
    return {"connected": False}


# ── Authenticated Endpoints ─────────────────────────────────────────

@app.put("/api/timeline/spending")
async def update_timeline_spending(
    body: UpdateSpendingRequest,
    user_id: str = Depends(get_current_user),
):
    """Update the spending amount for a timeline event."""
    row = await update_spending(body.event_id, body.spending)
    return row


@app.get("/api/timeline")
async def get_timeline(
    diary_id: str = Query(...),
    user_id: str = Depends(get_current_user),
):
    """Get active (non-deleted) timeline events for a diary, sorted by time."""
    _validate_uuid(diary_id, "diary_id")
    events = await get_active_timeline(diary_id)
    return {"timeline": events}


@app.post("/api/timeline/add")
async def add_timeline_event(
    body: ManualEventRequest,
    user_id: str = Depends(get_current_user),
):
    """Add a manual timeline event to a diary. Auto-generates emoji via LLM if missing."""
    event_data = body.event.model_dump()

    # Generate emoji if missing or generic default
    if not event_data.get("emoji") or event_data["emoji"] in ("\U0001f4cc", "\U0001f4c5", "\U0001f4dd"):
        try:
            emojis = await _assign_emojis([event_data])
            event_data["emoji"] = emojis[0]
        except Exception:
            event_data["emoji"] = "\U0001f4cc"

    row = await add_manual_event(body.diary_id, event_data)
    return {"event": row}


@app.delete("/api/timeline/{event_id}")
async def delete_timeline_event(
    event_id: str,
    user_id: str = Depends(get_current_user),
):
    """Soft-delete a timeline event (set is_deleted=true)."""
    _validate_uuid(event_id, "event_id")
    result = await soft_delete_event(event_id)
    return result


@app.post("/api/diary/save")
async def save_diary(
    body: SaveDiaryRequest,
    user_id: str = Depends(get_current_user),
):
    """Save a complete diary + timeline events to Supabase."""
    diary_fields = body.diary.model_dump(exclude={"timeline"})
    if "total_spending" in diary_fields:
        diary_fields["total_spending"] = round(diary_fields["total_spending"])
    diary_fields["user_id"] = user_id
    diary_row = await db_save_diary(body.date, diary_fields)

    events = []
    if body.diary.timeline:
        event_dicts = [e.model_dump() for e in body.diary.timeline]
        for ed in event_dicts:
            if "spending" in ed:
                ed["spending"] = round(ed["spending"])
        events = await save_timeline_events(diary_row["id"], event_dicts)

    return {**diary_row, "timeline_events": events}


@app.post("/api/diary/thumb")
async def thumb(
    body: ThumbRequest,
    user_id: str = Depends(get_current_user),
):
    """Save which timeline event was the user's favorite."""
    row = await db_save_thumb(body.diary_id, body.event_id)
    return row


@app.get("/api/diary/history")
async def diary_history(
    limit: int = Query(default=30, ge=1, le=100),
    user_id: str = Depends(get_current_user),
):
    """Return past diaries ordered by date desc, with timeline events."""
    return await db_get_diary_history(limit, user_id=user_id)


@app.get("/api/diary/draft")
async def get_or_create_draft(
    date: str = Query(...),
    user_id: str = Depends(get_current_user),
):
    """Get or create a draft diary for a given date. Returns diary_id."""
    diary = await get_or_create_diary(date, user_id=user_id)
    return diary


@app.get("/api/diary/{diary_id}")
async def get_diary_detail(
    diary_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get a single diary with full timeline events and photos."""
    _validate_uuid(diary_id, "diary_id")
    diary = await db_get_diary_by_id(diary_id)
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    return diary


@app.delete("/api/diary/{diary_id}")
async def delete_diary(
    diary_id: str,
    user_id: str = Depends(get_current_user),
):
    """Delete a diary entry and all related data (cascade)."""
    _validate_uuid(diary_id, "diary_id")
    await db_delete_diary(diary_id)
    return {"ok": True}


# ── Photos ───────────────────────────────────────────────────────────

@app.post("/api/photos/save")
async def save_photos_endpoint(
    body: SavePhotosRequest,
    user_id: str = Depends(get_current_user),
):
    """Save photo records linked to a diary entry."""
    photo_dicts = [p.model_dump() for p in body.photos]
    rows = await db_save_photos(body.diary_id, photo_dicts)
    return {"saved": len(rows), "photos": rows}


@app.get("/api/photos/{diary_id}")
async def get_photos_endpoint(
    diary_id: str,
    user_id: str = Depends(get_current_user),
):
    """Get all photos for a diary entry."""
    _validate_uuid(diary_id, "diary_id")
    photos = await db_get_photos(diary_id)
    return {"photos": photos}


# ── Calendar Events ──────────────────────────────────────────────────

@app.post("/api/calendar/events")
async def save_calendar(
    body: SaveCalendarRequest,
    user_id: str = Depends(get_current_user),
):
    """Import Google Calendar events for a date (upserts by calendar_id).
    Also bridges events into timeline_events for unified timeline.
    """
    event_dicts = [e.model_dump() for e in body.events]

    # Generate emojis via LLM for events that don't have one
    needs_emoji = [e for e in event_dicts if not e.get("emoji")]
    if needs_emoji:
        emojis = await _assign_emojis(needs_emoji)
        emoji_idx = 0
        for e in event_dicts:
            if not e.get("emoji") and emoji_idx < len(emojis):
                e["emoji"] = emojis[emoji_idx]
                emoji_idx += 1

    rows = await db_save_calendar_events(body.date, event_dicts, body.diary_id)

    # Bridge to timeline_events if diary exists
    diary = await get_or_create_diary(body.date, user_id=user_id)
    timeline_result = await save_calendar_as_timeline(diary["id"], event_dicts)

    return {
        "saved": len(rows),
        "events": rows,
        "diary_id": diary["id"],
        "timeline_inserted": timeline_result["inserted"],
    }


@app.get("/api/calendar/fetch")
async def fetch_calendar(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    calendar_id: str = Query(default="", description="Google Calendar ID"),
    tz: str = Query(default="America/New_York", description="Timezone"),
    user_id: str = Depends(get_current_user),
):
    """Fetch Google Calendar events for a date via Google Calendar API,
    save to DB, and return them with emojis."""
    creds = await _load_user_credentials(user_id)

    if not creds:
        raise HTTPException(status_code=401, detail="Google Calendar not connected. Visit /api/auth/google first.")

    # Refresh token if expired
    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request as GoogleRequest
        creds.refresh(GoogleRequest())
        await _save_user_credentials(user_id, creds)

    # Extract calendar ID from URL if needed
    cal_id_raw = calendar_id or DEFAULT_CALENDAR_ID
    cal_id = _extract_calendar_id(cal_id_raw)

    # Fetch events from Google Calendar API
    service = google_build("calendar", "v3", credentials=creds)

    try:
        from datetime import date as date_cls, datetime, timedelta
        from zoneinfo import ZoneInfo

        zone = ZoneInfo(tz)
        d = date_cls.fromisoformat(date)
        day_start = datetime(d.year, d.month, d.day, tzinfo=zone)
        day_end = day_start + timedelta(days=1)

        def _fetch_events(cid: str):
            return service.events().list(
                calendarId=cid,
                timeMin=day_start.isoformat(),
                timeMax=day_end.isoformat(),
                singleEvents=True,
                orderBy="startTime",
            ).execute()

        try:
            result = _fetch_events(cal_id)
        except Exception:
            if cal_id != "primary":
                logger.warning("Calendar ID '%s' not found, falling back to 'primary'", cal_id)
                result = _fetch_events("primary")
            else:
                raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Google Calendar API error: {str(e)}")

    google_events = result.get("items", [])

    if not google_events:
        return {"date": date, "events": [], "diary_id": None, "saved": 0}

    # Convert Google events to our CalendarEvent format
    event_dicts = []
    for ge in google_events:
        start = ge.get("start", {})
        end = ge.get("end", {})
        start_time = start.get("dateTime", start.get("date", ""))
        end_time = end.get("dateTime", end.get("date", ""))
        all_day = "date" in start and "dateTime" not in start

        event_date = start_time[:10]
        if event_date != date:
            continue

        event_dicts.append({
            "title": ge.get("summary", "Untitled"),
            "description": ge.get("description"),
            "start_time": start_time,
            "end_time": end_time,
            "location": ge.get("location"),
            "all_day": all_day,
            "calendar_id": ge.get("id"),
        })

    # Generate emojis via LLM
    emojis = await _assign_emojis(event_dicts)
    for i, e in enumerate(event_dicts):
        e["emoji"] = emojis[i] if i < len(emojis) else "\U0001f4c5"

    # Save to DB
    diary = await get_or_create_diary(date, user_id=user_id)
    rows = await db_save_calendar_events(date, event_dicts, diary["id"])

    # Bridge to timeline_events
    timeline_result = await save_calendar_as_timeline(diary["id"], event_dicts)

    # Return frontend-friendly format
    from db import _extract_hhmm

    frontend_events = []
    for e in event_dicts:
        frontend_events.append({
            "time": _extract_hhmm(e.get("start_time", "")),
            "title": e.get("title", ""),
            "location": e.get("location", ""),
            "emoji": e.get("emoji", "\U0001f4c5"),
            "description": e.get("description", ""),
            "calendar_id": e.get("calendar_id", ""),
        })

    return {
        "date": date,
        "events": frontend_events,
        "diary_id": diary["id"],
        "saved": len(rows),
        "timeline_inserted": timeline_result["inserted"],
    }


@app.get("/api/calendar/events")
async def get_calendar(
    date: str = Query(...),
    user_id: str = Depends(get_current_user),
):
    """Get all calendar events for a date."""
    events = await db_get_calendar_events(date)
    return {"date": date, "events": events}


@app.delete("/api/calendar/events")
async def delete_calendar(
    date: str = Query(...),
    user_id: str = Depends(get_current_user),
):
    """Delete all calendar events for a date (re-import)."""
    await db_delete_calendar_events(date)
    return {"ok": True}


# ── Emoji generation (Dedalus LLM) ──────────────────────────────────

EMOJI_PROMPT = """\
Given these calendar events, assign a single emoji to each that best represents the activity.
Return ONLY a JSON array of emojis in the same order. No markdown, no explanation.

Events:
{events}

Example input: ["Team standup", "Lunch at cafe", "Gym session"]
Example output: ["💻", "🍽️", "🏋️"]
"""


async def _assign_emojis(events: list[dict]) -> list[str]:
    """Call LLM to assign emojis to calendar events in one batch."""
    titles = [e.get("title", "") for e in events]
    if not titles:
        return []

    prompt = EMOJI_PROMPT.replace("{events}", json.dumps(titles))

    try:
        result = await runner.run(
            model="anthropic/claude-sonnet-4-5-20250929",
            input=[{"role": "user", "content": prompt}],
            max_steps=1,
        )
        text = (result.final_output or "").strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        emojis = json.loads(text)
        if isinstance(emojis, list) and len(emojis) == len(titles):
            return emojis
    except Exception:
        pass

    return ["\U0001f4c5"] * len(titles)


# ── EXIF extraction ──────────────────────────────────────────────────

def _extract_exif(raw: bytes) -> dict:
    """Extract time and GPS from EXIF data. Returns dict with 'time' and/or 'gps'."""
    result: dict = {}
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS, GPSTAGS

        img = Image.open(io.BytesIO(raw))
        exif_data = img._getexif()
        if not exif_data:
            return result

        # Extract DateTimeOriginal or DateTimeDigitized
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "DateTimeOriginal" or tag == "DateTimeDigitized":
                # Format: "2025:01:15 14:30:00"
                if isinstance(value, str) and len(value) >= 16:
                    time_part = value.split(" ")[1] if " " in value else None
                    if time_part:
                        result["time"] = time_part[:5]  # "14:30"
                        result["datetime_original"] = value
                break  # DateTimeOriginal is preferred, stop after first match

        # Extract GPS coordinates
        gps_info = exif_data.get(34853)  # GPSInfo tag
        if gps_info:
            def _to_degrees(ref, values):
                d = float(values[0])
                m = float(values[1])
                s = float(values[2])
                dd = d + m / 60 + s / 3600
                if ref in ("S", "W"):
                    dd = -dd
                return round(dd, 6)

            try:
                lat_ref = gps_info.get(1, "N")
                lat = gps_info.get(2)
                lon_ref = gps_info.get(3, "E")
                lon = gps_info.get(4)
                if lat and lon:
                    result["gps"] = {
                        "lat": _to_degrees(lat_ref, lat),
                        "lon": _to_degrees(lon_ref, lon),
                    }
            except (TypeError, IndexError, ZeroDivisionError):
                pass

    except Exception as e:
        logger.debug("EXIF extraction failed for image: %s", e)

    return result


@app.post("/api/emoji/assign")
async def assign_emoji(
    body: dict,
    user_id: str = Depends(get_current_user),
):
    """Assign emojis to a list of event titles via LLM."""
    titles = body.get("titles", [])
    if not titles or not isinstance(titles, list):
        raise HTTPException(status_code=400, detail="'titles' must be a non-empty list")
    if len(titles) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 titles at once")
    events = [{"title": t} for t in titles]
    emojis = await _assign_emojis(events)
    return {"emojis": emojis}


# ── Photo analysis (Dedalus Vision) ─────────────────────────────────

PHOTO_ANALYSIS_PROMPT = """\
Analyze this photo from someone's day and return a JSON object with these fields:
- "title": short 3-6 word description of the activity (e.g. "Latte art photo", "Lunch at noodle bar")
- "emoji": single emoji that best represents this moment
- "description": 1-2 sentence description of what's in the photo

Return ONLY the JSON object, no markdown or extra text. Example:
{"title": "Morning coffee ritual", "emoji": "☕", "description": "A latte with beautiful art at a cozy cafe."}
"""

PHOTO_ANALYSIS_PROMPT_NO_EXIF = """\
Analyze this photo from someone's day and return a JSON object with these fields:
- "time": estimated time of day in HH:MM format (24h). Guess from lighting/context.
- "title": short 3-6 word description of the activity (e.g. "Latte art photo", "Lunch at noodle bar")
- "emoji": single emoji that best represents this moment
- "description": 1-2 sentence description of what's in the photo

Return ONLY the JSON object, no markdown or extra text. Example:
{"time": "09:15", "title": "Morning coffee ritual", "emoji": "☕", "description": "A latte with beautiful art at a cozy cafe."}
"""


async def _analyze_one(raw: bytes, mime: str, filename: str) -> dict:
    """Extract EXIF metadata, then send image to Dedalus for vision analysis."""
    exif = _extract_exif(raw)
    exif_time = exif.get("time")  # e.g. "14:30" or None
    exif_gps = exif.get("gps")   # e.g. {"lat": 40.44, "lon": -79.99} or None

    # Use shorter prompt if EXIF already provides time
    prompt = PHOTO_ANALYSIS_PROMPT if exif_time else PHOTO_ANALYSIS_PROMPT_NO_EXIF

    b64 = base64.b64encode(raw).decode()

    result = await runner.run(
        model="anthropic/claude-sonnet-4-5-20250929",
        input=[
            {"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {
                    "url": f"data:{mime};base64,{b64}",
                }},
            ]},
        ],
        max_steps=1,
    )

    text = result.final_output or ""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "time": "12:00",
            "title": filename or "Photo",
            "emoji": "\U0001f4f8",
            "description": text,
        }

    # EXIF time takes priority over AI-estimated time
    final_time = exif_time or parsed.get("time", "12:00")

    event: dict = {
        "time": final_time,
        "title": parsed.get("title", "Photo"),
        "emoji": parsed.get("emoji", "\U0001f4f8"),
        "description": parsed.get("description", ""),
        "source": "photo",
        "time_source": "exif" if exif_time else "ai",
    }

    if exif_gps:
        event["gps"] = exif_gps

    return event


@app.post("/api/photos/upload")
async def upload_and_analyze_photos(
    files: list[UploadFile] = File(...),
    date: str = Query(default=""),
    user_id: str = Depends(get_current_user),
):
    """Upload photos to Supabase Storage + analyze with AI."""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

    photo_urls = []
    analysis_tasks = []

    for f in files:
        raw = await f.read()
        mime = f.content_type or "image/jpeg"
        fname = f.filename or "photo.jpg"

        try:
            url = await upload_photo_to_storage(raw, fname, mime)
            photo_urls.append({"url": url, "filename": fname})
        except Exception as e:
            photo_urls.append({"url": None, "filename": fname, "error": str(e)})

        analysis_tasks.append(_analyze_one(raw, mime, fname))

    analyses = await asyncio.gather(*analysis_tasks, return_exceptions=True)

    events = []
    for i, a in enumerate(analyses):
        if isinstance(a, Exception):
            events.append({
                "time": "12:00",
                "title": files[i].filename or "Photo",
                "emoji": "\U0001f4f8",
                "description": str(a),
                "source": "photo",
            })
        else:
            if i < len(photo_urls) and photo_urls[i].get("url"):
                a["photo_url"] = photo_urls[i]["url"]
            events.append(a)

    diary_id = None
    if date:
        diary = await get_or_create_diary(date, user_id=user_id)
        diary_id = diary["id"]
        for i, ev in enumerate(events):
            url = photo_urls[i].get("url") if i < len(photo_urls) else None
            if url:
                try:
                    await db_save_photo_event(diary_id, {
                        "photo_url": url,
                        "ai_analysis": ev.get("description", ""),
                        "time": ev.get("time", "12:00"),
                        "emoji": ev.get("emoji", "\U0001f4f8"),
                        "title": ev.get("title", "Photo"),
                        "description": ev.get("description", ""),
                    })
                except Exception:
                    pass

    return {"photos": photo_urls, "events": events, "diary_id": diary_id}


@app.post("/api/photos/analyze")
async def analyze_photos(
    files: list[UploadFile] = File(...),
    user_id: str = Depends(get_current_user),
):
    """Analyze photos with AI only (no storage upload)."""
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")

    analysis_tasks = []
    for f in files:
        raw = await f.read()
        mime = f.content_type or "image/jpeg"
        fname = f.filename or "photo.jpg"
        analysis_tasks.append(_analyze_one(raw, mime, fname))

    analyses = await asyncio.gather(*analysis_tasks, return_exceptions=True)

    events = []
    for i, a in enumerate(analyses):
        if isinstance(a, Exception):
            events.append({
                "time": "12:00",
                "title": files[i].filename or "Photo",
                "emoji": "\U0001f4f8",
                "description": str(a),
                "source": "photo",
            })
        else:
            events.append(a)

    return {"events": events}


# ── User Profile ─────────────────────────────────────────────────────

@app.get("/api/user")
async def get_user_profile(user_id: str = Depends(get_current_user)):
    """Get user profile for the authenticated user."""
    user = await db_get_user(user_id)
    if not user:
        return {
            "user_id": user_id,
            "email": None,
            "name": None,
            "gender": None,
            "age": None,
            "calendar_url": None,
            "photo_url": None,
        }
    return user


@app.post("/api/user")
async def update_user_profile(
    profile: UserProfile,
    user_id: str = Depends(get_current_user),
):
    """Create or update user profile for the authenticated user."""
    user_data = profile.model_dump(exclude_none=False)
    result = await db_create_or_update_user(user_id, user_data)
    return result
