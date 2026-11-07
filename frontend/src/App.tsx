import { useEffect, useRef, useState } from 'react'
import { ColorsSection } from './components/ColorsSection'
import { ExportPanel, MobileDownloadBar, type DownloadState } from './components/ExportPanel'
import { ChoiceGrid, Section } from './components/Fields'
import { LinkField } from './components/LinkField'
import { PictureField } from './components/PictureField'
import { ProofMat } from './components/ProofMat'
import { SizeSection } from './components/SizeSection'
import { DotIcon, FrameIcon, PatternIcon } from './components/StyleIcons'
import { requestQr } from './core/api'
import { fileStem, normalizeLink } from './core/link'
import { defaultOptions, DOT_STYLES, FRAME_STYLES, PATTERN_STYLES, SAMPLE_LINK, type QrOptions } from './core/options'
import { useInView } from './hooks/useInView'
import { useQrPreview } from './hooks/useQrPreview'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const [linkInput, setLinkInput] = useState('')
  const [settings, setSettings] = useState<QrOptions>(defaultOptions)
  const [showGuides, setShowGuides] = useState(true)
  const [download, setDownload] = useState<DownloadState>({ status: 'idle' })
  const exportPanel = useRef<HTMLDivElement>(null)
  const exportInView = useInView(exportPanel)

  const link = normalizeLink(linkInput)
  const options: QrOptions = { ...settings, data: link }
  // The preview is always an SVG; until there's a link it shows a sample so the styles can be explored.
  const preview = useQrPreview({ ...options, data: link || SAMPLE_LINK, format: 'svg' })

  const update = (patch: Partial<QrOptions>) => setSettings((current) => ({ ...current, ...patch }))

  useEffect(() => {
    if (download.status !== 'done') return
    const timer = window.setTimeout(() => setDownload({ status: 'idle' }), 5000)
    return () => window.clearTimeout(timer)
  }, [download])

  async function handleDownload() {
    setDownload({ status: 'working' })
    try {
      const blob = await requestQr(options)
      const fileName = `${fileStem(link)}.${options.format}`
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownload({ status: 'done', fileName })
    } catch (error) {
      setDownload({ status: 'error', message: (error as Error).message })
    }
  }

  const exportProps = {
    options,
    download,
    canDownload: Boolean(link),
    onDownload: handleDownload,
  }

  return (
    <>
      <Analytics />
      <div className="mx-auto max-w-[88rem] px-4 sm:px-8">
        <header className="flex items-center justify-between gap-6 py-5">
          <a
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-plum"
          >
            <img src="/favicon-96x96.png" alt="" className="size-9" />
            <span className="text-xl font-bold tracking-tight text-plum">FreeQR</span>
          </a>
          <p className="hidden text-sm text-muted sm:block">Free QR codes for any link. No sign-up, no watermark.</p>
        </header>

        <main className="pt-2 pb-28 lg:pb-16">
          <h1 className="sr-only">Make a custom QR code</h1>
          <LinkField value={linkInput} onChange={setLinkInput} link={link} />

          <div className="mt-8 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="lg:sticky lg:top-6 lg:self-start">
              <ProofMat
                preview={preview}
                options={options}
                isSample={!link}
                showGuides={showGuides}
                onShowGuidesChange={setShowGuides}
              />
              <ExportPanel ref={exportPanel} onFormatChange={(format) => update({ format })} {...exportProps} />
            </div>

            <div>
              <Section title="Pattern">
                <ChoiceGrid
                  legend="Shape of the small squares"
                  choices={PATTERN_STYLES}
                  value={settings.pattern.style}
                  onChange={(style) => update({ pattern: { ...settings.pattern, style } })}
                  icon={(style) => <PatternIcon style={style} />}
                />
              </Section>

              <Section title="Corners" description="The three big squares phones look for first.">
                <ChoiceGrid
                  legend="Frame"
                  choices={FRAME_STYLES}
                  value={settings.corner_frame.style}
                  onChange={(style) => update({ corner_frame: { ...settings.corner_frame, style } })}
                  icon={(style) => <FrameIcon style={style} />}
                />
                <ChoiceGrid
                  legend="Dot"
                  choices={DOT_STYLES}
                  value={settings.corner_dot.style}
                  onChange={(style) => update({ corner_dot: { ...settings.corner_dot, style } })}
                  icon={(style) => <DotIcon style={style} />}
                />
              </Section>

              <Section title="Colors">
                <ColorsSection options={settings} onChange={update} />
              </Section>

              <Section title="Center picture" description="Put your logo or a photo in the middle of the code.">
                <PictureField image={settings.image} onChange={(image) => update({ image })} />
              </Section>

              <Section
                title="Size and margins"
                description="Margins are the empty space between the code and the edge of the image."
              >
                <SizeSection options={settings} onChange={update} />
              </Section>
            </div>
          </div>
        </main>

        <footer className="border-t border-thistle py-6 pb-28 text-sm text-muted lg:pb-6">
          Codes made here point straight to your link, so they keep working for as long as your link does.
        </footer>

        <MobileDownloadBar visible={!exportInView} previewUrl={preview.url} {...exportProps} />
      </div>
    </>
  )
}

export default App
