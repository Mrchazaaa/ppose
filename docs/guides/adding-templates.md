# Add a template

Create a folder under `templates/` with a `config.json` and numbered transparent PNG pose guides. Templates are bundled from this folder at build time; no menu code changes are needed.

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
| `duration` | Milliseconds per GIF frame; integer of at least 20. |
| `width`, `height` | Capture and output resolution in pixels; integers from 1 to 2048. |
| `frames` | Ordered list of 1–50 guides, named consecutively `1.png`, `2.png`, and so on. |

All guides in a template must have identical dimensions and fit within the specified output resolution. They are centered horizontally and vertically over the camera view without scaling. Design each guide for the pose to be photographed in its corresponding frame; a guide helps with alignment but is not a background-removal mask.

An invalid configuration, missing guide, or guide of the wrong size prevents that template from loading. Check the browser console for the error. See [`src/templates.ts`](../../src/templates.ts) for the loader and validation rules.
