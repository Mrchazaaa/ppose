# Use ppose

## Choose a template

Open the app and choose an animation template from the menu. Starting a template requires a camera and permission to use it. Browser camera access also requires a secure context: use `localhost` on the development computer or trusted HTTPS on another device. If access fails, the app displays an error; see the [local setup instructions](../../README.md#run-locally) for phone testing.

## Capture and review frames

1. Line yourself up with the translucent pose guide over the live camera preview.
2. Take a photo immediately, or select a 3-, 5-, or 10-second timer before pressing the shutter.
3. Review the shot. Choose **Retake** to replace it, or **Accept photo** to save it and move to the next frame.
4. Repeat for every frame. Use the frame timeline to revisit an earlier photo and retake it if needed.

After all shots are accepted, the app removes their backgrounds and creates the GIF on your device. If final processing fails, use **Try again** to retry from the original photos. The app saves the session's photos in memory only until you exit. If the camera disconnects, return to the menu and reconnect it.

## Make and download the GIF

Once every frame has been accepted, choose **Make my GIF**. The results view shows encoding progress, a looping preview, and a **Download GIF** link. If export fails, choose **Try again**. Close the results view to return to the template menu.

The result has a transparent background. GIF transparency is one-bit, so edges cannot be partially transparent. The first background-removal run downloads model and WASM assets and may take longer; cached assets can be reused offline. No photos or model input are uploaded.
