const MAX_SIDE = 512
const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * Reads an image file and returns it as a PNG data URL no larger than 512px a side.
 * Shrinking in the browser keeps requests small and lets any format the browser can show (SVG included) through.
 */
export async function readPicture(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file isn’t an image. Choose a PNG, JPG, WebP or SVG.')
  if (file.size > MAX_FILE_BYTES) throw new Error('That picture is over 10 MB. Choose a smaller file.')

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode().catch(() => {
      throw new Error('That picture couldn’t be opened. Try a PNG or JPG.')
    })
    const width = image.naturalWidth || MAX_SIDE
    const height = image.naturalHeight || MAX_SIDE
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
