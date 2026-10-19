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
  stream: MediaStream;
  onClose: () => void;
  process?: ForegroundProcessor;
}) {
  const { mode, busy, layers, camera, photos, settings, result } =
    useCaptureViewModel(props.template, props.stream);
  const fileInput = useRef<HTMLInputElement>(null);
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
            mode === "import" && camera.imported
              ? {
                  url: camera.imported.url,
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
          {mode === "import" && (
            <div className="import-tools">
              <label>
                Size {Math.round(camera.placement.width)}%
                <input
                  type="range"
                  min="10"
                  max="300"
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
          <div className="capture-controls">
            {mode === "camera" || mode === "import" ? (
              <button
                className="shutter"
                type="button"
                disabled={
                  (mode === "camera" && !camera.ready) ||
                  busy ||
                  camera.countdown > 0
                }
                aria-label="Take photo"
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
                aria-label="Choose photo source"
                title="Choose photo source"
              >
                ＋
              </summary>
              <div className="source-options">
                <button
                  type="button"
                  disabled={busy}
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
                  Select one
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
