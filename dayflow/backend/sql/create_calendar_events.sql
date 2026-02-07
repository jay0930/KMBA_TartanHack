-- Google Calendar events imported for a given date
create table if not exists calendar_events (
  id            uuid primary key default gen_random_uuid(),
  diary_id      uuid references diaries(id) on delete cascade,
  date          date not null,
  title         text not null,
  description   text,
  start_time    timestamptz not null,
  end_time      timestamptz,
  location      text,
  all_day       boolean default false,
  source        text default 'google_calendar',
  calendar_id   text,          -- Google Calendar event ID for dedup
  created_at    timestamptz default now()
);

-- Fast lookup by date
create index if not exists idx_calendar_events_date on calendar_events(date);

-- Prevent duplicate imports of the same Google Calendar event
create unique index if not exists idx_calendar_events_calendar_id
  on calendar_events(calendar_id) where calendar_id is not null;
