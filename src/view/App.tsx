import { useAppViewModel } from "../viewmodel/useAppViewModel";
import { Capture } from "./Capture";
import { Results } from "./Results";
import { TemplateMenu } from "./TemplateMenu";
import { RouteStatus } from "./components/RouteStatus";

export function App() {
  const { templates, loading, session, result, starting, route, studio, start, startCustom, close, finish } =
    useAppViewModel();

  if (route.kind === "results")
    return <Results template={result!.template} frames={result!.frames} background={result!.background} onClose={close} />;

  if (route.kind === "studio")
    return (
      <Capture
        template={session!.template}
        stream={session!.stream}
        onClose={close}
        onFinish={finish}
      />
    );

  if (route.kind === "menu")
    return <TemplateMenu templates={templates} loading={loading} starting={starting} onStart={start} onStartCustom={startCustom} />;

  return <RouteStatus status={route.kind === "studio" && (loading || studio) ? "opening" : route.kind === "results" ? "results-unavailable" : "studio-not-found"} onClose={close} />;
}
