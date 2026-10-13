# Design guide

ppose uses a single dark theme: dark surfaces, mint accents, rounded cards and controls, and compact uppercase labels. Keep the menu, studio, and results views visually consistent. Follow an atomic-design approach: compose reusable controls and patterns into larger views rather than duplicating styles.

Design tokens for colors, radius, and the font stack live in [`src/variables.css`](../../src/variables.css). Use those CSS variables in [`src/styles.css`](../../src/styles.css) instead of defining per-component color values. Shared control styles include `.button`, `.text-button`, and `.circle-button`.

The menu shows template cards; the studio emphasizes the camera, pose guide, frame progress, and review actions; the results view emphasizes the GIF preview and download. Maintain keyboard access and legible status/error messages when changing these flows. Check mobile layouts and front-facing camera mirroring against the guide when making visual changes.
