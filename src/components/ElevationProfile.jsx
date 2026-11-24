import { useState } from 'react'
import profiles from '../data/track-elevation.json'
import maps from '../data/track-maps.json'
import { SPEED_COLORS } from './TrackMap'

const W = 760
const PAD = { l: 48, r: 22 }

/**
 * Lap profile: elevation (where reliable) with corner markers, plus a
 * speed-coloured "Turn" strip along the lap.
 * Elevation: AWS Terrain Tiles along the circuit outline, smoothed, kept only
 * where it agrees with the published elevation change.
 */
export default function ElevationProfile({ track }) {
  const [hover, setHover] = useState(null)
  const prof = track.circuit_id && profiles[track.circuit_id]
  const map = track.circuit_id && maps[track.circuit_id]
  const change = track.elevation_change_m != null ? Number(track.elevation_change_m) : null
  if (!prof && !map) return null

  const lapKm = (track.length_m ?? prof?.length ?? 5000) / 1000
  const iw = W - PAD.l - PAD.r
  const xf = (f) => PAD.l + f * iw                       // f = fraction of the lap
  const chartH = prof ? 130 : 0
  const top = 22, stripY = top + chartH + (prof ? 14 : 8), H = stripY + 50

  let elevEls = null, yOf = null, max = 0
  if (prof) {
    const e = prof.elev
    max = Math.max(...e)
    const yMax = Math.max(10, Math.ceil(max / 10) * 10)
    yOf = (f) => {                                        // elevation at lap fraction
      const x = f * e.length, i = Math.floor(x) % e.length, t = x - Math.floor(x)
      return e[i] * (1 - t) + e[(i + 1) % e.length] * t
    }
    const y = (v) => top + chartH - (v / yMax) * chartH
    const pts = [...e, e[0]].map((v, i) => `${xf(i / e.length).toFixed(1)},${y(v).toFixed(1)}`)
    const line = `M${pts.join(' L')}`
    const iMin = e.indexOf(Math.min(...e)), iMax = e.indexOf(max)
    elevEls = (
      <g>
        {[0, yMax / 2, yMax].map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="profile__grid" />
            <text x={PAD.l - 6} y={y(t) + 4} className="profile__label" textAnchor="end">{t === 0 ? '0 m' : `+${t} m`}</text>
          </g>
        ))}
        <path d={`${line} L${xf(1)},${top + chartH} L${PAD.l},${top + chartH} Z`} fill="url(#elevFill)" />
        <path d={line} className="profile__line" />
        {[['Low', iMin, 0], ['High', iMax, max]].map(([label, i, v]) => (
          <g key={label}>
            <path d={`M${xf(i / e.length)} ${y(v) - 6} l-5 -8 h10 z`} fill="#e879f9" />
            <text x={xf(i / e.length)} y={y(v) - 17} textAnchor="middle" className="profile__minmax">
              {label}{label === 'High' ? ` +${Math.round(v)} m` : ''}
            </text>
          </g>
        ))}
        {map?.corners.map((c) => (
          <g key={c.n}>
            <line x1={xf(c.at)} x2={xf(c.at)} y1={y(yOf(c.at))} y2={stripY} className="profile__drop" />
            <circle cx={xf(c.at)} cy={y(yOf(c.at))} r="3.5" fill="#e9ecf1" stroke={SPEED_COLORS[c.type]} strokeWidth="2" />
          </g>
        ))}
        {hover != null && (
          <g>
            <line x1={xf(hover)} x2={xf(hover)} y1={top} y2={top + chartH} className="profile__cursor" />
            <text x={Math.min(xf(hover) + 8, W - 120)} y={top + 10} className="profile__tip">
              {(hover * lapKm).toFixed(2)} km · +{Math.round(yOf(hover))} m
            </text>
          </g>
        )}
      </g>
    )
  }

  function onMove(ev) {
    if (!prof) return
    const r = ev.currentTarget.getBoundingClientRect()
    const f = (((ev.clientX - r.left) / r.width) * W - PAD.l) / iw
    setHover(f >= 0 && f < 1 ? f : null)
  }

  return (
    <figure className="elev-profile">
      <svg viewBox={`0 0 ${W} ${H}`} className="profile__svg" onMouseMove={onMove}
           onMouseLeave={() => setHover(null)} role="img"
           aria-label={prof ? `Lap profile: ${Math.round(max)} metres from lowest to highest point` : 'Corner speeds around the lap'}>
        <defs>
          <linearGradient id="elevFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c9ced8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#c9ced8" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        {elevEls}
        {map && (
          <g>
            {map.strip.map(([a, b, t], i) => (
              <rect key={i} x={xf(a)} y={stripY} width={Math.max(0.5, xf(b) - xf(a))} height="7"
                    fill={SPEED_COLORS[t]} opacity={t === 'straight' ? 0.35 : 1} />
            ))}
            <text x={PAD.l - 6} y={stripY + 28} className="profile__label" textAnchor="end">Turn</text>
            {(() => {
              // place each number on the first of three rows where it doesn't touch its neighbour
              const lastX = [-Infinity, -Infinity, -Infinity]
              return map.corners.map((c) => {
                const x = xf(c.at), wNeed = c.n >= 10 ? 15 : 10
                let row = lastX.findIndex((lx) => x - lx >= wNeed)
                if (row < 0) row = lastX.indexOf(Math.min(...lastX))
                lastX[row] = x
                return (
                  <text key={c.n} x={x} y={stripY + 24 + row * 11} textAnchor="middle" className="profile__turn">{c.n}</text>
                )
              })
            })()}
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={xf(1) + 4 + (k % 2) * 5} y={stripY - 3 + Math.floor(k / 2) * 5} width="5" height="5"
                    fill={k === 0 || k === 3 ? '#fff' : '#111'} />
            ))}
          </g>
        )}
      </svg>
      <figcaption className="muted small">
        {prof
          ? 'Height above the lap’s lowest point (approximate, from open terrain data). '
          : change != null && change < 10
            ? `Flat circuit: only ${change} m between the highest and lowest points. `
            : 'No reliable elevation data for this circuit. '}
        Strip colours show estimated corner speeds.
      </figcaption>
    </figure>
  )
}
