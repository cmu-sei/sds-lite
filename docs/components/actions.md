# Actions

[Documentation](../README.md) / [Components](./README.md) / Actions

Find: [button](#button), [toggles](#toggle-buttons), [action group](#action-group), or [link](#link).

## Button

Use a native button for an action:

```html
<button class="sds-button" type="button">Save changes</button>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-variant` | `filled`, `tonal`, `outlined`, `text` | `filled`; icon buttons use `text` |
| `data-sds-tone` | `neutral`, `accent`, `info`, `success`, `warning`, `danger` | `info`; icon buttons use `neutral` |
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl` | `md` |
| `data-sds-density` | `compact` | Comfortable |
| `data-sds-shape` | `icon` | Text button |
| `data-sds-block` | Presence | Content width |
| `disabled` | Native button state | Enabled |
| `aria-disabled="true"` | Link or custom disabled state | Enabled |
| `aria-busy="true"` | Action is processing | Not busy |

Comfortable single-line button heights are 24px, 32px, 40px, 48px, and 56px
for `xs` through `xl`, assuming a 16px root font size. The `sm`, `md`, and
`lg` heights match text inputs, selects, and input wrappers. Content can grow
beyond these minimums when labels wrap. Compact and icon buttons retain their
separate density scales; use compact actions in tables and toolbars.

### Accessibility

Use native `disabled` on buttons. `aria-disabled="true"` changes appearance
and pointer behavior but does not prevent keyboard activation; application
code must suppress a disabled link's action. Icon buttons need accessible names.
Extra-small buttons retain a `24px` minimum target; provide separation from
adjacent controls. Prefer `md` for general use.

### More examples

For navigation with button appearance, keep link semantics:

```html
<a class="sds-button" href="/projects/new">Create project</a>
```

### Action hierarchy

Use one primary action per local decision:

```html
<div class="sds-action-group">
  <button class="sds-button" type="submit">Save</button>
  <button class="sds-button" type="button" data-sds-variant="text">Cancel</button>
  <button class="sds-button" type="button" data-sds-variant="outlined">Preview</button>
</div>
```

Use a danger tone for a destructive action:

```html
<button class="sds-button" type="button" data-sds-tone="danger">Delete project</button>
```

### Icon-only buttons

Every icon-only control needs an accessible name:

```html
<button class="sds-button" type="button" data-sds-shape="icon" aria-label="Close">
  <span aria-hidden="true">&times;</span>
</button>
```

Icon buttons are neutral text controls by default. Set `data-sds-variant` and
`data-sds-tone` when an icon action needs stronger emphasis:

```html
<button class="sds-button"
  type="button"
  data-sds-shape="icon"
  data-sds-variant="filled"
  data-sds-tone="danger"
  aria-label="Delete"
>
  &times;
</button>
```

Use `data-sds-density="compact"` to reduce button height independently of its
variant. Toolbar and menu-like actions commonly combine it with `text`:

```html
<button class="sds-button" type="button" data-sds-density="compact" data-sds-variant="text">
  Edit
</button>
```

Use `data-sds-variant="tonal"` for a subtle tone-colored surface, or
`data-sds-variant="outlined"` for a transparent surface with a tone-colored
border. Compact density changes sizing, not the variant's border treatment.

Buttons can contain leading media without an additional SDS marker:

```html
<button class="sds-button" type="button" data-sds-density="compact">
  <img class="sds-avatar" data-sds-size="xs" src="/people/alex.jpg" alt="">
  Alex
</button>
```

### Related

[Action group](#action-group), [link](#link), [dialog actions](./overlays.md#dialog).

## Toggle buttons

Use a button with `aria-pressed` for an independent immediate on/off action:

```html
<button class="sds-button" type="button" data-sds-variant="outlined" aria-pressed="false">
  Show archived
</button>
<button class="sds-tag" type="button" aria-pressed="true">Favorites</button>
```

### Options

Use ordinary button or tag options. `aria-pressed="true"` adds a subtle
neutral surface, light border, and soft inset shadow without a heavy
underline or saturated action color. Native `disabled`
prevents activation. SDS styles state; application code changes it:

```js
button.addEventListener('click', () => {
  button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'))
})
```

### Accessibility

Keep the accessible label stable as state changes; assistive technology
announces pressed state. Independent toggles may have several active values.
Use native radios for exclusive selection and inputs for submitted values.
Do not add `role="toolbar"` unless you also implement toolbar keyboard behavior.

### Related

[Working toggles](../examples/selection.html),
[segmented controls](./forms.md#segmented-controls), [tag](./feedback.md#tag).

## Action group

`.sds-action-group` wraps related controls with consistent responsive spacing:

```html
<div class="sds-action-group" role="group" aria-label="Project actions">
  <button class="sds-button" type="button">Save</button>
  <button class="sds-button" type="button" data-sds-variant="text">Cancel</button>
</div>
```

### Options

No recipe-specific options. Direct button children share available width in a
narrow `.sds-page-header`; configure each button separately.

### Accessibility

Keep actions in meaningful DOM order and give every control an accessible name.

### Related

[Button hierarchy](#action-hierarchy), [responsive Cluster](./layout.md#cluster).

## Link

Use `.sds-link` to opt a link into SDS appearance and apply link options:

```html
<a class="sds-link" href="/projects">Projects</a>
<a class="sds-link" data-sds-variant="cta" href="/next">Next step</a>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-variant` | `secondary`, `tertiary`, `inline`, `cta` | Primary link |
| `data-sds-tone` | All semantic tones | `info` |
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl` | Inherited; `cta` uses `0.875rem` |
| `aria-disabled="true"` | Disabled appearance | Enabled |

An unsized link inherits its surrounding text size except for `cta`.
An explicit `data-sds-size="md"` establishes the standard `1rem` size.
The `secondary` and `tertiary` variants use muted and default text colors,
respectively, overriding `data-sds-tone`.

### Accessibility

Use links for navigation and buttons for actions, regardless of appearance.
Use descriptive link text. ARIA-disabled links still need activation prevention.

### More examples

Leave off SDS recipe classes when a third-party or application owns the link's
appearance:

```html
<a class="map-control" href="/map">Map</a>
```

### Related

[Disabled-link troubleshooting](../troubleshooting.md#a-link-marked-disabled-still-activates),
[skip link](./navigation.md#skip-link).
