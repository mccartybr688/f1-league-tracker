-- =====================================================================
-- Track outlines: link each track to its circuit shape.
-- circuit_id is the id used by the open f1-circuits dataset
-- (github.com/bacinger/f1-circuits, MIT), e.g. 'gb-1948' = Silverstone.
-- The app ships the outlines; this column just says which one to draw.
-- =====================================================================

alter table public.tracks add column if not exists circuit_id text;

update public.tracks t
set circuit_id = v.circuit_id
from (values
  ('Albert Park',             'au-1953'),
  ('Shanghai',                'cn-2004'),
  ('Suzuka',                  'jp-1962'),
  ('Bahrain',                 'bh-2002'),
  ('Jeddah',                  'sa-2021'),
  ('Miami',                   'us-2022'),
  ('Imola',                   'it-1953'),
  ('Monaco',                  'mc-1929'),
  ('Barcelona-Catalunya',     'es-1991'),
  ('Montreal',                'ca-1978'),
  ('Red Bull Ring',           'at-1969'),
  ('Silverstone',             'gb-1948'),
  ('Spa-Francorchamps',       'be-1925'),
  ('Hungaroring',             'hu-1986'),
  ('Zandvoort',               'nl-1948'),
  ('Monza',                   'it-1922'),
  ('Baku',                    'az-2016'),
  ('Marina Bay',              'sg-2008'),
  ('Circuit of the Americas', 'us-2012'),
  ('Mexico City',             'mx-1962'),
  ('Interlagos',              'br-1940'),
  ('Las Vegas',               'us-2023'),
  ('Lusail',                  'qa-2004'),
  ('Yas Marina',              'ae-2009')
) as v(name, circuit_id)
where t.name = v.name and t.circuit_id is null;
