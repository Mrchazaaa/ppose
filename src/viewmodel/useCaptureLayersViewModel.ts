import { useState, type CSSProperties } from 'react'
import type { Template } from '../model/templates'

export type PreviewLayer = {
  label: string; opacity: number; onOpacityChange: (opacity: number) => void
  className: string; style?: CSSProperties
} & ({ kind: 'video' } | { kind: 'image'; url?: string; alt: string })

export function useCaptureLayersViewModel(template: Template, frames: ({ url: string } | null)[], index: number, mode: 'camera' | 'review' | 'results', mirrored: boolean) {
  const [overlayIndex, setOverlayIndex] = useState<number | null>(null)
  const [cameraOpacity, setCameraOpacity] = useState(100)
  const [guideOpacity, setGuideOpacity] = useState(100)
  const [overlayOpacity, setOverlayOpacity] = useState(40)

  const layers: PreviewLayer[] = [
    mode === 'camera'
      ? { kind: 'video', label: 'Camera / photo', opacity: cameraOpacity, onOpacityChange: setCameraOpacity, className: 'camera-video', style: { transform: mirrored ? 'scaleX(-1)' : 'none' } }
      : { kind: 'image', label: 'Camera / photo', url: frames[index]?.url, alt: `Captured frame ${index + 1}`, opacity: cameraOpacity, onOpacityChange: setCameraOpacity, className: 'review-image' },
    { kind: 'image', label: 'Frame overlay', url: overlayIndex === null ? undefined : frames[overlayIndex]?.url, alt: '', opacity: overlayOpacity, onOpacityChange: setOverlayOpacity, className: 'frame-overlay' },
    { kind: 'image', label: 'Guide overlay', url: template.guides[index], alt: 'Pose guide', opacity: guideOpacity, onOpacityChange: setGuideOpacity, className: 'pose-guide', style: { width: `${template.guideWidth / template.width * 100}%`, height: `${template.guideHeight / template.height * 100}%` } },
  ]

  function toggleOverlay(position: number) { setOverlayIndex(previous => previous === position ? null : position) }
  function clearOverlay(position: number) { setOverlayIndex(previous => previous === position ? null : previous) }

  return { layers, overlayIndex, toggleOverlay, clearOverlay }
}
