import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('resizing an imported image keeps its center fixed', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { resizeImportedPhoto } = await server.ssrLoadModule('/src/model/processing.ts')
    const start = { x: 12, y: 18, width: 75, rotation: 37 }
    const next = resizeImportedPhoto(start, 120, 0.5, 0.8)
    assert.deepEqual(next, { x: -10.5, y: 9, width: 120, rotation: 37 })
    assert.equal(start.x + start.width / 2, next.x + next.width / 2)
    assert.equal(start.y + start.width * 0.8 * 0.5 / 2, next.y + next.width * 0.8 * 0.5 / 2)
  } finally { await server.close() }
})

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

test('imported photo is drawn at its preview placement and closed after capture', async () => {
  const server = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true } })
  const oldBitmap = globalThis.createImageBitmap
  const oldDocument = globalThis.document
  const draws = []
  let closed = false
  try {
    const { captureImportedPhoto } = await server.ssrLoadModule('/src/model/processing.ts')
    globalThis.createImageBitmap = async () => ({ width: 200, height: 100, close() { closed = true } })
    globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage: (...args) => draws.push(args) }), toBlob: callback => callback(new Blob(['frame'])) }) }
    const photo = await captureImportedPhoto(new Blob(['source']), 400, 300, { x: 25, y: 10, width: 50, rotation: 0 })
    assert.equal(await photo.text(), 'frame')
    assert.deepEqual(draws[0].slice(1), [100, 30, 200, 100])
    assert.equal(closed, true)
  } finally {
    globalThis.createImageBitmap = oldBitmap
    globalThis.document = oldDocument
    await server.close()
  }
})

test('rotated imports use the same image center and angle in captured frames', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  const oldBitmap = globalThis.createImageBitmap
  const oldDocument = globalThis.document
  const calls = []
  try {
    const { captureImportedPhoto } = await server.ssrLoadModule('/src/model/processing.ts')
    globalThis.createImageBitmap = async () => ({ width: 200, height: 100, close() {} })
    globalThis.document = { createElement: () => ({ getContext: () => ({ translate: (...args) => calls.push(['translate', ...args]), rotate: angle => calls.push(['rotate', angle]), drawImage: (...args) => calls.push(['drawImage', ...args.slice(1)]) }), toBlob: callback => callback(new Blob(['frame'])) }) }
    await captureImportedPhoto(new Blob(['source']), 400, 300, { x: 25, y: 10, width: 50, rotation: 90 })
    assert.deepEqual(calls[0], ['translate', 200, 80])
    assert.deepEqual(calls[1], ['rotate', Math.PI / 2])
    assert.deepEqual(calls[2], ['drawImage', -100, -50, 200, 100])
  } finally {
    globalThis.createImageBitmap = oldBitmap
    globalThis.document = oldDocument
    await server.close()
  }
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
    const fills = []
    const samples = []
    globalThis.document = { createElement: () => ({ getContext: () => ({
      fillRect() { fills.push(this.fillStyle); this.data = new Uint8ClampedArray(Array.from({ length: 16 }, () => [0, 255, 0, 255]).flat()) },
      drawImage(image) { image.data.forEach((value, i) => { if (image.data[Math.floor(i / 4) * 4 + 3]) this.data[i] = value }) },
      getImageData() { samples.push(...this.data.slice(0, 8)); return { data: this.data } },
    }) }) }
    const coloredGif = await createGif([frame(0)], { width: 4, height: 4, duration: 200 }, () => {}, undefined, '#00ff00')
    const coloredBytes = new Uint8Array(await coloredGif.arrayBuffer())
    assert.deepEqual(fills, ['#00ff00'])
    assert.deepEqual(samples, [255, 0, 0, 255, 0, 255, 0, 255]) // existing photo stays red; only its empty neighbor is filled
    assert.deepEqual([...coloredBytes].flatMap((byte, i) => byte === 0x21 && coloredBytes[i + 1] === 0xf9 ? [coloredBytes[i + 3]] : []), [8]) // filled pixels are opaque
  } finally {
    globalThis.createImageBitmap = oldBitmap
    globalThis.document = oldDocument
    await server.close()
  }
})
