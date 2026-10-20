import { useEffect, useState } from 'react'
import { loadTemplates, outputTemplate, type Template } from '../model/templates'

type Session = { template: Template; stream: MediaStream | null }

export function useAppViewModel() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const camera = !window.isSecureContext ? 'insecure' : navigator.mediaDevices ? 'available' : 'unavailable'
  const [error, setError] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let active = true
    loadTemplates().then(items => { if (active) { setTemplates(items); setLoading(false) } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!session) return
    return () => session.stream?.getTracks().forEach(track => track.stop())
  }, [session])

  async function start(template: Template) {
    setStarting(true)
    setError('')
    let stream: MediaStream | null = null
    if (camera === 'available') {
      try {
        const output = outputTemplate(template)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false, video: { facingMode: 'user', width: { ideal: output.width }, height: { ideal: output.height } },
        })
      } catch (reason) { console.error('Camera unavailable:', reason) }
    }
    setSession({ template, stream })
    setStarting(false)
  }

  return { templates, loading, camera, error, session, starting, start, close: () => setSession(null) }
}
