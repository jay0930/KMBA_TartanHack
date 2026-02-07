import asyncio
import base64

from fastapi import FastAPI, File, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dedalus_labs import AsyncDedalus, DedalusRunner

from db import (
    test_connection,
    save_diary as db_save_diary,
    save_timeline_events,
    update_spending,
    save_thumb as db_save_thumb,
    get_diary_by_id as db_get_diary_by_id,
    get_diary_history as db_get_diary_history,
    save_calendar_events as db_save_calendar_events,
    get_calendar_events as db_get_calendar_events,
    delete_calendar_events as db_delete_calendar_events,
    save_photo as db_save_photo,
    save_photos as db_save_photos,
    get_photos as db_get_photos,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    spending: int = 0
    category: str | None = None
    source: str | None = None


class DiaryOutput(BaseModel):
    diary_text: str | None = None
    spending_insight: str | None = None
    tomorrow_suggestion: str | None = None
    total_spending: int = 0
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
    spending: int


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


@app.post("/api/diary/save")
async def save_diary(body: SaveDiaryRequest):
    """Save a complete diary + timeline events to Supabase."""
    diary_fields = body.diary.model_dump(exclude={"timeline"})
    diary_row = await db_save_diary(body.date, diary_fields)

    events = []
    if body.diary.timeline:
        event_dicts = [e.model_dump() for e in body.diary.timeline]
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


@app.get("/api/diary/{diary_id}")
async def get_diary_detail(diary_id: str):
    """Get a single diary with full timeline events and photos."""
    diary = await db_get_diary_by_id(diary_id)
    if not diary:
        return {"error": "Diary not found"}
    return diary


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
    """Import Google Calendar events for a date (upserts by calendar_id)."""
    event_dicts = [e.model_dump() for e in body.events]
    rows = await db_save_calendar_events(body.date, event_dicts, body.diary_id)
    return {"saved": len(rows), "events": rows}


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


# ── Photo analysis (Dedalus Vision) ─────────────────────────────────

PHOTO_ANALYSIS_PROMPT = (
    "Analyze this photo from someone's day. "
    "What activity is shown? Where was it taken? "
    "What time of day does it look like? "
    "What food or drinks are visible? "
    "Be concise (2-3 sentences)."
)


async def _analyze_one(file: UploadFile) -> dict:
    """Send a single image to Dedalus for vision analysis."""
    raw = await file.read()
    b64 = base64.b64encode(raw).decode()

    # Detect MIME type from upload or fall back to jpeg
    mime = file.content_type or "image/jpeg"

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

    return {
        "filename": file.filename,
        "analysis": result.final_output,
    }


@app.post("/api/photos/analyze")
async def analyze_photos(files: list[UploadFile] = File(...)):
    """Accept up to 5 images and return AI-powered photo analyses (Dedalus Vision)."""
    if len(files) > 5:
        return {"error": "Maximum 5 images allowed"}

    tasks = [_analyze_one(f) for f in files]
    analyses = await asyncio.gather(*tasks, return_exceptions=True)

    results = []
    for a in analyses:
        if isinstance(a, Exception):
            results.append({"error": str(a)})
        else:
            results.append(a)

    return {"analyses": results}
