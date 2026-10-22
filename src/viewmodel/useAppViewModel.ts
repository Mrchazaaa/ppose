import { useEffect, useState } from 'react'
import { loadTemplates, outputTemplate, type Template } from '../model/templates'
import { useRoute } from './useRoute'

type Session = { path: string; template: Template; stream: MediaStream | null }
type Result = { template: Template; frames: Blob[]; background: string | null }

const customTemplate: Template = {
  id: 'custom', title: 'Custom GIF', description: '', preview: '',
  duration: 250, width: 720, height: 720, guideWidth: 0, guideHeight: 0, guides: [],
}

export function useAppViewModel() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const route = useRoute()
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [starting, setStarting] = useState(false)
  const template = route.kind === 'studio'
    ? route.templateId === 'custom' ? customTemplate : templates.find(item => item.id === route.templateId)
    : undefined

  useEffect(() => {
    let active = true
    loadTemplates().then(items => { if (active) { setTemplates(items); setLoading(false) } })
    return () => { active = false }
  }, [])

  useEffect(() => { if (route.kind !== 'results') setResult(null) }, [route.kind, route.path])

  useEffect(() => {
    setSession(null)
    if (loading || !template) { setStarting(false); return }
    const selected = template
    let active = true
    let stream: MediaStream | null = null
    setStarting(true)
    async function open() {
      if (window.isSecureContext && navigator.mediaDevices) {
        try {
          const output = outputTemplate(selected)
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false, video: { facingMode: 'user', width: { ideal: output.width }, height: { ideal: output.height } },
          })
        } catch (reason) { if (active) console.error('Camera unavailable:', reason) }
      }
      if (active) { setSession({ path: route.path, template: selected, stream }); setStarting(false) }
      else stream?.getTracks().forEach(track => track.stop())
    }
    void open()
    return () => { active = false; stream?.getTracks().forEach(track => track.stop()) }
  }, [route.path, template, loading])

  return { templates, loading, session: session?.path === route.path ? session : null,
    result: route.kind === 'results' ? result : null, starting, route: { path: route.path, kind: route.kind }, studio: !!template,
    start: (item: Template) => route.openStudio(item.id),
    startCustom: () => route.openStudio('custom'), close: route.openMenu,
    finish: (output: Result) => { setResult(output); route.openResults() } }
}
