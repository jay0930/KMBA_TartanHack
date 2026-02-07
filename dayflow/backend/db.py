import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_ANON_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Test ────────────────────────────────────────────────────────────

async def test_connection() -> dict:
    """Insert a test row into diaries and read it back to verify the connection."""
    test_date = "1970-01-01"

    # insert a test row
    insert_result = (
        supabase.table("diaries")
        .insert({"date": test_date, "diary_text": "connection test"})
        .execute()
    )
    row_id = insert_result.data[0]["id"]

    # read it back
    row = (
        supabase.table("diaries")
        .select("*")
        .eq("id", row_id)
        .maybe_single()
        .execute()
    )

    # clean up
    supabase.table("diaries").delete().eq("id", row_id).execute()

    return {"ok": True, "row": row.data}


# ── Diaries ─────────────────────────────────────────────────────────

async def save_diary(date: str, diary_data: dict) -> dict:
    """Save or update a diary entry for a given date.

    If diary_data contains an 'id', it upserts by primary key.
    Otherwise it inserts a new row.
    """
    row = {"date": date, **diary_data}
    if "id" in row:
        result = supabase.table("diaries").upsert(row).execute()
    else:
        result = supabase.table("diaries").insert(row).execute()
    return result.data[0]


async def get_diary(date: str) -> dict | None:
    """Fetch a single diary entry by date."""
    result = (
        supabase.table("diaries")
        .select("*, timeline_events(*)")
        .eq("date", date)
        .maybe_single()
        .execute()
    )
    return result.data


async def get_diary_by_id(diary_id: str) -> dict | None:
    """Fetch a single diary entry by ID, with timeline events and photos."""
    result = (
        supabase.table("diaries")
        .select("*, timeline_events(*), photos(*)")
        .eq("id", diary_id)
        .maybe_single()
        .execute()
    )
    return result.data


async def get_diary_history(limit: int = 30) -> list:
    """Fetch the most recent diary entries with their timeline events."""
    result = (
        supabase.table("diaries")
        .select("*, timeline_events(id, time, emoji, title, spending, source)")
        .order("date", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# ── Timeline Events ─────────────────────────────────────────────────

async def save_timeline_events(diary_id: str, events: list[dict]) -> list:
    """Bulk-insert timeline events linked to a diary entry."""
    rows = [{"diary_id": diary_id, **event} for event in events]
    result = supabase.table("timeline_events").insert(rows).execute()
    return result.data


async def update_spending(event_id: str, amount: int) -> dict:
    """Update the spending amount on a timeline event."""
    result = (
        supabase.table("timeline_events")
        .update({"spending": amount})
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

    rows = []
    for ev in events:
        row = {"date": date, **ev}
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
