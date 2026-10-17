import type { ForegroundProcessor } from './model/processing'
import type { Template } from './model/templates'
import { useResultsViewModel } from './viewmodel/useResultsViewModel'
import { Results } from './view/Results'

export function ResultsExport({ template, frames, process, onClose }: {
  template: Template; frames: Blob[]; process?: ForegroundProcessor; onClose: () => void
}) {
  return <Results viewModel={useResultsViewModel(template, frames, onClose, process)} />
}
