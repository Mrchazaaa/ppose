# Design guide

ppose uses a single dark theme: dark surfaces, mint accents, rounded cards and controls, and compact uppercase labels. Keep the menu, studio, and results views visually consistent. Follow an atomic-design approach: compose reusable controls and patterns into larger views rather than duplicating styles.

Design tokens for colors, radius, the font stack, spacing (`--space-1` through `--space-9`), and shared dimensions (`--control-size`, `--shutter-size`, `--masthead-height`) live in [`src/variables.scss`](../../src/variables.scss). Global resets, typography, and shared controls (`.button`, `.text-button`, `.circle-button`) live in [`src/styles.scss`](../../src/styles.scss); each view or component imports its own adjacent `.scss` file for its layout and appearance. Use the CSS variables for repeated values; keep one-off dimensions local to their component. The masthead and shutter sizes adjust at the mobile breakpoint.

The menu shows template cards; the studio emphasizes the camera, pose guide, frame progress, and review actions; the results view emphasizes the GIF preview and download. Maintain keyboard access and legible status/error messages when changing these flows. Check mobile layouts and front-facing camera mirroring against the guide when making visual changes.
