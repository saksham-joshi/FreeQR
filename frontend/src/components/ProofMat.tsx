import type { QrOptions } from '../core/options'
import type { Preview } from '../hooks/useQrPreview'
import { Toggle } from './Fields'
import { Spinner } from './Spinner'

interface ProofMatProps {
  preview: Preview
  options: QrOptions
  isSample: boolean
  showGuides: boolean
  onShowGuidesChange: (show: boolean) => void
}

/**
 * The export canvas laid on a cutting mat, drawn at the file's real proportions,
 * with its pixel size measured along the edges and the margins marked as guides.
 */
export function ProofMat({ preview, options, isSample, showGuides, onShowGuidesChange }: ProofMatProps) {
  const { width, height, margin_x, margin_y, background } = options
  const percent = (part: number, whole: number) => `${(part / whole) * 100}%`

  return (
    <div className="mat relative flex aspect-square flex-col overflow-hidden rounded-2xl text-blush lg:aspect-auto lg:h-[clamp(26rem,calc(100dvh-22rem),46rem)]">
      <div className="min-h-0 flex-1 px-12 pt-14 pb-6 [container-type:size] sm:px-16 sm:pt-16">
        <div className="flex size-full items-center justify-center">
          <div
            className="relative"
            style={{ width: `min(100cqw, calc(100cqh * ${width / height}))`, aspectRatio: `${width} / ${height}` }}
          >
            <Dimension axis="x" label={`${width} px`} />
            <Dimension axis="y" label={`${height} px`} />
            <div
              className={`size-full shadow-[0_1px_0_rgb(43_35_66/0.25),0_18px_32px_-12px_rgb(30_20_60/0.6)] ${background.transparent ? 'checker' : 'bg-white'}`}
            >
              {preview.url && (
                <img
                  src={preview.url}
                  alt={isSample ? 'QR code preview using a sample link' : `QR code preview for ${options.data}`}
                  className={`block size-full transition-opacity duration-200 ${preview.error ? 'opacity-25' : ''}`}
                />
              )}
            </div>
            {preview.loading && (
              <div
                aria-hidden="true"
                className="rendering pointer-events-none absolute inset-0 grid place-items-center overflow-hidden bg-white/55"
              >
                <span className="scan absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-transparent via-lagoon/35 to-transparent" />
                <span className="relative inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-blush shadow-lg">
                  <Spinner className="size-4 text-gold" />
                  Generating…
                </span>
              </div>
            )}
            {showGuides && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute border border-dashed border-lagoon"
                style={{
                  left: percent(margin_x, width),
                  right: percent(margin_x, width),
                  top: percent(margin_y, height),
                  bottom: percent(margin_y, height),
                }}
              />
            )}
            {preview.error && !preview.loading && (
              <div className="absolute inset-0 grid place-items-center p-4">
                <p role="alert" className="max-w-xs rounded-lg bg-white p-4 text-sm text-ink shadow-lg">
                  <span className="block font-semibold">Preview not updated</span>
                  {preview.error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-4 px-5 pb-4 text-sm">
        <p aria-live="polite" className="flex min-w-0 items-center gap-2">
          {preview.loading ? (
            <>
              <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2.5 rounded-full bg-gold" />
              </span>
              Updating preview
            </>
          ) : isSample ? (
            'Showing a sample link. Paste yours above to download.'
          ) : (
            <span className="sr-only">Preview up to date</span>
          )}
        </p>
        <Toggle label="Guides" checked={showGuides} onChange={onShowGuidesChange} tone="mat" />
      </div>
    </div>
  )
}

function Dimension({ axis, label }: { axis: 'x' | 'y'; label: string }) {
  const horizontal = axis === 'x'
  const tick = horizontal ? 'h-3 w-px bg-lagoon' : 'h-px w-3 bg-lagoon'
  const line = horizontal ? 'h-px flex-1 bg-lagoon' : 'w-px flex-1 bg-lagoon'
  return (
    <div
      aria-hidden="true"
      className={
        horizontal
          ? 'measure-x absolute inset-x-0 -top-9 flex h-3 items-center'
          : 'measure-y absolute inset-y-0 -left-9 flex w-3 flex-col items-center'
      }
    >
      <span className={tick} />
      <span className={line} />
      <span
        className={`shrink-0 rounded-full bg-lagoon text-xs leading-none font-semibold text-ink tabular-nums ${
          horizontal ? 'mx-1.5 px-2 py-1' : 'my-1.5 rotate-180 px-1 py-2 [writing-mode:vertical-rl]'
        }`}
      >
        {label}
      </span>
      <span className={line} />
      <span className={tick} />
    </div>
  )
}
