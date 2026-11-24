import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRaces, getSeasons, getStandings, getWinners, pickCurrentSeason } from '../data/api'
import { useLoad } from '../lib/useLoad'
import { flag, formatDate } from '../lib/format'
import { Avatar, DriverLink, ErrorNote, Loading, RookieBadge, StatusPill } from '../components/ui'

export default function SeasonPage() {
  const { number } = useParams()
  const navigate = useNavigate()

  const { data, error, loading } = useLoad(async () => {
    const seasons = await getSeasons()
    const season = number
      ? seasons.find((s) => s.number === Number(number))
      : pickCurrentSeason(seasons)
    if (!season) return { seasons, season: null }
    const [races, standings] = await Promise.all([getRaces(season.id), getStandings(season.id)])
    const winners = await getWinners(races.filter((r) => r.status === 'finalized').map((r) => r.id))
    return { seasons, season, races, standings, winners }
  }, [number])

  if (loading) return <Loading />
  if (error) return <ErrorNote error={error} />
  const { seasons, season, races, standings, winners } = data
  if (!season) return <p className="muted">No seasons yet.</p>

  const next = races.find((r) => r.status !== 'finalized')
  const done = races.filter((r) => r.status === 'finalized').length
  const leader = standings[0]?.races ? standings[0] : null

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Season {season.number}</p>
          <h1>{season.name}</h1>
          <p className="muted">
            {done} of {races.length} races complete · {season.attempts_per_race} attempts per
            driver · best single lap counts
          </p>
        </div>
        {seasons.length > 1 && (
          <label className="season-picker">
            <span className="muted">Season</span>
            <select
              value={season.number}
              onChange={(e) => navigate(`/seasons/${e.target.value}`)}
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.number}>
                  {s.number}. {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      <section className="grid-2">
        {next ? (
          <article className={`card next-race ${next.status === 'live' ? 'is-live' : ''}`}>
            <p className="eyebrow">{next.status === 'live' ? 'Racing now' : 'Next race'}</p>
            <h2>
              <span className="flag">{flag(next.track.country_code)}</span> {next.track.name}
            </h2>
            <p>{next.track.grand_prix}</p>
            <p className="muted">
              Round {next.round} · {formatDate(next.race_date)}
            </p>
            <StatusPill status={next.status} />
          </article>
        ) : (
          <article className="card next-race">
            <p className="eyebrow">Season complete</p>
            <h2>All {races.length} races run</h2>
          </article>
        )}

        <article className="card">
          <p className="eyebrow">Championship leader</p>
          {leader ? (
            <div className="leader">
              <Avatar driver={leader} size={64} />
              <div>
                <h2>
                  <DriverLink driver={leader} />
                  {leader.is_rookie && <RookieBadge />}
                </h2>
                <p className="muted">
                  {leader.team_name} · {leader.points} pts · {leader.wins}{' '}
                  {leader.wins === 1 ? 'win' : 'wins'}
                </p>
              </div>
            </div>
          ) : (
            <p className="muted">No races finished yet.</p>
          )}
        </article>
      </section>

      <section className="card">
        <h2 className="section-title">Calendar</h2>
        <ol className="calendar">
          {races.map((race) => {
            const winner = winners.find((w) => w.race_id === race.id)
            const isNext = race.id === next?.id
            return (
              <li key={race.id} className={`calendar-row ${isNext ? 'is-next' : ''}`}>
                <span className="round">R{race.round}</span>
                <span className="flag">{flag(race.track.country_code)}</span>
                <span className="calendar-track">
                  <strong>{race.track.name}</strong>
                  <span className="muted">{race.track.grand_prix}</span>
                </span>
                <span className="muted calendar-date">{formatDate(race.race_date)}</span>
                <span className="calendar-result">
                  {race.status === 'finalized' ? (
                    <Link to={`/races/${race.id}`} className="result-link">
                      🏆 {winner?.display_name ?? 'Results'} →
                    </Link>
                  ) : race.status === 'live' ? (
                    <Link to={`/races/${race.id}`} className="result-link">
                      Live timing →
                    </Link>
                  ) : (
                    <StatusPill status={race.status} />
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
