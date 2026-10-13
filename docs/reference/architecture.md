# Architecture and processing

ppose is a React and TypeScript client-side application. There is no backend: the camera, photos, background removal, GIF encoding, preview, and download all run in the browser.

## App structure

- [`src/view/App.tsx`](../../src/view/App.tsx) and [`src/view/Capture.tsx`](../../src/view/Capture.tsx) render the menu, capture, review, and results UI.
- [`src/viewmodel/`](../../src/viewmodel/) contains React hooks for template selection, camera and frame state, and GIF export progress. Views call their actions and render their state.
- [`src/model/templates.ts`](../../src/model/templates.ts) bundles templates and validates their configuration and image dimensions.
- [`src/model/processing.ts`](../../src/model/processing.ts) captures and processes photos; [`src/model/gif.ts`](../../src/model/gif.ts) encodes GIFs for the app and guide-animation script.

Views contain JSX, viewmodels own workflow state and actions, and models handle template and image data. Session frame state stays in the capture viewmodel rather than a global store.

## Photo-to-GIF pipeline

1. The menu requests a video-only camera stream when a template starts. If a camera is unavailable or permission is denied, capture cannot begin.
2. Capture displays a centered pose guide above the live preview. A camera frame is cropped to fill the template's output dimensions; front-facing captures are mirrored to match the preview.
3. The original photo is kept for review, retakes, and retrying a failed background-removal attempt. Accepting a photo runs `@imgly/background-removal` locally with the quantized ISNet model. The guide helps positioning; segmentation identifies the person.
4. Once all frames are processed, `gifenc` converts them in order at the template's configured frame duration. The encoder uses one-bit transparency and produces a GIF `Blob` for preview and download.
5. Leaving the session stops camera tracks and revokes temporary object URLs. GIF export reports progress and can be retried after failure.

Background-removal model and WASM assets are downloaded on first use and cached by the browser. Check performance, edge quality, and offline reuse on the target devices; first-use processing can be slow.
