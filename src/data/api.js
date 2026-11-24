// One data API for the whole app. In demo mode it reads bundled JSON
// (exported from the real database views); otherwise it queries Supabase.
// Both return the same shapes.
import { supabase, isDemo } from '../lib/supabase'
import demo from './demo-data.json'

const byRunOrder = (a, b) => a.run_order - b.run_order
const byPosition = (a, b) =>
  (a.position ?? Infinity) - (b.position ?? Infinity) || byRunOrder(a, b)

async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

function withTrack(race) {
  return { ...race, track: demo.tracks.find((t) => t.id === race.track_id) }
}

/** All seasons, oldest first. */
export async function getSeasons() {
  if (isDemo) return demo.seasons
  return q(supabase.from('seasons').select('*').order('number'))
}

/** The active season, or the most recent one. */
export function pickCurrentSeason(seasons) {
  return (
    seasons.find((s) => s.status === 'active') ?? seasons[seasons.length - 1]
  )
}

/** Races of a season (with track), in round order. */
export async function getRaces(seasonId) {
  if (isDemo)
    return demo.races
      .filter((r) => r.season_id === seasonId)
      .sort((a, b) => a.round - b.round)
      .map(withTrack)
  return q(
    supabase
      .from('races')
      .select('*, track:tracks(*)')
      .eq('season_id', seasonId)
      .order('round'),
  )
}

/** Season points table (only finalized races count). */
export async function getStandings(seasonId) {
  if (isDemo)
    return demo.season_standings
      .filter((s) => s.season_id === seasonId)
      .sort((a, b) => a.position - b.position)
  return q(
    supabase
      .from('season_standings')
      .select('*')
      .eq('season_id', seasonId)
      .order('position'),
  )
}

/** Winners (final_position 1) of the given finalized races. */
export async function getWinners(raceIds) {
  if (!raceIds.length) return []
  if (isDemo)
    return demo.race_leaderboard.filter(
      (r) => raceIds.includes(r.race_id) && r.final_position === 1,
    )
  return q(
    supabase
      .from('race_leaderboard')
      .select('*')
      .in('race_id', raceIds)
      .eq('final_position', 1),
  )
}

/** All drivers. */
export async function getDrivers() {
  if (isDemo) return demo.drivers
  return q(supabase.from('drivers').select('*').order('display_name'))
}

/** One driver plus every result they have, newest race first. */
export async function getDriver(driverId) {
  if (isDemo) {
    const driver = demo.drivers.find((d) => d.id === driverId)
    if (!driver) return null
    const results = demo.race_leaderboard
      .filter((r) => r.driver_id === driverId)
      .map((r) => ({ ...r, race: withTrack(demo.races.find((x) => x.id === r.race_id)) }))
    const standings = demo.season_standings.filter((s) => s.driver_id === driverId)
    return { driver, results, standings }
  }
  const driver = await q(
    supabase.from('drivers').select('*').eq('id', driverId).maybeSingle(),
  )
  if (!driver) return null
  const [rows, standings] = await Promise.all([
    q(supabase.from('race_leaderboard').select('*').eq('driver_id', driverId)),
    q(supabase.from('season_standings').select('*').eq('driver_id', driverId)),
  ])
  const raceIds = rows.map((r) => r.race_id)
  const races = raceIds.length
    ? await q(supabase.from('races').select('*, track:tracks(*)').in('id', raceIds))
    : []
  const results = rows.map((r) => ({ ...r, race: races.find((x) => x.id === r.race_id) }))
  return { driver, results, standings }
}

/** One race (with track and season) and its leaderboard, best first. */
export async function getRace(raceId) {
  if (isDemo) {
    const race = demo.races.find((r) => r.id === raceId)
    if (!race) return null
    return {
      race: {
        ...withTrack(race),
        season: demo.seasons.find((s) => s.id === race.season_id),
      },
      rows: demo.race_leaderboard.filter((r) => r.race_id === raceId).sort(byPosition),
    }
  }
  const race = await q(
    supabase
      .from('races')
      .select('*, track:tracks(*), season:seasons(*)')
      .eq('id', raceId)
      .maybeSingle(),
  )
  if (!race) return null
  const rows = await q(
    supabase.from('race_leaderboard').select('*').eq('race_id', raceId),
  )
  return { race, rows: rows.sort(byPosition) }
}
