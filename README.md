# F1 League Tracker

A small web app for running a home **F1 sim-racing league**: driver profiles, a season schedule, a **live race-day leaderboard** for the TV, and season standings.

Built for a league where everyone races the same track one at a time on a single sim rig, and each driver's **best single lap** decides the result.

**▶ Live demo: https://mccartybr688.github.io/f1-league-tracker/** (made-up drivers and results)

> This public repo runs on **demo data with made-up drivers**. The real league runs from a private copy.

## Features (planned / in progress)

- [x] Data model: seasons, tracks, drivers, races, results
- [x] Rules enforced in the database: points, tie-breaks, running order, race locking
- [x] Row-level security: signed-in viewers read, only the admin writes
- [x] Season page, driver profiles and race results (Rookie badge in a driver's first season)
- [ ] Admin time entry (DNF, penalties, typo fixes, finalize)
- [ ] Live TV leaderboard: re-sorts as times arrive, gap to leader, newest-time highlight, who's up next
- [ ] Standings and results by race
- [ ] Podium screen and champion crowning

## Stack

- **Supabase**: Postgres, realtime updates, auth, row-level security
- **React + Vite** front end, React Router (hash routing so it runs on any static host)
- Runs in **demo mode** with bundled data when no Supabase settings are present

## How it works

| Piece | What it does |
|---|---|
| `race_leaderboard` view | Live positions, gap to leader, `is_newest`, `is_up_next`, computed in SQL |
| `season_standings` view | Points table with countback tie-break and rookie flag |
| `set_run_order()` | Random for the very first race; after that from standings with the **leader running last** |
| `finalize_race()` / `reopen_race()` | Freeze positions and points, or unlock a race to fix a mistake |
| Realtime on `races` + `race_entries` | The TV display re-reads the leaderboard the moment a time is entered |

League rules are in [`docs/rules.md`](docs/rules.md).

Track outlines come from the open [f1-circuits](https://github.com/bacinger/f1-circuits) dataset (MIT); see [`docs/THIRD_PARTY.md`](docs/THIRD_PARTY.md). Track facts (length, corners, elevation change) and their sources are listed in [`docs/track-data-sources.md`](docs/track-data-sources.md).

## Run it yourself

**Demo mode (no setup):**
```bash
npm install
npm run dev
```
With no `.env`, the app uses `src/data/demo-data.json`, a snapshot exported from the real database views, so demo mode shows exactly what the SQL calculates.

**With your own Supabase project:**

1. Create a free Supabase project.
2. In the SQL Editor, run the files in `supabase/migrations/` in order, then `supabase/seed.sql` for demo data.
3. Create a user under **Authentication → Users**, then make it the admin:
   ```sql
   insert into public.admins (user_id) values ('<user-uuid>');
   ```
4. Copy `.env.example` to `.env`, fill in your project URL and publishable key, then `npm run dev`. Viewers must sign in; signed-out visitors can't read anything.

## License

MIT
