// Flag images (country-flag-icons, MIT) instead of emoji, which Windows
// doesn't draw. Covers every country on the F1 calendar; others show the code.
import { AE, AT, AU, AZ, BE, BH, BR, CA, CN, DE, ES, FR, GB, HU, IT, JP, MC, MX, MY, NL, PT, QA, SA, SG, TR, US } from 'country-flag-icons/react/3x2'

const FLAGS = { AE, AT, AU, AZ, BE, BH, BR, CA, CN, DE, ES, FR, GB, HU, IT, JP, MC, MX, MY, NL, PT, QA, SA, SG, TR, US }

export default function Flag({ code, className = '' }) {
  const F = code && FLAGS[code.toUpperCase()]
  if (!F) return <span className={`flag flag--text ${className}`}>{code ?? ''}</span>
  return <F className={`flag ${className}`} title={code} aria-hidden="true" />
}
