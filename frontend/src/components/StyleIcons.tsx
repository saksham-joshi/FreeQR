import type { DotStyle, FrameStyle, PatternStyle } from '../core/options'

// Small previews of each style. The shapes follow backend/qrgen/builder.py,
// drawn as they appear on the top-left corner of a code.

type Radii = [number, number, number, number] // top-left, top-right, bottom-right, bottom-left

const n = (v: number) => +v.toFixed(3)

function rect(x: number, y: number, w: number, h: number) {
  return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`
}

function roundedRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Radii) {
  return (
    `M${n(x + tl)} ${n(y)}H${n(x + w - tr)}A${tr} ${tr} 0 0 1 ${n(x + w)} ${n(y + tr)}` +
    `V${n(y + h - br)}A${br} ${br} 0 0 1 ${n(x + w - br)} ${n(y + h)}` +
    `H${n(x + bl)}A${bl} ${bl} 0 0 1 ${n(x)} ${n(y + h - bl)}` +
    `V${n(y + tl)}A${tl} ${tl} 0 0 1 ${n(x + tl)} ${n(y)}z`
  )
}

function circle(cx: number, cy: number, r: number) {
  return roundedRect(cx - r, cy - r, 2 * r, 2 * r, [r, r, r, r])
}

function polygon(points: [number, number][]) {
  return `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}z`
}

function diamond(x: number, y: number, w: number, h: number) {
  return polygon([
    [x + w / 2, y],
    [x + w, y + h / 2],
    [x + w / 2, y + h],
    [x, y + h / 2],
  ])
}

function octagon(x: number, y: number, size: number, cut: number) {
  const e = x + size
  const b = y + size
  return polygon([
    [x + cut, y],
    [e - cut, y],
    [e, y + cut],
    [e, b - cut],
    [e - cut, b],
    [x + cut, b],
    [x, b - cut],
    [x, y + cut],
  ])
}

function star(x: number, y: number, w: number, h: number, inner = 0.5) {
  const rad = Math.PI / 180
  const r = Math.min(w / (2 * Math.sin(72 * rad)), h / (1 + Math.cos(36 * rad)))
  const cx = x + w / 2
  const cy = y + h / 2 + (r * (1 - Math.cos(36 * rad))) / 2
  const points: [number, number][] = []
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * inner
    const angle = (-90 + i * 36) * rad
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return polygon(points)
}

const HEART: number[][] = [
  [0.3, 0.8, 0.02, 0.6, 0.02, 0.36],
  [0.02, 0.17, 0.13, 0.06, 0.27, 0.06],
  [0.38, 0.06, 0.46, 0.12, 0.5, 0.21],
  [0.54, 0.12, 0.62, 0.06, 0.73, 0.06],
  [0.87, 0.06, 0.98, 0.17, 0.98, 0.36],
  [0.98, 0.6, 0.7, 0.8, 0.5, 0.95],
]

function heart(x: number, y: number, w: number, h: number) {
  const curves = HEART.map((c) => 'C' + c.map((v, i) => n(i % 2 === 0 ? x + v * w : y + v * h)).join(' '))
  return `M${n(x + 0.5 * w)} ${n(y + 0.95 * h)}${curves.join('')}z`
}

// Leaf radii for the top-left corner: round the outer and inner corners.
const leaf = (r: number): Radii => [r, 0, r, 0]

function moduleShape(style: PatternStyle, x: number, y: number, [t, r, b, l]: boolean[]) {
  switch (style) {
    case 'rounded':
      return roundedRect(x, y, 1, 1, [t || l ? 0 : 0.5, t || r ? 0 : 0.5, b || r ? 0 : 0.5, b || l ? 0 : 0.5])
    case 'dots':
      return circle(x + 0.5, y + 0.5, 0.45)
    case 'diamond':
      return diamond(x - 0.04, y - 0.04, 1.08, 1.08)
    case 'heart':
      return heart(x - 0.04, y - 0.04, 1.08, 1.08)
    case 'star':
      return star(x - 0.05, y - 0.05, 1.1, 1.1)
    case 'leaf':
      return roundedRect(x, y, 1, 1, leaf(0.5))
    case 'bars':
      return roundedRect(x + 0.12, y, 0.76, 1, [t ? 0 : 0.38, t ? 0 : 0.38, b ? 0 : 0.38, b ? 0 : 0.38])
    default:
      return rect(x, y, 1, 1)
  }
}

function frameShape(style: FrameStyle) {
  switch (style) {
    case 'rounded':
      return roundedRect(0, 0, 7, 7, [2, 2, 2, 2]) + roundedRect(1, 1, 5, 5, [1, 1, 1, 1])
    case 'circle':
      return circle(3.5, 3.5, 3.5) + circle(3.5, 3.5, 2.5)
    case 'leaf':
      return roundedRect(0, 0, 7, 7, leaf(3)) + roundedRect(1, 1, 5, 5, leaf(2))
    case 'drop':
      return roundedRect(0, 0, 7, 7, [3.5, 3.5, 0, 3.5]) + roundedRect(1, 1, 5, 5, [2.5, 2.5, 0, 2.5])
    case 'chamfer':
      return octagon(0, 0, 7, 2) + octagon(1, 1, 5, Math.SQRT2)
    case 'dotted': {
      let d = ''
      for (let i = 0; i < 7; i++)
        for (let j = 0; j < 7; j++) if (i === 0 || i === 6 || j === 0 || j === 6) d += circle(i + 0.5, j + 0.5, 0.42)
      return d
    }
    default:
      return rect(0, 0, 7, 7) + rect(1, 1, 5, 5)
  }
}

function dotShape(style: DotStyle) {
  switch (style) {
    case 'rounded':
      return roundedRect(2, 2, 3, 3, [0.9, 0.9, 0.9, 0.9])
    case 'circle':
      return circle(3.5, 3.5, 1.5)
    case 'diamond':
      return diamond(1.75, 1.75, 3.5, 3.5)
    case 'heart':
      return heart(1.8, 1.8, 3.4, 3.4)
    case 'star':
      return star(1.75, 1.75, 3.5, 3.5, 0.55)
    case 'leaf':
      return roundedRect(2, 2, 3, 3, leaf(1.5))
    default:
      return rect(2, 2, 3, 3)
  }
}

const SAMPLE = [
  [1, 1, 0, 1],
  [0, 1, 0, 1],
  [1, 1, 1, 0],
  [1, 0, 1, 1],
]

export function PatternIcon({ style }: { style: PatternStyle }) {
  const on = (r: number, c: number) => SAMPLE[r]?.[c] === 1
  let d = ''
  SAMPLE.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) d += moduleShape(style, c, r, [on(r - 1, c), on(r, c + 1), on(r + 1, c), on(r, c - 1)])
    })
  )
  return (
    <svg viewBox="-0.4 -0.4 4.8 4.8" className="size-9" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  )
}

export function FrameIcon({ style }: { style: FrameStyle }) {
  return (
    <svg viewBox="-0.5 -0.5 8 8" className="size-9" aria-hidden="true">
      <path d={frameShape(style)} fill="currentColor" fillRule="evenodd" />
      <path d={rect(2, 2, 3, 3)} fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function DotIcon({ style }: { style: DotStyle }) {
  return (
    <svg viewBox="-0.5 -0.5 8 8" className="size-9" aria-hidden="true">
      <path d={frameShape('square')} fill="currentColor" fillRule="evenodd" opacity="0.3" />
      <path d={dotShape(style)} fill="currentColor" />
    </svg>
  )
}
