# Track data sources

Figures in `supabase/migrations/0003_track_facts.sql`, gathered November 2026.
They describe the real-world circuits; the game's versions can differ slightly.

| Field | Source |
|---|---|
| Length, corners | Sportmonks "Formula 1 tracks – 2026 season" reference table. Exceptions: Imola (not on the 2026 calendar) uses F1.com / Wikipedia (4.909 km, 19 corners); Las Vegas uses F1.com's circuit guide (6.201 km); Lusail uses Honda's circuit page for the post-2023 layout (5.419 km). |
| Elevation change | Formula1.com, *Highs and lows – which F1 track has the most elevation changes?* (2016), for 18 circuits. Circuits not in that article (Zandvoort, Imola, Jeddah, Miami, Las Vegas, Lusail) use f1-fansite.com circuit pages. |
| First F1 GP, city, official name | [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT), checked against the sources above. Monaco uses 1950 (first World Championship race) rather than 1929. |

**Elevation change** is the height difference between the highest and lowest points of the lap. It is not total climbing per lap, which is rarely published for race circuits. Sources disagree for some tracks (Zandvoort is quoted anywhere from 9 m to 14 m), so treat small values as approximate.

The newest layouts of Barcelona (2023), Marina Bay (2023), Yas Marina (2021) and Albert Park (2022) may be newer than the elevation survey; their elevation figures come from earlier layouts of the same site.
