import { removeBackground } from '@imgly/background-removal'
import { encodeGif } from './gif'
import type { Template } from './templates'

// The foreground processor can be replaced without changing the capture flow.
export type ForegroundProcessor = (photo: Blob) => Promise<Blob>
let device: 'gpu' | 'cpu' = 'gpu'
export const removePhotoBackground: ForegroundProcessor = async photo => {
  try {
    return await removeBackground(photo, { model: 'isnet_quint8', device })
  } catch (error) {
    if (device === 'cpu') throw error
    device = 'cpu'
    return removeBackground(photo, { model: 'isnet_quint8', device })
  }
}

export async function processPhotos(frames: Blob[], process: ForegroundProcessor, onProgress: (done: number) => void, signal: AbortSignal): Promise<Blob[]> {
  const processed: Blob[] = []
  for (const frame of frames) {
    if (signal.aborted) throw new DOMException('Processing cancelled', 'AbortError')
    processed.push(await process(frame))
    if (signal.aborted) throw new DOMException('Processing cancelled', 'AbortError')
    onProgress(processed.length)
  }
  return processed
}

export function capturePhoto(video: HTMLVideoElement, width: number, height: number, mirrored: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context || !video.videoWidth) throw new Error('Camera is not ready yet')
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
  const drawnWidth = video.videoWidth * scale
  const drawnHeight = video.videoHeight * scale
  if (mirrored) { context.translate(width, 0); context.scale(-1, 1) }
  context.drawImage(video, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight)
  return new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture photo')), 'image/png'))
}

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
