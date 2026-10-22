import type { CSSProperties, PointerEvent } from "react";
import type { PreviewLayer } from "../../viewmodel/useCaptureLayersViewModel";
import "./LayeredPreview.scss";

export function LayeredPreview(props: {
  layers: PreviewLayer[];
  background?: string | null;
}) {
  const ratio =
    props.layers.find((layer) => layer.aspectRatio !== undefined)
      ?.aspectRatio ?? 1;
  function startDrag(
    event: PointerEvent<HTMLElement>,
    manipulation: NonNullable<PreviewLayer["manipulation"]>,
    resize: boolean,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget;
    const picture = element.closest(".picture")!;
    const start = manipulation.placement;
    const x = event.clientX;
    const y = event.clientY;
    element.setPointerCapture(event.pointerId);
    element.onpointermove = (move) => {
      const scale = 100 / picture.getBoundingClientRect().width;
      if (resize)
        manipulation.onResize(start.width + (move.clientX - x) * scale);
      else
        manipulation.onMove({
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
          layer.manipulation ? (
            <div
              key={layer.id}
              className="imported-media"
              style={{
                left: `${layer.manipulation.placement.x}%`,
                top: `${layer.manipulation.placement.y}%`,
                width: `${layer.manipulation.placement.width}%`,
                transform: `rotate(${layer.manipulation.placement.rotation}deg)`,
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
                  layer.manipulation?.onMove({
                    x: layer.manipulation.placement.x + delta[0],
                    y: layer.manipulation.placement.y + delta[1],
                  });
                }
              }}
              onPointerDown={(event) => startDrag(event, layer.manipulation!, false)}
              aria-label={`Imported ${layer.kind === "video" ? "video" : "photo"}: drag or use arrow keys to reposition`}
            >
              {layer.kind === "video" ? (
                <video
                  ref={layer.ref}
                  src={layer.src}
                  muted
                  playsInline
                  className={layer.className}
                  style={{ ...layer.style, opacity: layer.opacity / 100 }}
                  onLoadedData={layer.onReady}
                  onLoadedMetadata={layer.onMetadata}
                  onSeeking={layer.onSeeking}
                  onSeeked={layer.onSeeked}
                  onError={layer.onError}
                  aria-label={layer.ariaLabel}
                />
              ) : (
                <img
                  src={layer.url}
                  alt={layer.alt}
                  className={layer.className}
                  draggable={false}
                  style={{ ...layer.style, opacity: layer.opacity / 100 }}
                />
              )}
              <button
                type="button"
                className="resize-handle"
                aria-label={`Resize imported ${layer.kind === "video" ? "video" : "photo"} with left and right arrow keys`}
                onPointerDown={(event) => startDrag(event, layer.manipulation!, true)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                    event.preventDefault();
                    event.stopPropagation();
                    layer.manipulation?.onResize(
                      layer.manipulation.placement.width +
                        (event.key === "ArrowRight" ? 2 : -2),
                    );
                  }
                }}
              />
            </div>
          ) : layer.kind === "video" ? (
            <video
              key={layer.id}
              ref={layer.ref}
              src={layer.src}
              autoPlay={layer.autoPlay ?? true}
              muted
              playsInline
              className={layer.className}
              style={{
                ...layer.style,
                zIndex: layer.zIndex,
                opacity: layer.opacity / 100,
              }}
              onPlaying={layer.onReady}
              onLoadedData={layer.onReady}
              onLoadedMetadata={layer.onMetadata}
              onSeeking={layer.onSeeking}
              onSeeked={layer.onSeeked}
              onError={layer.onError}
              aria-label={layer.ariaLabel}
            />
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
