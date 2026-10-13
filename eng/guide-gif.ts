import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pngjs from 'pngjs'
import { encodeGif } from '../src/gif'

async function main() {
  const id = process.argv[2]
  if (!id || !/^[\w-]+$/.test(id) || process.argv.length !== 3) {
    throw new Error('Usage: npm run guides:gif -- <template-id>')
  }
  const folder = new URL(`../templates/${id}/`, import.meta.url)
  const { frames, width, height, duration } = JSON.parse(await readFile(new URL('config.json', folder), 'utf8')) as {
    frames: string[]; width: number; height: number; duration: number
  }
  if (!Number.isInteger(width) || width < 1 || width > 2048 ||
      !Number.isInteger(height) || height < 1 || height > 2048 ||
      !Number.isInteger(duration) || duration < 20 ||
      !Array.isArray(frames) || frames.length < 1 || frames.length > 50 ||
      frames.some((frame, index) => frame !== `${index + 1}.png`)) {
    throw new Error(`${id}: invalid dimensions, duration, or frames in config.json`)
  }

  async function* guides() {
    let size: [number, number] | undefined
    for (const frame of frames) {
      const image = pngjs.PNG.sync.read(await readFile(new URL(frame, folder)))
      if (image.width > width || image.height > height ||
          (size && (image.width !== size[0] || image.height !== size[1]))) {
        throw new Error(`${id}: guides must share dimensions and fit within ${width}×${height}`)
      }
      size = [image.width, image.height]
      const rgba = new Uint8Array(width * height * 4)
      const x = Math.floor((width - image.width) / 2)
      const y = Math.floor((height - image.height) / 2)
      for (let row = 0; row < image.height; row++) {
        rgba.set(image.data.subarray(row * image.width * 4, (row + 1) * image.width * 4), ((y + row) * width + x) * 4)
      }
      yield rgba
    }
  }

  const gif = await encodeGif(guides(), width, height, duration, () => {})
  const output = new URL('guides.gif', folder)
  await writeFile(output, new Uint8Array(await gif.arrayBuffer()))
  console.log(`Created ${fileURLToPath(output)}`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
