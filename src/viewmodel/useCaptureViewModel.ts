import { useEffect, useRef, useState } from 'react'
import { capturePhoto, removePhotoBackground, type ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'

type Frame = { original: Blob; url: string; processed?: Blob }

export function useCaptureViewModel(template: Template, stream: MediaStream, process: ForegroundProcessor = removePhotoBackground) {
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
      const blob = await capturePhoto(video.current, template.width, template.height, mirrored)
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

  function continueCapture() {
    const next = frames.findIndex(frame => !frame?.processed)
    if (next !== -1) select(next)
    else { stream.getTracks().forEach(track => track.stop()); setMode('results') }
  }

  function chooseTimer(seconds: number) { setTimer(seconds); setCountdown(0) }
  function shoot() { if (timer) setCountdown(timer); else void takePhoto() }

  return { video, frames, index, mode, timer, countdown, busy, error, ready, setReady,
    current, completed, mirrored, chooseTimer, shoot, accept, select, retake, continueCapture }
}
