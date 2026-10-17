import type { ForegroundProcessor } from './model/processing'
import type { Template } from './model/templates'
import { useCaptureViewModel } from './viewmodel/useCaptureViewModel'
import { Capture } from './view/Capture'

export function CaptureSession({ template, stream, onClose, process }: {
  template: Template; stream: MediaStream; onClose: () => void; process?: ForegroundProcessor
}) {
  return <Capture viewModel={useCaptureViewModel(template, stream, onClose, process)} />
}
