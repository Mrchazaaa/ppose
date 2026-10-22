export interface Template {
  id: string
  title: string
  description: string
  preview: string
  duration: number
  width: number
  height: number
  guideWidth: number
  guideHeight: number
  guides: string[]
}

export function withAspectRatio(template: Template, ratio: number): Template {
  const width = Math.min(template.width, Math.round(template.height * ratio))
  const height = Math.min(template.height, Math.round(template.width / ratio))
  return { ...template, width, height }
}

export function outputTemplate(template: Template, ratio: number | null = null): Template {
  const cropped = ratio === null ? template : withAspectRatio(template, ratio)
  const scale = Math.min(2, Math.floor(2048 / Math.max(cropped.width, cropped.height)))
  return { ...cropped, width: cropped.width * scale, height: cropped.height * scale }
}

type TemplateConfig = Omit<Template, 'guideWidth' | 'guideHeight'>

const configs = import.meta.glob('../../templates/*/config.json', { eager: true, import: 'default' })
const images = import.meta.glob('../../templates/*/*.{png,jpg,jpeg,webp,gif}', { eager: true, query: '?url', import: 'default' })

export function parseTemplate(path: string, config: unknown, imageUrls: Record<string, string>): TemplateConfig {
  const data = config as Record<string, unknown>
  const id = path.split('/').at(-2)!
  if (id === 'custom') throw new Error('custom: reserved for the guide-free studio route')
  if (!data || typeof data.title !== 'string' || !data.title.trim() ||
      typeof data.preview !== 'string' || !data.preview.trim() ||
      typeof data.description !== 'string' || !Number.isInteger(data.duration) ||
      (data.duration as number) < 20 || typeof data.width !== 'number' ||
      typeof data.height !== 'number' || !Number.isInteger(data.width) ||
      !Number.isInteger(data.height) || (data.width as number) < 1 ||
      (data.height as number) < 1 || (data.width as number) > 2048 ||
      (data.height as number) > 2048 || !Array.isArray(data.frames) ||
      data.frames.length < 1 || data.frames.length > 100 ||
      data.frames.some((frame: unknown) => typeof frame !== 'string' || !/^[^/\\]+\.png$/.test(frame))) {
    throw new Error(`${id}: invalid config (title, description, preview, duration, width, height, 1–100 local PNG frames required)`)
  }
  const preview = imageUrls[`../../templates/${id}/${data.preview}`]
  if (!preview) throw new Error(`${id}: missing preview ${data.preview}`)
  const guides = (data.frames as string[]).map(frame => {
    const url = imageUrls[`../../templates/${id}/${frame}`]
    if (!url) throw new Error(`${id}: missing guide ${frame}`)
    return url
  })
  return { id, title: data.title, description: data.description, preview, duration: data.duration as number,
    width: data.width as number, height: data.height as number, guides }
}

function dimensions(url: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve([image.naturalWidth, image.naturalHeight])
    image.onerror = () => reject(new Error(`Unable to load guide: ${url}`))
    image.src = url
  })
}

export async function loadTemplates(): Promise<Template[]> {
  const valid = await Promise.all(Object.entries(configs).map(async ([path, config]) => {
    try {
      const template = parseTemplate(path, config, images as Record<string, string>)
      const sizes = await Promise.all(template.guides.map(dimensions))
      if (sizes.some(([width, height]) => width !== sizes[0][0] || height !== sizes[0][1] ||
          width > template.width || height > template.height)) {
        throw new Error(`${template.id}: guides must share dimensions and fit within ${template.width}×${template.height}`)
      }
      return { ...template, guideWidth: sizes[0][0], guideHeight: sizes[0][1] }
    } catch (error) {
      console.error('Template failed to load:', path, error)
      return null
    }
  }))
  return valid.filter((template): template is Template => template !== null)
}
