import { useState, type CSSProperties, type RefObject } from 'react'

export type LayerInput = {
  id: string; label: string; defaultOpacity: number; zIndex: number; aspectRatio?: number
  className: string; style?: CSSProperties
} & ({ kind: 'video'; ref: RefObject<HTMLVideoElement | null>; ariaLabel: string; onReady: () => void; onError: () => void; src?: string; autoPlay?: boolean; onMetadata?: () => void; onSeeking?: () => void; onSeeked?: () => void }
  | { kind: 'image'; url?: string; alt: string })

export type PreviewLayer = LayerInput & { opacity: number; onOpacityChange: (opacity: number) => void }

export function useCaptureLayersViewModel(inputs: LayerInput[]) {
  const [opacities, setOpacities] = useState<Record<string, number>>({})
  const layers: PreviewLayer[] = inputs.map(layer => ({
    ...layer,
    opacity: opacities[layer.id] ?? layer.defaultOpacity,
    onOpacityChange: opacity => setOpacities(previous => ({ ...previous, [layer.id]: opacity })),
  }))

  return layers
}
