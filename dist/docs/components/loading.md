# Loading and empty states

[Documentation](../README.md) / [Components](./README.md) / Loading

## Progress and measurement

Use native `<progress>` for task completion. A progress element without a
`value` communicates an indeterminate task:

```html
<div class="sds-field">
  <label for="upload-progress">Uploading files</label>
  <progress id="upload-progress" value="68" max="100">68%</progress>
</div>
```

Use `<meter>` for a scalar measurement within a known range, not for task
completion:

```html
<div class="sds-field">
  <label for="storage">Storage used</label>
  <meter id="storage" value="72" min="0" max="100" high="80">72%</meter>
</div>
```

Keep the changing value available as text when users need the exact number.
SDS Lite preserves the native value, range, optimum, and threshold semantics.

`progress` accepts every semantic `data-sds-tone`; the default is `info`.
Both elements accept `data-sds-size="sm|md|lg"`, with `md` as the default.
Meter color follows its native optimum, suboptimum, and low-value thresholds,
so it intentionally does not accept an authored tone.

## Spinner

Use a spinner when an action or compact region is waiting:

```html
<span class="sds-spinner" role="status">
  <span class="sds-sr-only">Loading projects</span>
</span>
```

| Size | Diameter | Typical use |
|---|---:|---|
| `sm` | `1rem` | Inline actions |
| `md` | `1.5rem` | Controls and compact regions |
| `lg` | `3rem` | Sections and cards |
| `xl` | `5rem` | Page-level loading |

`md` is the default size, and `neutral` is the default tone.
`data-sds-tone` accepts every semantic tone.

Use specific accessible text. “Loading projects” is more useful than
“Loading.” Avoid adding a live spinner repeatedly during frequent background
updates.

## Skeleton

Use a skeleton when the page structure is known and content is loading:

```html
<section aria-busy="true" aria-label="Loading project">
  <div
    class="sds-skeleton"
    style="height: 1.5rem"
    aria-hidden="true"
  ></div>
</section>
```

`.sds-skeleton` fills its container. Give it or its parent a useful height.
Hide decorative placeholders from assistive technology and report busy state
on the containing region.

Remove `aria-busy` when the real content replaces the placeholders.

## Empty state

Use an empty state when loading completed successfully but no content exists:

```html
<section class="sds-empty-state">
  <h2>No projects yet</h2>
  <p>Create a project to get started.</p>
  <button type="button">Create project</button>
</section>
```

An empty state is not an error message. Explain why the region is empty and
provide one clear next action when possible. `.sds-empty-state` has no
variants.

## Choosing the right state

| Situation | Use |
|---|---|
| Task has measurable completion | Progress |
| Short action in progress | Spinner in or near the action |
| Page structure known, data pending | Skeleton |
| Successful response with zero items | Empty state |
| Recoverable failure | Callout with an action |
| Background success | Toast |
