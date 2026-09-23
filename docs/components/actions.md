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
| `data-sds-variant` | `primary`, `secondary`, `tertiary`, `ghost` | `primary` |
| `data-sds-tone` | `neutral`, `accent`, `info`, `success`, `warning`, `danger` | Accent action |
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl` | `md` |
| `data-sds-density` | `compact` | Comfortable |
| `data-sds-shape` | `icon` | Text button |
| `data-sds-block` | Presence | Content width |
| `disabled` | Native button state | Enabled |
| `aria-disabled="true"` | Link or custom disabled state | Enabled |
| `aria-busy="true"` | Action is processing | Not busy |

Extra-small buttons retain a minimum `24px` target dimension. Use them only in
dense interfaces with sufficient separation from adjacent controls; `md`
remains the general-purpose size.

### Action hierarchy

Use one primary action per local decision:

```html
<div class="sds-action-group">
  <button type="submit">Save</button>
  <button type="button" data-sds-variant="ghost">Cancel</button>
  <button type="button" data-sds-variant="tertiary">Preview</button>
</div>
```

Use a danger tone for a destructive action:

```html
<button type="button" data-sds-tone="danger">Delete project</button>
```

### Icon-only buttons

Every icon-only control needs an accessible name:

```html
<button type="button" data-sds-shape="icon" aria-label="Close">
  <span aria-hidden="true">&times;</span>
</button>
```

Use `data-sds-density="compact"` for toolbar and menu-like actions:

```html
<button type="button" data-sds-density="compact">Edit</button>
```

Compact secondary buttons use a translucent (20%) tone-colored border,
matching SEI action buttons; standard secondary buttons retain their solid
neutral border. A disabled compact secondary uses a 10% neutral border.

An `svg`, `img`, or descendant with `data-sds-avatar` is treated as leading media:

```html
<button type="button" data-sds-density="compact">
  <img data-sds-avatar src="/people/alex.jpg" alt="">
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
  <button type="button" data-sds-variant="ghost">Cancel</button>
</div>
```

Direct button children share available width in a narrow `.sds-page-header`.

## Link

Links with `href` are styled automatically inside an SDS root. Use `.sds-link`
to apply link options:

```html
<a class="sds-link" href="/projects">Projects</a>
<a class="sds-link" data-sds-variant="cta" href="/next">Next step</a>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-variant` | `secondary`, `tertiary`, `inline`, `cta` | Primary link |
| `data-sds-tone` | All semantic tones | Action blue |
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl` | Inherited |
| `aria-disabled="true"` | Disabled appearance | Enabled |

An unsized link inherits its surrounding text size. An explicit
`data-sds-size="md"` establishes the standard `1rem` size.

Use `data-sds-unstyled` when a third-party or application recipe must opt out:

```html
<a class="map-control" data-sds-unstyled href="/map">Map</a>
```

Use a link for navigation and a button for an action, regardless of appearance.
