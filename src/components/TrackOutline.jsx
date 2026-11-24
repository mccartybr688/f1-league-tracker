import outlines from '../data/track-outlines.json'

/**
 * Circuit outline drawn from the open f1-circuits dataset
 * (github.com/bacinger/f1-circuits, MIT). Draws itself in on load.
 */
export default function TrackOutline({ circuitId, name, color = 'var(--accent)' }) {
  const shape = circuitId && outlines[circuitId]
  if (!shape) return null
  return (
    <svg
      className="track-outline"
      viewBox={shape.viewBox}
      role="img"
      aria-label={`${name ?? shape.name} layout`}
      style={{ '--line': color }}
    >
      {/* wide soft base, then the crisp line on top */}
      <path className="track-outline__base" d={shape.d} pathLength="1" />
      <path className="track-outline__line" d={shape.d} pathLength="1" />
    </svg>
  )
}
