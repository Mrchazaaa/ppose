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
  if (!context || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) throw new Error('Video is not ready yet')
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
  const drawnWidth = video.videoWidth * scale
  const drawnHeight = video.videoHeight * scale
  if (mirrored) { context.translate(width, 0); context.scale(-1, 1) }
  context.drawImage(video, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight)
  return new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture photo')), 'image/png'))
}

export function resizeImportedPhoto(placement: { x: number; y: number; width: number; rotation: number }, width: number, imageRatio: number, frameRatio: number) {
  const nextWidth = Math.max(10, Math.min(300, width))
  const shift = (placement.width - nextWidth) / 2
  return { ...placement, x: placement.x + shift, y: placement.y + shift * frameRatio * imageRatio, width: nextWidth }
}

export async function captureImportedPhoto(photo: Blob, width: number, height: number, placement: { x: number; y: number; width: number; rotation: number }): Promise<Blob> {
  const image = await createImageBitmap(photo)
  try {
    return await capturePlacedMedia(image, image.width, image.height, width, height, placement)
  } finally { image.close() }
}

export function captureImportedVideo(video: HTMLVideoElement, width: number, height: number, placement: { x: number; y: number; width: number; rotation: number }): Promise<Blob> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.seeking || !video.videoWidth || !video.videoHeight) throw new Error('Video is not ready yet')
  return capturePlacedMedia(video, video.videoWidth, video.videoHeight, width, height, placement)
}

function capturePlacedMedia(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, width: number, height: number, placement: { x: number; y: number; width: number; rotation: number }): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')
  const drawnWidth = width * placement.width / 100
  const drawnHeight = drawnWidth * sourceHeight / sourceWidth
  if (placement.rotation) {
    context.translate(width * placement.x / 100 + drawnWidth / 2, height * placement.y / 100 + drawnHeight / 2)
    context.rotate(placement.rotation * Math.PI / 180)
    context.drawImage(source, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight)
  } else context.drawImage(source, width * placement.x / 100, height * placement.y / 100, drawnWidth, drawnHeight)
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture imported frame')), 'image/png'))
}

async function pixels(blob: Blob, width: number, height: number, background: string | null): Promise<Uint8ClampedArray> {
  const image = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas is unavailable')
    if (background) { context.fillStyle = background; context.fillRect(0, 0, width, height) }
    context.drawImage(image, 0, 0, width, height)
    return context.getImageData(0, 0, width, height).data
  } finally {
    image.close()
  }
}

export async function createGif(frames: Blob[], template: Template, onProgress: (done: number) => void, signal?: AbortSignal, background: string | null = null): Promise<Blob> {
  async function* rgbaFrames() {
    for (const frame of frames) {
      if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
      yield await pixels(frame, template.width, template.height, background)
    }
  }
  return encodeGif(rgbaFrames(), template.width, template.height, template.duration, onProgress, signal)
}
