import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pngjs from 'pngjs'
import { encodeGif } from '../src/model/gif'

async function main() {
  const id = process.argv[2]
  if (!id || !/^[\w-]+$/.test(id) || process.argv.length !== 3) {
    throw new Error('Usage: npm run guides:gif -- <template-id>')
  }
  const folder = new URL(`../templates/${id}/`, import.meta.url)
  const { frames, width, height, duration } = JSON.parse(await readFile(new URL('config.json', folder), 'utf8')) as {
    frames: string[]; width: number; height: number; duration: number
  }
  const problems: string[] = []
  if (!Number.isInteger(width) || width < 1 || width > 2048) problems.push(`width must be an integer from 1 to 2048 (got ${width})`)
  if (!Number.isInteger(height) || height < 1 || height > 2048) problems.push(`height must be an integer from 1 to 2048 (got ${height})`)
  if (!Number.isInteger(duration) || duration < 20) problems.push(`duration must be an integer of at least 20 ms (got ${duration})`)
  if (!Array.isArray(frames)) problems.push('frames must be an array of 1–100 PNG filenames')
  else {
    if (frames.length < 1 || frames.length > 100) problems.push(`frames must contain 1–100 entries (got ${frames.length})`)
    const mismatch = frames.findIndex(frame => typeof frame !== 'string' || !/^[^/\\]+\.png$/.test(frame))
    if (mismatch !== -1) problems.push(`frames[${mismatch}] must name a PNG in the template folder (got ${JSON.stringify(frames[mismatch])})`)
  }
  if (problems.length) throw new Error(`${id}/config.json:\n- ${problems.join('\n- ')}`)

  async function* guides() {
    let size: [number, number] | undefined
    for (const frame of frames) {
      const image = pngjs.PNG.sync.read(await readFile(new URL(encodeURIComponent(frame), folder)))
      if (image.width > width || image.height > height ||
          (size && (image.width !== size[0] || image.height !== size[1]))) {
        throw new Error(`${id}/${frame}: guide is ${image.width}×${image.height}; guides must share dimensions and fit within ${width}×${height}`)
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

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
