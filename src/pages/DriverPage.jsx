import { Link, useParams } from 'react-router-dom'
import { getDriver, getSeasons, pickCurrentSeason } from '../data/api'
import { useLoad } from '../lib/useLoad'
import { flag, formatGap, formatLap, ordinal } from '../lib/format'
import { Avatar, ErrorNote, Loading, RookieBadge } from '../components/ui'
import { TEAM_COLORS } from '../components/CarSide'
import CarPicture from '../components/CarPicture'
import { teamPhoto } from '../data/carPhotos'

export default function DriverPage() {
  const { id } = useParams()
  const { data, error, loading } = useLoad(
    async () => ({ profile: await getDriver(id), seasons: await getSeasons() }),
    [id],
  )

  if (loading) return <Loading />
  if (error) return <ErrorNote error={error} />
  const { profile, seasons } = data
  if (!profile) return <p className="muted">Driver not found.</p>

  const { driver, results, standings } = profile
  const current = pickCurrentSeason(seasons)
  const firstSeason = seasons.find((s) => s.id === driver.first_season_id)
  const isRookie = current?.id === driver.first_season_id
  const currentStanding = standings.find((s) => s.season_id === current?.id)

  const finished = results
    .filter((r) => r.race?.status === 'finalized')
    .sort((a, b) => {
      const sa = seasons.find((s) => s.id === a.race.season_id)?.number ?? 0
      const sb = seasons.find((s) => s.id === b.race.season_id)?.number ?? 0
      return sb - sa || b.race.round - a.race.round
    })
  const bestFinish = Math.min(...finished.map((r) => r.final_position ?? Infinity))
  const totalWins = finished.filter((r) => r.final_position === 1).length
  const podiums = finished.filter((r) => r.final_position && r.final_position <= 3).length

  return (
    <div className="stack">
      <Link to="/drivers" className="back">← All drivers</Link>

      <header className="card profile" style={{ '--team': driver.team_color ?? '#6b7280' }}>
        <Avatar driver={driver} size={112} />
        <div className="profile__main">
          <h1>
            {driver.display_name} {isRookie && <RookieBadge />}
          </h1>
          <dl className="facts">
            <div><dt>Team</dt><dd>{driver.team_name}</dd></div>
            <div><dt>In-game car</dt><dd>{driver.in_game_car ?? 'TBD'}</dd></div>
            <div>
              <dt>First season</dt>
              <dd>
                Season {firstSeason?.number}
                {firstSeason ? ` · ${firstSeason.name}` : ''}
              </dd>
            </div>
          </dl>
        </div>
        <figure className="profile__car">
          <CarPicture
            photo={teamPhoto(driver.in_game_car)}
            team={driver.in_game_car}
            color={TEAM_COLORS[driver.in_game_car?.toLowerCase()] ? undefined : driver.team_color}
            alt={`${driver.display_name}'s car: ${driver.in_game_car ?? 'team colours'}`}
          />
          <figcaption className="muted small">
            {driver.in_game_car ? `Races the ${driver.in_game_car}` : 'Team colours'}
          </figcaption>
        </figure>
      </header>

      <section className="stats">
        <Stat label={current ? `Season ${current.number} position` : 'Position'}
              value={currentStanding?.races ? ordinal(currentStanding.position) : '—'} />
        <Stat label="Season points" value={currentStanding?.points ?? 0} />
        <Stat label="Career wins" value={totalWins} />
        <Stat label="Career podiums" value={podiums} />
        <Stat label="Best finish" value={Number.isFinite(bestFinish) ? ordinal(bestFinish) : '—'} />
      </section>

      <section className="card">
        <h2 className="section-title">Results by race</h2>
        {finished.length === 0 ? (
          <p className="muted">No finished races yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Race</th>
                <th>Finish</th>
                <th className="num">Best lap</th>
                <th className="num">Gap</th>
                <th className="num">Pts</th>
              </tr>
            </thead>
            <tbody>
              {finished.map((r) => (
                <tr key={r.race_id}>
                  <td>
                    <Link to={`/races/${r.race_id}`}>
                      {flag(r.race.track?.country_code)} R{r.race.round} {r.race.track?.name}
                    </Link>
                  </td>
                  <td>{r.dnf ? <span className="dnf">DNF</span> : ordinal(r.final_position)}</td>
                  <td className="num mono">{formatLap(r.effective_ms)}</td>
                  <td className="num mono muted">{formatGap(r.gap_to_leader_ms)}</td>
                  <td className="num">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <span className="stat-value">{value}</span>
      <span className="muted small">{label}</span>
    </div>
  )
}
