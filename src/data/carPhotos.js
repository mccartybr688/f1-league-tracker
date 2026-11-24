// Optional real car photos. A private deployment can add
// family/car-photos.json (and optional cut-out images in
// family/car-photos/); see docs/car-photos.md. This public repo ships
// none, so every car falls back to the drawn illustration.
const found = import.meta.glob('../../family/car-photos.json', { eager: true, import: 'default' })
const images = import.meta.glob('../../family/car-photos/*.{webp,png,jpg}', {
  eager: true, query: '?url', import: 'default',
})
const photos = Object.values(found)[0] ?? { records: {}, teams: {} }

function resolve(p) {
  if (!p) return null
  if (p.file) {
    const src = images[`../../family/car-photos/${p.file}`]
    return src ? { ...p, src, cutout: true } : null
  }
  return p.src ? p : null
}

/** Photo of the car that set a track's lap record, if one is configured. */
export function recordPhoto(track) {
  const base = `${track.record_team}|${track.record_year}`
  return resolve(photos.records?.[`${base}|${track.record_driver}`] ?? photos.records?.[base])
}

/** Photo of a team's current car (for a driver's in-game pick), if configured. */
export function teamPhoto(team) {
  return team ? resolve(photos.teams?.[team.toLowerCase().trim()]) : null
}
