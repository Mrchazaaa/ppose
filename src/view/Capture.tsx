import { useRef } from "react";
import type { ForegroundProcessor } from "../model/processing";
import type { Template } from "../model/templates";
import { LayeredPreview } from "./components/LayeredPreview";
import { CaptureSettings } from "./components/CaptureSettings";
import { FrameTimeline } from "./components/FrameTimeline";
import { useCaptureViewModel } from "../viewmodel/useCaptureViewModel";
import { Results } from "./Results";
import "./Capture.scss";

export function Capture(props: {
  template: Template;
  stream: MediaStream | null;
  onClose: () => void;
  process?: ForegroundProcessor;
}) {
  const { mode, busy, layers, camera, photos, settings, result } =
    useCaptureViewModel(props.template, props.stream);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const sourceMenu = useRef<HTMLDetailsElement>(null);

  if (mode === "results")
    return (
      <Results
        template={result.template}
        frames={result.frames}
        background={result.background}
        process={props.process}
        onClose={props.onClose}
      />
    );

  return (
    <main className="studio">
      <div className="viewport">
        <LayeredPreview
          layers={layers}
          background={settings.background}
          imported={
            (mode === "import" && camera.imported) || (mode === "video" && camera.videoFile)
              ? {
                  url: camera.imported?.url,
                  placement: camera.placement,
                  onMove: camera.setPlacement,
                  onResize: camera.resize,
                }
              : undefined
          }
        />
        {camera.countdown > 0 && (
          <div className="countdown" aria-live="assertive">
            {camera.countdown}
          </div>
        )}
        <div className="studio-top">
          <button className="text-button" type="button" onClick={props.onClose}>
            ← Exit studio
          </button>
          <CaptureSettings
            aspect={settings.aspect}
            hasFrames={settings.hasFrames}
            onAspectChange={settings.setAspect}
            timer={settings.timer}
            onTimerChange={settings.chooseTimer}
            background={settings.background}
            onBackgroundChange={settings.setBackground}
            layers={layers}
          />
        </div>
        {camera.error && (
          <p className="notice studio-error" role="alert">
            {camera.error}
          </p>
        )}
        <div className="studio-bottom">
          {mode === "review" && (
            <p className="studio-instruction">
              Check your shot. Accept it or retake it before making your GIF.
            </p>
          )}
          {(mode === "import" || mode === "video") && (
            <div className="import-tools">
              <label>
                Size {Math.round(camera.placement.width)}%
                <input
                  type="range"
                  min="10"
                  max={Math.max(300, Math.ceil(camera.placement.width))}
                  value={camera.placement.width}
                  onChange={(event) =>
                    camera.resize(Number(event.target.value))
                  }
                />
              </label>
              <label>
                Rotate {camera.placement.rotation}°
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={camera.placement.rotation}
                  onChange={(event) =>
                    camera.setPlacement({
                      ...camera.placement,
                      rotation: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
          )}
          {mode === "video" && (
            <div className="video-tools">
              <label htmlFor="video-position">Video position</label>
              <input
                id="video-position"
                type="range"
                min="0"
                max={camera.videoDuration || 1}
                step="any"
                value={camera.videoTime}
                disabled={!camera.videoDuration}
                onChange={(event) => camera.seek(Number(event.target.value))}
              />
              <span>{camera.videoTime.toFixed(1)}s / {camera.videoDuration.toFixed(1)}s</span>
            </div>
          )}
          <div className="capture-controls">
            {mode === "camera" || mode === "import" || mode === "video" ? (
              <button
                className="shutter"
                type="button"
                disabled={
                  ((mode === "camera" || mode === "video") && !camera.ready) ||
                  busy ||
                  camera.countdown > 0
                }
                aria-label={mode === "video" ? "Capture video frame" : "Take photo"}
                onClick={camera.shoot}
              >
                <span />
              </button>
            ) : (
              <button
                className="button primary"
                type="button"
                disabled={busy}
                onClick={photos.accept}
              >
                {photos.completed === photos.frames.length - 1 &&
                !photos.current?.accepted
                  ? "Make GIF"
                  : "Accept"}
              </button>
            )}
            {mode === "review" && (
              <button
                className="button secondary"
                type="button"
                disabled={busy}
                onClick={photos.retake}
              >
                ↺ Retake
              </button>
            )}
          </div>
          <div className="timeline-controls">
            <details className="source-menu" ref={sourceMenu}>
              <summary
                aria-label="Choose capture source"
                title="Choose capture source"
              >
                ＋
              </summary>
              <div className="source-options">
                <button
                  type="button"
                  disabled={busy || !props.stream}
                  onClick={() => {
                    camera.useCamera();
                    sourceMenu.current!.open = false;
                  }}
                >
                  Capture image
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    fileInput.current?.click();
                    sourceMenu.current!.open = false;
                  }}
                >
                  Import image
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    videoInput.current?.click();
                    sourceMenu.current!.open = false;
                  }}
                >
                  Import video
                </button>
              </div>
            </details>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="file-input"
              aria-label="Select image file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void camera.importPhoto(file);
                event.target.value = "";
              }}
            />
            <input
              ref={videoInput}
              type="file"
              accept="video/*"
              className="file-input"
              aria-label="Select video file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) camera.importVideo(file);
                event.target.value = "";
              }}
            />
            <FrameTimeline
              frames={photos.frames}
              index={photos.index}
              busy={busy}
              overlayIndex={photos.overlayIndex}
              onSelect={photos.select}
              onToggleOverlay={photos.toggleOverlay}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
