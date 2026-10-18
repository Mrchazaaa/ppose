import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('camera, photo, frame and guide render as ordered layers with independent opacity', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { LayeredPreview } = await server.ssrLoadModule('/src/view/components/LayeredPreview.tsx')
    const template = { width: 480, height: 600 }
    const layers = [
      { kind: 'image', label: 'Camera / photo', url: '/photo.png', alt: 'Captured frame 1', opacity: 60, className: 'review-image' },
      { kind: 'image', label: 'Frame overlay', url: '/frame.png', alt: '', opacity: 40, className: 'frame-overlay' },
      { kind: 'image', label: 'Guide overlay', url: '/guide.png', alt: 'Pose guide', opacity: 75, className: 'pose-guide', style: { width: '50%', height: '80%' } },
    ]
    const preview = moreLayers => renderToStaticMarkup(createElement(LayeredPreview, {
      captureTemplate: template, video: { current: null }, layers: moreLayers, onReady() {}, onError() {},
    }))
    const html = preview(layers)
    assert.ok(html.indexOf('/photo.png') < html.indexOf('/frame.png'))
    assert.ok(html.indexOf('/frame.png') < html.indexOf('/guide.png'))
    assert.match(html, /class="review-image" style="opacity:0.6"/)
    assert.match(html, /class="frame-overlay" style="opacity:0.4"/)
    assert.match(html, /class="pose-guide" style="width:50%;height:80%;opacity:0.75"/)
    assert.doesNotMatch(preview([layers[0], { ...layers[1], opacity: 0 }, layers[2]]), /class="frame-overlay"/)
    const camera = preview([{ kind: 'video', label: 'Camera / photo', opacity: 0, className: 'camera-video', style: { transform: 'scaleX(-1)' } }, ...layers.slice(1)])
    assert.match(camera, /<video[^>]*class="camera-video" style="transform:scaleX\(-1\);opacity:0"/)
    assert.doesNotMatch(camera, /class="review-image"/)
  } finally {
    await server.close()
  }
})
