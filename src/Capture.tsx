import { useEffect, useRef, useState } from 'react'
import { createGif, removePhotoBackground, type ForegroundProcessor } from './processing'
import type { Template } from './templates'

type Frame = { original: Blob; url: string; processed?: Blob }

function frameCanvas(video: HTMLVideoElement, width: number, height: number, mirrored: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context || !video.videoWidth) throw new Error('Camera is not ready yet')
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight)
  const drawnWidth = video.videoWidth * scale
  const drawnHeight = video.videoHeight * scale
  if (mirrored) { context.translate(width, 0); context.scale(-1, 1) }
  context.drawImage(video, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight)
  return canvas
}

export function Capture({ template, stream, onClose, process = removePhotoBackground }: {
  template: Template; stream: MediaStream; onClose: () => void; process?: ForegroundProcessor
}) {
  const video = useRef<HTMLVideoElement>(null)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  const [frames, setFrames] = useState<(Frame | null)[]>(() => Array(template.guides.length).fill(null))
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'camera' | 'review' | 'results'>('camera')
  const [timer, setTimer] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const current = frames[index]
  const completed = frames.filter(frame => frame?.processed).length
  const mirrored = stream.getVideoTracks()[0]?.getSettings().facingMode !== 'environment'

  useEffect(() => {
    alive.current = true
    const track = stream.getVideoTracks()[0]
    const interrupted = () => { setReady(false); setError('Camera disconnected. Return to the menu and reconnect it.') }
    track?.addEventListener('ended', interrupted)
    return () => {
      alive.current = false
      track?.removeEventListener('ended', interrupted)
      stream.getTracks().forEach(item => item.stop())
      urls.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [stream])

  useEffect(() => {
    if (mode !== 'camera' || !video.current) return
    const element = video.current
    element.srcObject = stream
    void element.play().catch(() => setError('Unable to start camera preview.'))
    return () => { element.srcObject = null }
  }, [mode, stream])

  useEffect(() => {
    if (!countdown || mode !== 'camera') return
    const id = window.setTimeout(() => {
      if (countdown === 1) { setCountdown(0); void takePhoto() }
      else setCountdown(countdown - 1)
    }, 1000)
    return () => window.clearTimeout(id)
    // takePhoto reads the current video ref when the timer completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, mode])

  async function takePhoto() {
    if (!video.current || busy) return
    setBusy(true)
    setError('')
    try {
      const canvas = frameCanvas(video.current, template.width, template.height, mirrored)
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not capture photo')), 'image/png'))
      if (!alive.current) return
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      if (frames[index]) { URL.revokeObjectURL(frames[index]!.url); urls.current.delete(frames[index]!.url) }
      setFrames(previous => previous.map((frame, position) => position === index ? { original: blob, url } : frame))
      setMode('review')
    } catch (reason) { setError(String(reason)) }
    finally { if (alive.current) setBusy(false) }
  }

  async function accept() {
    if (!current || busy) return
    setBusy(true)
    setError('')
    try {
      const processed = await process(current.original)
      if (!alive.current) return
      setFrames(previous => previous.map((frame, position) => position === index && frame === current ? { ...frame, processed } : frame))
      const next = frames.findIndex((frame, position) => position !== index && !frame?.processed)
      if (next !== -1) { setIndex(next); setMode('camera') }
    } catch (reason) {
      console.error('Background removal failed:', reason)
      if (alive.current) setError('Background removal failed. Your photo is saved; try accepting it again.')
    } finally { if (alive.current) setBusy(false) }
  }

  function select(position: number) {
    if (busy) return
    setCountdown(0)
    setError('')
    setIndex(position)
    setMode(frames[position] ? 'review' : 'camera')
  }

  function retake() {
    if (busy) return
    if (current) { URL.revokeObjectURL(current.url); urls.current.delete(current.url) }
    setFrames(previous => previous.map((frame, position) => position === index ? null : frame))
    setError('')
    setMode('camera')
  }

  if (mode === 'results') return <Results template={template} frames={frames.map(frame => frame!.processed!)} onClose={onClose} />

  return <main className="studio">
    <div className="studio-top"><button className="text-button" type="button" onClick={onClose}>← Exit studio</button><span className="brand">p<span>p</span>ose<span className="brand-dot">.</span></span><span className="studio-count">{completed}/{frames.length} DONE</span></div>
    <div className="studio-layout">
      <section className="studio-info"><span className="eyebrow">NOW SHOOTING / {template.title.toUpperCase()}</span><h1>{mode === 'review' ? 'Looking good?' : 'Strike a pose.'}</h1><p>{mode === 'review' ? current?.processed ? 'Frame saved. Review or retake any photo before making your GIF.' : 'Check your shot. Accept it to remove the background, or try again.' : 'Line yourself up with the guide, then take your shot.'}</p><div className="step-label">FRAME {String(index + 1).padStart(2, '0')} <span>/ {String(frames.length).padStart(2, '0')}</span></div></section>
      <div className="studio-main"><div className="viewport" style={{ aspectRatio: `${template.width} / ${template.height}` }}>
        {mode === 'camera' ? <><video ref={video} autoPlay muted playsInline className="camera-video" style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }} onLoadedMetadata={() => setReady(true)} aria-label="Live camera preview" /><img className="pose-guide" style={{ width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` }} src={template.guides[index]} alt="Pose guide" />{countdown > 0 && <div className="countdown" aria-live="assertive">{countdown}</div>}</> : current && <img className="review-image" src={current.url} alt={`Captured frame ${index + 1}`} />}
        <span className="viewport-corner top-left" /><span className="viewport-corner top-right" /><span className="viewport-corner bottom-left" /><span className="viewport-corner bottom-right" />
        <span className="viewport-label">{mode === 'camera' ? '● LIVE CAMERA' : '✓ PHOTO REVIEW'}</span>
      </div>
      <div className="capture-controls">
        {mode === 'camera' ? <><label className="timer-label">TIMER <select value={timer} onChange={event => { setTimer(Number(event.target.value)); setCountdown(0) }} aria-label="Photo timer"><option value="0">Off</option><option value="3">3 sec</option><option value="5">5 sec</option><option value="10">10 sec</option></select></label><button className="shutter" type="button" disabled={!ready || busy || countdown > 0} aria-label="Take photo" onClick={() => timer ? setCountdown(timer) : void takePhoto()}><span /></button><span className="control-hint">{countdown ? 'GET READY…' : 'TAP TO CAPTURE'}</span></> : <><button className="button secondary" type="button" disabled={busy} onClick={retake}>↺ Retake</button>{!current?.processed ? <button className="button primary" type="button" disabled={busy} onClick={() => void accept()}>{busy ? 'Removing background…' : 'Accept photo →'}</button> : <button className="button primary" type="button" onClick={() => { const next = frames.findIndex(frame => !frame?.processed); if (next !== -1) select(next); else { stream.getTracks().forEach(track => track.stop()); setMode('results') } }}>{completed === frames.length ? 'Make my GIF →' : 'Continue →'}</button>}</>}
      </div>
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="timeline" aria-label="Frames">{frames.map((frame, position) => <button className={`timeline-frame ${position === index ? 'active' : ''}`} type="button" key={position} disabled={busy} onClick={() => select(position)} aria-label={`Frame ${position + 1}${frame?.processed ? ', complete' : ''}`} aria-current={position === index ? 'step' : undefined}>{frame ? <img src={frame.url} alt="" /> : <span>+</span>}<small>{String(position + 1).padStart(2, '0')}</small></button>)}</div>
    </div></div>
  </main>
}

function Results({ template, frames, onClose }: { template: Template; frames: Blob[]; onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    createGif(frames, template, done => { if (active) setProgress(done) })
      .then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) } })
      .catch(reason => { console.error('GIF export failed:', reason); if (active) setError('Could not create the GIF. Please try again.') })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [frames, template, attempt])

  return <main className="results shell"><header className="masthead"><span className="brand">p<span>p</span>ose<span className="brand-dot">.</span></span><button className="text-button" type="button" onClick={onClose}>✕ Close</button></header><section className="results-content"><div><span className="eyebrow">THE BIG REVEAL ✳</span><h1>You made <em>magic.</em></h1><p>Your moment, on repeat. Made entirely on your device.</p>{url ? <a className="button primary download" href={url} download={`${template.id}.gif`}>↓ Download GIF</a> : error ? <><p className="notice" role="alert">{error}</p><button className="button primary" type="button" onClick={() => { setError(''); setProgress(0); setAttempt(value => value + 1) }}>Try again</button></> : <p role="status">Creating your GIF… {progress}/{frames.length} frames</p>}</div><div className="result-preview">{url ? <img src={url} alt={`Animated GIF of ${template.title}`} /> : <div className="result-placeholder">✳</div>}<span>YOUR LOOP / {frames.length} FRAMES</span></div></section></main>
}
