import type { useResultsViewModel } from '../viewmodel/useResultsViewModel'

export function Results({ viewModel }: { viewModel: ReturnType<typeof useResultsViewModel> }) {
  const { url, progress, stage, error, retry, template, frames, onClose } = viewModel

  return <main className="results shell"><header className="masthead"><span className="brand">p<span>p</span>ose<span className="brand-dot">.</span></span><button className="text-button" type="button" onClick={onClose}>✕ Close</button></header><section className="results-content"><div><span className="eyebrow">THE BIG REVEAL ✳</span><h1>You made <em>magic.</em></h1><p>Your moment, on repeat. Made entirely on your device.</p>{url ? <a className="button primary download" href={url} download={`${template.id}.gif`}>↓ Download GIF</a> : error ? <><p className="notice" role="alert">{error}</p><button className="button primary" type="button" onClick={retry}>Try again</button></> : <p role="status">{stage === 'background' ? 'Removing backgrounds' : 'Creating your GIF'}… {progress}/{frames.length} frames</p>}</div><div className="result-preview">{url ? <img src={url} alt={`Animated GIF of ${template.title}`} /> : <div className="result-placeholder">✳</div>}<span>YOUR LOOP / {frames.length} FRAMES</span></div></section></main>
}
