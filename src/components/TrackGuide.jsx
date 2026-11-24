import guides from '../data/track-guides.json'

/** Original "what makes it special" write-up, signature corners and a sim tip. */
export default function TrackGuide({ track }) {
  const g = track.circuit_id && guides[track.circuit_id]
  if (!g) return null
  return (
    <div className="guide">
      <section>
        <h3 className="guide__h">What makes it special</h3>
        <p>{g.special}</p>
      </section>
      <section>
        <h3 className="guide__h">Signature corners</h3>
        <ul className="chips">{g.corners.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section className="guide__tip">
        <h3 className="guide__h">Sim tip</h3>
        <p>{g.tip}</p>
      </section>
    </div>
  )
}
