import { Link } from 'react-router-dom'
import { getDrivers, getSeasons, getStandings, pickCurrentSeason } from '../data/api'
import { useLoad } from '../lib/useLoad'
import { ordinal } from '../lib/format'
import { Avatar, ErrorNote, Loading, RookieBadge } from '../components/ui'

export default function DriversPage() {
  const { data, error, loading } = useLoad(async () => {
    const [drivers, seasons] = await Promise.all([getDrivers(), getSeasons()])
    const current = pickCurrentSeason(seasons)
    const standings = current ? await getStandings(current.id) : []
    return { drivers, seasons, current, standings }
  }, [])

  if (loading) return <Loading />
  if (error) return <ErrorNote error={error} />
  const { drivers, seasons, current, standings } = data
  const seasonOf = (id) => seasons.find((s) => s.id === id)

  // Current-season drivers in standings order, then everyone else.
  const ordered = [...drivers].sort((a, b) => {
    const pa = standings.find((s) => s.driver_id === a.id)?.position ?? Infinity
    const pb = standings.find((s) => s.driver_id === b.id)?.position ?? Infinity
    return pa - pb || a.display_name.localeCompare(b.display_name)
  })

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">The grid</p>
          <h1>Drivers</h1>
        </div>
      </header>

      <ul className="driver-grid">
        {ordered.map((d) => {
          const st = standings.find((s) => s.driver_id === d.id)
          const first = seasonOf(d.first_season_id)
          const rookie = current && d.first_season_id === current.id
          return (
            <li key={d.id}>
              <Link to={`/drivers/${d.id}`} className="card driver-card" style={{ '--team': d.team_color ?? '#6b7280' }}>
                <Avatar driver={d} size={72} />
                <div className="driver-card-body">
                  <h2>
                    {d.display_name} {rookie && <RookieBadge />}
                  </h2>
                  <p>{d.team_name}</p>
                  <p className="muted">
                    {d.in_game_car ? `Drives the ${d.in_game_car}` : 'Car TBD'}
                  </p>
                  <p className="muted small">
                    Since Season {first?.number ?? '?'}
                    {st?.races ? ` · ${ordinal(st.position)} · ${st.points} pts` : ''}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
