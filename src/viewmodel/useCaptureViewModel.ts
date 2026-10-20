import { useEffect, useMemo, useRef, useState } from 'react'
import { captureImportedPhoto, captureImportedVideo, capturePhoto, resizeImportedPhoto } from '../model/processing'
import { withAspectRatio, type Template } from '../model/templates'
import { useCaptureLayersViewModel, type LayerInput } from './useCaptureLayersViewModel'

type Frame = { original: Blob; url: string; accepted: boolean }

export function useCaptureViewModel(template: Template, stream: MediaStream | null) {
  const video = useRef<HTMLVideoElement>(null)
  const importedVideo = useRef<HTMLVideoElement>(null)
  const requestedVideoTime = useRef(0)
  const videoPlacementReady = useRef(false)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  const importRequest = useRef(0)
  const [imported, setImported] = useState<{ file: File; url: string; ratio: number } | null>(null)
  const [videoFile, setVideoFile] = useState<string | null>(null)
  const [videoTime, setVideoTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoRatio, setVideoRatio] = useState(1)
  const [placement, setPlacement] = useState({ x: 0, y: 0, width: 100, rotation: 0 })
  const [frames, setFrames] = useState<(Frame | null)[]>(() => Array(template.guides.length).fill(null))
  const [index, setIndex] = useState(0)
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null)
  const [mode, setMode] = useState<'camera' | 'import' | 'video' | 'review' | 'results'>('camera')
  const [timer, setTimer] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(stream ? '' : 'Camera unavailable. Import an image or video from the ＋ menu.')
  const [ready, setReady] = useState(false)
  const [aspect, setAspect] = useState('original')
  const [background, setBackground] = useState<string | null>(null)
  const captureTemplate = useMemo(() => aspect === 'original' ? template : withAspectRatio(template, Number(aspect)), [template, aspect])
  const resultFrames = useMemo(() => mode === 'results' ? frames.map(frame => frame!.original) : [], [frames, mode])
  const current = frames[index]
  const completed = frames.filter(frame => frame?.accepted).length
  const mirrored = stream?.getVideoTracks()[0]?.getSettings().facingMode !== 'environment'
  const layerInputs: LayerInput[] = [
    mode === 'camera'
      ? { id: 'base', kind: 'video', label: 'Camera / photo', defaultOpacity: 100, zIndex: 0, aspectRatio: captureTemplate.width / captureTemplate.height, className: 'camera-video', style: { transform: mirrored ? 'scaleX(-1)' : 'none' }, ref: video, ariaLabel: 'Live camera preview', onReady: () => setReady(true), onError: () => setError('Unable to start camera preview.') }
      : mode === 'video' && videoFile
        ? { id: 'base', kind: 'video', label: 'Video', defaultOpacity: 100, zIndex: 0, aspectRatio: captureTemplate.width / captureTemplate.height, className: 'imported-video', ref: importedVideo, src: videoFile, autoPlay: false, ariaLabel: 'Imported video preview', onReady: () => { const element = importedVideo.current; if (element && !element.seeking && Number.isFinite(element.duration) && element.duration > 0 && Math.abs(element.currentTime - requestedVideoTime.current) < 0.01) setReady(true) }, onMetadata: () => {
          const element = importedVideo.current!
          if (!Number.isFinite(element.duration) || element.duration <= 0) { setReady(false); setError('Could not read this video. Choose another video file.'); return }
          setVideoDuration(element.duration)
          if (!videoPlacementReady.current) {
            const ratio = element.videoHeight / element.videoWidth
            const width = Math.max(100, captureTemplate.height / captureTemplate.width / ratio * 100)
            const height = width * captureTemplate.width / captureTemplate.height * ratio
            setVideoRatio(ratio)
            setPlacement({ x: (100 - width) / 2, y: (100 - height) / 2, width, rotation: 0 })
            videoPlacementReady.current = true
          }
          requestedVideoTime.current = videoTime
          if (videoTime) element.currentTime = videoTime
        }, onSeeking: () => setReady(false), onSeeked: () => {
          const element = importedVideo.current
          if (!element) return
          if (Math.abs(element.currentTime - requestedVideoTime.current) >= 0.01) element.currentTime = requestedVideoTime.current
          else if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true)
        }, onError: () => { setReady(false); setError('Could not play this video. Choose another video file.') } }
      : { id: 'base', kind: 'image', label: 'Camera / photo', url: mode === 'review' ? current?.url : undefined, alt: `Captured frame ${index + 1}`, defaultOpacity: 100, zIndex: 0, aspectRatio: captureTemplate.width / captureTemplate.height, className: 'review-image' },
    { id: 'overlay', kind: 'image', label: 'Frame overlay', url: overlayIndex === null ? undefined : frames[overlayIndex]?.url, alt: '', defaultOpacity: 40, zIndex: 1, className: 'frame-overlay' },
    { id: 'guide', kind: 'image', label: 'Guide overlay', url: template.guides[index], alt: 'Pose guide', defaultOpacity: 100, zIndex: 2, className: 'pose-guide', style: { width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` } },
  ]
  const layers = useCaptureLayersViewModel(layerInputs)

  useEffect(() => {
    alive.current = true
    const track = stream?.getVideoTracks()[0]
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
    const track = stream?.getVideoTracks()[0]
    if (track) track.enabled = mode !== 'import' && mode !== 'video'
    return () => { if (track) track.enabled = true }
  }, [mode, stream])

  useEffect(() => {
    if (mode !== 'camera' || !video.current || !stream) return
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
    if (busy || (mode === 'camera' && (!stream || !ready)) || (mode === 'video' && (!ready || !importedVideo.current)) || (mode === 'import' && !imported)) return
    setBusy(true)
    setError('')
    try {
      const blob = mode === 'import' && imported
        ? await captureImportedPhoto(imported.file, captureTemplate.width, captureTemplate.height, placement)
        : mode === 'video'
          ? await captureImportedVideo(importedVideo.current!, captureTemplate.width, captureTemplate.height, placement)
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
    if (videoFile) { URL.revokeObjectURL(videoFile); urls.current.delete(videoFile) }
    setImported(null)
    setVideoFile(null)
    setVideoDuration(0)
    setVideoTime(0)
    requestedVideoTime.current = 0
    setReady(false)
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
      clearImport()
      const url = URL.createObjectURL(file)
      urls.current.add(url)
      setImported({ file, url, ratio })
      setPlacement({ x: (100 - width) / 2, y: (100 - height) / 2, width, rotation: 0 })
      setCountdown(0)
      setMode('import')
    } catch { if (alive.current) setError('Could not open that image. Choose another image file.') }
    finally { if (alive.current) setBusy(false) }
  }

  function importVideo(file: File) {
    if (busy) return
    setError('')
    if (!file.type.startsWith('video/')) { setError('Select a video file.'); return }
    clearImport()
    videoPlacementReady.current = false
    const url = URL.createObjectURL(file)
    urls.current.add(url)
    setVideoFile(url)
    setCountdown(0)
    setMode('video')
  }

  function seek(time: number) {
    const element = importedVideo.current
    if (!element) return
    setReady(false)
    setVideoTime(time)
    requestedVideoTime.current = time
    if (!element.seeking) {
      if (Math.abs(element.currentTime - time) < 0.01 && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true)
      else element.currentTime = time
    }
  }

  function useCamera() { if (busy || !stream) return; clearImport(); setCountdown(0); setError(''); setMode('camera') }

  function accept() {
    if (!current || busy) return
    setError('')
    setFrames(previous => previous.map((frame, position) => position === index ? { ...frame!, accepted: true } : frame))
    const next = frames.findIndex((frame, position) => position !== index && !frame?.accepted)
    if (next !== -1) { setReady(false); setIndex(next); setMode(videoFile ? 'video' : imported ? 'import' : 'camera') }
    else { stream?.getTracks().forEach(track => track.stop()); setMode('results') }
  }

  function select(position: number) {
    if (busy) return
    setCountdown(0)
    setReady(false)
    setError('')
    setIndex(position)
    setMode(frames[position] ? 'review' : videoFile ? 'video' : imported ? 'import' : 'camera')
  }

  function retake() {
    if (busy) return
    if (current) { URL.revokeObjectURL(current.url); urls.current.delete(current.url) }
    setOverlayIndex(previous => previous === index ? null : previous)
    setFrames(previous => previous.map((frame, position) => position === index ? null : frame))
    setReady(false)
    setError('')
    setMode(videoFile ? 'video' : imported ? 'import' : 'camera')
  }

  function chooseTimer(seconds: number) { setTimer(seconds); setCountdown(0) }
  function resize(width: number) {
    const ratio = imported?.ratio ?? (videoFile ? videoRatio : null)
    if (ratio !== null) setPlacement(previous => resizeImportedPhoto(previous, width, ratio, captureTemplate.width / captureTemplate.height))
  }
  function shoot() { if (mode === 'camera' && timer) setCountdown(timer); else void takePhoto() }
  function toggleOverlay(position: number) { setOverlayIndex(previous => previous === position ? null : position) }
  return {
    mode, busy, layers,
    camera: { ready, countdown, error, shoot, useCamera, importPhoto, importVideo, videoFile, videoTime, videoDuration, seek, imported, placement, setPlacement, resize },
    photos: { frames, index, current, completed, overlayIndex, toggleOverlay, select, retake, accept },
    settings: { aspect, setAspect, timer, chooseTimer, background, setBackground, hasFrames: frames.some(Boolean) },
    result: { template: captureTemplate, frames: resultFrames, background },
  }
}
