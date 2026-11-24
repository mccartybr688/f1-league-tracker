import CarPicture from './CarPicture'
import { recordPhoto } from '../data/carPhotos'
import { formatLap } from '../lib/format'

/** Real-world official race lap record for a track, with a team-coloured car. */
export default function LapRecord({ track }) {
  if (!track.record_ms) return null
  return (
    <div className="lap-record">
      <CarPicture
        photo={recordPhoto(track)}
        team={track.record_team}
        alt={`${track.record_team} car from ${track.record_year}`}
      />
      <div className="lap-record__time mono">{formatLap(track.record_ms)}</div>
      <div>
        <strong>{track.record_driver}</strong>
        <span className="muted"> · {track.record_team} · {track.record_year}</span>
      </div>
      <p className="muted small">Real-world F1 race lap record</p>
    </div>
  )
}
