import { useId, useState, type ReactNode } from 'react'
import { parseHex } from '../core/color'
import type { Choice } from '../core/options'

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum'
const peerFocusRing = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum'

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-t border-thistle py-8 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-[60ch] text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-6">{children}</div>
    </section>
  )
}

export function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2.5 text-sm text-ink">
      <svg viewBox="0 0 20 20" className="mt-px size-[18px] shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="10" fill="var(--color-gold)" />
        <path d="M10 5v6.5" stroke="var(--color-ink)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="10" cy="14.75" r="1.25" fill="var(--color-ink)" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

interface ChoiceGridProps<T extends string> {
  legend: string
  choices: Choice<T>[]
  value: T
  onChange: (value: T) => void
  icon: (value: T) => ReactNode
}

/** A radio group shown as a grid of picture tiles. */
export function ChoiceGrid<T extends string>({ legend, choices, value, onChange, icon }: ChoiceGridProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {choices.map((choice) => (
          <label key={choice.value} className="group flex cursor-pointer flex-col items-center gap-1.5">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span
              className={`grid h-14 w-full place-items-center rounded-lg border border-thistle bg-white text-plum transition-colors group-hover:border-plum peer-checked:border-plum peer-checked:bg-plum peer-checked:text-blush ${peerFocusRing}`}
            >
              {icon(choice.value)}
            </span>
            <span className="text-sm text-muted peer-checked:font-medium peer-checked:text-ink">{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  hideLabel?: boolean
  choices: (Choice<T> & { icon?: ReactNode })[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, hideLabel, choices, value, onChange }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-sm font-medium text-ink'}>{label}</legend>
      <div className="inline-flex rounded-lg border border-thistle bg-white p-0.5">
        {choices.map((choice) => (
          <label key={choice.value} className="cursor-pointer" title={choice.icon ? choice.label : undefined}>
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span
              className={`flex h-8 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:text-ink peer-checked:bg-plum peer-checked:text-white ${peerFocusRing}`}
            >
              {choice.icon ?? choice.label}
              {choice.icon && <span className="sr-only">{choice.label}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  tone?: 'page' | 'mat'
}

export function Toggle({ label, checked, onChange, tone = 'page' }: ToggleProps) {
  const track =
    tone === 'mat'
      ? 'bg-white/25 peer-checked:bg-lagoon peer-focus-visible:outline-gold'
      : 'bg-thistle peer-checked:bg-plum peer-focus-visible:outline-plum'
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4 motion-reduce:after:transition-none ${track}`}
      />
      <span className={`text-sm ${tone === 'mat' ? 'text-blush' : 'text-ink'}`}>{label}</span>
    </label>
  )
}

/** Keeps a text draft while typing and resets it whenever the committed value changes from outside. */
function useDraft(value: string) {
  const [draft, setDraft] = useState(value)
  const [committed, setCommitted] = useState(value)
  if (value !== committed) {
    setCommitted(value)
    setDraft(value)
  }
  return [draft, setDraft] as const
}

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ColorField({ label, value, onChange, disabled }: ColorFieldProps) {
  const [draft, setDraft] = useDraft(value)
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-45' : ''}`}>
      <span
        className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-thistle shadow-[inset_0_0_0_2px_white] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-plum"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value.toLowerCase()}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={`${label}: open color picker`}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </span>
      <input
        type="text"
        value={draft}
        disabled={disabled}
        maxLength={7}
        spellCheck={false}
        autoComplete="off"
        aria-label={`${label}: hex code`}
        onChange={(e) => {
          setDraft(e.target.value)
          const hex = parseHex(e.target.value)
          if (hex) onChange(hex)
        }}
        onBlur={() => setDraft(value)}
        className="h-9 w-[5.75rem] rounded-lg border border-thistle bg-white px-2.5 text-sm text-ink uppercase tabular-nums outline-none focus:border-plum focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-plum disabled:cursor-not-allowed"
      />
    </div>
  )
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  suffix?: string
}

export function NumberField({ label, value, onChange, min, max, suffix = 'px' }: NumberFieldProps) {
  const [draft, setDraft] = useDraft(String(value))
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)))
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <span className="flex h-10 items-center rounded-lg border border-thistle bg-white focus-within:border-plum has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-1 has-[input:focus-visible]:outline-plum">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            const next = Number(e.target.value)
            if (e.target.value !== '' && Number.isInteger(next) && next >= min && next <= max) onChange(next)
          }}
          onBlur={() => {
            const next = Number(draft)
            const settled = draft === '' || Number.isNaN(next) ? value : clamp(next)
            setDraft(String(settled))
            if (settled !== value) onChange(settled)
          }}
          className="h-full w-full min-w-0 bg-transparent pl-3 text-base text-ink tabular-nums outline-none"
        />
        <span className="pr-3 pl-1 text-sm text-muted">{suffix}</span>
      </span>
    </label>
  )
}

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  format: (value: number) => string
}

export function Slider({ label, value, onChange, min, max, format }: SliderProps) {
  const id = useId()
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="text-sm text-muted tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full accent-plum ${focusRing}`}
      />
    </div>
  )
}
