import type { ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'
import { LayeredPreview } from './components/LayeredPreview'
import { CaptureSettings } from './components/CaptureSettings'
import { FrameTimeline } from './components/FrameTimeline'
import { useCaptureViewModel } from '../viewmodel/useCaptureViewModel'
import { Results } from './Results'

export function Capture(props: {
  template: Template; stream: MediaStream; onClose: () => void; process?: ForegroundProcessor
}) {
  const { frames, index, mode, timer, countdown, busy, error, ready,
    current, completed, layers, overlayIndex, toggleOverlay,
    chooseTimer, shoot, accept, select, retake, aspect, setAspect,
    captureTemplate, resultFrames } = useCaptureViewModel(props.template, props.stream)

  if (mode === 'results') return <Results template={captureTemplate} frames={resultFrames} process={props.process} onClose={props.onClose} />

  return <main className="studio">
    <div className="viewport">
      <LayeredPreview layers={layers} />
      {countdown > 0 && <div className="countdown" aria-live="assertive">{countdown}</div>}
      <div className="studio-top"><button className="text-button" type="button" onClick={props.onClose}>← Exit studio</button><div className="step-label">FRAME {String(index + 1).padStart(2, '0')} <span>/ {String(frames.length).padStart(2, '0')}</span></div></div>
      {error && <p className="notice studio-error" role="alert">{error}</p>}
      <div className="studio-bottom">{mode === 'review' && <p className="studio-instruction">Check your shot. Accept it or retake it before making your GIF.</p>}
        <div className="capture-controls">
          <CaptureSettings aspect={aspect} hasFrames={frames.some(Boolean)} onAspectChange={setAspect} timer={timer} onTimerChange={chooseTimer} layers={layers} />
          {mode === 'camera' ? <button className="shutter" type="button" disabled={!ready || busy || countdown > 0} aria-label="Take photo" onClick={shoot}><span /></button> : <button className="button primary" type="button" disabled={busy} onClick={accept}>{completed === frames.length - 1 && !current?.accepted ? 'Make GIF' : 'Accept'}</button>}
          {mode === 'review' && <button className="button secondary" type="button" disabled={busy} onClick={retake}>↺ Retake</button>}
        </div>
        <FrameTimeline frames={frames} index={index} busy={busy} overlayIndex={overlayIndex} onSelect={select} onToggleOverlay={toggleOverlay} />
      </div>
    </div>
  </main>
}
