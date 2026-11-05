import type { QrOptions } from './options'

export async function requestQr(options: QrOptions, signal?: AbortSignal): Promise<Blob> {
  let response: Response
  try {
    response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error("Can't reach the QR server. Check your connection and try again.")
  }
  if (!response.ok) throw new Error(await readError(response))
  return response.blob()
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail) && body.detail[0]?.msg) return `Check your settings: ${body.detail[0].msg}.`
  } catch {
    // Fall through to the generic message.
  }
  return `The server couldn't make the code (error ${response.status}). Try again.`
}
