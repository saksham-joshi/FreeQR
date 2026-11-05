import { useEffect, useRef, useState } from 'react'
import { requestQr } from '../core/api'
import type { QrOptions } from '../core/options'

export interface Preview {
  url: string | null
  error: string | null
  loading: boolean
}

/** Fetches an SVG preview whenever the options settle, keeping the last good image on screen meanwhile. */
export function useQrPreview(options: QrOptions, delay = 220): Preview {
  const [preview, setPreview] = useState<Preview>({ url: null, error: null, loading: true })
  const currentUrl = useRef<string | null>(null)
  const key = JSON.stringify(options)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setPreview((previous) => ({ ...previous, loading: true }))
      try {
        const blob = await requestQr(JSON.parse(key), controller.signal)
        const url = URL.createObjectURL(blob)
        if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
        currentUrl.current = url
        setPreview({ url, error: null, loading: false })
      } catch (error) {
        if (controller.signal.aborted) return
        setPreview((previous) => ({ ...previous, error: (error as Error).message, loading: false }))
      }
    }, delay)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [key, delay])

  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
    },
    []
  )

  return preview
}
