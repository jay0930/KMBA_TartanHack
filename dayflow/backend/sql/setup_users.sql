-- ============================================================
-- DayFlow: User DB Setup
-- Run this in Supabase SQL Editor (with service_role access)
-- ============================================================

-- 1. profiles 테이블 (auth.users 연동)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url  text,
  timezone    text default 'America/New_York',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. diaries 테이블에 user_id 컬럼 추가
alter table diaries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_diaries_user_id on diaries(user_id);

-- 3. 신규 유저 가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. RLS (Row Level Security)
alter table profiles enable row level security;
alter table diaries enable row level security;

-- profiles: 본인만 읽기/수정
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- diaries: 본인 것만 CRUD
create policy "Users can view own diaries"
  on diaries for select using (auth.uid() = user_id);

create policy "Users can insert own diaries"
  on diaries for insert with check (auth.uid() = user_id);

create policy "Users can update own diaries"
  on diaries for update using (auth.uid() = user_id);

create policy "Users can delete own diaries"
  on diaries for delete using (auth.uid() = user_id);

-- 5. 테스트 사용자 3명 생성
-- (Supabase Auth에 직접 삽입 — SQL Editor에서만 가능)
insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data,
  created_at, updated_at,
  aud, role
) values
  (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'alice@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"display_name": "Alice Kim"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'bob@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"display_name": "Bob Park"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'charlie@test.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"display_name": "Charlie Lee"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  )
on conflict (id) do nothing;

-- 확인 쿼리
-- select p.id, p.display_name, u.email
-- from profiles p join auth.users u on u.id = p.id;
