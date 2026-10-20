import * as gifenc from 'gifenc'

const { applyPalette, GIFEncoder, quantize } = typeof gifenc.default === 'function' ? gifenc : gifenc.default

export async function encodeGif(frames: AsyncIterable<Uint8Array | Uint8ClampedArray>, width: number, height: number, duration: number, onProgress: (done: number) => void, signal?: AbortSignal): Promise<Blob> {
  const gif = GIFEncoder()
  let index = 0
  for await (const pixels of frames) {
    if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
    const rgba = new Uint8ClampedArray(pixels)
    // Reserve one palette entry for transparency; GIF has one-bit alpha.
    for (let i = 3; i < rgba.length; i += 4) rgba[i] = rgba[i] < 128 ? 0 : 255
    const transparent = rgba.some((value, position) => position % 4 === 3 && value === 0)
    const palette = quantize(rgba, transparent ? 255 : 256, { format: 'rgb565' })
    const indexed = applyPalette(rgba, palette, 'rgb565')
    const transparentIndex = transparent ? palette.push([0, 0, 0]) - 1 : 0
    // Force all transparent pixels to the reserved entry, regardless of quantization.
    for (let i = 0; i < indexed.length; i++) if (rgba[i * 4 + 3] === 0) indexed[i] = transparentIndex
    gif.writeFrame(indexed, width, height, {
      palette, transparent, transparentIndex: Math.max(0, transparentIndex), delay: duration, repeat: 0, dispose: 2,
    })
    onProgress(++index)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  gif.finish()
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}
