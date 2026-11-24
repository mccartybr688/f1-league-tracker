-- Marina Bay was cut from 23 to 19 corners for 2023 (Formula1.com circuit guide).
update public.tracks set corners = 19 where name = 'Marina Bay' and corners = 23;
