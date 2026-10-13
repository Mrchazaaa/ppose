import * as gifenc from 'gifenc'

const { applyPalette, GIFEncoder, quantize } = 'default' in gifenc ? gifenc.default : gifenc

export async function encodeGif(frames: AsyncIterable<Uint8Array | Uint8ClampedArray>, width: number, height: number, duration: number, onProgress: (done: number) => void, signal?: AbortSignal): Promise<Blob> {
  const gif = GIFEncoder()
  let index = 0
  for await (const pixels of frames) {
    if (signal?.aborted) throw new DOMException('GIF export cancelled', 'AbortError')
    const rgba = new Uint8ClampedArray(pixels)
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
    gif.writeFrame(indexed, width, height, {
      palette, transparent, transparentIndex: Math.max(0, transparentIndex), delay: duration, repeat: 0, dispose: 2,
    })
    onProgress(++index)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  gif.finish()
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}
