-- =====================================================================
-- F1 League Tracker — schema (step 1: data model)
-- Run in the Supabase SQL editor, or with `supabase db push`.
--
-- Rules built in (see docs/rules.md):
--   * Result = best single valid lap (+ penalty). DNF = no valid lap.
--   * Points per season, default 10-8-6-5-4-3-2-1, no bonus.
--   * Race tie on equal time: the driver who ran earlier wins.
--   * Season tie-break: points, wins, 2nds, 3rds.
--   * Run order: random for the very first race; after that from
--     standings with the leader LAST; drivers with no standings first.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.seasons (
  id                uuid primary key default gen_random_uuid(),
  number            int  not null unique check (number > 0),
  name              text not null,
  status            text not null default 'planned'
                      check (status in ('planned', 'active', 'complete')),
  points_scale      int[] not null default '{10,8,6,5,4,3,2,1}',
  attempts_per_race int  not null default 10 check (attempts_per_race > 0),
  created_at        timestamptz not null default now()
);

-- Catalog of circuits available in the game.
create table public.tracks (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,              -- 'Silverstone'
  grand_prix   text not null,              -- 'British Grand Prix'
  country      text not null,
  country_code char(2),                    -- for a flag emoji / icon
  layout       text not null default 'Standard',  -- e.g. 'Reverse'
  unique (name, layout)
);

create table public.drivers (
  id              uuid primary key default gen_random_uuid(),
  display_name    text not null unique,
  team_name       text not null,           -- family team name
  in_game_car     text,                    -- the car/team picked in the game
  team_color      text check (team_color ~ '^#[0-9A-Fa-f]{6}$'),
  avatar_url      text,
  photo_url       text,
  first_season_id uuid not null references public.seasons (id),
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Who races in which season.
create table public.season_drivers (
  season_id uuid not null references public.seasons (id) on delete cascade,
  driver_id uuid not null references public.drivers (id) on delete cascade,
  primary key (season_id, driver_id)
);

create table public.races (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references public.seasons (id) on delete cascade,
  round        int  not null check (round > 0),
  track_id     uuid not null references public.tracks (id),
  race_date    date,
  status       text not null default 'scheduled'
                 check (status in ('scheduled', 'live', 'finalized')),
  finalized_at timestamptz,
  unique (season_id, round)
);

-- One row per driver per race. Times are milliseconds (1:27.456 = 87456).
create table public.race_entries (
  race_id         uuid not null references public.races (id) on delete cascade,
  driver_id       uuid not null references public.drivers (id),
  run_order       int  not null check (run_order > 0),
  best_lap_ms     int  check (best_lap_ms > 0),
  penalty_ms      int  not null default 0 check (penalty_ms >= 0),
  dnf             boolean not null default false,
  attempts_used   int  check (attempts_used >= 0),
  notes           text,
  time_entered_at timestamptz,             -- drives the "newest time" highlight
  final_position  int,                     -- frozen when the race is finalized
  points          int,                     -- frozen when the race is finalized
  updated_at      timestamptz not null default now(),
  primary key (race_id, driver_id),
  unique (race_id, run_order) deferrable initially deferred,
  check (not (dnf and best_lap_ms is not null))
);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create index on public.races (season_id, status);
create index on public.race_entries (driver_id);

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- Stamp time_entered_at whenever the result itself changes; lock
-- finalized races (reopen_race() unlocks them).
create function public.race_entries_before_write()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.races r
             where r.id = coalesce(new.race_id, old.race_id)
               and r.status = 'finalized') then
    raise exception 'Race is finalized. Reopen it before changing results.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.best_lap_ms is not null or new.dnf then
      new.time_entered_at := clock_timestamp();
    end if;
  elsif new.best_lap_ms is distinct from old.best_lap_ms
     or new.penalty_ms  is distinct from old.penalty_ms
     or new.dnf         is distinct from old.dnf then
    new.time_entered_at := case
      when new.best_lap_ms is null and not new.dnf then null
      else clock_timestamp() end;
  end if;

  new.updated_at := now();
  return new;
end $$;

create trigger race_entries_before_write
before insert or update or delete on public.race_entries
for each row execute function public.race_entries_before_write();

-- A driver's first season is permanent once they have a finalized result.
create function public.drivers_protect_first_season()
returns trigger language plpgsql as $$
begin
  if new.first_season_id is distinct from old.first_season_id
     and exists (select 1 from public.race_entries e
                 join public.races r on r.id = e.race_id
                 where e.driver_id = old.id and r.status = 'finalized') then
    raise exception 'First season is permanent once a driver has results.';
  end if;
  return new;
end $$;

create trigger drivers_protect_first_season
before update on public.drivers
for each row execute function public.drivers_protect_first_season();

-- ---------------------------------------------------------------------
-- Views (security_invoker so they respect row-level security)
-- ---------------------------------------------------------------------

-- Live leaderboard for the TV display and admin page.
create view public.race_leaderboard with (security_invoker = true) as
with e as (
  select re.*,
         case when not re.dnf and re.best_lap_ms is not null
              then re.best_lap_ms + re.penalty_ms end as effective_ms
  from public.race_entries re
)
select
  e.race_id,
  e.driver_id,
  d.display_name,
  d.team_name,
  d.team_color,
  d.avatar_url,
  e.run_order,
  e.best_lap_ms,
  e.penalty_ms,
  e.effective_ms,
  e.dnf,
  case when e.effective_ms is not null then
    row_number() over (partition by e.race_id
                       order by e.effective_ms nulls last, e.run_order)
  end as position,
  e.effective_ms - min(e.effective_ms) over (partition by e.race_id)
    as gap_to_leader_ms,
  case when e.dnf then 'dnf'
       when e.effective_ms is not null then 'done'
       else 'waiting' end as state,
  (e.time_entered_at is not null and e.time_entered_at =
     max(e.time_entered_at) over (partition by e.race_id)) as is_newest,
  (e.effective_ms is null and not e.dnf and e.run_order =
     min(e.run_order) filter (where e.effective_ms is null and not e.dnf)
       over (partition by e.race_id)) as is_up_next,
  e.time_entered_at,
  e.final_position,
  e.points
from e
join public.drivers d on d.id = e.driver_id;

-- Season points table. Only finalized races count.
create view public.season_standings with (security_invoker = true) as
with fr as (
  select re.driver_id, r.season_id, re.final_position, re.points
  from public.race_entries re
  join public.races r on r.id = re.race_id
  where r.status = 'finalized'
),
agg as (
  select sd.season_id,
         sd.driver_id,
         coalesce(sum(fr.points), 0)::int                       as points,
         count(*) filter (where fr.final_position = 1)::int     as wins,
         count(*) filter (where fr.final_position = 2)::int     as seconds,
         count(*) filter (where fr.final_position = 3)::int     as thirds,
         count(fr.driver_id)::int                               as races
  from public.season_drivers sd
  left join fr on fr.driver_id = sd.driver_id and fr.season_id = sd.season_id
  group by sd.season_id, sd.driver_id
)
select
  rank() over (partition by a.season_id
               order by a.points desc, a.wins desc, a.seconds desc, a.thirds desc)
    as position,
  a.*,
  d.display_name,
  d.team_name,
  d.team_color,
  d.avatar_url,
  (d.first_season_id = a.season_id) as is_rookie
from agg a
join public.drivers d on d.id = a.driver_id;

-- ---------------------------------------------------------------------
-- Functions (admin actions)
-- ---------------------------------------------------------------------

create function public.is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create function public.assert_admin()
returns void language plpgsql as $$
begin
  -- Signed-in app users must be admins. Direct SQL (postgres /
  -- service role, e.g. the seed) is allowed.
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    raise exception 'Only the league admin can do that.';
  end if;
end $$;

-- Create entries for every active season driver and set the running order.
-- Safe to re-run before any times are entered.
create function public.set_run_order(p_race_id uuid)
returns void language plpgsql as $$
declare
  v_season  public.seasons;
  v_race    public.races;
  v_source  uuid;   -- season whose standings decide the order
begin
  perform public.assert_admin();

  select * into v_race from public.races where id = p_race_id;
  if v_race is null then raise exception 'Race not found'; end if;
  if v_race.status = 'finalized' then raise exception 'Race is finalized'; end if;
  if exists (select 1 from public.race_entries
             where race_id = p_race_id
               and (best_lap_ms is not null or dnf)) then
    raise exception 'Times already entered; running order is locked.';
  end if;

  select * into v_season from public.seasons where id = v_race.season_id;

  -- Current season if it has finalized races, else the previous season.
  if exists (select 1 from public.races
             where season_id = v_season.id and status = 'finalized') then
    v_source := v_season.id;
  else
    select s.id into v_source
    from public.seasons s
    where s.number < v_season.number
      and exists (select 1 from public.races r
                  where r.season_id = s.id and r.status = 'finalized')
    order by s.number desc
    limit 1;   -- null => fully random (very first race)
  end if;

  insert into public.race_entries (race_id, driver_id, run_order)
  select p_race_id, sd.driver_id, 1000000 + row_number() over ()
  from public.season_drivers sd
  join public.drivers d on d.id = sd.driver_id
  where sd.season_id = v_season.id and d.active
  on conflict (race_id, driver_id) do nothing;

  -- Leader last: order by standings position descending; drivers with no
  -- standings (rookies / newcomers) first; ties shuffled.
  with ordered as (
    select e.driver_id,
           row_number() over (order by st.position desc nulls first, random())
             as new_order
    from public.race_entries e
    left join public.season_standings st
      on st.driver_id = e.driver_id and st.season_id = v_source
    where e.race_id = p_race_id
  )
  update public.race_entries e
  set run_order = o.new_order
  from ordered o
  where e.race_id = p_race_id and e.driver_id = o.driver_id;

  update public.races set status = 'live'
  where id = p_race_id and status = 'scheduled';
end $$;

-- Freeze positions and points, then lock the race.
create function public.finalize_race(p_race_id uuid)
returns void language plpgsql as $$
declare
  v_scale int[];
begin
  perform public.assert_admin();

  if (select status from public.races where id = p_race_id) = 'finalized' then
    raise exception 'Race already finalized';
  end if;
  if not exists (select 1 from public.race_entries where race_id = p_race_id) then
    raise exception 'Race has no entries';
  end if;
  if exists (select 1 from public.race_entries
             where race_id = p_race_id and best_lap_ms is null and not dnf) then
    raise exception 'Every driver needs a time or a DNF before finalizing.';
  end if;

  select s.points_scale into v_scale
  from public.races r join public.seasons s on s.id = r.season_id
  where r.id = p_race_id;

  update public.race_entries e
  set final_position = lb.position,
      points = case when lb.position is null then 0
                    else coalesce(v_scale[lb.position], 0) end
  from public.race_leaderboard lb
  where lb.race_id = e.race_id and lb.driver_id = e.driver_id
    and e.race_id = p_race_id;

  update public.races
  set status = 'finalized', finalized_at = now()
  where id = p_race_id;
end $$;

-- Unlock a finalized race to fix a mistake (then finalize again).
create function public.reopen_race(p_race_id uuid)
returns void language plpgsql as $$
begin
  perform public.assert_admin();
  update public.races set status = 'live', finalized_at = null
  where id = p_race_id and status = 'finalized';
  update public.race_entries set final_position = null, points = null
  where race_id = p_race_id;
end $$;

revoke execute on function public.set_run_order(uuid), public.finalize_race(uuid),
  public.reopen_race(uuid), public.assert_admin() from public, anon;
grant  execute on function public.set_run_order(uuid), public.finalize_race(uuid),
  public.reopen_race(uuid), public.assert_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Row-level security: signed-in family can read; only admins write.
-- Anonymous visitors see nothing (kids' profiles stay private).
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['seasons','tracks','drivers','season_drivers',
                           'races','race_entries'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "family can read" on public.%I
                    for select to authenticated using (true)', t);
    execute format('create policy "admin can write" on public.%I
                    for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Explicit API grants (the project does not auto-grant new tables).
-- Anonymous visitors get nothing; RLS above decides what signed-in users see.
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.seasons, public.tracks, public.drivers, public.season_drivers,
  public.races, public.race_entries to authenticated;
grant select on public.admins, public.race_leaderboard,
  public.season_standings to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.admins enable row level security;
create policy "see own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Realtime: the TV display subscribes to these and re-reads the
-- race_leaderboard view on each change.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.races, public.race_entries;
