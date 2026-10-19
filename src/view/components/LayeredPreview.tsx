import type { CSSProperties, PointerEvent } from "react";
import type { PreviewLayer } from "../../viewmodel/useCaptureLayersViewModel";
import "./LayeredPreview.scss";

export function LayeredPreview(props: {
  layers: PreviewLayer[];
  background?: string | null;
  imported?: {
    url: string;
    placement: { x: number; y: number; width: number; rotation: number };
    onMove: (placement: {
      x: number;
      y: number;
      width: number;
      rotation: number;
    }) => void;
    onResize: (width: number) => void;
  };
}) {
  const ratio =
    props.layers.find((layer) => layer.aspectRatio !== undefined)
      ?.aspectRatio ?? 1;
  function startDrag(event: PointerEvent<HTMLElement>, resize: boolean) {
    if (!props.imported) return;
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    const picture = element.closest(".picture")!;
    const start = props.imported.placement;
    const x = event.clientX;
    const y = event.clientY;
    element.setPointerCapture(event.pointerId);
    element.onpointermove = (move) => {
      const scale = 100 / picture.getBoundingClientRect().width;
      if (resize)
        props.imported?.onResize(start.width + (move.clientX - x) * scale);
      else
        props.imported?.onMove({
          ...start,
          x: start.x + (move.clientX - x) * scale,
          y: start.y + (move.clientY - y) * scale,
        });
    };
    element.onpointerup = element.onpointercancel = () => {
      element.onpointermove = null;
      element.onpointerup = null;
      element.onpointercancel = null;
    };
  }
  return (
    <div
      className="picture"
      style={
        {
          aspectRatio: ratio,
          "--picture-ratio": ratio,
          background: props.background ?? undefined,
        } as CSSProperties
      }
    >
      {[...props.layers]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer) =>
          layer.kind === "video" ? (
            <video
              key={layer.id}
              ref={layer.ref}
              autoPlay
              muted
              playsInline
              className={layer.className}
              style={{
                ...layer.style,
                zIndex: layer.zIndex,
                opacity: layer.opacity / 100,
              }}
              onPlaying={layer.onReady}
              onError={layer.onError}
              aria-label={layer.ariaLabel}
            />
          ) : layer.id === "base" && props.imported ? (
            <div
              key={layer.id}
              className="imported-photo"
              style={{
                left: `${props.imported.placement.x}%`,
                top: `${props.imported.placement.y}%`,
                width: `${props.imported.placement.width}%`,
                transform: `rotate(${props.imported.placement.rotation}deg)`,
                zIndex: layer.zIndex,
              }}
              tabIndex={0}
              role="group"
              onKeyDown={(event) => {
                const delta = {
                  ArrowLeft: [-2, 0],
                  ArrowRight: [2, 0],
                  ArrowUp: [0, -2],
                  ArrowDown: [0, 2],
                }[event.key];
                if (delta) {
                  event.preventDefault();
                  props.imported?.onMove({
                    ...props.imported.placement,
                    x: props.imported.placement.x + delta[0],
                    y: props.imported.placement.y + delta[1],
                  });
                }
              }}
              onPointerDown={(event) => startDrag(event, false)}
              aria-label="Imported photo: drag or use arrow keys to reposition"
            >
              <img
                src={props.imported.url}
                alt=""
                draggable={false}
                style={{ opacity: layer.opacity / 100 }}
              />
              <button
                type="button"
                className="resize-handle"
                aria-label="Resize imported photo with left and right arrow keys"
                onPointerDown={(event) => startDrag(event, true)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    event.stopPropagation();
                    props.imported?.onResize(
                      props.imported.placement.width +
                        (event.key === "ArrowRight" ? 2 : -2),
                    );
                  }
                }}
              />
            </div>
          ) : (
            layer.url &&
            layer.opacity > 0 && (
              <img
                key={layer.id}
                className={layer.className}
                style={{
                  ...layer.style,
                  zIndex: layer.zIndex,
                  opacity: layer.opacity / 100,
                }}
                src={layer.url}
                alt={layer.alt}
              />
            )
          ),
        )}
    </div>
  );
}
