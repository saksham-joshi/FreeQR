import type { ReactNode } from 'react'
import { contrast, isLighter } from '../core/color'
import type { Fill, FillType, QrOptions } from '../core/options'
import { ColorField, Segmented, Toggle, Warning } from './Fields'

interface ColorsSectionProps {
  options: QrOptions
  onChange: (patch: Partial<QrOptions>) => void
}

const FILL_TYPES: { value: FillType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
]

function Arrow({ angle }: { angle: number }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true">
      <path
        d="M3 10h13M11.5 5.5 16 10l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const DIRECTIONS = [
  { value: '0', label: 'Left to right', icon: <Arrow angle={0} /> },
  { value: '45', label: 'Top left to bottom right', icon: <Arrow angle={45} /> },
  { value: '90', label: 'Top to bottom', icon: <Arrow angle={90} /> },
  { value: '135', label: 'Top right to bottom left', icon: <Arrow angle={135} /> },
]

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm font-medium text-ink sm:pt-2">{label}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

/** Phones read dark-on-light codes with clear contrast; warn about anything else. */
function scanWarning({ background, pattern, corner_frame, corner_dot }: QrOptions): string | null {
  const surface = background.transparent ? '#FFFFFF' : background.color
  const inks = [pattern.fill.color, corner_frame.color, corner_dot.color]
  if (pattern.fill.type !== 'solid') inks.push(pattern.fill.color2)
  if (inks.some((ink) => isLighter(ink, surface))) {
    return 'Parts of the code are lighter than the background. Many phone cameras can’t read light-on-dark codes.'
  }
  if (Math.min(...inks.map((ink) => contrast(ink, surface))) < 3) {
    return 'Low contrast between the code and its background. Use darker code colors or a lighter background so phones can read it.'
  }
  return null
}

export function ColorsSection({ options, onChange }: ColorsSectionProps) {
  const { background, pattern, corner_frame, corner_dot } = options
  const fill = pattern.fill
  const setFill = (patch: Partial<Fill>) => onChange({ pattern: { ...pattern, fill: { ...fill, ...patch } } })
  const warning = scanWarning(options)

  return (
    <>
      <Row label="Background">
        <ColorField
          label="Background"
          value={background.color}
          disabled={background.transparent}
          onChange={(color) => onChange({ background: { ...background, color } })}
        />
        <Toggle
          label="Transparent"
          checked={background.transparent}
          onChange={(transparent) => onChange({ background: { ...background, transparent } })}
        />
      </Row>

      <Row label="Pattern">
        <Segmented
          label="Pattern fill"
          hideLabel
          choices={FILL_TYPES}
          value={fill.type}
          onChange={(type) => setFill({ type })}
        />
        <div className="flex basis-full flex-wrap items-center gap-x-4 gap-y-3">
          <ColorField
            label={fill.type === 'solid' ? 'Pattern' : 'Gradient start'}
            value={fill.color}
            onChange={(color) => setFill({ color })}
          />
          {fill.type !== 'solid' && (
            <ColorField label="Gradient end" value={fill.color2} onChange={(color2) => setFill({ color2 })} />
          )}
          {fill.type === 'linear' && (
            <Segmented
              label="Gradient direction"
              hideLabel
              choices={DIRECTIONS}
              value={String(fill.angle)}
              onChange={(angle) => setFill({ angle: Number(angle) })}
            />
          )}
        </div>
      </Row>

      <Row label="Corner frames">
        <ColorField
          label="Corner frames"
          value={corner_frame.color}
          onChange={(color) => onChange({ corner_frame: { ...corner_frame, color } })}
        />
      </Row>

      <Row label="Corner dots">
        <ColorField
          label="Corner dots"
          value={corner_dot.color}
          onChange={(color) => onChange({ corner_dot: { ...corner_dot, color } })}
        />
      </Row>

      {warning && <Warning>{warning}</Warning>}
      {!warning && background.transparent && (
        <p className="text-sm text-muted">A transparent code scans best on a light surface.</p>
      )}
    </>
  )
}
