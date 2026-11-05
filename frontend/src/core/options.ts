// Mirrors backend/qrgen/models.py. Field names stay snake_case to match the API.

export type Format = 'svg' | 'png' | 'jpg'
export type PatternStyle = 'square' | 'rounded' | 'dots' | 'diamond' | 'heart' | 'star' | 'leaf' | 'bars'
export type FrameStyle = 'square' | 'rounded' | 'circle' | 'leaf' | 'drop' | 'chamfer' | 'dotted'
export type DotStyle = 'square' | 'rounded' | 'circle' | 'diamond' | 'heart' | 'star' | 'leaf'
export type FillType = 'solid' | 'linear' | 'radial'

export interface Fill {
  type: FillType
  color: string
  color2: string
  angle: number
}

export interface CenterImage {
  data_url: string
  size: number
  clear_behind: boolean
}

export interface QrOptions {
  data: string
  format: Format
  width: number
  height: number
  margin_x: number
  margin_y: number
  background: { transparent: boolean; color: string }
  pattern: { style: PatternStyle; fill: Fill }
  corner_frame: { style: FrameStyle; color: string }
  corner_dot: { style: DotStyle; color: string }
  image: CenterImage | null
}

export interface Choice<T extends string> {
  value: T
  label: string
}

export const SAMPLE_LINK = 'https://example.com'

export const SIZE_LIMITS = { min: 64, max: 4096 }

export const defaultOptions: QrOptions = {
  data: '',
  format: 'png',
  width: 1024,
  height: 1024,
  margin_x: 80,
  margin_y: 80,
  background: { transparent: false, color: '#FFFFFF' },
  pattern: { style: 'rounded', fill: { type: 'solid', color: '#5C4B8A', color2: '#00979A', angle: 45 } },
  corner_frame: { style: 'rounded', color: '#5C4B8A' },
  corner_dot: { style: 'rounded', color: '#5C4B8A' },
  image: null,
}

export const PATTERN_STYLES: Choice<PatternStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
  { value: 'diamond', label: 'Diamonds' },
  { value: 'heart', label: 'Hearts' },
  { value: 'star', label: 'Stars' },
  { value: 'leaf', label: 'Leaves' },
  { value: 'bars', label: 'Bars' },
]

export const FRAME_STYLES: Choice<FrameStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'drop', label: 'Drop' },
  { value: 'chamfer', label: 'Cut' },
  { value: 'dotted', label: 'Dotted' },
]

export const DOT_STYLES: Choice<DotStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'leaf', label: 'Leaf' },
]

export const FORMATS: Choice<Format>[] = [
  { value: 'svg', label: 'SVG' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
]
