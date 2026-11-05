const SCHEME = /^[a-z][a-z\d+.-]*:/i

/** Adds https:// when the user leaves out the scheme, so "example.com" opens in a browser. */
export function normalizeLink(input: string): string {
  const link = input.trim()
  if (!link) return ''
  return SCHEME.test(link) ? link : `https://${link}`
}

/** True when the link looks like a web address a phone can open. Other schemes are allowed through. */
export function looksLikeLink(link: string): boolean {
  try {
    const url = new URL(link)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true
    return url.hostname.includes('.') || url.hostname === 'localhost'
  } catch {
    return false
  }
}

/** A short, filesystem-safe name for downloads, e.g. "qr-example.com". */
export function fileStem(link: string): string {
  try {
    const host = new URL(link).hostname.replace(/^www\./, '')
    if (host) return `qr-${host}`
  } catch {
    // Not a URL; use the generic name.
  }
  return 'qr-code'
}
