import { removeBackground } from '@imgly/background-removal'
import { encodeGif } from './gif'
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
  async function* rgbaFrames() {
    for (const frame of frames) {
      if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
      yield await pixels(frame, template.width, template.height)
    }
  }
  return encodeGif(rgbaFrames(), template.width, template.height, template.duration, onProgress, signal)
}
