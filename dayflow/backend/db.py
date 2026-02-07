import os
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["SUPABASE_ANON_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PHOTO_BUCKET = "photos"


def _extract_hhmm(time_str: str) -> str:
    """Extract HH:MM from various time formats.

    Handles ISO 8601 ("2025-02-07T10:00:00"), plain time ("10:00"), etc.
    """
    if not time_str:
        return "12:00"
    if "T" in time_str:
        # ISO format: extract after the T
        time_part = time_str.split("T", 1)[1]
        return time_part[:5] if len(time_part) >= 5 else "12:00"
    if len(time_str) >= 5 and time_str[2] == ":":
        return time_str[:5]
    return "12:00"


# ── Test ────────────────────────────────────────────────────────────

async def test_connection() -> dict:
    """Simple read-only check to verify Supabase connectivity."""
    result = supabase.table("diaries").select("id").limit(1).execute()
    return {"ok": True, "count": len(result.data)}


# ── Diaries ─────────────────────────────────────────────────────────

async def get_or_create_diary(date: str, user_id: str | None = None) -> dict:
    """Return existing diary for a date (and user_id if given), or create a draft one."""
    query = supabase.table("diaries").select("*").eq("date", date)
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.limit(1).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]

    row = {"date": date}
    if user_id:
        row["user_id"] = user_id
    result = supabase.table("diaries").insert(row).execute()
    return result.data[0]


async def save_diary(date: str, diary_data: dict) -> dict:
    """Save or update a diary entry for a given date.

    If diary_data contains an 'id', it upserts by primary key.
    Otherwise, finds existing diary for the date (and user_id) and updates it, or creates new one.
    """
    row = {"date": date, **diary_data}
    user_id = row.get("user_id")
    if "id" in row:
        result = supabase.table("diaries").upsert(row, on_conflict="id").execute()
    else:
        # Check if diary already exists for this date + user
        existing = await get_or_create_diary(date, user_id=user_id)
        row["id"] = existing["id"]
        result = supabase.table("diaries").upsert(row, on_conflict="id").execute()
    return result.data[0]


async def get_diary(date: str) -> dict | None:
    """Fetch a single diary entry by date."""
    result = (
        supabase.table("diaries")
        .select("*, timeline_events(*)")
        .eq("date", date)
        .limit(1)
        .execute()
    )
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def get_diary_by_id(diary_id: str) -> dict | None:
    """Fetch a single diary entry by ID, with timeline events and photos."""
    result = (
        supabase.table("diaries")
        .select("*, timeline_events(*), photos(*)")
        .eq("id", diary_id)
        .limit(1)
        .execute()
    )
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def get_diary_history(limit: int = 30, user_id: str | None = None) -> list:
    """Fetch the most recent diary entries with their timeline events and photos (excluding soft-deleted)."""
    query = (
        supabase.table("diaries")
        .select("*, timeline_events(id, time, emoji, title, spending, source, is_deleted), photos(url, extracted_time)")
    )
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.order("date", desc=True).limit(limit).execute()
    # Filter out soft-deleted timeline events and set primary photo
    for diary in result.data:
        if diary.get("timeline_events"):
            diary["timeline_events"] = [
                e for e in diary["timeline_events"] if not e.get("is_deleted")
            ]
        # Set photo_url to first photo's URL if available
        photos = diary.get("photos", [])
        if photos and len(photos) > 0:
            # Sort photos by extracted_time if available, then pick first
            sorted_photos = sorted(photos, key=lambda p: p.get("extracted_time") or "00:00")
            diary["photo_url"] = sorted_photos[0].get("url")
        else:
            diary["photo_url"] = None
    return result.data


async def delete_diary(diary_id: str) -> bool:
    """Delete a diary entry by ID. Cascade deletes timeline_events, photos, etc."""
    supabase.table("diaries").delete().eq("id", diary_id).execute()
    return True


TIMELINE_FIELDS = {"time", "emoji", "title", "description", "location", "source", "source_id",
                    "spending", "is_deleted", "photo_url", "photo_analysis", "sort_order"}


def _clean_timeline_row(diary_id: str, event: dict) -> dict:
    """Build a timeline_events row with only known DB columns, dropping Nones."""
    row = {"diary_id": diary_id}
    for k, v in event.items():
        if k in TIMELINE_FIELDS and v is not None:
            row[k] = v
    return row


# ── Timeline Events ─────────────────────────────────────────────────

async def save_timeline_events(diary_id: str, events: list[dict]) -> list:
    """Bulk-insert timeline events linked to a diary entry."""
    rows = [_clean_timeline_row(diary_id, e) for e in events]
    for r in rows:
        if "spending" in r:
            r["spending"] = round(r["spending"])
    result = supabase.table("timeline_events").insert(rows).execute()
    return result.data


async def get_active_timeline(diary_id: str) -> list:
    """Return timeline events that are not soft-deleted, sorted by time."""
    result = (
        supabase.table("timeline_events")
        .select("*")
        .eq("diary_id", diary_id)
        .eq("is_deleted", False)
        .order("time")
        .execute()
    )
    return result.data


async def add_manual_event(diary_id: str, event: dict) -> dict:
    """Insert a single manual timeline event."""
    row = _clean_timeline_row(diary_id, {**event, "source": "manual", "is_deleted": False})
    row.setdefault("spending", 0)
    if "spending" in row:
        row["spending"] = round(row["spending"])
    result = supabase.table("timeline_events").insert(row).execute()
    return result.data[0]


async def soft_delete_event(event_id: str) -> dict:
    """Soft-delete a timeline event (set is_deleted=true)."""
    result = (
        supabase.table("timeline_events")
        .update({"is_deleted": True})
        .eq("id", event_id)
        .execute()
    )
    return {"success": True}


async def update_spending(event_id: str, amount: float) -> dict:
    """Update the spending amount on a timeline event."""
    result = (
        supabase.table("timeline_events")
        .update({"spending": round(amount)})
        .eq("id", event_id)
        .execute()
    )
    return result.data[0]


# ── Calendar Events ──────────────────────────────────────────────────

async def save_calendar_events(date: str, events: list[dict], diary_id: str | None = None) -> list:
    """Save Google Calendar events for a date.

    Deletes existing events for the date first, then inserts fresh.
    This avoids partial-index issues with on_conflict.
    """
    # clear old events for this date, then bulk-insert
    supabase.table("calendar_events").delete().eq("date", date).execute()
    # Also delete by calendar_id to avoid unique constraint violations from multi-day events
    cal_ids = [ev.get("calendar_id") for ev in events if ev.get("calendar_id")]
    if cal_ids:
        supabase.table("calendar_events").delete().in_("calendar_id", cal_ids).execute()

    rows = []
    for ev in events:
        row = {"date": date, **ev}
        # Remove fields not in calendar_events table schema
        row.pop("emoji", None)
        # Convert short time "10:00" to full ISO timestamp for start_time/end_time
        for field in ("start_time", "end_time"):
            val = row.get(field)
            if val and len(val) <= 5:  # e.g. "10:00"
                row[field] = f"{date}T{val}:00"
        if diary_id:
            row["diary_id"] = diary_id
        rows.append(row)

    result = supabase.table("calendar_events").insert(rows).execute()
    return result.data


async def get_calendar_events(date: str) -> list:
    """Fetch all calendar events for a given date, ordered by start_time."""
    result = (
        supabase.table("calendar_events")
        .select("*")
        .eq("date", date)
        .order("start_time")
        .execute()
    )
    return result.data


async def delete_calendar_events(date: str) -> None:
    """Delete all calendar events for a date (useful before re-import)."""
    supabase.table("calendar_events").delete().eq("date", date).execute()


# ── Photos ───────────────────────────────────────────────────────────

async def save_photo_event(diary_id: str, photo: dict) -> dict:
    """Save a photo to the photos table AND create a timeline_event for it."""
    # 1. Insert into photos table
    photo_result = (
        supabase.table("photos")
        .insert({
            "diary_id": diary_id,
            "url": photo.get("photo_url") or photo.get("url", ""),
            "thumbnail_url": photo.get("thumbnail_url"),
            "ai_analysis": photo.get("ai_analysis") or photo.get("description", ""),
            "extracted_time": photo.get("extracted_time") or photo.get("time"),
            "extracted_location": photo.get("extracted_location") or photo.get("location"),
        })
        .execute()
    )
    photo_row = photo_result.data[0]

    # 2. Insert into timeline_events
    event_result = (
        supabase.table("timeline_events")
        .insert({
            "diary_id": diary_id,
            "time": photo.get("extracted_time") or photo.get("time") or "12:00",
            "emoji": photo.get("emoji", "📸"),
            "title": photo.get("title", "Photo moment"),
            "description": photo.get("description") or (photo.get("ai_analysis") or "")[:100],
            "location": photo.get("extracted_location") or photo.get("location"),
            "source": "photo",
            "source_id": photo_row["id"],
            "photo_url": photo.get("photo_url") or photo.get("url", ""),
            "photo_analysis": photo.get("ai_analysis") or photo.get("description", ""),
            "spending": 0,
            "is_deleted": False,
        })
        .execute()
    )
    event_row = event_result.data[0]

    return {"photo": photo_row, "event": event_row}


async def save_calendar_as_timeline(diary_id: str, events: list[dict]) -> dict:
    """Save calendar events into timeline_events with source='calendar' and dedup by source_id."""
    # Get existing calendar source_ids for this diary
    existing = (
        supabase.table("timeline_events")
        .select("source_id")
        .eq("diary_id", diary_id)
        .eq("source", "calendar")
        .eq("is_deleted", False)
        .execute()
    ).data
    existing_ids = {e["source_id"] for e in existing if e.get("source_id")}

    # Filter out duplicates
    new_events = [e for e in events if not e.get("calendar_id") or e.get("calendar_id") not in existing_ids]
    if not new_events:
        return {"inserted": 0, "events": []}

    rows = []
    for i, e in enumerate(new_events):
        rows.append({
            "diary_id": diary_id,
            "time": _extract_hhmm(e.get("start_time", e.get("time", "12:00"))),
            "emoji": e.get("emoji", "📅"),
            "title": e.get("title", ""),
            "description": e.get("description", ""),
            "location": e.get("location"),
            "source": "calendar",
            "source_id": e.get("calendar_id"),
            "spending": 0,
            "is_deleted": False,
            "sort_order": i,
        })

    result = supabase.table("timeline_events").insert(rows).execute()
    return {"inserted": len(result.data), "events": result.data}


async def save_photo(diary_id: str, photo_data: dict) -> dict:
    """Save a photo record linked to a diary entry."""
    row = {"diary_id": diary_id, **photo_data}
    result = supabase.table("photos").insert(row).execute()
    return result.data[0]


async def save_photos(diary_id: str, photos: list[dict]) -> list:
    """Bulk-insert photo records linked to a diary entry."""
    rows = [{"diary_id": diary_id, **p} for p in photos]
    result = supabase.table("photos").insert(rows).execute()
    return result.data


async def get_photos(diary_id: str) -> list:
    """Fetch all photos for a diary entry."""
    result = (
        supabase.table("photos")
        .select("*")
        .eq("diary_id", diary_id)
        .order("extracted_time")
        .execute()
    )
    return result.data


# ── Storage ──────────────────────────────────────────────────────────

async def upload_photo_to_storage(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """Upload an image to Supabase Storage and return the public URL."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    path = f"{uuid.uuid4().hex}.{ext}"
    supabase.storage.from_(PHOTO_BUCKET).upload(
        path,
        file_bytes,
        file_options={"content-type": content_type},
    )
    public_url = supabase.storage.from_(PHOTO_BUCKET).get_public_url(path)
    return public_url


# ── Thumb ────────────────────────────────────────────────────────────

async def save_thumb(diary_id: str, event_id: str) -> dict:
    """Save a thumb (bookmark / highlight) for a specific event in a diary."""
    result = (
        supabase.table("diaries")
        .update({"thumb_event_id": event_id})
        .eq("id", diary_id)
        .execute()
    )
    return result.data[0]


# ── Users ────────────────────────────────────────────────────────────

async def get_user(user_id: str) -> dict | None:
    """Fetch user profile by auth user_id (UUID)."""
    result = (
        supabase.table("users")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


async def create_or_update_user(user_id: str, user_data: dict) -> dict:
    """Create or update a user profile. Upserts by auth user_id."""
    existing = await get_user(user_id)

    if existing:
        row = {**user_data}
        result = (
            supabase.table("users")
            .update(row)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]
    else:
        row = {"user_id": user_id, **user_data}
        result = supabase.table("users").insert(row).execute()
        return result.data[0]


# ── Google OAuth Token (DB storage) ──────────────────────────────

async def save_google_token(user_id: str, token_data: dict) -> dict:
    """Save Google OAuth token JSON to the users table."""
    existing = await get_user(user_id)
    if existing:
        result = (
            supabase.table("users")
            .update({"google_token": token_data})
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0]
    else:
        result = (
            supabase.table("users")
            .insert({"user_id": user_id, "google_token": token_data})
            .execute()
        )
        return result.data[0]


async def get_google_token(user_id: str) -> dict | None:
    """Load Google OAuth token JSON from the users table."""
    result = (
        supabase.table("users")
        .select("google_token")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if result.data and result.data[0].get("google_token"):
        return result.data[0]["google_token"]
    return None
