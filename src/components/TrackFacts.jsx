import { formatHeight, formatLength } from '../lib/format'

// Spa-Francorchamps (102 m) is the hilliest circuit on the calendar;
// the elevation bar is scaled against it.
const HILLIEST_M = 102.2

export default function TrackFacts({ track }) {
  const length = formatLength(track.length_m)
  const elev = formatHeight(track.elevation_change_m)
  const facts = [
    length && { label: 'Lap length', value: length.km, sub: length.mi },
    track.corners && { label: 'Corners', value: track.corners },
    elev && {
      label: 'Elevation change',
      value: elev.m,
      sub: elev.ft,
      bar: Math.min(1, Number(track.elevation_change_m) / HILLIEST_M),
      title: 'Height difference between the highest and lowest points of the lap',
    },
    track.first_gp && { label: 'First F1 race', value: track.first_gp },
  ].filter(Boolean)

  if (!facts.length) return null
  return (
    <dl className="track-facts">
      {facts.map((f) => (
        <div key={f.label} className="track-fact" title={f.title}>
          <dt>{f.label}</dt>
          <dd>
            <span className="track-fact__value">{f.value}</span>
            {f.sub && <span className="track-fact__sub">{f.sub}</span>}
          </dd>
          {f.bar != null && (
            <span className="elev-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(4, f.bar * 100)}%` }} />
            </span>
          )}
        </div>
      ))}
    </dl>
  )
}
