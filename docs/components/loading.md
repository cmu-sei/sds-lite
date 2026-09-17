# Loading and empty states

[Documentation](../README.md) / [Components](./README.md) / Loading

## Spinner

Use a spinner when an action or compact region is waiting:

```html
<span class="sds-spinner" role="status">
  <span class="sds-sr-only">Loading projects</span>
</span>
```

`data-size` accepts `sm`, `md`, or `lg`; `md` is the default. `data-tone`
accepts every semantic tone.

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
| Short action in progress | Spinner in or near the action |
| Page structure known, data pending | Skeleton |
| Successful response with zero items | Empty state |
| Recoverable failure | Callout with an action |
| Background success | Toast |
