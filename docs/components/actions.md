# Actions

[Documentation](../README.md) / [Components](./README.md) / Actions

## Button

Use a native button for an action:

```html
<button type="button">Save changes</button>
```

Native buttons inside an SDS root are styled automatically. Use
`.sds-button` when a link should have button appearance:

```html
<a class="sds-button" href="/projects/new">Create project</a>
```

| Option | Values | Default |
|---|---|---|
| `data-variant` | `primary`, `secondary`, `tertiary`, `ghost` | `primary` |
| `data-tone` | `neutral`, `accent`, `info`, `success`, `warning`, `danger` | Accent action |
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl` | `md` |
| `data-density` | `compact` | Comfortable |
| `data-shape` | `icon` | Text button |
| `data-block` | Presence | Content width |
| `disabled` | Native button state | Enabled |
| `aria-disabled="true"` | Link or custom disabled state | Enabled |
| `aria-busy="true"` | Action is processing | Not busy |

### Action hierarchy

Use one primary action per local decision:

```html
<div class="sds-action-group">
  <button type="submit">Save</button>
  <button type="button" data-variant="ghost">Cancel</button>
  <button type="button" data-variant="tertiary">Preview</button>
</div>
```

Use a danger tone for a destructive action:

```html
<button type="button" data-tone="danger">Delete project</button>
```

### Icon-only buttons

Every icon-only control needs an accessible name:

```html
<button type="button" data-shape="icon" aria-label="Close">
  <span aria-hidden="true">&times;</span>
</button>
```

Use `data-density="compact"` for toolbar and menu-like actions:

```html
<button type="button" data-density="compact">Edit</button>
```

An `svg`, `img`, or descendant with `data-avatar` is treated as leading media:

```html
<button type="button" data-density="compact">
  <img data-avatar src="/people/alex.jpg" alt="">
  Alex
</button>
```

`aria-disabled="true"` changes appearance and pointer behavior but does not
prevent keyboard activation. Prefer native `disabled` on buttons. When a link
must remain in the reading order, application code must suppress its action.

## Action group

`.sds-action-group` wraps related controls with consistent responsive spacing:

```html
<div class="sds-action-group" aria-label="Project actions">
  <button type="button">Save</button>
  <button type="button" data-variant="ghost">Cancel</button>
</div>
```

Direct button children share available width in a narrow `.sds-page-header`.

## Link

Links with `href` are styled automatically inside an SDS root. Use `.sds-link`
to apply link options:

```html
<a class="sds-link" href="/projects">Projects</a>
<a class="sds-link" data-variant="cta" href="/next">Next step</a>
```

| Option | Values | Default |
|---|---|---|
| `data-variant` | `secondary`, `tertiary`, `inline`, `cta` | Primary link |
| `data-tone` | All semantic tones | Action blue |
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl` | Inherited |
| `aria-disabled="true"` | Disabled appearance | Enabled |

Use `data-sds-unstyled` when a third-party or application recipe must opt out:

```html
<a class="map-control" data-sds-unstyled href="/map">Map</a>
```

Use a link for navigation and a button for an action, regardless of appearance.
