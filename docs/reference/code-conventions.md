# Code conventions

## Frontend views

- A view component receives a single prop: `viewModel`. Its dedicated view model provides the state and actions the view needs to render and handle interactions; do not pass additional state or callback props to the view.
- Create a view model specifically for each view. Name its hook `use{ViewName}ViewViewModel`, where `{ViewName}` is the view component's name (for example, `ResultsView` uses `useResultsViewViewModel`).
- Keep workflow state and actions in the view model and rendering in the view. 

