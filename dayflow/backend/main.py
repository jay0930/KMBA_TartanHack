import asyncio
import base64

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dedalus_labs import AsyncDedalus, DedalusRunner

import json

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
    save_photo as db_save_photo,
    save_photo_event as db_save_photo_event,
    save_photos as db_save_photos,
    get_photos as db_get_photos,
    upload_photo_to_storage,
    delete_diary as db_delete_diary,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dedalus client ──────────────────────────────────────────────────
dedalus_client = AsyncDedalus()  # uses DEDALUS_API_KEY env var
runner = DedalusRunner(dedalus_client)


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
    spending: float


class ThumbRequest(BaseModel):
    diary_id: str
    event_id: str


class PhotoRecord(BaseModel):
    url: str
    thumbnail_url: str | None = None
    ai_analysis: str | None = None
    extracted_time: str | None = None
    extracted_location: str | None = None


class SavePhotosRequest(BaseModel):
    diary_id: str
    photos: list[PhotoRecord]


class CalendarEvent(BaseModel):
    title: str
    description: str | None = None
    start_time: str          # ISO 8601
    end_time: str | None = None
    location: str | None = None
    all_day: bool = False
    calendar_id: str | None = None  # Google event ID for dedup


class CalendarFetchResponse(BaseModel):
    """Structured output from LLM after reading Google Calendar via MCP."""
    events: list[CalendarEvent]


class ManualEventRequest(BaseModel):
    diary_id: str
    event: TimelineEvent


class SaveCalendarRequest(BaseModel):
    date: str
    events: list[CalendarEvent]
    diary_id: str | None = None


# ── Endpoints ───────────────────────────────────────────────────────

@app.get("/api/test-db")
async def test_db():
    """Quick smoke-test: insert a row, read it back, delete it."""
    try:
        result = await test_connection()
        return result
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.put("/api/timeline/spending")
async def update_timeline_spending(body: UpdateSpendingRequest):
    """Update the spending amount for a timeline event."""
    row = await update_spending(body.event_id, body.spending)
    return row


@app.get("/api/timeline")
async def get_timeline(diary_id: str = Query(...)):
    """Get active (non-deleted) timeline events for a diary, sorted by time."""
    events = await get_active_timeline(diary_id)
    return {"timeline": events}


@app.post("/api/timeline/add")
async def add_timeline_event(body: ManualEventRequest):
    """Add a manual timeline event to a diary. Auto-generates emoji via LLM if missing."""
    event_data = body.event.model_dump()

    # Generate emoji if missing or generic default
    if not event_data.get("emoji") or event_data["emoji"] in ("📌", "📅", "📝"):
        emojis = await _assign_emojis([event_data])
        event_data["emoji"] = emojis[0]

    row = await add_manual_event(body.diary_id, event_data)
    return {"event": row}


@app.delete("/api/timeline/{event_id}")
async def delete_timeline_event(event_id: str):
    """Soft-delete a timeline event (set is_deleted=true)."""
    result = await soft_delete_event(event_id)
    return result


@app.post("/api/diary/save")
async def save_diary(body: SaveDiaryRequest):
    """Save a complete diary + timeline events to Supabase."""
    diary_fields = body.diary.model_dump(exclude={"timeline"})
    # Round spending to int for Supabase integer columns
    if "total_spending" in diary_fields:
        diary_fields["total_spending"] = round(diary_fields["total_spending"])
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
async def thumb(body: ThumbRequest):
    """Save which timeline event was the user's favorite."""
    row = await db_save_thumb(body.diary_id, body.event_id)
    return row


@app.get("/api/diary/history")
async def diary_history(limit: int = Query(default=30, ge=1, le=100)):
    """Return past diaries ordered by date desc, with timeline events."""
    return await db_get_diary_history(limit)


@app.get("/api/diary/draft")
async def get_or_create_draft(date: str = Query(...)):
    """Get or create a draft diary for a given date. Returns diary_id."""
    diary = await get_or_create_diary(date)
    return diary


@app.get("/api/diary/{diary_id}")
async def get_diary_detail(diary_id: str):
    """Get a single diary with full timeline events and photos."""
    diary = await db_get_diary_by_id(diary_id)
    if not diary:
        raise HTTPException(status_code=404, detail="Diary not found")
    return diary


@app.delete("/api/diary/{diary_id}")
async def delete_diary(diary_id: str):
    """Delete a diary entry and all related data (cascade)."""
    await db_delete_diary(diary_id)
    return {"ok": True}


# ── Photos ───────────────────────────────────────────────────────────

@app.post("/api/photos/save")
async def save_photos_endpoint(body: SavePhotosRequest):
    """Save photo records linked to a diary entry."""
    photo_dicts = [p.model_dump() for p in body.photos]
    rows = await db_save_photos(body.diary_id, photo_dicts)
    return {"saved": len(rows), "photos": rows}


@app.get("/api/photos/{diary_id}")
async def get_photos_endpoint(diary_id: str):
    """Get all photos for a diary entry."""
    photos = await db_get_photos(diary_id)
    return {"photos": photos}


# ── Calendar Events ──────────────────────────────────────────────────

@app.post("/api/calendar/events")
async def save_calendar(body: SaveCalendarRequest):
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
    diary = await get_or_create_diary(body.date)
    timeline_result = await save_calendar_as_timeline(diary["id"], event_dicts)

    return {
        "saved": len(rows),
        "events": rows,
        "diary_id": diary["id"],
        "timeline_inserted": timeline_result["inserted"],
    }


@app.get("/api/calendar/fetch")
async def fetch_calendar(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """Fetch Google Calendar events for a date via Dedalus MCP,
    save to DB, and return them with emojis."""

    prompt = CALENDAR_FETCH_PROMPT.replace("{date}", date)

    try:
        result = await runner.run(
            model="anthropic/claude-sonnet-4-5-20250929",
            input=[{"role": "user", "content": prompt}],
            mcp_servers=["google-calendar-mcp"],
            response_format=CalendarFetchResponse,
            max_steps=5,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch calendar from Dedalus MCP: {str(e)}"
        )

    # Parse the structured output
    try:
        if isinstance(result.final_output, str):
            text = result.final_output.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            parsed = CalendarFetchResponse.model_validate_json(text)
        else:
            parsed = result.final_output
        events = parsed.events
    except Exception:
        try:
            raw = json.loads(result.final_output)
            if isinstance(raw, list):
                events = [CalendarEvent(**e) for e in raw]
            elif isinstance(raw, dict) and "events" in raw:
                events = [CalendarEvent(**e) for e in raw["events"]]
            else:
                events = []
        except Exception:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse calendar events from LLM response"
            )

    if not events:
        return {"date": date, "events": [], "diary_id": None, "saved": 0}

    # Generate emojis
    event_dicts = [e.model_dump() for e in events]
    emojis = await _assign_emojis(event_dicts)
    for i, e in enumerate(event_dicts):
        e["emoji"] = emojis[i] if i < len(emojis) else "📅"

    # Save to DB
    diary = await get_or_create_diary(date)
    rows = await db_save_calendar_events(date, event_dicts, diary["id"])

    # Bridge to timeline_events
    timeline_result = await save_calendar_as_timeline(diary["id"], event_dicts)

    # Return frontend-friendly format
    frontend_events = []
    for e in event_dicts:
        start = e.get("start_time", "")
        time_str = start[11:16] if len(start) > 16 else start[:5] if len(start) >= 5 else "12:00"
        frontend_events.append({
            "time": time_str,
            "title": e.get("title", ""),
            "location": e.get("location", ""),
            "emoji": e.get("emoji", "📅"),
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
async def get_calendar(date: str = Query(...)):
    """Get all calendar events for a date."""
    events = await db_get_calendar_events(date)
    return {"date": date, "events": events}


@app.delete("/api/calendar/events")
async def delete_calendar(date: str = Query(...)):
    """Delete all calendar events for a date (re-import)."""
    await db_delete_calendar_events(date)
    return {"ok": True}


# ── Calendar fetch (Dedalus MCP) ──────────────────────────────────

CALENDAR_FETCH_PROMPT = """\
Fetch all Google Calendar events for the date {date}.
For each event, extract:
- title: the event summary/title
- description: the event description (if any)
- start_time: start time in ISO 8601 format (e.g., "2026-02-07T10:00:00")
- end_time: end time in ISO 8601 format (if any)
- location: event location (if any)
- all_day: true if it's an all-day event, false otherwise
- calendar_id: the Google Calendar event ID (for dedup)

Return all events for {date} as a structured list.
If there are no events, return an empty list.
"""


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

    # Fallback: default emoji for all
    return ["📅"] * len(titles)


# ── Photo analysis (Dedalus Vision) ─────────────────────────────────

PHOTO_ANALYSIS_PROMPT = """\
Analyze this photo from someone's day and return a JSON object with these fields:
- "time": estimated time of day in HH:MM format (24h). Guess from lighting/context.
- "title": short 3-6 word description of the activity (e.g. "Latte art photo", "Lunch at noodle bar")
- "emoji": single emoji that best represents this moment
- "description": 1-2 sentence description of what's in the photo

Return ONLY the JSON object, no markdown or extra text. Example:
{"time": "09:15", "title": "Morning coffee ritual", "emoji": "☕", "description": "A latte with beautiful art at a cozy cafe."}
"""


async def _analyze_one(raw: bytes, mime: str, filename: str) -> dict:
    """Send a single image to Dedalus for vision analysis and return structured data."""
    b64 = base64.b64encode(raw).decode()

    result = await runner.run(
        model="anthropic/claude-sonnet-4-5-20250929",
        input=[
            {"role": "user", "content": [
                {"type": "text", "text": PHOTO_ANALYSIS_PROMPT},
                {"type": "image_url", "image_url": {
                    "url": f"data:{mime};base64,{b64}",
                }},
            ]},
        ],
        max_steps=1,
    )

    # Parse structured JSON from AI response
    text = result.final_output or ""
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "time": "12:00",
            "title": filename or "Photo",
            "emoji": "📸",
            "description": text,
        }

    return {
        "time": parsed.get("time", "12:00"),
        "title": parsed.get("title", "Photo"),
        "emoji": parsed.get("emoji", "📸"),
        "description": parsed.get("description", ""),
        "source": "photo",
    }


@app.post("/api/photos/upload")
async def upload_and_analyze_photos(
    files: list[UploadFile] = File(...),
    date: str = Query(default=""),
):
    """Upload photos to Supabase Storage + analyze with AI.
    If date is provided, also saves to photos table + timeline_events.

    Returns:
        - photos: list of { url, filename }
        - events: list of { time, title, emoji, source } (structured PhotoEvent)
        - diary_id: if date was provided
    """
    if len(files) > 10:
        return {"error": "Maximum 10 images allowed"}

    photo_urls = []
    analysis_tasks = []

    for f in files:
        raw = await f.read()
        mime = f.content_type or "image/jpeg"
        fname = f.filename or "photo.jpg"

        # Upload to Supabase Storage
        try:
            url = await upload_photo_to_storage(raw, fname, mime)
            photo_urls.append({"url": url, "filename": fname})
        except Exception as e:
            photo_urls.append({"url": None, "filename": fname, "error": str(e)})

        # Queue analysis
        analysis_tasks.append(_analyze_one(raw, mime, fname))

    # Run all analyses in parallel
    analyses = await asyncio.gather(*analysis_tasks, return_exceptions=True)

    events = []
    for i, a in enumerate(analyses):
        if isinstance(a, Exception):
            events.append({
                "time": "12:00",
                "title": files[i].filename or "Photo",
                "emoji": "📸",
                "description": str(a),
                "source": "photo",
            })
        else:
            # Attach photo URL to the event
            if i < len(photo_urls) and photo_urls[i].get("url"):
                a["photo_url"] = photo_urls[i]["url"]
            events.append(a)

    # If date provided, save to DB (photos + timeline_events)
    diary_id = None
    if date:
        diary = await get_or_create_diary(date)
        diary_id = diary["id"]
        for i, ev in enumerate(events):
            url = photo_urls[i].get("url") if i < len(photo_urls) else None
            if url:
                try:
                    await db_save_photo_event(diary_id, {
                        "photo_url": url,
                        "ai_analysis": ev.get("description", ""),
                        "time": ev.get("time", "12:00"),
                        "emoji": ev.get("emoji", "📸"),
                        "title": ev.get("title", "Photo"),
                        "description": ev.get("description", ""),
                    })
                except Exception:
                    pass  # photo already saved to storage, timeline insert is best-effort

    return {"photos": photo_urls, "events": events, "diary_id": diary_id}


@app.post("/api/photos/analyze")
async def analyze_photos(files: list[UploadFile] = File(...)):
    """Analyze photos with AI only (no storage upload). Returns structured PhotoEvent data."""
    if len(files) > 5:
        return {"error": "Maximum 5 images allowed"}

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
                "emoji": "📸",
                "description": str(a),
                "source": "photo",
            })
        else:
            events.append(a)

    return {"events": events}
