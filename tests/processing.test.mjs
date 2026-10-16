import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('final processing removes backgrounds in frame order and can retry after failure', async () => {
  const server = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true } })
  try {
    const { processPhotos } = await server.ssrLoadModule('/src/model/processing.ts')
    const photos = [new Blob(['first']), new Blob(['second'])]
    const progress = []
    let failed = false
    const process = async photo => {
      if (photo === photos[1] && !failed) { failed = true; throw new Error('Temporary failure') }
      return new Blob([await photo.text(), '-transparent'])
    }
    await assert.rejects(processPhotos(photos, process, done => progress.push(done), new AbortController().signal), /Temporary failure/)
    assert.deepEqual(progress, [1])
    progress.length = 0
    const result = await processPhotos(photos, process, done => progress.push(done), new AbortController().signal)
    assert.deepEqual(await Promise.all(result.map(photo => photo.text())), ['first-transparent', 'second-transparent'])
    assert.deepEqual(progress, [1, 2])
  } finally { await server.close() }
})

test('GIF export preserves opaque backgrounds and clears transparent frames', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  })
  const oldBitmap = globalThis.createImageBitmap
  const oldDocument = globalThis.document
  try {
    const { createGif } = await server.ssrLoadModule('/src/model/processing.ts')
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
    const opaque = new Blob([new Uint8Array(Array.from({ length: 16 }, () => [255, 0, 0, 255]).flat())])
    const originalGif = await createGif([opaque], { width: 4, height: 4, duration: 200 }, () => {})
    const originalBytes = new Uint8Array(await originalGif.arrayBuffer())
    assert.deepEqual([...originalBytes].flatMap((byte, i) => byte === 0x21 && originalBytes[i + 1] === 0xf9 ? [originalBytes[i + 3]] : []), [8]) // opaque background stays opaque
  } finally {
    globalThis.createImageBitmap = oldBitmap
    globalThis.document = oldDocument
    await server.close()
  }
})
