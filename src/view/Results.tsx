import type { ForegroundProcessor } from '../model/processing'
import type { Template } from '../model/templates'
import { useResultsViewModel } from '../viewmodel/useResultsViewModel'
import './Results.scss'

export function Results(props: {
  template: Template; frames: Blob[]; background: string | null; process?: ForegroundProcessor; onClose: () => void
}) {
  const { url, progress, stage, error, retry } = useResultsViewModel(props.template, props.frames, props.background, props.process)

  return <main className="results shell"><header className="masthead"><span className="brand">p<span>p</span>ose<span className="brand-dot">.</span></span><button className="text-button" type="button" onClick={props.onClose}>✕ Close</button></header><section className="results-content"><div><span className="eyebrow">THE BIG REVEAL ✳</span><h1>You made <em>magic.</em></h1><p>Your moment, on repeat. Made entirely on your device.</p>{url ? <a className="button primary download" href={url} download={`${props.template.id}.gif`}>↓ Download GIF</a> : error ? <><p className="notice" role="alert">{error}</p><button className="button primary" type="button" onClick={retry}>Try again</button></> : <p role="status">{stage === 'background' ? 'Removing backgrounds' : 'Creating your GIF'}… {progress}/{props.frames.length} frames</p>}</div><div className="result-preview">{url ? <img src={url} alt={`Animated GIF of ${props.template.title}`} /> : <div className="result-placeholder">✳</div>}<span>YOUR LOOP / {props.frames.length} FRAMES</span></div></section></main>
}
