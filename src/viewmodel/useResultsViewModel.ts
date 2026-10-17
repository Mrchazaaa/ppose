import { useEffect, useRef, useState } from 'react'
import { createGif, processPhotos, removePhotoBackground, type ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'

// Set to true to restore background removal before GIF encoding.
const REMOVE_BACKGROUNDS = false

export function useResultsViewModel(template: Template, frames: Blob[], onClose: () => void, process: ForegroundProcessor = removePhotoBackground) {
  const processedFrames = useRef<Blob[] | null>(null)
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<'background' | 'gif'>(REMOVE_BACKGROUNDS ? 'background' : 'gif')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const controller = new AbortController()
    async function run() {
      let encoding = false
      try {
        const outputFrames = REMOVE_BACKGROUNDS
          ? processedFrames.current ?? await processPhotos(frames, process, done => { if (active) setProgress(done) }, controller.signal)
          : frames
        if (!active) return
        if (REMOVE_BACKGROUNDS) processedFrames.current = outputFrames
        setStage('gif')
        setProgress(0)
        encoding = true
        const blob = await createGif(outputFrames, template, done => { if (active) setProgress(done) }, controller.signal)
        if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
      } catch (reason) {
        if (active) {
          console.error('Final processing failed:', reason)
          setError(encoding ? 'Could not create the GIF. Please try again.' : 'Could not remove backgrounds. Please try again.')
        }
      }
    }
    void run()
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [frames, template, process, attempt])

  function retry() { setError(''); setStage(REMOVE_BACKGROUNDS ? 'background' : 'gif'); setProgress(0); setAttempt(value => value + 1) }
  return { url, progress, stage, error, retry, template, frames, onClose }
}
