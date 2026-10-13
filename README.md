# ppose

Make a transparent animated GIF of yourself, entirely in your browser.

## Run locally

Requires Node.js 20+. Run `npm ci` and `npm run dev`, then open the local URL. A camera requires localhost or HTTPS. Run `npm run build` to type-check and build.

Select a template, line up with each guide, take a photo immediately or after a 3/5/10-second timer, and accept or retake it. Click earlier frames to review or replace them. When all frames are accepted, make and download your GIF. Photos are held only in memory until you exit; no photos are uploaded. The background-removal library downloads its model and WASM assets on first use and caches them in the browser. The quantized model is roughly 40 MB, so initial processing can take a while; subsequent runs can use cached assets offline. GIF transparency is one-bit (edges cannot be partially transparent).

## Add a template

Create `templates/<id>/config.json` and numbered transparent PNG guides (`1.png`, `2.png`, etc.). The folder is picked up automatically at build time. For example:

```json
{
  "title": "Hello, you!",
  "description": "A little wave in four frames.",
  "duration": 320,
  "width": 480,
  "height": 600,
  "frames": ["1.png", "2.png", "3.png", "4.png"]
}
```

`duration` is milliseconds per GIF frame (at least 20). `width` and `height` are the capture/output resolution (up to 2048 each). The guides must be the same size, fit within that resolution, and are centered without scaling. Templates may have 1–50 ordered frames. Invalid templates are skipped with a console error.

## Style guide

Dark surfaces, mint accents, rounded cards and controls, and compact uppercase labels. Design tokens (colors, radius and font stack) live in `src/variables.css`; layouts and components use those tokens in `src/styles.css`. Reusable controls share `.button`, `.text-button`, and `.circle-button` styles. UI flows are split into menu (`App`), capture (`Capture`), and result (`Results`); template loading and image processing live outside the views.

The background-removal dependency is AGPL-3.0. Check its license terms before distributing the app.
