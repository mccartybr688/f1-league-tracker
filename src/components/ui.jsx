import { Link } from 'react-router-dom'

/** Photo/avatar if set, otherwise initials on the team color. */
export function Avatar({ driver, size = 48 }) {
  const color = driver.team_color ?? '#6b7280'
  const style = { width: size, height: size, '--team': color, fontSize: size * 0.38 }
  if (driver.avatar_url)
    return <img className="avatar" style={style} src={driver.avatar_url} alt="" />
  const initials = driver.display_name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className="avatar avatar--initials" style={style} aria-hidden="true">
      {initials}
    </span>
  )
}

export function RookieBadge() {
  return (
    <span className="badge badge--rookie" title="First season">
      Rookie
    </span>
  )
}

export function TeamStripe({ color }) {
  return <span className="team-stripe" style={{ '--team': color ?? '#6b7280' }} />
}

export function DriverLink({ driver, children }) {
  return (
    <Link className="driver-link" to={`/drivers/${driver.driver_id ?? driver.id}`}>
      {children ?? driver.display_name}
    </Link>
  )
}

export function Loading() {
  return <p className="muted">Loading…</p>
}

export function ErrorNote({ error }) {
  return (
    <p className="error" role="alert">
      Couldn't load this: {error?.message ?? String(error)}
    </p>
  )
}

export function StatusPill({ status }) {
  const label = { scheduled: 'Upcoming', live: 'Live', finalized: 'Final' }[status]
  return <span className={`pill pill--${status}`}>{label}</span>
}
