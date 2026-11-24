import { Link, useParams } from 'react-router-dom'
import { getRace } from '../data/api'
import { useLoad } from '../lib/useLoad'
import { flag, formatDate, formatGap, formatLap } from '../lib/format'
import { Avatar, DriverLink, ErrorNote, Loading, StatusPill } from '../components/ui'
import StartLights from '../components/StartLights'
import TrackOutline from '../components/TrackOutline'

export default function RacePage() {
  const { id } = useParams()
  const { data, error, loading } = useLoad(() => getRace(id), [id])

  if (loading) return <Loading />
  if (error) return <ErrorNote error={error} />
  if (!data) return <p className="muted">Race not found.</p>
  const { race, rows } = data
  const final = race.status === 'finalized'

  return (
    <div className="stack">
      <Link to={`/seasons/${race.season?.number ?? ''}`} className="back">
        ← {race.season?.name ?? 'Season'}
      </Link>

      <header className="card race-banner">
        <StartLights status={race.status} />
        <div className="race-banner__body">
          <div className="race-banner__text">
            <p className="eyebrow">
              Round {race.round} · {formatDate(race.race_date)}
            </p>
            <h1>
              <span className="flag">{flag(race.track.country_code)}</span> {race.track.name}
            </h1>
            <p className="muted">{race.track.grand_prix}</p>
            <StatusPill status={race.status} />
          </div>
          <TrackOutline circuitId={race.track.circuit_id} name={race.track.name} />
        </div>
      </header>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Driver</th>
              <th className="num">Best lap</th>
              <th className="num">Gap</th>
              {final && <th className="num">Pts</th>}
              <th className="num col-ran">Ran</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.driver_id} className={r.position === 1 ? 'is-winner' : ''}>
                <td className="pos">
                  {r.dnf ? <span className="dnf">DNF</span> : r.position ?? '–'}
                </td>
                <td>
                  <span className="driver-cell" style={{ '--team': r.team_color ?? '#6b7280' }}>
                    <Avatar driver={r} size={32} />
                    <span>
                      <DriverLink driver={r} />
                      <span className="muted small block team-sub">{r.team_name}</span>
                    </span>
                  </span>
                </td>
                <td className="num mono">
                  {r.state === 'waiting' ? (
                    r.is_up_next ? <span className="up-next">Up next</span> : <span className="waiting">Waiting</span>
                  ) : (
                    formatLap(r.effective_ms)
                  )}
                  {r.penalty_ms > 0 && (
                    <span className="penalty"> (+{r.penalty_ms / 1000}s pen.)</span>
                  )}
                </td>
                <td className="num mono muted">{formatGap(r.gap_to_leader_ms)}</td>
                {final && <td className="num">{r.points}</td>}
                <td className="num muted col-ran">#{r.run_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!final && (
          <p className="muted small">
            Race in progress. Results become official when the race is finalized.
          </p>
        )}
      </section>
    </div>
  )
}
