import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('GIF export preserves transparency and clears previous frames', async () => {
  const server = await createServer({ server: { middlewareMode: true }, ssr: { noExternal: ['gifenc'] } })
  const oldBitmap = globalThis.createImageBitmap
  const oldDocument = globalThis.document
  try {
    const { createGif } = await server.ssrLoadModule('/src/processing.ts')
    globalThis.createImageBitmap = async blob => ({ data: new Uint8ClampedArray(await blob.arrayBuffer()), close() {} })
    globalThis.document = { createElement: () => ({
      getContext: () => ({ drawImage(image) { this.data = image.data }, getImageData() { return { data: this.data } } }),
    }) }
    const frame = (x) => {
      const data = new Uint8ClampedArray(4 * 4 * 4)
      data.set([255, 0, 0, 255], x * 4)
      return new Blob([data])
    }
    const progress = []
    const gif = await createGif([frame(0), frame(3)], { width: 4, height: 4, duration: 200 }, done => progress.push(done))
    const bytes = new Uint8Array(await gif.arrayBuffer())
    assert.equal(new TextDecoder().decode(bytes.slice(0, 6)), 'GIF89a')
    assert.deepEqual(progress, [1, 2])
    const flags = [...bytes].flatMap((byte, i) => byte === 0x21 && bytes[i + 1] === 0xf9 ? [bytes[i + 3]] : [])
    assert.deepEqual(flags, [9, 9]) // disposal method 2 + transparency bit on both frames
  } finally {
    globalThis.createImageBitmap = oldBitmap
    globalThis.document = oldDocument
    await server.close()
  }
})
