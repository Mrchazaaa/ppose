# Add a template

Create a folder under `templates/` with a `config.json` and transparent PNG pose guides. Templates are bundled from this folder at build time; no menu code changes are needed.

```text
templates/
  hello/
    config.json
    1.png
    2.png
    3.png
    4.png
```

Example `config.json`:

```json
{
  "title": "Hello, you!",
  "description": "A little wave in four frames.",
  "preview": "2.png",
  "duration": 320,
  "width": 480,
  "height": 600,
  "frames": ["1.png", "2.png", "3.png", "4.png"]
}
```

| Field | Meaning |
| --- | --- |
| `title` | Nonempty name displayed in the menu and studio. |
| `description` | Text displayed on the template card. |
| `preview` | Image in the template folder displayed on the homepage card (PNG, JPG, WebP, or GIF); can be separate from the guides. |
| `duration` | Milliseconds per GIF frame; integer of at least 20. |
| `width`, `height` | Template dimensions in pixels; integers from 1 to 2048. Templates with a longest side of 1024 pixels or less are captured at twice these dimensions. GIF exports fit within 480×720 pixels. |
| `frames` | Ordered list of 1–100 PNG filenames in the template folder; names may repeat to hold a pose. |

All guides in a template must have identical dimensions and fit within the configured template dimensions. They are centered horizontally and vertically over the camera view without scaling. Design each guide for the pose to be photographed in its corresponding frame; a guide helps with alignment but is not a background-removal mask.

Run `npm run guides:gif -- hello` to generate `templates/hello/guides.gif` from the listed PNGs at the configured duration and resolution. Set `"preview": "guides.gif"` to use it as the homepage preview.

An invalid configuration, missing guide, or guide of the wrong size prevents that template from loading. Check the browser console for the error. See [`src/model/templates.ts`](../../src/model/templates.ts) for the loader and validation rules.
