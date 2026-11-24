/**
 * Original side-view F1 car illustration (generic shape, no logos or
 * real liveries), painted from a simple team colour palette.
 */

// Generic team colour pairs: [body, accent]. Colours only — no marks.
export const TEAM_COLORS = {
  ferrari: ['#d40000', '#ffd200'],
  mclaren: ['#ff8000', '#1f2937'],
  mercedes: ['#1c1f24', '#00d2be'],
  'red bull': ['#1b2a5e', '#e10600'],
  'aston martin': ['#00594f', '#cedc00'],
  williams: ['#00205b', '#00a3e0'],
  alpine: ['#0b5cad', '#ff87bc'],
  haas: ['#e8e8e8', '#d40000'],
  'racing bulls': ['#e8ecf5', '#2b4fd9'],
  sauber: ['#2d2d2d', '#52e252'],
  audi: ['#cfcfcf', '#d40000'],
  cadillac: ['#111111', '#c9c9c9'],
}

export function teamColors(team, fallback = '#6b7280') {
  const key = team?.toLowerCase().trim()
  return TEAM_COLORS[key] ?? [fallback, '#111827']
}

export default function CarSide({ team, color, accent, className = '', title }) {
  const [body, acc] = color ? [color, accent ?? '#111827'] : teamColors(team)
  const label = title ?? (team ? `${team}-coloured F1 car, side view` : 'F1 car, side view')
  return (
    <svg className={`car-side ${className}`} viewBox="0 0 600 170" role="img" aria-label={label}>
      <ellipse cx="300" cy="152" rx="270" ry="8" fill="#000" opacity="0.35" />
      {/* diffuser */}
      <path d="M56 116 L96 122 L100 136 L62 132 Z" fill="#0d0d0f" />
      {/* floor / plank */}
      <path d="M78 134 H536 L546 139 H70 Z" fill="#0d0d0f" />
      {/* rear wing */}
      <rect x="40" y="36" width="9" height="74" rx="2" fill={body} />
      <rect x="84" y="46" width="6" height="52" fill="#141414" />
      <path d="M32 34 H100 V45 H32 Z" fill={acc} />
      <path d="M36 50 H96 V57 H36 Z" fill={body} />
      {/* main body */}
      <path
        d="M58 112 L60 94 L100 90 L136 84 Q196 64 246 50 L258 40 Q266 34 278 37 L294 56
           Q304 60 320 60 L332 58 Q346 56 356 64 L366 74 Q430 86 480 98 L552 112
           Q560 116 552 120 L480 126 L420 128 L362 126 L334 130 L200 132 L150 130 L96 124 Z"
        fill={body}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* sidepod shading + inlet */}
      <path d="M206 98 Q236 86 300 86 L334 88 Q344 102 334 118 L214 122 Q198 112 206 98 Z" fill="#000" opacity="0.18" />
      <path d="M328 90 Q338 92 337 101 L330 102 Q333 95 328 90 Z" fill="#0d0d0f" opacity="0.8" />
      {/* accent stripes */}
      <path d="M140 88 Q196 70 248 56 L252 62 Q200 76 146 94 Z" fill={acc} />
      <path d="M368 92 L552 114 L550 118 L480 114 L368 102 Z" fill={acc} />
      {/* airbox, helmet, halo */}
      <path d="M262 42 L277 40 L283 52 L267 54 Z" fill="#0d0d0f" />
      <circle cx="320" cy="55" r="9.5" fill={acc} />
      <path d="M316 50 H330 V56 H316 Z" fill="#0d0d0f" opacity="0.85" />
      <path d="M298 62 Q312 40 350 49 L348 55 Q318 47 305 63 Z" fill="#1a1a1a" />
      {/* front wing */}
      <path d="M452 129 H574 V135 H448 Z" fill={acc} />
      <path d="M470 123 H570 V127 H468 Z" fill={body} />
      <rect x="562" y="110" width="9" height="26" rx="2" fill={body} />
      {/* wheels */}
      <Wheel cx={124} cy={118} r={33} />
      <Wheel cx={470} cy={120} r={29} />
    </svg>
  )
}

function Wheel({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#111214" />
      <circle cx={cx} cy={cy} r={r * 0.8} fill="none" stroke="#e8e8e8" strokeWidth="2" opacity="0.7" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#26282c" />
      <circle cx={cx} cy={cy} r={r * 0.34} fill="#4b4f56" />
      <circle cx={cx} cy={cy} r={r * 0.12} fill="#9aa0a6" />
    </g>
  )
}
