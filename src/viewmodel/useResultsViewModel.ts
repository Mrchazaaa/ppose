import { useEffect, useState } from 'react'
import { createGif } from '../model/processing'
import type { Template } from '../model/templates'

export function useResultsViewModel(template: Template, frames: Blob[]) {
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let objectUrl = ''
    const controller = new AbortController()
    createGif(frames, template, done => { if (active) setProgress(done) }, controller.signal)
      .then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) } })
      .catch(reason => { if (active) { console.error('GIF export failed:', reason); setError('Could not create the GIF. Please try again.') } })
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [frames, template, attempt])

  function retry() { setError(''); setProgress(0); setAttempt(value => value + 1) }
  return { url, progress, error, retry }
}
