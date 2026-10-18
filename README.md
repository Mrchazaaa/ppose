# ppose

Make a transparent animated GIF of yourself, entirely in your browser.

## Run locally

Requires Node.js 20+. Run `npm ci` and `npm run dev`, then open `http://localhost:5173/` on the computer running the server (use the port Vite prints if it changes). A LAN HTTP address such as `http://mrchazaaa-asus-laptop:5173/` can display the app but **cannot access the camera on any device**, including the host computer. Other devices need trusted HTTPS.

To use the camera on a phone while testing locally:

1. Stop any server already using port 5173, then run `./eng/dev-https.sh` (or `npm run dev:https`). The script selects the IP of the default network route. If your phone is on a different network, supply its reachable LAN IP instead: `./eng/dev-https.sh YOUR_LAN_IP` (for example, `./eng/dev-https.sh 192.168.1.227`).
2. Transfer **only** `.cert/local-ca.crt` (Android) or `.cert/local-ca.cer` (iPhone) to your phone and install it as a trusted certificate authority. On iPhone, after installing the profile, enable full trust under Settings → General → About → Certificate Trust Settings. Keep `.cert/local-ca.key` private.
3. On the phone, open `https://YOUR_LAN_IP:5173/` in its browser. The exact IP supplied in step 1 must match the address in the URL. If the browser reports a certificate warning, check that the CA is trusted before using the camera.

The `.cert/` directory is generated locally and git-ignored. Run `npm run build` to type-check and build.

## Deploy to Netlify

In Netlify, choose **Add new project → Import an existing project**, connect this GitHub repository, and select the `master` branch. `netlify.toml` runs the tests and production build, then publishes `dist/`. Once connected, pushes to `master` deploy automatically; pull requests get deploy previews. Netlify supplies HTTPS, so cameras work without the local certificate.

Select a template, line up with each guide, take a photo immediately or after a 3/5/10-second timer, and accept or retake it. Click earlier frames to review or replace them. When all frames are accepted, make and download your GIF with the original photo backgrounds. Photos are held only in memory until you exit; no photos are uploaded.

## Add a template

Create `templates/<id>/config.json` and transparent PNG guides. The folder is picked up automatically at build time. For example:

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

`preview` names an image in the template folder (PNG, JPG, WebP, or GIF) for its homepage card; it can be separate from the pose guides. `duration` is milliseconds per GIF frame (at least 20). `width` and `height` are the capture/output resolution (up to 2048 each). The guides must be the same size, fit within that resolution, and are centered without scaling. `frames` lists 1–100 PNG filenames in playback order; names can be repeated to hold a pose. Invalid templates are skipped with a console error.

Run `npm run guides:gif -- hello` to animate the listed guide PNGs using the template's dimensions and frame duration. It writes `templates/hello/guides.gif`; set `"preview": "guides.gif"` in its `config.json` to show that animation on the homepage.

## Style guide

Dark surfaces, mint accents, rounded cards and controls, and compact uppercase labels. Design tokens (colors, radius, font stack, spacing, and shared sizes) live in `src/variables.scss`; global styles and reusable controls (`.button`, `.text-button`, `.circle-button`) live in `src/styles.scss`. Each view and component imports its own adjacent `.scss` file. `src/view/` renders the menu, capture, and results; `src/viewmodel/` manages their state and actions; `src/model/` loads templates and processes images.

Background removal is temporarily disabled. Set `REMOVE_BACKGROUNDS` to `true` in `src/viewmodel/useResultsViewModel.ts` to enable it again. The background-removal dependency is AGPL-3.0. Check its license terms before distributing the app.
