import { useState } from 'react'
import profiles from '../data/track-elevation.json'

const W = 600, H = 150
const PAD = { l: 44, r: 10, t: 14, b: 26 }

/**
 * Lap elevation profile (metres above the lap's lowest point vs distance).
 * Data: AWS Terrain Tiles sampled along the circuit outline, smoothed, and
 * only kept where it agrees with the published elevation change.
 */
export default function ElevationProfile({ track }) {
  const [hover, setHover] = useState(null)
  const data = track.circuit_id && profiles[track.circuit_id]
  const change = track.elevation_change_m != null ? Number(track.elevation_change_m) : null

  if (!data) {
    return (
      <p className="muted small profile-note">
        {change != null && change < 10
          ? `Flat circuit: only ${change} m between the highest and lowest points of the lap, so there's no hill profile to draw.`
          : 'No elevation profile for this circuit yet: open terrain data around it isn’t reliable enough to draw one.'}
      </p>
    )
  }

  const elev = data.elev
  const lapKm = (track.length_m ?? data.length) / 1000
  const max = Math.max(...elev)
  const yMax = Math.max(10, Math.ceil(max / 10) * 10)
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b
  const x = (i) => PAD.l + (i / elev.length) * iw
  const y = (v) => PAD.t + ih - (v / yMax) * ih
  const pts = [...elev, elev[0]].map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const line = `M${pts.join(' L')}`
  const area = `${line} L${x(elev.length)},${PAD.t + ih} L${PAD.l},${PAD.t + ih} Z`
  const kmTicks = Array.from({ length: Math.floor(lapKm) + 1 }, (_, k) => k)
  const yTicks = [0, yMax / 2, yMax]

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / iw) * elev.length)
    setHover(i >= 0 && i < elev.length ? i : null)
  }

  return (
    <figure className="elev-profile">
      <svg viewBox={`0 0 ${W} ${H}`} className="profile__svg" onMouseMove={onMove}
           onMouseLeave={() => setHover(null)} role="img"
           aria-label={`Elevation profile: ${Math.round(max)} metres between the lowest and highest points`}>
        <defs>
          <linearGradient id="elevFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c9ced8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#c9ced8" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="profile__grid" />
            <text x={PAD.l - 6} y={y(t) + 4} className="profile__label" textAnchor="end">
              {t === 0 ? '0 m' : `+${t} m`}
            </text>
          </g>
        ))}
        {kmTicks.map((k) => (
          <g key={k}>
            <line x1={x((k / lapKm) * elev.length)} x2={x((k / lapKm) * elev.length)}
                  y1={PAD.t + ih} y2={PAD.t + ih + 4} className="profile__axis" />
            <text x={x((k / lapKm) * elev.length)} y={H - 8} className="profile__label"
                  textAnchor={x((k / lapKm) * elev.length) > W - 30 ? 'end' : 'middle'}>
              {k} km
            </text>
          </g>
        ))}
        <path d={area} fill="url(#elevFill)" />
        <path d={line} className="profile__line" />
        <line x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih} y2={PAD.t + ih} className="profile__axis" />
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} className="profile__cursor" />
            <circle cx={x(hover)} cy={y(elev[hover])} r="4" className="profile__dot" />
            <text x={Math.min(x(hover) + 8, W - 110)} y={PAD.t + 12} className="profile__tip">
              {((hover / elev.length) * lapKm).toFixed(2)} km · +{Math.round(elev[hover])} m
            </text>
          </g>
        )}
      </svg>
      <figcaption className="muted small">
        Height above the lap's lowest point. Approximate, from open terrain data.
      </figcaption>
    </figure>
  )
}
