# Track data sources

Figures in `supabase/migrations/0003_track_facts.sql`, gathered November 2026.
They describe the real-world circuits; the game's versions can differ slightly.

| Field | Source |
|---|---|
| Length, corners | Marina Bay corners = 19 (2023 layout, Formula1.com circuit guide). Otherwise Sportmonks "Formula 1 tracks – 2026 season" reference table. Exceptions: Imola (not on the 2026 calendar) uses F1.com / Wikipedia (4.909 km, 19 corners); Las Vegas uses F1.com's circuit guide (6.201 km); Lusail uses Honda's circuit page for the post-2023 layout (5.419 km). |
| Elevation change | Formula1.com, *Highs and lows – which F1 track has the most elevation changes?* (2016), for 18 circuits. Circuits not in that article (Zandvoort, Imola, Jeddah, Miami, Las Vegas, Lusail) use f1-fansite.com circuit pages. |
| Lap record (time, driver, team, year) | lightsoutblog.com *F1 Lap Records*, official race lap records table (updated 13 Sep 2026). Red Bull Ring uses Carlos Sainz's 1:05.619 (2020); one other source lists a slower 2025 lap. Teams added from each record's season. Records set after September 2026 are not included. |
| Elevation profile (graph) | Sampled from [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Terrarium format, zoom 15) along each circuit outline, median-filtered and smoothed over ~150 m. Shown only for circuits whose sampled height range is within 25% of the published elevation change and at least 10 m. Monaco is excluded (the tunnel runs under buildings the terrain data can't see through). |
| Track map speed colours and corner numbers | Computed by `scripts/make_track_maps.py` from the f1-circuits outlines (resampled every 2 m, smoothed, curvature → effective corner radius). Slow < 45 m radius, medium < 150 m, fast above; thresholds tuned against published low/medium/high corner counts for seven circuits (f1-fansite.com). Corners are numbered in lap order from the outline's start point, capped at the official corner count, so numbering can differ slightly from the official turn numbers. Marina Bay's outline runs backwards in the dataset and is reversed. |
| Track write-ups ("what makes it special", signature corners, sim tips) | Written for this project (`src/data/track-guides.json`), not quoted from other sites. |
| First F1 GP, city, official name | [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) (MIT), checked against the sources above. Monaco uses 1950 (first World Championship race) rather than 1929. |

**Elevation change** is the height difference between the highest and lowest points of the lap. It is not total climbing per lap, which is rarely published for race circuits. Sources disagree for some tracks (Zandvoort is quoted anywhere from 9 m to 14 m), so treat small values as approximate.

The newest layouts of Barcelona (2023), Marina Bay (2023), Yas Marina (2021) and Albert Park (2022) may be newer than the elevation survey; their elevation figures come from earlier layouts of the same site.
