import type { CSSProperties, RefObject } from 'react'
import type { Template } from '../../model/templates'
import type { PreviewLayer } from '../../viewmodel/useCaptureLayersViewModel'

export function LayeredPreview(props: {
  captureTemplate: Template; video: RefObject<HTMLVideoElement | null>; layers: PreviewLayer[]
  onReady: () => void; onError: () => void
}) {
  return <div className="picture" style={{ aspectRatio: `${props.captureTemplate.width} / ${props.captureTemplate.height}`, '--picture-ratio': props.captureTemplate.width / props.captureTemplate.height } as CSSProperties}>
    {props.layers.map(layer => layer.kind === 'video'
      ? <video key={layer.label} ref={props.video} autoPlay muted playsInline className={layer.className} style={{ ...layer.style, opacity: layer.opacity / 100 }} onPlaying={props.onReady} onError={props.onError} aria-label="Live camera preview" />
      : layer.url && layer.opacity > 0 && <img key={layer.label} className={layer.className} style={{ ...layer.style, opacity: layer.opacity / 100 }} src={layer.url} alt={layer.alt} />)}
  </div>
}
