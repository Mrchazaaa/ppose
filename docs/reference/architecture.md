# Architecture and processing

ppose is a React and TypeScript client-side application. There is no backend: the camera, imported media, background removal, GIF encoding, preview, and download all run in the browser.

## App structure

- [`src/view/App.tsx`](../../src/view/App.tsx) selects [`TemplateMenu`](../../src/view/TemplateMenu.tsx), [`Capture`](../../src/view/Capture.tsx), or [`Results`](../../src/view/Results.tsx) for the route; it delegates pending and unavailable route messages to a small UI component.
- [`src/view/components/`](../../src/view/components/) contains the smaller UI pieces composed by those views, including the layered preview and capture settings.
- [`src/viewmodel/`](../../src/viewmodel/) contains React hooks for template selection, camera and frame state, preview layer selection and opacity, and GIF export progress. Views call their actions and render their state.
- [`src/model/templates.ts`](../../src/model/templates.ts) bundles templates and validates their configuration and image dimensions.
- [`src/model/processing.ts`](../../src/model/processing.ts) captures and processes photos; [`src/model/gif.ts`](../../src/model/gif.ts) encodes GIFs for the app and guide-animation script.

Views contain JSX, viewmodels own workflow state and actions, and models handle template and image data. `TemplateMenu` calls its own viewmodel for camera availability and the local setup URL; the app viewmodel supplies loaded templates and session-start actions. Session frame state stays local to the capture viewmodel's composed hooks rather than a global store.
[`useRoute`](../../src/viewmodel/useRoute.ts) maps `/` to the template menu, `/capture/custom` to a custom studio, `/capture/:templateId` to a bundled template, and `/results` to the completed export. It owns URL parsing, history navigation, and Back/Forward listening; the app viewmodel resolves templates and owns camera sessions and in-memory results. Completing a capture hands accepted originals and output settings to the app, which mounts the dedicated Results view at `/results`. Results exist only in memory: a direct visit or refresh has no export and shows a return-to-menu action. Browser Back from results starts a fresh studio session; leaving results releases its originals and GIF URL, so Forward cannot restore that export. Leaving a studio stops its stream; a late camera permission response is discarded and its tracks stopped. Unknown routes show a menu return action. Netlify rewrites direct route requests to `index.html` via `public/_redirects`.
The capture viewmodel owns session phases and review/results transitions. It composes [`useCaptureSettings`](../../src/viewmodel/useCaptureSettings.ts) for aspect validation, derived output dimensions, timer duration, and background, and [`useCaptureCountdown`](../../src/viewmodel/useCaptureCountdown.ts) for countdown state, ticking, and timeout cleanup. The coordinator decides when capture and aspect changes are allowed, cancels countdowns on workflow changes, and captures when a countdown completes.

[`useCaptureFrames`](../../src/viewmodel/useCaptureFrames.ts) owns frame originals and preview URLs, acceptance, current-frame and overlay selection, and completion state. Frame actions handle replacement/retake cleanup and next-frame selection; the coordinator uses their outcomes to choose session transitions. Ordered originals are available for export only when every frame is accepted.

It also composes [`useCaptureSource`](../../src/viewmodel/useCaptureSource.ts), which owns camera wiring, imported-media URLs, video seeking/readiness, placement, and capturing the selected source into a `Blob`. Source selection survives review; the source hook receives preview activity and output dimensions, not session setters or frame state. Each owner releases its own object URLs.

The source hook prepares a base preview layer; the capture viewmodel substitutes the reviewed photo and adds frame and guide overlays. Each display-ready descriptor carries its stacking order, appearance, video wiring, and optional placement controls. The layer viewmodel manages opacity by layer ID. The layered preview renders descriptors by z-index without knowing capture modes or source records, while settings expose their opacity controls. Retaking an overlaid frame clears that selection. Aspect changes are locked during capture/import and while saved frames exist.

## Photo-to-GIF pipeline

1. The menu requests a video-only camera stream when a template starts. If a camera is unavailable or permission is denied, the studio still opens for imported images and videos.
2. Capture displays a centered pose guide above the live preview. Templates with a longest side of 1024 pixels or less are captured at twice their configured dimensions; the camera requests matching resolution where supported. A camera frame is cropped to fill the capture dimensions; front-facing captures are mirrored to match the preview. Imported video uses the browser's video decoder and a position slider; paused frames use the same movable, resizable placement and canvas capture as imported images.
3. Original photos are kept for review and retakes. Accepting a photo moves to the next frame without processing it. Once all photos are accepted, final processing runs `@imgly/background-removal` locally on each original with the quantized ISNet model. The guide helps positioning; segmentation identifies the person.
4. Once all frames are processed, each frame is resized to fit within 480×720 pixels without upscaling, then `gifenc` converts them in order at the template's configured frame duration. The encoder uses one-bit transparency and produces a GIF `Blob` for preview and download. Failed final processing can be retried from the saved originals.
5. Leaving the session stops camera tracks and revokes temporary object URLs. GIF export reports progress and can be retried after failure.

Background-removal model and WASM assets are downloaded on first use and cached by the browser. Check performance, edge quality, and offline reuse on the target devices; first-use processing can be slow.
