# Overlays

[Documentation](../README.md) / [Components](./README.md) / Overlays

Choose the smallest overlay that fits:

| Content | Recipe |
|---|---|
| Short, noninteractive description | Tooltip |
| Rich or interactive anchored content | Popover |
| Focused decision or task | Dialog |
| Long secondary workflow at an edge | Panel |
| List of actions | [Dropdown](./navigation.md#dropdown-menu) |

## Tooltip

Put the trigger first and short description second:

```html
<sds-tooltip>
  <button type="button">What is a slug?</button>
  <span>A short name used in the project's URL.</span>
</sds-tooltip>
```

Tooltips open immediately on pointer hover or keyboard focus. Pointer leave,
focus loss, or Escape closes them. SDS Lite adds the ID, role, class, manual
Popover mode, and `aria-describedby`.

Tooltips support `data-placement` and `data-offset`. The default offset is 6
CSS pixels. Keep content noninteractive; use a popover for controls or long
text.

## Popover

```html
<sds-popover data-width="lg" data-placement="block-end-start">
  <button type="button">Project details</button>
  <section>
    <h2>Project Atlas</h2>
    <p>Updated five minutes ago.</p>
    <a href="/projects/atlas">Open project</a>
  </section>
</sds-popover>
```

Hover or focus opens after 500ms. Moving between trigger and surface keeps it
open. Leaving both closes after a short grace period. Native click, touch,
keyboard, Escape, and light-dismiss behavior remain available.

Popovers support the dropdown `data-width`, `data-placement`, and
`data-offset` values. Their default offset is 9 CSS pixels.

Tooltips, popovers, and dropdowns:

- use logical placement that follows writing mode and text direction;
- flip vertically or horizontally to avoid viewport overflow;
- stay attached during document and nested-container scrolling;
- retain a stable resolved placement while it fits;
- expose the resolved side through generated `data-side`;
- position their arrow toward the trigger without overlapping rounded corners.

## Dialog

```html
<button type="button" commandfor="confirm-dialog" command="show-modal">
  Open dialog
</button>

<dialog
  id="confirm-dialog"
  class="sds-dialog"
  data-width="md"
  closedby="any"
  aria-labelledby="confirm-title"
  aria-describedby="confirm-description"
>
  <header class="sds-dialog-header">
    <div>
      <h2 id="confirm-title">Confirm change</h2>
      <p id="confirm-description">This action can be reversed later.</p>
    </div>
    <button
      type="button"
      data-shape="icon"
      commandfor="confirm-dialog"
      command="request-close"
      aria-label="Close"
    >
      &times;
    </button>
  </header>

  <p>Continue with this change?</p>

  <footer class="sds-dialog-footer">
    <button
      type="button"
      data-variant="ghost"
      commandfor="confirm-dialog"
      command="close"
      data-return-value="cancel"
    >
      Cancel
    </button>
    <button
      type="button"
      commandfor="confirm-dialog"
      command="close"
      data-return-value="confirm"
    >
      Confirm
    </button>
  </footer>
</dialog>
```

`data-width` accepts `sm`, `md`, `lg`, `xl`, or `2xl`; `md` is the default.
Every dialog needs a unique ID and accessible name through `aria-labelledby`
or `aria-label`. The footer aligns actions right and places primary buttons
after other variants.

## Panel

Use direct native `header`, `main`, and `footer` children:

```html
<button type="button" commandfor="help-panel" command="show-modal">
  Open help
</button>

<dialog
  id="help-panel"
  class="sds-panel"
  data-side="right"
  data-width="md"
  closedby="any"
  aria-labelledby="help-title"
>
  <header>
    <h2 id="help-title">Help</h2>
    <button
      type="button"
      data-shape="icon"
      commandfor="help-panel"
      command="request-close"
      aria-label="Close"
    >
      &times;
    </button>
  </header>
  <main>Help content goes here.</main>
  <footer>
    <button type="button" commandfor="help-panel" command="close">Done</button>
  </footer>
</dialog>
```

| Option | Values | Default |
|---|---|---|
| `data-side` | `left`, `right`, `bottom` | `right` |
| `data-width` | `sm`, `md`, `lg`, `xl` | `md` |

For side panels size controls width; for bottom panels it controls height.
Header and footer remain visible while `main` consumes the flexible space.

## Commands and dismissal

| Interface | Meaning |
|---|---|
| `commandfor="id"` | Target dialog or panel |
| `command="show-modal"` | Open modally |
| `command="close"` | Close immediately |
| `command="request-close"` | Request a cancelable close |
| `data-return-value="value"` | Set `dialog.returnValue` while closing |
| `closedby="any"` | Escape, close controls, and backdrop dismissal |
| `closedby="closerequest"` | Close requests, no backdrop dismissal |
| `closedby="none"` | No implicit dismissal |

Native `cancel`, `close`, `beforetoggle`, and `toggle` events remain available.
Prevent `cancel` when unsaved work must keep the surface open:

```js
document.querySelector('#editor')?.addEventListener('cancel', (event) => {
  if (hasUnsavedChanges) event.preventDefault()
})
```
