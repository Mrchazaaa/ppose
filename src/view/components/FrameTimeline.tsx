import "./FrameTimeline.scss";

export function FrameTimeline(props: {
  frames: ({ url: string; accepted: boolean } | null)[];
  index: number;
  busy: boolean;
  overlayIndex: number | null;
  onSelect: (position: number) => void;
  onToggleOverlay: (position: number) => void;
}) {
  return (
    <div className="timeline" aria-label="Frames">
      {props.frames.map((frame, position) => (
        <div className="timeline-item" key={position}>
          <button
            className={`timeline-frame ${position === props.index ? "active" : ""}`}
            type="button"
            disabled={props.busy}
            onClick={() => props.onSelect(position)}
            aria-label={`Frame ${position + 1}${frame?.accepted ? ", complete" : ""}`}
            aria-current={position === props.index ? "step" : undefined}
          >
            {frame ? <img src={frame.url} alt="" /> : <span>+</span>}
            <small>{String(position + 1).padStart(2, "0")}</small>
          </button>
          {frame && (
            <input
              className="overlay-toggle"
              type="checkbox"
              checked={props.overlayIndex === position}
              disabled={props.busy}
              onChange={() => props.onToggleOverlay(position)}
              aria-label={`Overlay frame ${position + 1} on preview`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
