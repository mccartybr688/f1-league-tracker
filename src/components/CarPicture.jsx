import { useState } from 'react'
import CarSide from './CarSide'

/**
 * A real photo (with the credit its licence requires) when one is
 * configured, otherwise the drawn car in team colours.
 */
export default function CarPicture({ photo, team, color, alt }) {
  const [broken, setBroken] = useState(false)
  if (!photo || broken) return <CarSide team={team} color={color} title={alt} />
  return (
    <figure className="car-photo">
      <img src={photo.src} alt={alt} loading="lazy" onError={() => setBroken(true)} />
      <figcaption>
        Photo: {photo.author} ·{' '}
        {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> : photo.license}
        {' · '}
        <a href={photo.page} target="_blank" rel="noreferrer">Wikimedia Commons</a>
      </figcaption>
    </figure>
  )
}
