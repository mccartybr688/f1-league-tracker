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

-- Track facts (same data as migration 0003, for fresh databases).
update public.tracks t
set official_name = v.official_name, city = v.city, length_m = v.length_m,
    corners = v.corners, elevation_change_m = v.elev, first_gp = v.first_gp
from (values
  ('Albert Park',             'Albert Park Circuit',                     'Melbourne',          5278, 14,   2.6, 1996),
  ('Shanghai',                'Shanghai International Circuit',          'Shanghai',           5451, 16,   7.4, 2004),
  ('Suzuka',                  'Suzuka International Racing Course',      'Suzuka',             5807, 18,  40.4, 1987),
  ('Bahrain',                 'Bahrain International Circuit',           'Sakhir',             5412, 15,  16.9, 2004),
  ('Jeddah',                  'Jeddah Corniche Circuit',                 'Jeddah',             6174, 27,   8.0, 2021),
  ('Miami',                   'Miami International Autodrome',           'Miami',              5412, 19,   3.0, 2022),
  ('Imola',                   'Autodromo Enzo e Dino Ferrari',           'Imola',              4909, 19,  30.0, 1980),
  ('Monaco',                  'Circuit de Monaco',                       'Monte Carlo',        3337, 19,  42.0, 1950),
  ('Barcelona-Catalunya',     'Circuit de Barcelona-Catalunya',          'Barcelona',          4675, 16,  29.6, 1991),
  ('Montreal',                'Circuit Gilles Villeneuve',               'Montreal',           4361, 14,   5.2, 1978),
  ('Red Bull Ring',           'Red Bull Ring',                           'Spielberg',          4318, 10,  63.5, 1970),
  ('Silverstone',             'Silverstone Circuit',                     'Silverstone',        5891, 18,  11.3, 1950),
  ('Spa-Francorchamps',       'Circuit de Spa-Francorchamps',            'Spa-Francorchamps',  7004, 19, 102.2, 1950),
  ('Hungaroring',             'Hungaroring',                             'Budapest',           4381, 14,  34.7, 1986),
  ('Zandvoort',               'Circuit Zandvoort',                       'Zandvoort',          4259, 14,  14.0, 1952),
  ('Monza',                   'Autodromo Nazionale Monza',               'Monza',              5793, 11,  12.8, 1950),
  ('Baku',                    'Baku City Circuit',                       'Baku',               6003, 20,  26.8, 2016),
  ('Marina Bay',              'Marina Bay Street Circuit',               'Singapore',          5063, 23,   5.3, 2008),
  ('Circuit of the Americas', 'Circuit of the Americas',                 'Austin',             5513, 20,  30.9, 2012),
  ('Mexico City',             'Autódromo Hermanos Rodríguez',            'Mexico City',        4304, 17,   2.8, 1963),
  ('Interlagos',              'Autódromo José Carlos Pace',              'São Paulo',          4309, 15,  43.0, 1973),
  ('Las Vegas',               'Las Vegas Strip Circuit',                 'Las Vegas',          6201, 17,   5.0, 2023),
  ('Lusail',                  'Lusail International Circuit',            'Lusail',             5419, 16,   5.0, 2021),
  ('Yas Marina',              'Yas Marina Circuit',                      'Abu Dhabi',          5281, 16,  10.7, 2009)
) as v(name, official_name, city, length_m, corners, elev, first_gp)
where t.name = v.name;

-- Lap records (same data as migration 0004, for fresh databases).
update public.tracks t
set record_ms = v.ms, record_driver = v.driver, record_team = v.team, record_year = v.yr
from (values
  ('Albert Park',              79813, 'Charles Leclerc',    'Ferrari',  2024),
  ('Bahrain',                  91447, 'Pedro de la Rosa',   'McLaren',  2005),
  ('Shanghai',                 92238, 'Michael Schumacher', 'Ferrari',  2004),
  ('Baku',                    103009, 'Charles Leclerc',    'Ferrari',  2019),
  ('Barcelona-Catalunya',      75743, 'Oscar Piastri',      'McLaren',  2025),
  ('Monaco',                   72909, 'Lewis Hamilton',     'Mercedes', 2021),
  ('Montreal',                 73078, 'Valtteri Bottas',    'Mercedes', 2019),
  ('Red Bull Ring',            65619, 'Carlos Sainz',       'McLaren',  2020),
  ('Silverstone',              87097, 'Max Verstappen',     'Red Bull', 2020),
  ('Hungaroring',              76627, 'Lewis Hamilton',     'Mercedes', 2020),
  ('Spa-Francorchamps',       104701, 'Sergio Pérez',       'Red Bull', 2024),
  ('Monza',                    80901, 'Lando Norris',       'McLaren',  2025),
  ('Marina Bay',               93808, 'Lewis Hamilton',     'Ferrari',  2025),
  ('Suzuka',                   90965, 'Kimi Antonelli',     'Mercedes', 2025),
  ('Mexico City',              77774, 'Valtteri Bottas',    'Mercedes', 2021),
  ('Circuit of the Americas',  96169, 'Charles Leclerc',    'Ferrari',  2019),
  ('Interlagos',               70540, 'Valtteri Bottas',    'Mercedes', 2018),
  ('Yas Marina',               85637, 'Kevin Magnussen',    'Haas',     2024),
  ('Imola',                    75484, 'Lewis Hamilton',     'Mercedes', 2020),
  ('Zandvoort',                71097, 'Lewis Hamilton',     'Mercedes', 2021),
  ('Lusail',                   82384, 'Lando Norris',       'McLaren',  2024),
  ('Jeddah',                   90734, 'Lewis Hamilton',     'Mercedes', 2021),
  ('Miami',                    89708, 'Max Verstappen',     'Red Bull', 2023),
  ('Las Vegas',                93365, 'Max Verstappen',     'Red Bull', 2025)
) as v(name, ms, driver, team, yr)
where t.name = v.name;
