import type { CSSProperties } from 'react'
import type { useCaptureViewModel } from '../viewmodel/useCaptureViewModel'
import { ResultsExport } from '../ResultsExport'

export function Capture({ viewModel }: { viewModel: ReturnType<typeof useCaptureViewModel> }) {
  const { video, frames, index, mode, timer, countdown, busy, error, ready, setReady, setError,
    current, completed, mirrored, chooseTimer, shoot, accept, select, retake, aspect, setAspect,
    template, captureTemplate, resultFrames, onClose, process } = viewModel

  if (mode === 'results') return <ResultsExport template={captureTemplate} frames={resultFrames} process={process} onClose={onClose} />

  return <main className="studio">
    <div className="viewport"><div className="picture" style={{ aspectRatio: `${captureTemplate.width} / ${captureTemplate.height}`, '--picture-ratio': captureTemplate.width / captureTemplate.height } as CSSProperties}>
        {mode === 'camera' ? <><video ref={video} autoPlay muted playsInline className="camera-video" style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }} onPlaying={() => setReady(true)} onError={() => setError('Unable to start camera preview.')} aria-label="Live camera preview" /><img className="pose-guide" style={{ width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` }} src={template.guides[index]} alt="Pose guide" /></> : current && <img className="review-image" src={current.url} alt={`Captured frame ${index + 1}`} />}
      </div>
      {countdown > 0 && <div className="countdown" aria-live="assertive">{countdown}</div>}
      <div className="studio-top"><button className="text-button" type="button" onClick={onClose}>← Exit studio</button><div className="step-label">FRAME {String(index + 1).padStart(2, '0')} <span>/ {String(frames.length).padStart(2, '0')}</span></div></div>
      {error && <p className="notice studio-error" role="alert">{error}</p>}
      <div className="studio-bottom">{mode === 'review' && <p className="studio-instruction">Check your shot. Accept it or retake it before making your GIF.</p>}
        <div className="capture-controls">
          <details className="capture-settings"><summary aria-label="Capture settings" title="Capture settings"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M10 2h4l.5 2.5 1.4.6L18 3.7l2.3 2.3-1.4 2.1.6 1.4L22 10v4l-2.5.5-.6 1.4 1.4 2.1-2.3 2.3-2.1-1.4-1.4.6L14 22h-4l-.5-2.5-1.4-.6L6 20.3 3.7 18l1.4-2.1-.6-1.4L2 14v-4l2.5-.5.6-1.4L3.7 6 6 3.7l2.1 1.4 1.4-.6L10 2Z"/><circle cx="12" cy="12" r="3"/></svg></summary><div className="settings-panel"><strong>Camera options</strong><label>Aspect ratio<select value={aspect} disabled={frames.some(Boolean)} onChange={event => setAspect(event.target.value)}><option value="original">Template</option><option value="1">1:1</option><option value="0.8">4:5</option><option value="0.5625">9:16</option></select></label>{frames.some(Boolean) && <small>Retake all photos to change ratio.</small>}<label>Timer<select value={timer} onChange={event => chooseTimer(Number(event.target.value))}><option value="0">Off</option><option value="3">3 sec</option><option value="5">5 sec</option><option value="10">10 sec</option></select></label></div></details>
          {mode === 'camera' ? <button className="shutter" type="button" disabled={!ready || busy || countdown > 0} aria-label="Take photo" onClick={shoot}><span /></button> : <button className="button primary" type="button" disabled={busy} onClick={accept}>{completed === frames.length - 1 && !current?.accepted ? 'Make GIF' : 'Accept'}</button>}
          {mode === 'review' && <button className="button secondary" type="button" disabled={busy} onClick={retake}>↺ Retake</button>}
        </div>
        <div className="timeline" aria-label="Frames">{frames.map((frame, position) => <button className={`timeline-frame ${position === index ? 'active' : ''}`} type="button" key={position} disabled={busy} onClick={() => select(position)} aria-label={`Frame ${position + 1}${frame?.accepted ? ', complete' : ''}`} aria-current={position === index ? 'step' : undefined}>{frame ? <img src={frame.url} alt="" /> : <span>+</span>}<small>{String(position + 1).padStart(2, '0')}</small></button>)}</div>
      </div>
    </div>
  </main>
}
