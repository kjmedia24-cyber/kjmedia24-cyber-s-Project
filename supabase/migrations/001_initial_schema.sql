-- =============================================
-- Spreado DB 스키마
-- =============================================

-- 유저 바이러스 프로필
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  virus_name   text not null,
  virus_color  text not null,
  points       integer default 100 not null,
  total_cells  integer default 0 not null,
  created_at   timestamptz default now()
);

-- 감염된 셀 (중립 셀은 저장 안 함)
create table if not exists cells (
  h3_index     text primary key,
  owner_id     uuid references profiles(id) on delete set null,
  virus_color  text not null,
  virus_name   text not null default '',
  infected_at  timestamptz default now(),
  strength     integer default 1
);

create index if not exists cells_owner_idx on cells(owner_id);

-- 행동 로그
create table if not exists spread_events (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references profiles(id) on delete set null,
  h3_index     text not null,
  event_type   text check (event_type in ('gps_spread', 'remote_spread', 'disinfect', 'natural')),
  lat          double precision,
  lng          double precision,
  points_spent integer default 0,
  created_at   timestamptz default now()
);

create index if not exists spread_events_actor_idx on spread_events(actor_id);
create index if not exists spread_events_time_idx  on spread_events(created_at desc);

-- 리더보드 뷰 (매 1분 갱신)
create materialized view if not exists leaderboard_view as
select
  p.id,
  p.username,
  p.virus_name,
  p.virus_color,
  coalesce(count(c.h3_index), 0) as cell_count
from profiles p
left join cells c on c.owner_id = p.id
group by p.id
order by cell_count desc;

create unique index if not exists leaderboard_view_id_idx on leaderboard_view(id);

-- Realtime 활성화 (cells 테이블)
alter publication supabase_realtime add table cells;

-- =============================================
-- RLS 정책
-- =============================================

alter table profiles enable row level security;
alter table cells enable row level security;
alter table spread_events enable row level security;

-- profiles: 모두 읽기 가능, 본인만 수정
create policy "profiles_read_all"
  on profiles for select using (true);

create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

-- cells: 모두 읽기 가능, 인증된 유저 쓰기 가능
create policy "cells_read_all"
  on cells for select using (true);

create policy "cells_write_auth"
  on cells for all using (auth.role() = 'authenticated');

-- spread_events: 모두 읽기, 인증된 유저 삽입
create policy "events_read_all"
  on spread_events for select using (true);

create policy "events_insert_auth"
  on spread_events for insert with check (auth.uid() = actor_id);

-- =============================================
-- 헬퍼 함수
-- =============================================

-- 셀 카운트 증가
create or replace function increment_cell_count(user_id uuid)
returns void as $$
  update profiles set total_cells = total_cells + 1 where id = user_id;
$$ language sql security definer;

-- 셀 카운트 감소
create or replace function decrement_cell_count(owner_id uuid)
returns void as $$
  update profiles set total_cells = greatest(0, total_cells - 1) where id = owner_id;
$$ language sql security definer;

-- 리더보드 갱신 함수
create or replace function refresh_leaderboard()
returns void as $$
  refresh materialized view concurrently leaderboard_view;
$$ language sql security definer;

-- =============================================
-- 신규 유저 프로필 자동 생성 트리거 (선택사항)
-- =============================================
-- 온보딩에서 수동으로 생성하므로 주석 처리
-- create or replace function handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (id) values (new.id);
--   return new;
-- end;
-- $$ language plpgsql security definer;
