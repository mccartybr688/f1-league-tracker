-- =====================================================================
-- Track facts shown on the race page: official name, city, length,
-- corners, elevation change (highest point minus lowest point).
-- Sources for every figure: docs/track-data-sources.md
-- =====================================================================

alter table public.tracks
  add column if not exists official_name      text,
  add column if not exists city               text,
  add column if not exists length_m           int  check (length_m > 0),
  add column if not exists corners            int  check (corners > 0),
  add column if not exists elevation_change_m numeric(5,1) check (elevation_change_m >= 0),
  add column if not exists first_gp           int;

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
  ('Marina Bay',              'Marina Bay Street Circuit',               'Singapore',          5063, 19,   5.3, 2008),
  ('Circuit of the Americas', 'Circuit of the Americas',                 'Austin',             5513, 20,  30.9, 2012),
  ('Mexico City',             'Autódromo Hermanos Rodríguez',            'Mexico City',        4304, 17,   2.8, 1963),
  ('Interlagos',              'Autódromo José Carlos Pace',              'São Paulo',          4309, 15,  43.0, 1973),
  ('Las Vegas',               'Las Vegas Strip Circuit',                 'Las Vegas',          6201, 17,   5.0, 2023),
  ('Lusail',                  'Lusail International Circuit',            'Lusail',             5419, 16,   5.0, 2021),
  ('Yas Marina',              'Yas Marina Circuit',                      'Abu Dhabi',          5281, 16,  10.7, 2009)
) as v(name, official_name, city, length_m, corners, elev, first_gp)
where t.name = v.name;
