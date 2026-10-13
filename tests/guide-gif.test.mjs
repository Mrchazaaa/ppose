import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import pngjs from 'pngjs'

test('guide GIF command accepts ordered and repeated PNG filenames and rejects invalid entries', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const folder = await mkdtemp(join(root, 'templates', 'guide-error-'))
  try {
    await writeFile(join(folder, 'config.json'), JSON.stringify({ width: 480, height: 600, duration: 200,
      frames: ['../outside.png', ...Array.from({ length: 100 }, (_, index) => `frame_${index + 1}.png`)] }))
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'eng/guide-gif.ts', basename(folder)], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /frames must contain 1–100 entries \(got 101\)/)
    assert.match(result.stderr, /frames\[0\] must name a PNG in the template folder \(got "\.\.\/outside\.png"\)/)
    const png = new pngjs.PNG({ width: 2, height: 2 })
    png.data.set([255, 0, 0, 255])
    await writeFile(join(folder, 'wave.png'), pngjs.PNG.sync.write(png))
    await writeFile(join(folder, 'config.json'), JSON.stringify({ width: 2, height: 2, duration: 200,
      frames: ['wave.png', 'wave.png'] }))
    const success = spawnSync(process.execPath, ['--import', 'tsx', 'eng/guide-gif.ts', basename(folder)], { cwd: root, encoding: 'utf8' })
    assert.equal(success.status, 0, success.stderr)
    assert.equal((await readFile(join(folder, 'guides.gif'))).subarray(0, 6).toString(), 'GIF89a')
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
})
