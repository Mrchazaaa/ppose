import type { Template } from '../../model/templates'
import './TemplateCard.scss'

export function TemplateCard(props: {
  template: Template; disabled: boolean; onStart: (template: Template) => void
}) {
  const { template } = props

  return <article className="template-card">
    <div className="card-art"><img src={template.preview} alt="" /><span className="card-frame">{template.guides.length} FRAMES</span></div>
    <div className="card-footer"><div><h3>{template.title}</h3><p>{template.description}</p></div><button className="circle-button" type="button" aria-label={`Start ${template.title}`} disabled={props.disabled} onClick={() => void props.onStart(template)}>↗</button></div>
  </article>
}
