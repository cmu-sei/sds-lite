# Loading and empty states

[Documentation](../README.md) / [Components](./README.md) / Loading

Find: [progress or meter](#progress-and-measurement), [spinner](#spinner),
[skeleton](#skeleton), or [empty state](#empty-state).

## Progress and measurement

Use native `<progress class="sds-progress">` for task completion. A progress element without a
`value` communicates an indeterminate task:

```html
<div class="sds-field">
  <label for="upload-progress">Uploading files</label>
  <progress class="sds-progress" id="upload-progress" value="68" max="100">68%</progress>
</div>
```

Use `<meter class="sds-meter">` for a scalar measurement within a known range, not for task
completion:

```html
<div class="sds-field">
  <label for="storage">Storage used</label>
  <meter class="sds-meter" id="storage" value="72" min="0" max="100" high="80">72%</meter>
</div>
```

### Options

`progress` accepts every semantic `data-sds-tone`; the default is `info`.
Both elements accept `data-sds-size="sm|md|lg"`, with `md` as the default.
Meter color follows its native optimum, suboptimum, and low-value thresholds,
so it intentionally does not accept an authored tone.

### Accessibility

Label the control and keep exact changing values available as text when needed.
SDS Lite preserves native range, optimum, and threshold semantics.

### Related

[Spinner](#spinner) for compact indeterminate work, [datapoint](./data-display.md#datapoint) for a metric.

## Spinner

Use a spinner when an action or compact region is waiting:

```html
<span class="sds-spinner" role="status">
  <span class="sds-sr-only">Loading projects</span>
</span>
```

### Options

| Size | Diameter | Typical use |
|---|---:|---|
| `sm` | `1rem` | Inline actions |
| `md` | `1.5rem` | Controls and compact regions |
| `lg` | `3rem` | Sections and cards |
| `xl` | `5rem` | Page-level loading |

`md` is the default size, and `neutral` is the default tone.
`data-sds-tone` accepts every semantic tone.

### Accessibility

Use specific accessible text. “Loading projects” is more useful than
“Loading.” Avoid adding a live spinner repeatedly during frequent background
updates.

### Related

[Progress](#progress-and-measurement), [skeleton](#skeleton).

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

### Options

No recipe-specific options. `.sds-skeleton` fills its container; give it or its
parent a useful height.

### Accessibility

Hide decorative placeholders and report busy state on the containing region.
Remove `aria-busy` when the real content replaces the placeholders.

### Related

[Spinner](#spinner), [empty state](#empty-state).

## Empty state

Use an empty state when loading completed successfully but no content exists:

```html
<section class="sds-empty-state">
  <h2>No projects yet</h2>
  <p>Create a project to get started.</p>
  <button class="sds-button" type="button">Create project</button>
</section>
```

### Options

`.sds-empty-state` has no variants.

### Accessibility

Explain why the region is empty and provide one clear next action when possible.
Use this for successful empty responses, not errors or loading.

### Related

[Callout](./feedback.md#callout) for errors, [skeleton](#skeleton) while loading.

## Choosing the right state

| Situation | Use |
|---|---|
| Task has measurable completion | [Progress](#progress-and-measurement) |
| Short action in progress | [Spinner](#spinner) in or near the action |
| Page structure known, data pending | [Skeleton](#skeleton) |
| Successful response with zero items | [Empty state](#empty-state) |
| Recoverable failure | [Callout](./feedback.md#callout) with an action |
| Background success | [Toast](./feedback.md#toast) |
