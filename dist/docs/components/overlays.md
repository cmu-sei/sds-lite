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

Tooltips support `placement` and `offset`. The default offset is 6
CSS pixels. Keep content noninteractive; use a popover for controls or long
text.

## Popover

```html
<sds-popover width="lg">
  <button>Project details</button>
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

Popovers support the dropdown `width`, `placement`, and `offset` values.
Their default offset is 9 CSS pixels. The reflected `open` property and
`show()` and `hide()` methods provide programmatic control.

Tooltips, popovers, and dropdowns:

- use logical placement that follows writing mode and text direction;
- flip vertically or horizontally to avoid viewport overflow;
- stay attached during document and nested-container scrolling;
- retain a stable resolved placement while it fits;
- expose the resolved side through generated `data-sds-side`;
- position their arrow toward the trigger without overlapping rounded corners.

## Dialog

```html
<button type="button" commandfor="confirm-dialog" command="show-modal">
  Open dialog
</button>

<dialog
  id="confirm-dialog"
  class="sds-dialog"
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
      data-sds-shape="icon"
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
      data-sds-variant="ghost"
      command="close"
      data-sds-return-value="cancel"
    >
      Cancel
    </button>
    <button
      type="button"
      command="close"
      data-sds-return-value="confirm"
    >
      Confirm
    </button>
  </footer>
</dialog>
```

`data-sds-width` accepts `sm`, `md`, `lg`, `xl`, or `2xl`; `md` is the default.
Every dialog needs a unique ID and accessible name through `aria-labelledby`
or `aria-label`. The footer aligns actions right and places primary buttons
after other variants.

## Panel

Use direct `header`, `main` or `section`, and `footer` children:

```html
<button type="button" commandfor="help-panel" command="show-modal">
  Open help
</button>

<dialog
  id="help-panel"
  class="sds-panel"
  closedby="any"
  aria-labelledby="help-title"
>
  <header>
    <h2 id="help-title">Help</h2>
    <button
      type="button"
      data-sds-shape="icon"
      command="request-close"
      aria-label="Close"
    >
      &times;
    </button>
  </header>
  <section aria-label="Panel content">Help content goes here.</section>
  <footer>
    <button type="button" command="close">Done</button>
  </footer>
</dialog>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-side` | `left`, `right`, `bottom` | `right` |
| `data-sds-width` | `sm`, `md`, `lg`, `xl` | `md` |

For side panels size controls width; for bottom panels it controls height.
Header and footer remain visible while `main` consumes the flexible space.
`setupSds()` automatically adds an iOS-style pill handle; no additional markup
is required. Drag toward the attached edge to dismiss. Short or slow drags
settle back into place, while deliberate swipes use release velocity to
complete naturally. Dragging emits the native cancelable `cancel` event before
dismissal, so preventing that event returns the panel to its open position.

## Commands and dismissal

| Interface | Meaning |
|---|---|
| `commandfor="id"` | Target an external dialog or panel |
| `command="show-modal"` | Open modally |
| `command="close"` | Close immediately |
| `command="request-close"` | Request a cancelable close |
| `data-sds-return-value="value"` | Set `dialog.returnValue` while closing |
| `closedby="any"` | Escape, close controls, and backdrop dismissal |
| `closedby="closerequest"` | Close requests, no backdrop dismissal |
| `closedby="none"` | No implicit dismissal |

Controls inside a dialog or panel infer their nearest dialog when
`commandfor` is omitted. External controls still require `commandfor`.

Native `cancel`, `close`, `beforetoggle`, and `toggle` events remain available.
Prevent `cancel` when unsaved work must keep the surface open:

```js
document.querySelector('#editor')?.addEventListener('cancel', (event) => {
  if (hasUnsavedChanges) event.preventDefault()
})
```
