// Optional real car photos. A private deployment can add
// family/car-photos.json (see docs/car-photos.md); this public repo ships
// none, so every car falls back to the drawn illustration.
const found = import.meta.glob('../../family/car-photos.json', { eager: true, import: 'default' })
const photos = Object.values(found)[0] ?? { records: {}, teams: {} }

/** Photo of the car that set a track's lap record, if one is configured. */
export function recordPhoto(track) {
  const base = `${track.record_team}|${track.record_year}`
  return photos.records?.[`${base}|${track.record_driver}`] ?? photos.records?.[base] ?? null
}

/** Photo of a team's current car (for a driver's in-game pick), if configured. */
export function teamPhoto(team) {
  return team ? photos.teams?.[team.toLowerCase().trim()] ?? null : null
}
