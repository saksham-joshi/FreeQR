import { useEffect, useRef, useState } from 'react'
import { requestQr } from '../core/api'
import type { QrOptions } from '../core/options'

export interface Preview {
  url: string | null
  error: string | null
  loading: boolean
}

interface Result {
  /** The options the last finished request was for. */
  key: string | null
  url: string | null
  error: string | null
}

/**
 * Fetches an SVG preview whenever the options settle, keeping the last good image on screen meanwhile.
 * It counts as loading from the moment the options change until their own image arrives.
 */
export function useQrPreview(options: QrOptions, delay = 220): Preview {
  const [result, setResult] = useState<Result>({ key: null, url: null, error: null })
  const currentUrl = useRef<string | null>(null)
  const key = JSON.stringify(options)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const blob = await requestQr(JSON.parse(key), controller.signal)
        const url = URL.createObjectURL(blob)
        if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
        currentUrl.current = url
        setResult({ key, url, error: null })
      } catch (error) {
        if (controller.signal.aborted) return
        setResult((previous) => ({ ...previous, key, error: (error as Error).message }))
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

  return { url: result.url, error: result.error, loading: result.key !== key }
}
