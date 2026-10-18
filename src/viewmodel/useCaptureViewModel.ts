import { useEffect, useMemo, useRef, useState } from 'react'
import { capturePhoto } from '../model/processing'
import { withAspectRatio, type Template } from '../model/templates'

type Frame = { original: Blob; url: string; accepted: boolean }

export function useCaptureViewModel(template: Template, stream: MediaStream) {
  const video = useRef<HTMLVideoElement>(null)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  const [frames, setFrames] = useState<(Frame | null)[]>(() => Array(template.guides.length).fill(null))
  const [index, setIndex] = useState(0)
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null)
  const [guideOpacity, setGuideOpacity] = useState(100)
  const [overlayOpacity, setOverlayOpacity] = useState(40)
  const [mode, setMode] = useState<'camera' | 'review' | 'results'>('camera')
  const [timer, setTimer] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [aspect, setAspect] = useState('original')
  const captureTemplate = useMemo(() => aspect === 'original' ? template : withAspectRatio(template, Number(aspect)), [template, aspect])
  const resultFrames = useMemo(() => mode === 'results' ? frames.map(frame => frame!.original) : [], [frames, mode])
  const current = frames[index]
  const completed = frames.filter(frame => frame?.accepted).length
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
    return () => { setReady(false); element.srcObject = null }
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
      const blob = await capturePhoto(video.current, captureTemplate.width, captureTemplate.height, mirrored)
      if (!alive.current) return
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      if (frames[index]) { URL.revokeObjectURL(frames[index]!.url); urls.current.delete(frames[index]!.url) }
      setFrames(previous => previous.map((frame, position) => position === index ? { original: blob, url, accepted: false } : frame))
      setMode('review')
    } catch (reason) { setError(String(reason)) }
    finally { if (alive.current) setBusy(false) }
  }

  function accept() {
    if (!current || busy) return
    setError('')
    setFrames(previous => previous.map((frame, position) => position === index ? { ...frame!, accepted: true } : frame))
    const next = frames.findIndex((frame, position) => position !== index && !frame?.accepted)
    if (next !== -1) { setIndex(next); setMode('camera') }
    else { stream.getTracks().forEach(track => track.stop()); setMode('results') }
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
    if (overlayIndex === index) setOverlayIndex(null)
    setFrames(previous => previous.map((frame, position) => position === index ? null : frame))
    setError('')
    setMode('camera')
  }

  function chooseTimer(seconds: number) { setTimer(seconds); setCountdown(0) }
  function shoot() { if (timer) setCountdown(timer); else void takePhoto() }
  function toggleOverlay(position: number) {
    setOverlayIndex(overlayIndex === position ? null : position)
  }

  return { video, frames, index, mode, timer, countdown, busy, error, ready, setReady, setError,
    current, completed, mirrored, overlayIndex, toggleOverlay, guideOpacity, setGuideOpacity, overlayOpacity, setOverlayOpacity,
    chooseTimer, shoot, accept, select, retake, aspect, setAspect,
    captureTemplate, resultFrames }
}
