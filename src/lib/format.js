/** 87412 -> "1:27.412" */
export function formatLap(ms) {
  if (ms == null) return '—'
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0')
  return `${minutes}:${seconds}`
}

/** 493 -> "+0.493"; 0 -> "Leader" */
export function formatGap(ms) {
  if (ms == null) return ''
  if (ms === 0) return 'Leader'
  return `+${(ms / 1000).toFixed(3)}`
}

/** "2026-12-05" -> "Sat, Dec 5" (date-only, no timezone shift) */
export function formatDate(isoDate) {
  if (!isoDate) return 'Date TBD'
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** "GB" -> 🇬🇧 */
export function flag(countryCode) {
  if (!countryCode) return '🏁'
  return countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

export function ordinal(n) {
  if (n == null) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** 5807 -> { km: "5.807 km", mi: "3.608 mi" } */
export function formatLength(m) {
  if (m == null) return null
  return { km: `${(m / 1000).toFixed(3)} km`, mi: `${(m / 1609.344).toFixed(3)} mi` }
}

/** 40.4 -> { m: "40 m", ft: "133 ft" } (one decimal under 10 m) */
export function formatHeight(m) {
  if (m == null) return null
  const n = Number(m)
  return { m: `${n < 10 ? n.toFixed(1) : Math.round(n)} m`, ft: `${Math.round(n * 3.28084)} ft` }
}
