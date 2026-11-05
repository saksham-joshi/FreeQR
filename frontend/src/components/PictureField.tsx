import { useRef, useState } from 'react'
import type { CenterImage } from '../core/options'
import { readPicture } from '../core/picture'
import { focusRing, Slider, Toggle, Warning } from './Fields'

interface PictureFieldProps {
  image: CenterImage | null
  onChange: (image: CenterImage | null) => void
}

export function PictureField({ image, onChange }: PictureFieldProps) {
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function take(file: File | undefined) {
    if (!file) return
    setError(null)
    try {
      const data_url = await readPicture(file)
      onChange({ data_url, size: image?.size ?? 0.22, clear_behind: image?.clear_behind ?? true })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={(e) => {
        void take(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  )

  if (!image) {
    return (
      <div className="space-y-3">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void take(e.dataTransfer.files[0])
          }}
          className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors hover:border-plum has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-plum ${dragging ? 'border-plum bg-white' : 'border-thistle'}`}
        >
          {fileInput}
          <span className="font-semibold text-plum">Choose a picture</span>
          <span className="text-sm text-muted">or drop one here. PNG, JPG, WebP or SVG.</span>
        </label>
        {error && <Warning>{error}</Warning>}
      </div>
    )
  }

  const button = `h-9 rounded-lg border border-thistle bg-white px-3.5 text-sm font-medium text-ink transition-colors hover:border-plum ${focusRing}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={image.data_url}
          alt="Your center picture"
          className="checker size-16 rounded-lg object-contain p-1 ring-1 ring-thistle"
        />
        <div className="flex flex-wrap gap-2">
          {fileInput}
          <button type="button" className={button} onClick={() => input.current?.click()}>
            Replace
          </button>
          <button type="button" className={button} onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      </div>
      {error && <Warning>{error}</Warning>}
      <Slider
        label="Picture size"
        value={Math.round(image.size * 100)}
        min={10}
        max={35}
        format={(v) => `${v}% of the code`}
        onChange={(v) => onChange({ ...image, size: v / 100 })}
      />
      <Toggle
        label="Clear the pattern behind the picture"
        checked={image.clear_behind}
        onChange={(clear_behind) => onChange({ ...image, clear_behind })}
      />
      {image.size > 0.3 ? (
        <Warning>Large pictures can stop the code from scanning. Test it with your phone before you print.</Warning>
      ) : (
        <p className="max-w-[60ch] text-sm text-muted">
          With a picture in the middle, the code uses its highest error correction so it still scans.
        </p>
      )}
    </div>
  )
}
