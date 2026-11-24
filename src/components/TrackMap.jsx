import maps from '../data/track-maps.json'

export const SPEED_COLORS = {
  slow: '#ef4444',     // tight / technical
  medium: '#f59e0b',
  fast: '#22c55e',
  straight: '#d7dbe3',
}

/**
 * Circuit map with speed-coloured sections, numbered corners and the
 * start/finish line. Speed classes are estimated from corner radius
 * (see scripts/make_track_maps.py).
 */
export default function TrackMap({ circuitId, name }) {
  const m = circuitId && maps[circuitId]
  if (!m) return null
  const [, , vw, vh] = m.viewBox.split(' ').map(Number)
  const u = Math.max(vw, vh) / 1000            // scale marks to the map size
  return (
    <figure className="track-map">
      <svg viewBox={m.viewBox} role="img" aria-label={`${name} circuit map with numbered corners`}>
        {m.paths.map((p, i) => (
          <path key={`b${i}`} d={p.d} className="track-map__base" strokeWidth={30 * u} />
        ))}
        {m.paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={SPEED_COLORS[p.type]} strokeWidth={13 * u}
                strokeLinecap="round" strokeLinejoin="round" />
        ))}
        <g transform={`translate(${m.sf.x} ${m.sf.y}) rotate(${m.sf.angle + 90})`}>
          <rect x={-22 * u} y={-6 * u} width={44 * u} height={12 * u} fill="#fff" />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={(-22 + k * 11) * u} y={(k % 2 ? 0 : -6) * u} width={11 * u} height={6 * u} fill="#111" />
          ))}
          {[0, 1, 2, 3].map((k) => (
            <rect key={`b${k}`} x={(-22 + k * 11) * u} y={(k % 2 ? -6 : 0) * u} width={11 * u} height={6 * u} fill="#fff" />
          ))}
        </g>
        {/* direction of travel: arrow just past the line, offset to the side */}
        <g transform={`translate(${m.sf.x} ${m.sf.y}) rotate(${m.sf.angle})`}>
          <path d={`M${30 * u} ${-40 * u} h${44 * u}`} stroke="#fff" strokeWidth={4 * u} opacity="0.9" />
          <path d={`M${84 * u} ${-40 * u} l${-16 * u} ${-9 * u} v${18 * u} z`} fill="#fff" opacity="0.9" />
        </g>
        {m.corners.map((c) => (
          <g key={c.n}>
            <line x1={c.x} y1={c.y} x2={c.lx} y2={c.ly} stroke="#6b7280" strokeWidth={2 * u} />
            <circle cx={c.lx} cy={c.ly} r={19 * u} fill="#e9ecf1" stroke={SPEED_COLORS[c.type]} strokeWidth={4 * u} />
            <text x={c.lx} y={c.ly} dy={7 * u} textAnchor="middle" fontSize={20 * u} fontWeight="800" fill="#111">
              {c.n}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        <span className="track-map__legend">
          <i style={{ background: SPEED_COLORS.slow }} /> Slow / technical
          <i style={{ background: SPEED_COLORS.medium }} /> Medium
          <i style={{ background: SPEED_COLORS.fast }} /> Fast
          <i style={{ background: SPEED_COLORS.straight }} /> Straight
        </span>
        <span className="muted small">Corner speeds and numbering estimated from the track shape.</span>
      </figcaption>
    </figure>
  )
}
