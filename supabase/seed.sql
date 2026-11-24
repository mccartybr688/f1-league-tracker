-- =====================================================================
-- F1 League Tracker — sample data (made-up drivers, safe for a demo)
-- Run after the migrations (0001, 0002). Season 1: rounds 1-2 finalized,
-- round 3 live with some times in, rounds 4-6 scheduled.
-- =====================================================================

-- Track catalog (circuits from recent F1 games; add/remove to match your game).
insert into public.tracks (name, grand_prix, country, country_code) values
  ('Albert Park',           'Australian Grand Prix',     'Australia',     'AU'),
  ('Shanghai',              'Chinese Grand Prix',        'China',         'CN'),
  ('Suzuka',                'Japanese Grand Prix',       'Japan',         'JP'),
  ('Bahrain',               'Bahrain Grand Prix',        'Bahrain',       'BH'),
  ('Jeddah',                'Saudi Arabian Grand Prix',  'Saudi Arabia',  'SA'),
  ('Miami',                 'Miami Grand Prix',          'United States', 'US'),
  ('Imola',                 'Emilia Romagna Grand Prix', 'Italy',         'IT'),
  ('Monaco',                'Monaco Grand Prix',         'Monaco',        'MC'),
  ('Barcelona-Catalunya',   'Spanish Grand Prix',        'Spain',         'ES'),
  ('Montreal',              'Canadian Grand Prix',       'Canada',        'CA'),
  ('Red Bull Ring',         'Austrian Grand Prix',       'Austria',       'AT'),
  ('Silverstone',           'British Grand Prix',        'United Kingdom','GB'),
  ('Spa-Francorchamps',     'Belgian Grand Prix',        'Belgium',       'BE'),
  ('Hungaroring',           'Hungarian Grand Prix',      'Hungary',       'HU'),
  ('Zandvoort',             'Dutch Grand Prix',          'Netherlands',   'NL'),
  ('Monza',                 'Italian Grand Prix',        'Italy',         'IT'),
  ('Baku',                  'Azerbaijan Grand Prix',     'Azerbaijan',    'AZ'),
  ('Marina Bay',            'Singapore Grand Prix',      'Singapore',     'SG'),
  ('Circuit of the Americas','United States Grand Prix', 'United States', 'US'),
  ('Mexico City',           'Mexico City Grand Prix',    'Mexico',        'MX'),
  ('Interlagos',            'São Paulo Grand Prix',      'Brazil',        'BR'),
  ('Las Vegas',             'Las Vegas Grand Prix',      'United States', 'US'),
  ('Lusail',                'Qatar Grand Prix',          'Qatar',         'QA'),
  ('Yas Marina',            'Abu Dhabi Grand Prix',      'United Arab Emirates', 'AE');

insert into public.seasons (number, name, status)
values (1, 'Winter Season 1 (Demo)', 'active');

insert into public.drivers (display_name, team_name, in_game_car, team_color, first_season_id)
select v.*, (select id from public.seasons where number = 1)
from (values
  ('Captain Apex',    'Pit Lane Pirates',   'McLaren',      '#FF8000'),
  ('Turbo Taco',      'Salsa Speed',        'Ferrari',      '#DC0000'),
  ('Lightning Lou',   'Thunder Garage',     'Red Bull',     '#1E41FF'),
  ('Drift Queen',     'Purple Sector',      'Mercedes',     '#00D2BE'),
  ('Rocket Rex',      'Dino Motorsport',    'Aston Martin', '#006F62'),
  ('Slipstream Sam',  'Basement Bullets',   'Williams',     '#005AFF')
) as v(display_name, team_name, in_game_car, team_color);

insert into public.season_drivers (season_id, driver_id)
select s.id, d.id from public.seasons s cross join public.drivers d
where s.number = 1;

insert into public.races (season_id, round, track_id, race_date)
select s.id, v.round, t.id, v.race_date::date
from public.seasons s
cross join (values
  (1, 'Silverstone',       '2026-12-05'),
  (2, 'Monza',             '2026-12-12'),
  (3, 'Suzuka',            '2026-12-19'),
  (4, 'Spa-Francorchamps', '2027-01-09'),
  (5, 'Interlagos',        '2027-01-16'),
  (6, 'Yas Marina',        '2027-01-23')
) as v(round, track, race_date)
join public.tracks t on t.name = v.track
where s.number = 1;

-- Helper for the sample results only.
create temporary table sample_times (round int, driver text, lap_ms int, dnf bool);
insert into sample_times values
  -- Round 1, Silverstone
  (1, 'Captain Apex',   87412, false),
  (1, 'Turbo Taco',     88950, false),
  (1, 'Lightning Lou',  87905, false),
  (1, 'Drift Queen',    90233, false),
  (1, 'Rocket Rex',     null,  true ),
  (1, 'Slipstream Sam', 89114, false),
  -- Round 2, Monza
  (2, 'Captain Apex',   81877, false),
  (2, 'Turbo Taco',     81402, false),
  (2, 'Lightning Lou',  82560, false),
  (2, 'Drift Queen',    83019, false),
  (2, 'Rocket Rex',     84771, false),
  (2, 'Slipstream Sam', 82110, false);

do $$
declare
  r record;
begin
  for r in select id, round from public.races
           where season_id = (select id from public.seasons where number = 1)
             and round <= 3
           order by round loop
    perform public.set_run_order(r.id);

    if r.round < 3 then
      update public.race_entries e
      set best_lap_ms = st.lap_ms, dnf = st.dnf, attempts_used = 10
      from sample_times st
      join public.drivers d on d.display_name = st.driver
      where st.round = r.round and e.race_id = r.id and e.driver_id = d.id;
      perform public.finalize_race(r.id);
    else
      -- Round 3: first three in running order have set times.
      update public.race_entries e
      set best_lap_ms = v.lap_ms, attempts_used = 10
      from (values (1, 92844), (2, 91560), (3, 93107)) as v(run_order, lap_ms)
      where e.race_id = r.id and e.run_order = v.run_order;
    end if;
  end loop;
end $$;

drop table sample_times;

-- Track outlines (same mapping as migration 0002, for fresh databases).
update public.tracks t set circuit_id = v.circuit_id
from (values
  ('Albert Park','au-1953'), ('Shanghai','cn-2004'), ('Suzuka','jp-1962'),
  ('Bahrain','bh-2002'), ('Jeddah','sa-2021'), ('Miami','us-2022'),
  ('Imola','it-1953'), ('Monaco','mc-1929'), ('Barcelona-Catalunya','es-1991'),
  ('Montreal','ca-1978'), ('Red Bull Ring','at-1969'), ('Silverstone','gb-1948'),
  ('Spa-Francorchamps','be-1925'), ('Hungaroring','hu-1986'), ('Zandvoort','nl-1948'),
  ('Monza','it-1922'), ('Baku','az-2016'), ('Marina Bay','sg-2008'),
  ('Circuit of the Americas','us-2012'), ('Mexico City','mx-1962'),
  ('Interlagos','br-1940'), ('Las Vegas','us-2023'), ('Lusail','qa-2004'),
  ('Yas Marina','ae-2009')
) as v(name, circuit_id)
where t.name = v.name;
