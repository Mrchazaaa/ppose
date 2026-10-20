# Architecture and processing

ppose is a React and TypeScript client-side application. There is no backend: the camera, imported media, background removal, GIF encoding, preview, and download all run in the browser.

## App structure

- [`src/view/App.tsx`](../../src/view/App.tsx) and [`src/view/Capture.tsx`](../../src/view/Capture.tsx) render the menu, capture, review, and results UI.
- [`src/view/components/`](../../src/view/components/) contains the smaller UI pieces composed by those views, including the layered preview and capture settings.
- [`src/viewmodel/`](../../src/viewmodel/) contains React hooks for template selection, camera and frame state, preview layer selection and opacity, and GIF export progress. Views call their actions and render their state.
- [`src/model/templates.ts`](../../src/model/templates.ts) bundles templates and validates their configuration and image dimensions.
- [`src/model/processing.ts`](../../src/model/processing.ts) captures and processes photos; [`src/model/gif.ts`](../../src/model/gif.ts) encodes GIFs for the app and guide-animation script.

Views contain JSX, viewmodels own workflow state and actions, and models handle template and image data. Session frame state stays in the capture viewmodel rather than a global store.
The capture viewmodel coordinates shots and review, selects any frame overlay, and resolves the camera (or reviewed photo), frame, and guide into display-ready layer descriptors. Each descriptor carries its stacking order, appearance, and any video wiring; the layer viewmodel manages opacity by layer ID. The layered preview receives only those layers and renders them by z-index, while settings expose their opacity controls. Retaking an overlaid frame clears that selection.

## Photo-to-GIF pipeline

1. The menu requests a video-only camera stream when a template starts. If a camera is unavailable or permission is denied, the studio still opens for imported images and videos.
2. Capture displays a centered pose guide above the live preview. A camera frame is cropped to fill the template's output dimensions; front-facing captures are mirrored to match the preview. Imported video uses the browser's video decoder and a position slider; paused frames use the same movable, resizable placement and canvas capture as imported images.
3. Original photos are kept for review and retakes. Accepting a photo moves to the next frame without processing it. Once all photos are accepted, final processing runs `@imgly/background-removal` locally on each original with the quantized ISNet model. The guide helps positioning; segmentation identifies the person.
4. Once all frames are processed, `gifenc` converts them in order at the template's configured frame duration. The encoder uses one-bit transparency and produces a GIF `Blob` for preview and download. Failed final processing can be retried from the saved originals.
5. Leaving the session stops camera tracks and revokes temporary object URLs. GIF export reports progress and can be retried after failure.

Background-removal model and WASM assets are downloaded on first use and cached by the browser. Check performance, edge quality, and offline reuse on the target devices; first-use processing can be slow.
