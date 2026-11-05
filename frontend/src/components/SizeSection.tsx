import { useState } from 'react'
import { SIZE_LIMITS, type QrOptions } from '../core/options'
import { NumberField, Warning } from './Fields'

interface SizeSectionProps {
  options: QrOptions
  onChange: (patch: Partial<QrOptions>) => void
}

const PRESETS = [512, 1024, 2048, 4096]

export function SizeSection({ options, onChange }: SizeSectionProps) {
  const { width, height, margin_x, margin_y } = options
  // Width divided by height while the proportions are locked.
  const [ratio, setRatio] = useState<number | null>(width / height)
  const fit = (v: number) => Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, Math.round(v)))
  const room = Math.min(width - 2 * margin_x, height - 2 * margin_y)

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
        <NumberField
          label="Width"
          value={width}
          {...SIZE_LIMITS}
          onChange={(w) => onChange(ratio ? { width: w, height: fit(w / ratio) } : { width: w })}
        />
        <button
          type="button"
          aria-pressed={ratio !== null}
          onClick={() => setRatio(ratio ? null : width / height)}
          title={ratio ? 'Proportions locked' : 'Proportions unlocked'}
          className="mb-0.5 grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum aria-pressed:text-plum"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            {ratio ? (
              <path
                d="M8 6.5 9.5 5a3.2 3.2 0 0 1 4.5 4.5L12.5 11M12 13.5 10.5 15A3.2 3.2 0 0 1 6 10.5L7.5 9M8 12l4-4"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M8 6.5 9.5 5a3.2 3.2 0 0 1 4.5 4.5L12.5 11M12 13.5 10.5 15A3.2 3.2 0 0 1 6 10.5L7.5 9"
                strokeLinecap="round"
              />
            )}
          </svg>
          <span className="sr-only">Keep width and height in proportion</span>
        </button>
        <NumberField
          label="Height"
          value={height}
          {...SIZE_LIMITS}
          onChange={(h) => onChange(ratio ? { height: h, width: fit(h * ratio) } : { height: h })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">Square</span>
        {PRESETS.map((size) => {
          const active = width === size && height === size
          return (
            <button
              key={size}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setRatio(1)
                onChange({ width: size, height: size })
              }}
              className="h-8 rounded-full border border-thistle bg-white px-3 text-sm text-ink tabular-nums transition-colors hover:border-plum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum aria-pressed:border-plum aria-pressed:bg-plum aria-pressed:text-white"
            >
              {size}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Margin X" value={margin_x} min={0} max={2048} onChange={(v) => onChange({ margin_x: v })} />
        <NumberField label="Margin Y" value={margin_y} min={0} max={2048} onChange={(v) => onChange({ margin_y: v })} />
      </div>
      {room < 96 && <Warning>The margins leave little room for the code. Lower them or make the image bigger.</Warning>}
    </>
  )
}
