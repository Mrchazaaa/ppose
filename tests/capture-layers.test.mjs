import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

test('camera, photo, frame and guide render as ordered layers with independent opacity', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { LayeredPreview } = await server.ssrLoadModule('/src/view/components/LayeredPreview.tsx')
    const layers = [
      { id: 'base', kind: 'image', label: 'Camera / photo', url: '/photo.png', alt: 'Captured frame 1', opacity: 60, zIndex: 0, aspectRatio: 0.8, className: 'review-image' },
      { id: 'overlay', kind: 'image', label: 'Frame overlay', url: '/frame.png', alt: '', opacity: 40, zIndex: 1, className: 'frame-overlay' },
      { id: 'guide', kind: 'image', label: 'Guide overlay', url: '/guide.png', alt: 'Pose guide', opacity: 75, zIndex: 2, className: 'pose-guide', style: { width: '50%', height: '80%' } },
    ]
    const preview = moreLayers => renderToStaticMarkup(createElement(LayeredPreview, { layers: moreLayers }))
    const html = preview([...layers].reverse())
    assert.ok(html.indexOf('/photo.png') < html.indexOf('/frame.png'))
    assert.ok(html.indexOf('/frame.png') < html.indexOf('/guide.png'))
    assert.match(html, /class="picture" style="aspect-ratio:0.8;--picture-ratio:0.8"/)
    assert.match(html, /class="review-image" style="z-index:0;opacity:0.6"/)
    assert.match(html, /class="frame-overlay" style="z-index:1;opacity:0.4"/)
    assert.match(html, /class="pose-guide" style="width:50%;height:80%;z-index:2;opacity:0.75"/)
    assert.doesNotMatch(preview([layers[0], { ...layers[1], opacity: 0 }, layers[2]]), /class="frame-overlay"/)
    const camera = preview([{ id: 'base', kind: 'video', label: 'Camera / photo', opacity: 0, zIndex: 0, aspectRatio: 0.8, className: 'camera-video', style: { transform: 'scaleX(-1)' }, ref: { current: null }, ariaLabel: 'Live camera preview', onReady() {}, onError() {} }, ...layers.slice(1)])
    assert.match(camera, /<video[^>]*class="camera-video" style="transform:scaleX\(-1\);z-index:0;opacity:0"/)
    assert.doesNotMatch(camera, /class="review-image"/)
  } finally {
    await server.close()
  }
})

test('layer opacity defaults and controls use only display-ready layer inputs', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { useCaptureLayersViewModel } = await server.ssrLoadModule('/src/viewmodel/useCaptureLayersViewModel.ts')
    const inputs = [
      { id: 'first', kind: 'image', label: 'First', url: '/a.png', alt: '', className: 'image', zIndex: 0, defaultOpacity: 30 },
      { id: 'second', kind: 'image', label: 'Second', url: '/b.png', alt: '', className: 'image', zIndex: 1, defaultOpacity: 80 },
    ]
    let layers
    function Probe() { layers = useCaptureLayersViewModel(inputs); return null }
    renderToStaticMarkup(createElement(Probe))
    assert.deepEqual(layers.map(layer => [layer.id, layer.opacity]), [['first', 30], ['second', 80]])
    assert.ok(layers.every(layer => typeof layer.onOpacityChange === 'function'))
  } finally {
    await server.close()
  }
})

test('custom capture starts with one frame, no pose guide, and an add-frame control', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true } })
  try {
    const { Capture } = await server.ssrLoadModule('/src/view/Capture.tsx')
    const template = { id: 'custom', title: 'Custom GIF', description: '', preview: '', duration: 250, width: 720, height: 720, guideWidth: 0, guideHeight: 0, guides: [] }
    const render = item => renderToStaticMarkup(createElement(Capture, { template: item, stream: null, onClose() {} }))
    const html = render(template)
    assert.match(html, /aria-label="Frame 1"/)
    assert.doesNotMatch(html, /aria-label="Frame 2"|Pose guide|Make GIF/)
    assert.match(html, /aria-label="Add another frame"/)
    assert.doesNotMatch(render({ ...template, guides: ['/guide.png'] }), /aria-label="Add another frame"/)
  } finally {
    await server.close()
  }
})
