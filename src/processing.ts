import { removeBackground } from '@imgly/background-removal'
import { applyPalette, GIFEncoder, quantize } from 'gifenc'
import type { Template } from './templates'

// The foreground processor can be replaced without changing the capture flow.
export type ForegroundProcessor = (photo: Blob) => Promise<Blob>
export const removePhotoBackground: ForegroundProcessor = photo =>
  removeBackground(photo, { model: 'isnet_quint8', device: 'cpu' })

async function pixels(blob: Blob, width: number, height: number): Promise<Uint8ClampedArray> {
  const image = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas is unavailable')
    context.drawImage(image, 0, 0, width, height)
    return context.getImageData(0, 0, width, height).data
  } finally {
    image.close()
  }
}

export async function createGif(frames: Blob[], template: Template, onProgress: (done: number) => void, signal?: AbortSignal): Promise<Blob> {
  const gif = GIFEncoder()
  for (const [index, frame] of frames.entries()) {
    if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
    const rgba = await pixels(frame, template.width, template.height)
    if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
    // Reserve one palette entry for transparency; GIF has one-bit alpha.
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = rgba[i] < 128 ? 0 : 255
    const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: true })
    const transparent = rgba.some((value, position) => position % 4 === 3 && value === 0)
    let transparentIndex = palette.findIndex(color => color[3] === 0)
    if (transparent && transparentIndex < 0) {
      // Leave room for an explicit transparent index if quantization used every color.
      if (palette.length === 256) palette.pop()
      transparentIndex = palette.push([0, 0, 0, 0]) - 1
    }
    const indexed = applyPalette(rgba, palette, 'rgba4444')
    // Force all transparent pixels to the reserved entry, regardless of quantization.
    for (let i = 0; i < indexed.length; i++) if (rgba[i * 4 + 3] === 0) indexed[i] = transparentIndex
    gif.writeFrame(indexed, template.width, template.height, {
      palette, transparent, transparentIndex: Math.max(0, transparentIndex), delay: template.duration, repeat: 0, dispose: 2,
    })
    onProgress(index + 1)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  gif.finish()
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}
