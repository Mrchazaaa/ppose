import type { CSSProperties } from 'react'
import { useCaptureViewModel } from '../viewmodel/useCaptureViewModel'
import { useResultsViewModel } from '../viewmodel/useResultsViewModel'
import type { ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'

export function Capture({ template, stream, onClose, process }: {
  template: Template; stream: MediaStream; onClose: () => void; process?: ForegroundProcessor
}) {
  const vm = useCaptureViewModel(template, stream)
  const { video, frames, index, mode, timer, countdown, busy, error, ready, setReady, setError,
    current, completed, mirrored, chooseTimer, shoot, accept, select, retake } = vm

  if (mode === 'results') return <Results template={template} frames={frames.map(frame => frame!.original)} process={process} onClose={onClose} />

  return <main className="studio">
    <div className="studio-layout">
      <aside className="studio-sidebar"><button className="text-button studio-exit" type="button" onClick={onClose}>← Exit studio</button>
      <div className="capture-controls">
        <label className="timer-label">TIMER <select value={timer} onChange={event => chooseTimer(Number(event.target.value))} aria-label="Photo timer"><option value="0">Off</option><option value="3">3 sec</option><option value="5">5 sec</option><option value="10">10 sec</option></select></label>
        {mode === 'camera' ? <button className="shutter" type="button" disabled={!ready || busy || countdown > 0} aria-label="Take photo" onClick={shoot}><span /></button> : <button className="button primary" type="button" disabled={busy} onClick={accept}>{completed === frames.length - 1 && !current?.accepted ? 'Make GIF' : 'Accept'}</button>}
        {mode === 'camera' ? <span className="control-hint">{countdown ? 'GET READY…' : 'TAP TO CAPTURE'}</span> : <button className="button secondary" type="button" disabled={busy} onClick={retake}>↺ Retake</button>}
      </div>
      <section className="studio-info"><p>{mode === 'review' ? 'Check your shot. Accept it or retake it before making your GIF.' : 'Line yourself up with the guide, then take your shot.'}</p><div className="step-label">FRAME {String(index + 1).padStart(2, '0')} <span>/ {String(frames.length).padStart(2, '0')}</span></div></section>
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="timeline" aria-label="Frames">{frames.map((frame, position) => <button className={`timeline-frame ${position === index ? 'active' : ''}`} type="button" key={position} disabled={busy} onClick={() => select(position)} aria-label={`Frame ${position + 1}${frame?.accepted ? ', complete' : ''}`} aria-current={position === index ? 'step' : undefined}>{frame ? <img src={frame.url} alt="" /> : <span>+</span>}<small>{String(position + 1).padStart(2, '0')}</small></button>)}</div></aside>
      <div className="studio-main"><div className="viewport"><div className="picture" style={{ aspectRatio: `${template.width} / ${template.height}`, '--picture-ratio': template.width / template.height } as CSSProperties}>
        {mode === 'camera' ? <><video ref={video} autoPlay muted playsInline className="camera-video" style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }} onPlaying={() => setReady(true)} onError={() => setError('Unable to start camera preview.')} aria-label="Live camera preview" /><img className="pose-guide" style={{ width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` }} src={template.guides[index]} alt="Pose guide" />{countdown > 0 && <div className="countdown" aria-live="assertive">{countdown}</div>}</> : current && <img className="review-image" src={current.url} alt={`Captured frame ${index + 1}`} />}
        <span className="viewport-corner top-left" /><span className="viewport-corner top-right" /><span className="viewport-corner bottom-left" /><span className="viewport-corner bottom-right" />
        <span className="viewport-label">{mode === 'camera' ? '● LIVE CAMERA' : '✓ PHOTO REVIEW'}</span>
      </div></div>
    </div></div>
  </main>
}

function Results({ template, frames, process, onClose }: { template: Template; frames: Blob[]; process?: ForegroundProcessor; onClose: () => void }) {
  const { url, progress, stage, error, retry } = useResultsViewModel(template, frames, process)

  return <main className="results shell"><header className="masthead"><span className="brand">p<span>p</span>ose<span className="brand-dot">.</span></span><button className="text-button" type="button" onClick={onClose}>✕ Close</button></header><section className="results-content"><div><span className="eyebrow">THE BIG REVEAL ✳</span><h1>You made <em>magic.</em></h1><p>Your moment, on repeat. Made entirely on your device.</p>{url ? <a className="button primary download" href={url} download={`${template.id}.gif`}>↓ Download GIF</a> : error ? <><p className="notice" role="alert">{error}</p><button className="button primary" type="button" onClick={retry}>Try again</button></> : <p role="status">{stage === 'background' ? 'Removing backgrounds' : 'Creating your GIF'}… {progress}/{frames.length} frames</p>}</div><div className="result-preview">{url ? <img src={url} alt={`Animated GIF of ${template.title}`} /> : <div className="result-placeholder">✳</div>}<span>YOUR LOOP / {frames.length} FRAMES</span></div></section></main>
}
