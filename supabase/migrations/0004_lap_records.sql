-- =====================================================================
-- Real-world official race lap record per track (fastest lap set during
-- a Grand Prix race, the figure F1 calls "the lap record").
-- Source: lightsoutblog.com/f1-lap-records (updated 13 Sep 2026); see
-- docs/track-data-sources.md. Update these when a record falls.
-- =====================================================================

alter table public.tracks
  add column if not exists record_ms     int check (record_ms > 0),
  add column if not exists record_driver text,
  add column if not exists record_team   text,
  add column if not exists record_year   int;

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
