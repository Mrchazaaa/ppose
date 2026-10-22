import { useEffect, useRef, useState } from 'react'
import { captureImportedPhoto, captureImportedVideo, capturePhoto, resizeImportedPhoto } from '../model/processing'
import type { LayerInput } from './useCaptureLayersViewModel'

export function useCaptureSource(stream: MediaStream | null, dimensions: { width: number; height: number }, active: boolean) {
  const video = useRef<HTMLVideoElement>(null)
  const importedVideo = useRef<HTMLVideoElement>(null)
  const requestedVideoTime = useRef(0)
  const videoPlacementReady = useRef(false)
  const urls = useRef(new Set<string>())
  const alive = useRef(true)
  const importRequest = useRef(0)
  const [kind, setKind] = useState<'camera' | 'import' | 'video'>('camera')
  const [imported, setImported] = useState<{ file: File; url: string; ratio: number } | null>(null)
  const [videoFile, setVideoFile] = useState<string | null>(null)
  const [videoTime, setVideoTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoRatio, setVideoRatio] = useState(1)
  const [placement, setPlacement] = useState({ x: 0, y: 0, width: 100, rotation: 0 })
  const [mediaReady, setReady] = useState(false)
  const [error, setError] = useState(stream ? '' : 'Camera unavailable. Import an image or video from the ＋ menu.')
  const mirrored = stream?.getVideoTracks()[0]?.getSettings().facingMode !== 'environment'
  const ready = active && (kind === 'import' ? !!imported : mediaReady && (kind !== 'camera' || !!stream))

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
      urls.current.clear()
    }
  }, [stream])

  useEffect(() => {
    const track = stream?.getVideoTracks()[0]
    if (track) track.enabled = active && kind === 'camera'
    const element = active && kind === 'camera' ? video.current : null
    if (element) element.srcObject = stream
    return () => {
      setReady(false)
      if (element) element.srcObject = null
      if (track) track.enabled = true
    }
  }, [active, kind, stream, videoFile])

  function clearImport() {
    importRequest.current++
    urls.current.forEach(url => URL.revokeObjectURL(url))
    urls.current.clear()
    setImported(null)
    setVideoFile(null)
    setVideoDuration(0)
    setVideoTime(0)
    requestedVideoTime.current = 0
    setReady(false)
  }

  async function importPhoto(file: File) {
    const request = ++importRequest.current
    setError('')
    if (!file.type.startsWith('image/')) throw new Error('Select an image file.')
    let image: ImageBitmap
    try { image = await createImageBitmap(file) }
    catch { throw new Error('Could not open that image. Choose another image file.') }
    const width = Math.min(100, image.width / image.height * dimensions.height / dimensions.width * 100)
    const ratio = image.height / image.width
    const height = width * dimensions.width / dimensions.height * ratio
    image.close()
    if (!alive.current || request !== importRequest.current) return false
    clearImport()
    const url = URL.createObjectURL(file)
    urls.current.add(url)
    setImported({ file, url, ratio })
    setPlacement({ x: (100 - width) / 2, y: (100 - height) / 2, width, rotation: 0 })
    setKind('import')
    return true
  }

  function importVideo(file: File) {
    setError('')
    if (!file.type.startsWith('video/')) throw new Error('Select a video file.')
    clearImport()
    videoPlacementReady.current = false
    const url = URL.createObjectURL(file)
    urls.current.add(url)
    setVideoFile(url)
    setKind('video')
  }

  function useCamera() {
    if (!stream) return false
    if (kind !== 'camera') clearImport()
    setError('')
    setKind('camera')
    return true
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

  function readVideoMetadata() {
    const element = importedVideo.current!
    if (!Number.isFinite(element.duration) || element.duration <= 0) { setReady(false); setError('Could not read this video. Choose another video file.'); return }
    setVideoDuration(element.duration)
    if (!videoPlacementReady.current) {
      const ratio = element.videoHeight / element.videoWidth
      const width = Math.max(100, dimensions.height / dimensions.width / ratio * 100)
      const height = width * dimensions.width / dimensions.height * ratio
      setVideoRatio(ratio)
      setPlacement({ x: (100 - width) / 2, y: (100 - height) / 2, width, rotation: 0 })
      videoPlacementReady.current = true
    }
    requestedVideoTime.current = videoTime
    if (videoTime) element.currentTime = videoTime
  }

  function move(position: { x: number; y: number }) { setPlacement(previous => ({ ...previous, x: position.x, y: position.y })) }
  function rotate(rotation: number) { setPlacement(previous => ({ ...previous, rotation })) }
  function resize(width: number) {
    const ratio = imported?.ratio ?? (videoFile ? videoRatio : null)
    if (ratio !== null) setPlacement(previous => resizeImportedPhoto(previous, width, ratio, dimensions.width / dimensions.height))
  }

  function capture() {
    if (!ready) throw new Error('Capture source is not ready yet')
    if (kind === 'import') return captureImportedPhoto(imported!.file, dimensions.width, dimensions.height, placement)
    if (kind === 'video') return captureImportedVideo(importedVideo.current!, dimensions.width, dimensions.height, placement)
    return capturePhoto(video.current!, dimensions.width, dimensions.height, mirrored)
  }

  const base = { id: 'base', defaultOpacity: 100, zIndex: 0, aspectRatio: dimensions.width / dimensions.height }
  const manipulation = { placement, onMove: move, onResize: resize }
  const layer: LayerInput = kind === 'camera'
    ? { ...base, kind: 'video', label: 'Camera / photo', className: 'camera-video', style: { transform: mirrored ? 'scaleX(-1)' : 'none' }, ref: video, ariaLabel: 'Live camera preview', onReady: () => setReady(true), onError: () => { setReady(false); setError('Unable to start camera preview.') } }
    : kind === 'video'
      ? { ...base, kind: 'video', label: 'Video', className: 'imported-video', ref: importedVideo, src: videoFile ?? undefined, autoPlay: false, manipulation, ariaLabel: 'Imported video preview', onMetadata: readVideoMetadata, onReady: () => {
        const element = importedVideo.current
        if (element && !element.seeking && Number.isFinite(element.duration) && element.duration > 0 && Math.abs(element.currentTime - requestedVideoTime.current) < 0.01) setReady(true)
      }, onSeeking: () => setReady(false), onSeeked: () => {
        const element = importedVideo.current
        if (!element) return
        if (Math.abs(element.currentTime - requestedVideoTime.current) >= 0.01) element.currentTime = requestedVideoTime.current
        else if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true)
      }, onError: () => { setReady(false); setError('Could not play this video. Choose another video file.') } }
      : { ...base, kind: 'image', label: 'Camera / photo', className: 'imported-image', url: imported?.url, alt: 'Imported photo', manipulation }

  return { kind, ready, error, dismissError: () => setError(''), layer, capture, importPhoto, importVideo, useCamera, placement, rotate, resize, videoTime, videoDuration, seek }
}
