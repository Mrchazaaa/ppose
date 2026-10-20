import type { PreviewLayer } from "../../viewmodel/useCaptureLayersViewModel";
import "./CaptureSettings.scss";

export function CaptureSettings(props: {
  aspect: string;
  originalLabel: string;
  hasFrames: boolean;
  onAspectChange: (aspect: string) => void;
  timer: number;
  onTimerChange: (seconds: number) => void;
  background: string | null;
  onBackgroundChange: (background: string | null) => void;
  layers: PreviewLayer[];
}) {
  return (
    <details className="capture-settings">
      <summary aria-label="Capture settings" title="Capture settings">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 2h4l.5 2.5 1.4.6L18 3.7l2.3 2.3-1.4 2.1.6 1.4L22 10v4l-2.5.5-.6 1.4 1.4 2.1-2.3 2.3-2.1-1.4-1.4.6L14 22h-4l-.5-2.5-1.4-.6L6 20.3 3.7 18l1.4-2.1-.6-1.4L2 14v-4l2.5-.5-.6-1.4L3.7 6 6 3.7l2.1 1.4 1.4-.6L10 2Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </summary>
      <div className="settings-panel">
        <strong>Camera options</strong>
        <label>
          Aspect ratio
          <select
            value={props.aspect}
            disabled={props.hasFrames}
            onChange={(event) => props.onAspectChange(event.target.value)}
          >
            <option value="original">{props.originalLabel}</option>
            <option value="1">1:1</option>
            <option value="0.8">4:5</option>
            <option value="0.5625">9:16</option>
          </select>
        </label>
        {props.hasFrames && <small>Retake all photos to change ratio.</small>}
        <label>
          Timer
          <select
            value={props.timer}
            onChange={(event) =>
              props.onTimerChange(Number(event.target.value))
            }
          >
            <option value="0">Off</option>
            <option value="3">3 sec</option>
            <option value="5">5 sec</option>
            <option value="10">10 sec</option>
          </select>
        </label>
        <label>
          GIF background
          <select
            value={props.background === null ? "transparent" : "color"}
            onChange={(event) =>
              props.onBackgroundChange(
                event.target.value === "transparent" ? null : "#ffffff",
              )
            }
          >
            <option value="transparent">Transparent</option>
            <option value="color">Color</option>
          </select>
        </label>
        {props.background !== null && (
          <label>
            Background color
            <input
              type="color"
              value={props.background}
              onChange={(event) => props.onBackgroundChange(event.target.value)}
            />
          </label>
        )}
        {props.layers.map((layer) => (
          <label key={layer.id}>
            {layer.label} opacity: {layer.opacity}%
            <input
              type="range"
              min="0"
              max="100"
              value={layer.opacity}
              onChange={(event) =>
                layer.onOpacityChange(Number(event.target.value))
              }
            />
          </label>
        ))}
      </div>
    </details>
  );
}
