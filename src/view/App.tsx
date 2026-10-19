import { TemplateCard } from "./components/TemplateCard";
import { useAppViewModel } from "../viewmodel/useAppViewModel";
import { Capture } from "./Capture";
import "./App.scss";

export function App() {
  const { templates, loading, camera, error, session, starting, start, close } =
    useAppViewModel();

  if (session)
    return (
      <Capture
        template={session.template}
        stream={session.stream}
        onClose={close}
      />
    );

  return (
    <main className="menu shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="ppose home">
          p<span>p</span>ose<span className="brand-dot">.</span>
        </a>
        <span className="privacy-note">YOUR PHOTOS STAY ON YOUR DEVICE ✳</span>
      </header>
      <section className="templates" aria-labelledby="templates-heading">
        <div className="section-heading">
          <h1 id="templates-heading">Templates</h1>
          <span className="section-note">More poses coming soon ↗</span>
        </div>
        {loading ? (
          <p>Loading templates…</p>
        ) : templates.length === 0 ? (
          <p>No valid templates found. Check the console for details.</p>
        ) : (
          <div className="template-grid">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                disabled={camera !== "available" || starting}
                onStart={start}
              />
            ))}
          </div>
        )}
        {camera === "unavailable" && (
          <p className="notice" role="alert">
            No camera detected. Connect a camera and refresh to start a
            template.
          </p>
        )}
        {camera === "insecure" && (
          <p className="notice" role="alert">
            Camera access needs a secure address on every device. On the
            computer running ppose, open{" "}
            <a href={`http://localhost:${window.location.port || "5173"}/`}>
              http://localhost:{window.location.port || "5173"}/
            </a>
            . On other devices, use trusted HTTPS.
          </p>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
