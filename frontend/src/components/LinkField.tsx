import { useId } from 'react'
import { looksLikeLink } from '../core/link'
import { focusRing, Warning } from './Fields'

interface LinkFieldProps {
  value: string
  onChange: (value: string) => void
  /** The normalized link that goes into the code. */
  link: string
}

// The link is the page's headline: set large, then stepped down so long links stay on one line.
function sizeFor(length: number) {
  if (length <= 26) return 'text-[clamp(2rem,5.2vw,3rem)]'
  if (length <= 44) return 'text-[clamp(1.5rem,3.4vw,2.25rem)]'
  return 'text-[clamp(1.125rem,2.2vw,1.5rem)]'
}

export function LinkField({ value, onChange, link }: LinkFieldProps) {
  const id = useId()
  const hintId = useId()
  const valid = !link || looksLikeLink(link)

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-muted">
        Your link
      </label>
      <div className="relative flex items-center border-b-2 border-thistle transition-colors focus-within:border-plum">
        <input
          id={id}
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Paste your link here"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hintId}
          aria-invalid={!valid}
          className={`h-[1.5em] w-full min-w-0 bg-transparent pr-12 font-semibold tracking-tight text-ink outline-none placeholder:text-ghost ${sizeFor(value.length)}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={`absolute right-0 grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-ink ${focusRing}`}
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Clear link</span>
          </button>
        )}
      </div>
      <div id={hintId} className="mt-2.5 min-h-5 text-sm text-muted" aria-live="polite">
        {!link && 'Any web address works. We add https:// if you leave it out.'}
        {link && valid && (
          <>
            Scanning opens <span className="break-all text-ink">{link}</span>
          </>
        )}
        {link && !valid && <Warning>This doesn’t look like a web address. Check it for typos.</Warning>}
      </div>
    </div>
  )
}
