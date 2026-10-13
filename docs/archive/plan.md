# Instructions: 
  - Do not commit or push this plan.md document. Keep it unstaged.
  - When executing this plan regularly make and push commits. Comit together changes which conceptually belong in the same slice and provide a concise yet descriptive commit message.
  - Adhere to SOLID principles.
  - Where possible avoid duplication.
  - Avoid magic strings.
  - Dont worry about deploying this web app to hosting. I will deploy it at a later time.
  - Prefer composition over inheritance.
  - Ensure an appropriate level of encapsulation, with interfaces being used to avoid tight coupling and allow things like dependencies to be swapped in and out easily.
  - When considering an important choice which may affect the wider project or intended functionality, prompt me for input rather than making a decision on your own.

## ppose

### Overview

ppose is a clientside web app which allows users to create animated gifs of themselves from a set of predefined templates. The user selects a template and takes a several pictures of themselves within a sequence of overlayed pose guides. Once all poses have been provided by the user the app animates the sequence of images. It then allows the user to download the resulting gif of all the images animated.

### Features

- For now, if a camera is not detected or allowed to be used then the app wont allow the user to launch a template.

#### UI
- Modern UI which is consistent across the app. 
- Atomic design with reusable components across the app.
- A styleguide is defined.
- CSS variables are defined in a single variables file and reused across the app, rather than having individual componentsdefine their own css values. 
- No light mode, only dark mode.

#### Template menu
- When the user goes to ppose.com they are presented with a menu where they can select the animation template they want to start.

#### Template 
- When starting a template, the user is presented with a full screen camera view. 
- This view allows the user to set a timer for counting down to taking a picture or allows the user to click a button to take a picture immediately.
- In this view, the camera is overlayed with an onion skin post guide which they can position themselves within. The user is intended to arrange themselves into the provided post and take a picture.
- Upon taking a picture the user is shown the image and prompted whether they want to continue to the next frame or retake that picture.
- When the user selects the accept button the app attempts to remove the background in the image leaving only the person in the foreground. It should attempt to use the guide to inform roughly which bits can be removed from the background.
- The view includes a button which allows the user to go back to any previously taken frame and review it. They can then decide to retake it if they so choose.
- Once all frames have been provided with a picture, a "next" button is enabled allowing the user to continue to the results page.
- Templates can have up to 50 guide images provided (although this may be increased later).
- For now, assume that templates can only be added by me manually creating a folder in a "templates" folder which will include a json configuration file (for things like animation speed and template title) and a series of numbered png frames which contain the onion skin pose guides.
- All guide images in a template must be the same width and height. If they are not, the app should fail to load them and print relevant errors logs in the console.
- The template configuration file must define a resolution in which the images must be taken. It is assumed that the guides will be sized to fit just within that camera size and should be horizontally and vertically centered within the camera frame.

#### Results 
- In the results page, the app produces an animated gif of all the images using the templates' specified speed. 
- The results page displays a preview of the animated gif.
- The user can download the produced animation.
- The user can close the results view and they will be returned to the template menu.
- The resulting animation shows the user on a real transparent background rather than a solid background.

### Implementation details

- An MVVM architecture.
- Use typescript.
- Use React.
- All processing is done locally, there is no backend.
- React state should exist as close to the place where it is actually used and relevant to avoid unnessary prop drilling.
- React should be used appropriately according to best practices to ensure no unecessary rerenders and good performance.
- For now, use https://github.com/imgly/background-removal-js for background removal. But keep the design flexible to allow for different mechanisms to be used in the future.

### Implementation plan

1. **Validate the browser-only pipeline first.** Build a small prototype that captures a camera frame, runs on-device person segmentation, and exports a short GIF. Test on a target phone and desktop browser before committing to a model or UI structure. The pose guide can help users line up, but cannot by itself distinguish the person from the background; use a segmentation model for that. Check model size, processing time, edge quality, and whether the browser can run it offline after assets load.
2. **Set up the React app and template format.** Define a minimal template config (title, frame duration, ordered guide images), validate it when loaded, and include one complete sample template. Load bundled templates from the `templates` folder at build time so adding a folder does not require editing UI code. Keep template metadata and guide images together.
3. **Build the capture flow.** Show the selected guide over the live camera, allow immediate capture or a selectable countdown, then show a review screen with accept/retake. Track progress by frame; allow revisiting and replacing accepted frames. Store captured originals until the session ends so a failed segmentation step can be retried without another photo. Keep the relevant session state in the capture flow rather than in a global store.
4. **Process and export.** Segment accepted photos locally, crop/scale them consistently into the template's output dimensions, and encode the ordered frames at the configured speed. Show progress and a recoverable error if processing fails. Generate a GIF preview and download from the resulting Blob; release camera tracks, temporary object URLs, and frame buffers when leaving the flow.
5. **Polish and verify.** Test camera permission denial, no camera, slow/failed processing, interrupted sessions, retakes, and returning to the menu. Check guide alignment and capture mirroring on front-facing cameras, mobile layout, keyboard access, and performance on the intended devices. No photo or model input should be uploaded.

