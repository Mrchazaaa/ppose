export function RouteStatus(props: {
  status: "opening" | "results-unavailable" | "studio-not-found";
  onClose: () => void;
}) {
  return (
    <main className="menu shell">
      {props.status === "opening" ? (
        <p role="status">Opening studio…</p>
      ) : (
        <>
          <h1>{props.status === "results-unavailable" ? "Results unavailable" : "Studio not found"}</h1>
          {props.status === "results-unavailable" && <p>Results are available only until you leave the session.</p>}
          <button className="button secondary" type="button" onClick={props.onClose}>Back to templates</button>
        </>
      )}
    </main>
  );
}
