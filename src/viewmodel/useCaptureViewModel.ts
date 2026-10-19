import { useEffect, useMemo, useRef, useState } from 'react'
import { captureImportedPhoto, capturePhoto, resizeImportedPhoto } from '../model/processing'
import { withAspectRatio, type Template } from '../model/templates'
import { useCaptureLayersViewModel, type LayerInput } from './useCaptureLayersViewModel'

type Frame = { original: Blob; url: string; accepted: boolean }

export function useCaptureViewModel(template: Template, stream: MediaStream) {
  const video = useRef<HTMLVideoElement>(null)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  const importRequest = useRef(0)
  const [imported, setImported] = useState<{ file: File; url: string; ratio: number } | null>(null)
  const [placement, setPlacement] = useState({ x: 0, y: 0, width: 100, rotation: 0 })
  const [frames, setFrames] = useState<(Frame | null)[]>(() => Array(template.guides.length).fill(null))
  const [index, setIndex] = useState(0)
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null)
  const [mode, setMode] = useState<'camera' | 'import' | 'review' | 'results'>('camera')
  const [timer, setTimer] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [aspect, setAspect] = useState('original')
  const [background, setBackground] = useState<string | null>(null)
  const captureTemplate = useMemo(() => aspect === 'original' ? template : withAspectRatio(template, Number(aspect)), [template, aspect])
  const resultFrames = useMemo(() => mode === 'results' ? frames.map(frame => frame!.original) : [], [frames, mode])
  const current = frames[index]
  const completed = frames.filter(frame => frame?.accepted).length
  const mirrored = stream.getVideoTracks()[0]?.getSettings().facingMode !== 'environment'
  const layerInputs: LayerInput[] = [
    mode === 'camera'
      ? { id: 'base', kind: 'video', label: 'Camera / photo', defaultOpacity: 100, zIndex: 0, aspectRatio: captureTemplate.width / captureTemplate.height, className: 'camera-video', style: { transform: mirrored ? 'scaleX(-1)' : 'none' }, ref: video, ariaLabel: 'Live camera preview', onReady: () => setReady(true), onError: () => setError('Unable to start camera preview.') }
      : { id: 'base', kind: 'image', label: 'Camera / photo', url: mode === 'review' ? current?.url : undefined, alt: `Captured frame ${index + 1}`, defaultOpacity: 100, zIndex: 0, aspectRatio: captureTemplate.width / captureTemplate.height, className: 'review-image' },
    { id: 'overlay', kind: 'image', label: 'Frame overlay', url: overlayIndex === null ? undefined : frames[overlayIndex]?.url, alt: '', defaultOpacity: 40, zIndex: 1, className: 'frame-overlay' },
    { id: 'guide', kind: 'image', label: 'Guide overlay', url: template.guides[index], alt: 'Pose guide', defaultOpacity: 100, zIndex: 2, className: 'pose-guide', style: { width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` } },
  ]
  const layers = useCaptureLayersViewModel(layerInputs)

  useEffect(() => {
    alive.current = true
    const track = stream.getVideoTracks()[0]
    const interrupted = () => { setReady(false); setError('Camera disconnected. Return to the menu and reconnect it.') }
    track?.addEventListener('ended', interrupted)
    return () => {
      alive.current = false
      importRequest.current++
      track?.removeEventListener('ended', interrupted)
      urls.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [stream])

  useEffect(() => {
    const track = stream.getVideoTracks()[0]
    if (track) track.enabled = mode !== 'import'
    return () => { if (track) track.enabled = true }
  }, [mode, stream])

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
    if (busy || (mode === 'camera' && !video.current) || (mode === 'import' && !imported)) return
    setBusy(true)
    setError('')
    try {
      const blob = mode === 'import' && imported
        ? await captureImportedPhoto(imported.file, captureTemplate.width, captureTemplate.height, placement)
        : await capturePhoto(video.current!, captureTemplate.width, captureTemplate.height, mirrored)
      if (!alive.current) return
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      if (frames[index]) { URL.revokeObjectURL(frames[index]!.url); urls.current.delete(frames[index]!.url) }
      setFrames(previous => previous.map((frame, position) => position === index ? { original: blob, url, accepted: false } : frame))
      setMode('review')
    } catch (reason) { setError(String(reason)) }
    finally { if (alive.current) setBusy(false) }
  }

  function clearImport() {
    importRequest.current++
    if (imported) { URL.revokeObjectURL(imported.url); urls.current.delete(imported.url) }
    setImported(null)
  }

  async function importPhoto(file: File) {
    if (busy) return
    const request = ++importRequest.current
    setBusy(true)
    setError('')
    try {
      if (!file.type.startsWith('image/')) throw new Error('Select an image file.')
      const image = await createImageBitmap(file)
      const width = Math.min(100, image.width / image.height * captureTemplate.height / captureTemplate.width * 100)
      const ratio = image.height / image.width
      const height = width * captureTemplate.width / captureTemplate.height * ratio
      image.close()
      if (!alive.current || request !== importRequest.current) return
      if (imported) { URL.revokeObjectURL(imported.url); urls.current.delete(imported.url) }
      const url = URL.createObjectURL(file)
      urls.current.add(url)
      setImported({ file, url, ratio })
      setPlacement({ x: (100 - width) / 2, y: (100 - height) / 2, width, rotation: 0 })
      setCountdown(0)
      setMode('import')
    } catch { if (alive.current) setError('Could not open that image. Choose another image file.') }
    finally { if (alive.current) setBusy(false) }
  }

  function useCamera() { if (busy) return; clearImport(); setCountdown(0); setError(''); setMode('camera') }

  function accept() {
    if (!current || busy) return
    setError('')
    setFrames(previous => previous.map((frame, position) => position === index ? { ...frame!, accepted: true } : frame))
    const next = frames.findIndex((frame, position) => position !== index && !frame?.accepted)
    if (next !== -1) { setIndex(next); setMode(imported ? 'import' : 'camera') }
    else { stream.getTracks().forEach(track => track.stop()); setMode('results') }
  }

  function select(position: number) {
    if (busy) return
    setCountdown(0)
    setError('')
    setIndex(position)
    setMode(frames[position] ? 'review' : imported ? 'import' : 'camera')
  }

  function retake() {
    if (busy) return
    if (current) { URL.revokeObjectURL(current.url); urls.current.delete(current.url) }
    setOverlayIndex(previous => previous === index ? null : previous)
    setFrames(previous => previous.map((frame, position) => position === index ? null : frame))
    setError('')
    setMode(imported ? 'import' : 'camera')
  }

  function chooseTimer(seconds: number) { setTimer(seconds); setCountdown(0) }
  function resize(width: number) {
    if (imported) setPlacement(previous => resizeImportedPhoto(previous, width, imported.ratio, captureTemplate.width / captureTemplate.height))
  }
  function shoot() { if (mode === 'camera' && timer) setCountdown(timer); else void takePhoto() }
  function toggleOverlay(position: number) { setOverlayIndex(previous => previous === position ? null : position) }
  return {
    mode, busy, layers,
    camera: { ready, countdown, error, shoot, useCamera, importPhoto, imported, placement, setPlacement, resize },
    photos: { frames, index, current, completed, overlayIndex, toggleOverlay, select, retake, accept },
    settings: { aspect, setAspect, timer, chooseTimer, background, setBackground, hasFrames: frames.some(Boolean) },
    result: { template: captureTemplate, frames: resultFrames, background },
  }
}
