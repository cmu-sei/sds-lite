# Navigation

[Documentation](../README.md) / [Components](./README.md) / Navigation

## Tabs

For client-rendered markup, provide a named tab list and one panel per tab:

```html
<sds-tabs>
  <div aria-label="Project settings">
    <button type="button">Profile</button>
    <button type="button" aria-selected="true">Security</button>
  </div>
  <section>Profile settings</section>
  <section>Security settings</section>
</sds-tabs>
```

SDS Lite supplies missing classes, roles, IDs, relationships, tab order, and
panel visibility. `aria-selected="true"` chooses the initial enabled tab; the
first enabled tab is used when it is omitted.

| Option | Values | Default |
|---|---|---|
| `data-variant` | `folder`, `block`, `underline` | `folder` |
| `data-size` | `md`, `lg` | `md` |
| `data-tone` | All semantic tones | Brand treatment |
| `data-activation` | `automatic`, `manual` | `automatic` |
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-value` on a tab | Any string | Tab `id` |
| `aria-selected="true"` | Initial selection | First enabled tab |
| `disabled` | Disabled button tab | Enabled |
| `aria-disabled="true"` | Disabled tab | Enabled |

Automatic activation selects as focus moves. Manual activation moves focus
without selecting until click, Enter, or Space. Horizontal tabs use Left and
Right; vertical tabs use Up and Down. Home and End move to the first and last
enabled tab.

```js
document.querySelector('sds-tabs')?.addEventListener('sds-change', (event) => {
  console.log(event.detail.index, event.detail.value)
})
```

The supplied visual recipe is a horizontal scrolling row. Applications using
vertical orientation provide their own panel placement while retaining roles
and relationships.

Route-backed tabs may use `<a class="sds-tab" role="tab" href="...">`. Arrow
keys move focus; activating a link navigates. Render the requested route with
its corresponding link selected and panel visible.

See [Server rendering](../guides/server-rendering.md) for complete authored
tab markup.

## Dropdown menu

```html
<sds-dropdown>
  <button type="button">Actions</button>
  <menu>
    <li><button type="button">Rename</button></li>
    <li><a href="/duplicate">Duplicate</a></li>
    <li><button type="button" data-tone="danger">Delete</button></li>
  </menu>
</sds-dropdown>
```

| Option | Values | Default |
|---|---|---|
| `data-width` | `auto`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-placement` | Logical side, optionally followed by `-start` or `-end` | `block-end-start` |
| `data-offset` | Nonnegative CSS pixels | `5` |

Logical sides are `block-start`, `block-end`, `inline-start`, and
`inline-end`. Placement is preferred rather than fixed; the menu flips when
the requested side would overflow.

Dropdowns support:

- Enter, Space, Arrow Down, or Arrow Up to open and focus an item;
- Arrow keys, Home, and End to navigate enabled items;
- Escape to close and return focus;
- close after activation;
- synchronized `aria-expanded`;
- repositioning during document and nested-container scrolling.

Use native `disabled` on menu buttons and `aria-disabled="true"` on other
menu items. The trigger and menu must be direct children. Invalid or ambiguous
structures are not enhanced and produce a console warning.

Use `<sds-popover>` rather than a dropdown when the surface contains rich
content instead of menu actions.

## Disclosure

Use native `<details>` and `<summary>`:

```html
<details class="sds-disclosure">
  <summary>What does this setting do?</summary>
  <p>This setting controls project notifications.</p>
</details>
```

Use native `open` for initial state. No JavaScript import is required. The
summary must clearly describe the content it reveals.
