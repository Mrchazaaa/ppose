# Development and verification

## Working principles

Use TypeScript and React with local browser processing. Keep state near its consumers, avoid unnecessary rerenders and prop drilling, and favor composition, encapsulation, reuse, and clear boundaries. Avoid duplicated logic and unexplained magic strings. Before making a choice that significantly affects the product or project, ask for input. Deployment is separate from the app's core behavior.

## Delivery sequence

The project started from this sequence. Use it as context when extending or checking the implementation:

1. **Validate the browser pipeline.** Capture a camera frame, run on-device person segmentation, and export a short GIF on a target phone and desktop browser. Check model size, processing time, edge quality, and offline behavior after assets load. A pose guide alone cannot separate a person from the background.
2. **Set up the app and template format.** Load bundled template folders without editing menu code. Validate metadata and guides; include a complete sample template.
3. **Build the capture flow.** Overlay guides, offer immediate and timed photos, allow accept/retake and revisiting frames, and keep originals available for segmentation retries.
4. **Process and export.** Remove backgrounds locally, size images consistently to template output dimensions, encode frames at the configured speed, show progress and recoverable errors, and release camera tracks, URLs, and frame buffers when done.
5. **Polish and verify.** Check camera denial or absence, slow and failed processing, interrupted sessions, retakes, returning to the menu, guide alignment, front-camera mirroring, mobile layout, keyboard access, and performance on intended devices. Photos and model input must remain local.

Run `npm test` for the processing checks and `npm run build` to type-check and build the app. For local camera testing, see the [README](../README.md#run-locally).

For capture integration checks, run `npm run dev` and open `/tests/capture-workflow.html` in Chromium. It reports PASS/FAIL using canvas-generated media (no camera permission required), exercising frame replacement/selection, overlay invalidation, source switching, review/retake, video seeking, placement, acceptance, and resource cleanup.

Open `/tests/routing.html` in Chromium to check studio/results navigation, Back/Forward, unknown paths, and cleanup when a camera request finishes after leaving a studio.
