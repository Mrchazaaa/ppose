# Code conventions

## Frontend views

- Name each React component after its file (for example, `Results` in `Results.tsx`); do not append suffixes such as `Page` or `View` to the component name.
- A view calls its dedicated view-model hook directly. Pass it only the inputs it needs from its parent; do not pass a view-model object through wrapper components.
- Name the view's parameter `props` and give it an explicit inline object type listing each prop (including optional props):

  ```tsx
  export function Capture(props: {
    template: Template; stream: MediaStream | null; onClose: () => void;
    onFinish: (result: { template: Template; frames: Blob[]; background: string | null }) => void
  }) {
    // ...
  }
  ```

- Create a view model specifically for each view. Name its hook `use{ViewName}ViewModel`, where `{ViewName}` is the view component's name (for example, `Results` uses `useResultsViewModel`).
- Compose related hooks inside the view model so the view calls one dedicated hook. Group related returned state and actions into named objects when the return becomes crowded (for example, `camera`, `photos`, `settings`, and `result` in `useCaptureViewModel`); keep values shared across groups at the top level. Pass individual values to child components, not entire view-model groups.
- Keep workflow state and actions in the view model and rendering in the view. Mount views conditionally in the parent rather than calling their hooks conditionally.
