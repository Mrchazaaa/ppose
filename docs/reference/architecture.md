# Architecture and processing

ppose is a React and TypeScript client-side application. There is no backend: the camera, photos, background removal, GIF encoding, preview, and download all run in the browser.

## App structure

- [`src/App.tsx`](../../src/App.tsx) loads templates, presents the menu, requests camera access, and owns the active session.
- [`src/Capture.tsx`](../../src/Capture.tsx) owns the capture, review, and results flow. Session frame state stays close to the views that use it rather than in a global store.
- [`src/templates.ts`](../../src/templates.ts) bundles templates and validates their configuration and image dimensions.
- [`src/processing.ts`](../../src/processing.ts) contains the foreground processor and GIF encoder. `ForegroundProcessor` is a function type that lets the capture flow use another removal implementation without changing the view.

Views own their state and call processing functions for image work, following the project's MVVM separation in a lightweight way. Favor composition, reuse, and small boundaries over duplicated logic or tight coupling.

## Photo-to-GIF pipeline

1. The menu requests a video-only camera stream when a template starts. If a camera is unavailable or permission is denied, capture cannot begin.
2. Capture displays a centered pose guide above the live preview. A camera frame is cropped to fill the template's output dimensions; front-facing captures are mirrored to match the preview.
3. The original photo is kept for review, retakes, and retrying a failed background-removal attempt. Accepting a photo runs `@imgly/background-removal` locally with the quantized ISNet model. The guide helps positioning; segmentation identifies the person.
4. Once all frames are processed, `gifenc` converts them in order at the template's configured frame duration. The encoder uses one-bit transparency and produces a GIF `Blob` for preview and download.
5. Leaving the session stops camera tracks and revokes temporary object URLs. GIF export reports progress and can be retried after failure.

Background-removal model and WASM assets are downloaded on first use and cached by the browser. Check performance, edge quality, and offline reuse on the target devices; first-use processing can be slow.
