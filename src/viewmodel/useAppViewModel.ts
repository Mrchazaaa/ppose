import { useEffect, useState } from 'react'
import { loadTemplates, type Template } from '../model/templates'

type Session = { template: Template; stream: MediaStream }

export function useAppViewModel() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [camera, setCamera] = useState<'available' | 'unavailable' | 'insecure'>(() =>
    !window.isSecureContext ? 'insecure' : navigator.mediaDevices ? 'available' : 'unavailable')
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
    return () => session.stream.getTracks().forEach(track => track.stop())
  }, [session])

  async function start(template: Template) {
    setStarting(true)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: 'user', width: { ideal: template.width }, height: { ideal: template.height } },
      })
      setSession({ template, stream })
      setCamera('available')
    } catch (reason) {
      console.error('Camera unavailable:', reason)
      if (reason instanceof DOMException && reason.name === 'NotFoundError') {
        setCamera('unavailable')
      } else setError('Camera access failed. Check your permissions and try again.')
    } finally { setStarting(false) }
  }

  return { templates, loading, camera, error, session, starting, start, close: () => setSession(null) }
}
