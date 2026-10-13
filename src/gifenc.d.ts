declare module 'gifenc' {
  export function quantize(rgba: Uint8ClampedArray, colors: number, options?: { format?: string; oneBitAlpha?: boolean | number }): number[][]
  export function applyPalette(rgba: Uint8ClampedArray, palette: number[][], format?: string): Uint8Array
  export function GIFEncoder(): {
    writeFrame(index: Uint8Array, width: number, height: number, options: {
      palette: number[][]; transparent: boolean; transparentIndex: number; delay: number; repeat: number; dispose: number
    }): void
    finish(): void
    bytes(): Uint8Array
  }
}
