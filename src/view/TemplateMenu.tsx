import type { Template } from "../model/templates";
import { useTemplateMenuViewModel } from "../viewmodel/useTemplateMenuViewModel";
import { TemplateCard } from "./components/TemplateCard";
import "./TemplateMenu.scss";

export function TemplateMenu(props: {
  templates: Template[];
  loading: boolean;
  starting: boolean;
  onStart: (template: Template) => void;
  onStartCustom: () => void;
}) {
  const { camera, localhostUrl } = useTemplateMenuViewModel();

  return (
    <main className="menu shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="ppose home">
          p<span>p</span>ose<span className="brand-dot">.</span>
        </a>
        <span className="privacy-note">YOUR MEDIA STAYS ON YOUR DEVICE ✳</span>
      </header>
      <section className="templates" aria-labelledby="templates-heading">
        <div className="section-heading">
          <h1 id="templates-heading">Templates</h1>
          <span className="section-note">More poses coming soon ↗</span>
        </div>
        {props.loading ? (
          <p>Loading templates…</p>
        ) : props.templates.length === 0 ? (
          <p>No valid templates found. Check the console for details.</p>
        ) : (
          <div className="template-grid">
            {props.templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                disabled={props.starting}
                onStart={props.onStart}
              />
            ))}
          </div>
        )}
        {camera === "unavailable" && (
          <p className="notice" role="alert">
            No camera detected. You can still import photos or videos.
          </p>
        )}
        {camera === "insecure" && (
          <p className="notice" role="alert">
            Camera access needs a secure address on every device; imports still work. On the
            computer running ppose, open{" "}
            <a href={localhostUrl}>{localhostUrl}</a>
            . On other devices, use trusted HTTPS.
          </p>
        )}
      </section>
      <section className="custom-gif" aria-label="Create without a template">
        <button className="button secondary" type="button" disabled={props.starting} onClick={props.onStartCustom}>
          ＋ Create a custom GIF
        </button>
      </section>
    </main>
  );
}
