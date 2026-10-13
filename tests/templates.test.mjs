import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('template preview resolves independently of pose guides', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { parseTemplate } = await server.ssrLoadModule('/src/templates.ts')
    const path = '../templates/example/config.json'
    const config = { title: 'Example', description: 'Example template', preview: 'cover.webp', duration: 200, width: 480, height: 600, frames: ['1.png'] }
    const images = { '../templates/example/cover.webp': '/cover.webp', '../templates/example/1.png': '/1.png' }
    assert.deepEqual(parseTemplate(path, config, images), {
      id: 'example', title: 'Example', description: 'Example template', preview: '/cover.webp',
      duration: 200, width: 480, height: 600, guides: ['/1.png'],
    })
    assert.throws(() => parseTemplate(path, { ...config, preview: 'missing.png' }, images), /missing preview/)
  } finally {
    await server.close()
  }
})
