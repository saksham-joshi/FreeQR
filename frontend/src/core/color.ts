function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export function isLighter(a: string, b: string): boolean {
  return luminance(a) > luminance(b)
}

/** Accepts "#abc", "abc", "#aabbcc" or "aabbcc"; returns "#AABBCC" or null. */
export function parseHex(input: string): string | null {
  let hex = input.trim().replace(/^#/, '')
  if (/^[\da-f]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join('')
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null
}
