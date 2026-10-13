import { useEffect, useState } from 'react'
import { Capture } from './Capture'
import { loadTemplates, type Template } from './templates'

type Session = { template: Template; stream: MediaStream }

export function App() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [camera, setCamera] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [error, setError] = useState('')
  const [session, setSession] = useState<Session | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let active = true
    loadTemplates().then(items => { if (active) { setTemplates(items); setLoading(false) } })
    if (!navigator.mediaDevices?.getUserMedia) { setCamera('unavailable'); return () => { active = false } }
    navigator.mediaDevices.enumerateDevices()
      .then(devices => { if (active) setCamera(devices.some(device => device.kind === 'videoinput') ? 'available' : 'unavailable') })
      .catch(() => { if (active) setCamera('available') })
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
      setError('Camera access failed. Check your permissions and try again.')
    } finally { setStarting(false) }
  }

  if (session) return <Capture template={session.template} stream={session.stream} onClose={() => setSession(null)} />

  return <main className="menu shell">
    <header className="masthead"><a className="brand" href="/" aria-label="ppose home">p<span>p</span>ose<span className="brand-dot">.</span></a><span className="badge">YOUR OWN LITTLE LOOP</span></header>
    <section className="hero">
      <div className="eyebrow"><span className="spark">✳</span> CAMERA-READY CREATIVITY</div>
      <h1>Make a moment <em>move.</em></h1>
      <p>Pick a pose, take a few photos, and turn yourself into a looping GIF. No uploads. Just you, in motion.</p>
      <div className="hero-decoration" aria-hidden="true"><span>✦</span><span>↗</span><span>✳</span></div>
    </section>
    <section className="templates" aria-labelledby="templates-heading">
      <div className="section-heading"><div><span className="eyebrow">01 / THE STARTING POINT</span><h2 id="templates-heading">Choose your move</h2></div><span className="section-note">More poses coming soon ↗</span></div>
      {loading ? <p>Loading templates…</p> : templates.length === 0 ? <p>No valid templates found. Check the console for details.</p> :
        <div className="template-grid">{templates.map((template, index) => <article className="template-card" key={template.id}>
          <div className="card-art"><span className="card-number">/ 0{index + 1}</span><img src={template.guides[0]} alt="" /><span className="card-frame">{template.guides.length} FRAMES</span></div>
          <div className="card-footer"><div><h3>{template.title}</h3><p>{template.description}</p></div><button className="circle-button" type="button" aria-label={`Start ${template.title}`} disabled={camera !== 'available' || starting} onClick={() => void start(template)}>↗</button></div>
        </article>)}</div>}
      {camera === 'unavailable' && <p className="notice" role="alert">No camera detected. Connect a camera and refresh to start a template.</p>}
      {camera === 'checking' && <p className="notice">Checking for a camera…</p>}
      {error && <p className="notice" role="alert">{error}</p>}
    </section>
    <footer className="menu-footer"><span>MADE FOR THE MOMENT</span><span>YOUR PHOTOS STAY ON YOUR DEVICE ✳</span></footer>
  </main>
}
