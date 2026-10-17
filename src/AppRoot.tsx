import { useAppViewModel } from './viewmodel/useAppViewModel'
import { App } from './view/App'

export function AppRoot() {
  return <App viewModel={useAppViewModel()} />
}
