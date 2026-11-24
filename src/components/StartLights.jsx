import { useState } from 'react'

/**
 * F1-style start gantry: five light pods.
 *  - scheduled: lights off
 *  - live: the five reds come on one by one, then lights out (click to replay)
 *  - finalized: chequered flag
 */
export default function StartLights({ status }) {
  const [run, setRun] = useState(0) // bump to restart the animation
  const live = status === 'live'

  return (
    <div
      className={`gantry gantry--${status}`}
      onClick={live ? () => setRun((n) => n + 1) : undefined}
      title={live ? 'Replay the start' : undefined}
      aria-hidden="true"
    >
      <div className="gantry__pods" key={run}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="gantry__pod" key={i} style={{ '--i': i }}>
            <span className="lamp" />
            <span className="lamp" />
          </div>
        ))}
      </div>
      {live && (
        <span className="gantry__label" key={`l${run}`}>
          Lights out
        </span>
      )}
    </div>
  )
}
