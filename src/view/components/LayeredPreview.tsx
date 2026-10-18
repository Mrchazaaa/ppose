import type { CSSProperties } from 'react'
import type { PreviewLayer } from '../../viewmodel/useCaptureLayersViewModel'

export function LayeredPreview(props: { layers: PreviewLayer[] }) {
  const ratio = props.layers.find(layer => layer.aspectRatio !== undefined)?.aspectRatio ?? 1
  return <div className="picture" style={{ aspectRatio: ratio, '--picture-ratio': ratio } as CSSProperties}>
    {[...props.layers].sort((a, b) => a.zIndex - b.zIndex).map(layer => layer.kind === 'video'
      ? <video key={layer.id} ref={layer.ref} autoPlay muted playsInline className={layer.className} style={{ ...layer.style, zIndex: layer.zIndex, opacity: layer.opacity / 100 }} onPlaying={layer.onReady} onError={layer.onError} aria-label={layer.ariaLabel} />
      : layer.url && layer.opacity > 0 && <img key={layer.id} className={layer.className} style={{ ...layer.style, zIndex: layer.zIndex, opacity: layer.opacity / 100 }} src={layer.url} alt={layer.alt} />)}
  </div>
}
