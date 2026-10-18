import type { CSSProperties, RefObject } from 'react'
import type { Template } from '../model/templates'

export function CameraPreview(props: {
  template: Template; captureTemplate: Template; mode: 'camera' | 'review'; video: RefObject<HTMLVideoElement | null>
  mirrored: boolean; currentUrl?: string; overlayUrl?: string; overlayOpacity: number; guideOpacity: number
  index: number; onReady: () => void; onError: () => void
}) {
  return <div className="picture" style={{ aspectRatio: `${props.captureTemplate.width} / ${props.captureTemplate.height}`, '--picture-ratio': props.captureTemplate.width / props.captureTemplate.height } as CSSProperties}>
    {props.mode === 'camera' ? <video ref={props.video} autoPlay muted playsInline className="camera-video" style={{ transform: props.mirrored ? 'scaleX(-1)' : 'none' }} onPlaying={props.onReady} onError={props.onError} aria-label="Live camera preview" /> : props.currentUrl && <img className="review-image" src={props.currentUrl} alt={`Captured frame ${props.index + 1}`} />}
    {props.overlayUrl && <img className="frame-overlay" style={{ opacity: props.overlayOpacity / 100 }} src={props.overlayUrl} alt="" />}
    {props.guideOpacity > 0 && <img className="pose-guide" style={{ width: `${props.template.guideWidth / props.template.width * 100}%`, height: `${props.template.guideHeight / props.template.height * 100}%`, opacity: props.guideOpacity / 100 }} src={props.template.guides[props.index]} alt="Pose guide" />}
  </div>
}
