import type { ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'
import { LayeredPreview } from './components/LayeredPreview'
import { CaptureSettings } from './components/CaptureSettings'
import { FrameTimeline } from './components/FrameTimeline'
import { useCaptureViewModel } from '../viewmodel/useCaptureViewModel'
import { Results } from './Results'
import './Capture.scss'

export function Capture(props: {
  template: Template; stream: MediaStream; onClose: () => void; process?: ForegroundProcessor
}) {
  const { mode, busy, layers, camera, photos, settings, result } = useCaptureViewModel(props.template, props.stream)

  if (mode === 'results') return <Results template={result.template} frames={result.frames} process={props.process} onClose={props.onClose} />

  return <main className="studio">
    <div className="viewport">
      <LayeredPreview layers={layers} />
      {camera.countdown > 0 && <div className="countdown" aria-live="assertive">{camera.countdown}</div>}
      <div className="studio-top"><button className="text-button" type="button" onClick={props.onClose}>← Exit studio</button><div className="step-label">FRAME {String(photos.index + 1).padStart(2, '0')} <span>/ {String(photos.frames.length).padStart(2, '0')}</span></div></div>
      {camera.error && <p className="notice studio-error" role="alert">{camera.error}</p>}
      <div className="studio-bottom">{mode === 'review' && <p className="studio-instruction">Check your shot. Accept it or retake it before making your GIF.</p>}
        <div className="capture-controls">
          <CaptureSettings aspect={settings.aspect} hasFrames={settings.hasFrames} onAspectChange={settings.setAspect} timer={settings.timer} onTimerChange={settings.chooseTimer} layers={layers} />
          {mode === 'camera' ? <button className="shutter" type="button" disabled={!camera.ready || busy || camera.countdown > 0} aria-label="Take photo" onClick={camera.shoot}><span /></button> : <button className="button primary" type="button" disabled={busy} onClick={photos.accept}>{photos.completed === photos.frames.length - 1 && !photos.current?.accepted ? 'Make GIF' : 'Accept'}</button>}
          {mode === 'review' && <button className="button secondary" type="button" disabled={busy} onClick={photos.retake}>↺ Retake</button>}
        </div>
        <FrameTimeline frames={photos.frames} index={photos.index} busy={busy} overlayIndex={photos.overlayIndex} onSelect={photos.select} onToggleOverlay={photos.toggleOverlay} />
      </div>
    </div>
  </main>
}
