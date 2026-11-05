import type { Ref } from 'react'
import { FORMATS, type Format, type QrOptions } from '../core/options'
import { focusRing, Segmented } from './Fields'

export type DownloadState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done'; fileName: string }
  | { status: 'error'; message: string }

interface DownloadButtonProps {
  format: Format
  download: DownloadState
  disabled: boolean
  onDownload: () => void
  compact?: boolean
}

export function DownloadButton({ format, download, disabled, onDownload, compact }: DownloadButtonProps) {
  const name = format.toUpperCase()
  const working = download.status === 'working'
  return (
    <button
      type="button"
      onClick={onDownload}
      disabled={disabled || working}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold font-semibold text-ink transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:bg-thistle/70 disabled:text-muted ${focusRing} ${compact ? 'h-11 px-4 text-sm' : 'h-12 px-6 text-base'}`}
    >
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
        <path
          d="M10 3v9.5M5.5 8.5 10 13l4.5-4.5M4 16.5h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {working ? `Preparing ${name}…` : `Download ${name}`}
    </button>
  )
}

function formatHint({ format, width, height, background }: QrOptions): string {
  const size = `${width} × ${height} px`
  if (format === 'svg') return 'Vector file. Stays sharp at any print size, from business card to banner.'
  if (format === 'png') return `Image, ${size}. Keeps a transparent background if you choose one.`
  if (background.transparent) return `Image, ${size}. JPG can’t be transparent, so the background will be white.`
  return `Image, ${size}. The smallest file, good for email and chat.`
}

interface ExportPanelProps {
  options: QrOptions
  onFormatChange: (format: Format) => void
  download: DownloadState
  canDownload: boolean
  onDownload: () => void
  ref?: Ref<HTMLDivElement>
}

export function ExportPanel({ options, onFormatChange, download, canDownload, onDownload, ref }: ExportPanelProps) {
  let message = formatHint(options)
  if (download.status === 'error') message = download.message
  else if (download.status === 'done') message = `Downloaded ${download.fileName}`
  else if (!canDownload) message = 'Paste your link above to download your code.'

  return (
    <div ref={ref} className="mt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Segmented label="File format" hideLabel choices={FORMATS} value={options.format} onChange={onFormatChange} />
        <div className="ml-auto">
          <DownloadButton format={options.format} download={download} disabled={!canDownload} onDownload={onDownload} />
        </div>
      </div>
      <p
        aria-live="polite"
        className={`mt-3 max-w-[64ch] text-sm ${download.status === 'error' ? 'font-medium text-ink' : 'text-muted'}`}
      >
        {message}
      </p>
    </div>
  )
}

interface MobileDownloadBarProps {
  visible: boolean
  previewUrl: string | null
  options: QrOptions
  download: DownloadState
  canDownload: boolean
  onDownload: () => void
}

/** Keeps the download in reach on small screens once the panel under the preview scrolls away. */
export function MobileDownloadBar({
  visible,
  previewUrl,
  options,
  download,
  canDownload,
  onDownload,
}: MobileDownloadBarProps) {
  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-thistle bg-blush/95 px-4 py-3 backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${visible ? '' : 'translate-y-full'}`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-3">
        {previewUrl && (
          <img
            src={previewUrl}
            alt=""
            className={`size-11 shrink-0 rounded-md object-contain ring-1 ring-thistle ${options.background.transparent ? 'checker' : 'bg-white'}`}
          />
        )}
        <p className="min-w-0 flex-1 text-sm leading-tight">
          <span className="block font-medium text-ink tabular-nums">
            {options.width} × {options.height} px
          </span>
          <span className="text-muted">{canDownload ? options.format.toUpperCase() : 'Add your link first'}</span>
        </p>
        <DownloadButton
          format={options.format}
          download={download}
          disabled={!canDownload}
          onDownload={onDownload}
          compact
        />
      </div>
    </div>
  )
}
