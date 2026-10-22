import { useEffect, useMemo, useRef, useState } from 'react'

type Frame = { original: Blob; url: string; accepted: boolean }

export function useCaptureFrames(guideCount: number) {
  const custom = guideCount === 0
  const urls = useRef(new Set<string>())
  const [frames, setFrames] = useState<(Frame | null)[]>(() => Array(Math.max(1, guideCount)).fill(null))
  const [index, setIndex] = useState(0)
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null)
  const current = frames[index]
  const completed = frames.filter(frame => frame?.accepted).length
  const complete = completed === frames.length
  const originals = useMemo(() => complete ? frames.map(frame => frame!.original) : [], [frames, complete])

  useEffect(() => () => {
    urls.current.forEach(url => URL.revokeObjectURL(url))
    urls.current.clear()
  }, [])

  function releaseCurrent() {
    if (!current) return
    URL.revokeObjectURL(current.url)
    urls.current.delete(current.url)
  }

  function store(original: Blob) {
    const url = URL.createObjectURL(original)
    urls.current.add(url)
    releaseCurrent()
    setFrames(previous => previous.map((frame, position) => position === index ? { original, url, accepted: false } : frame))
  }

  function accept() {
    if (!current) return
    const accepted = frames.map((frame, position) => position === index ? { ...current, accepted: true } : frame)
    const next = accepted.findIndex(frame => !frame?.accepted)
    setFrames(accepted)
    if (next === -1) return 'complete'
    setIndex(next)
    return 'next'
  }

  function add() {
    if (!custom) return false
    setFrames(previous => [...previous, null])
    setIndex(frames.length)
    return true
  }

  function select(position: number) {
    if (!Number.isInteger(position) || position < 0 || position >= frames.length) return
    setIndex(position)
    return frames[position] ? 'captured' : 'empty'
  }

  function retake() {
    releaseCurrent()
    setOverlayIndex(previous => previous === index ? null : previous)
    setFrames(previous => previous.map((frame, position) => position === index ? null : frame))
  }

  function toggleOverlay(position: number) {
    if (!frames[position]) return
    setOverlayIndex(previous => previous === position ? null : position)
  }

  return {
    frames, index, current, custom, completed, complete, originals, hasFrames: frames.some(Boolean),
    overlayIndex, overlayUrl: overlayIndex === null ? undefined : frames[overlayIndex]?.url,
    store, accept, add, select, retake, toggleOverlay,
  }
}
