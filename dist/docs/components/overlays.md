# Overlays

[Documentation](../README.md) / [Components](./README.md) / Overlays

Choose the smallest overlay that fits:

| Content | Recipe |
|---|---|
| Short, noninteractive description | [Tooltip](#tooltip) |
| Rich or interactive anchored content | [Popover](#popover) |
| Focused decision or task | [Dialog](#dialog) |
| Long secondary workflow at an edge | [Panel](#panel) |
| List of actions | [Dropdown](./navigation.md#dropdown-menu) |

Load behavior once using the [installation guide](../installation/npm.md#recommended-setup).

## Tooltip

Put the trigger first and short description second:

```html
<sds-tooltip>
  <button class="sds-button" type="button">What is a slug?</button>
  <span>A short name used in the project's URL.</span>
</sds-tooltip>
```

### Options

Tooltips support `size`, `placement`, and `offset`. Sizes are `sm`, `md`, `lg`,
`xl`, and `auto`; the default is `sm`. The default offset is 6 CSS pixels.
Placement defaults to `block-start` and follows writing direction.

### Accessibility

Tooltips open on pointer hover or keyboard focus; pointer leave, focus loss,
or Escape closes them. SDS Lite supplies `aria-describedby` and tooltip semantics.
Keep text short and noninteractive; do not put essential instructions only in a tooltip.

### Related

[Popover](#popover) for controls or long text, [floating-placement troubleshooting](../troubleshooting.md#a-dropdown-tooltip-or-popover-is-misplaced).

## Popover

```html
<sds-popover width="lg">
  <button class="sds-button">Project details</button>
  <section>
    <h2>Project Atlas</h2>
    <p>Updated five minutes ago.</p>
    <a href="/projects/atlas">Open project</a>
  </section>
</sds-popover>
```

### Options

Popovers support the dropdown `width`, `placement`, and `offset` values.
Their default offset is 9 CSS pixels. The reflected `open` property and
`show()` and `hide()` methods provide programmatic control.

### Events

Listen for `sds-toggle` and read `detail.open` to synchronize application state
with native Popover visibility.

### Accessibility

Keep trigger and surface as direct children. Hover or focus opens after 500ms;
moving between them keeps it open. Leaving both closes after a grace period.
Native click, touch, keyboard, Escape, and light-dismiss behavior remain available.
Give the trigger a clear name and use meaningful structure inside the surface.

### Positioning

Tooltips, popovers, and dropdowns:

- use logical placement that follows writing mode and text direction;
- flip vertically or horizontally to avoid viewport overflow;
- stay attached during document and nested-container scrolling;
- retain a stable resolved placement while it fits;
- expose the resolved side through generated `data-sds-side`;
- position their arrow toward the trigger without overlapping rounded corners.

### Related

[Dropdown menu](./navigation.md#dropdown-menu) for actions, [dialog](#dialog) for a modal task.

## Dialog

```html
<button class="sds-button" type="button" commandfor="notice-dialog" command="show-modal">
  Open dialog
</button>
<dialog id="notice-dialog" class="sds-dialog" aria-labelledby="notice-title">
  <h2 id="notice-title">Project saved</h2>
  <p>Your changes are available.</p>
  <button class="sds-button" type="button" command="close">Done</button>
</dialog>
```

### Options

`data-sds-width` accepts `sm`, `md`, `lg`, `xl`, or `2xl`; `md` is the default.
Use [commands and dismissal](#commands-and-dismissal) for close policy and return values.

### Events

Native `cancel` supports preventing a close request; `close` reports completed
closure. Read `dialog.returnValue` for an authored result.

### Accessibility

Give the dialog a unique ID and accessible name through `aria-labelledby` or
`aria-label`. Choose an appropriate initial focus and verify focus return.
Name icon-only close controls.

### More examples

For a decision with header, description, and footer actions:

```html
<button class="sds-button" type="button" commandfor="confirm-dialog" command="show-modal">
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
    <button class="sds-button"
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
    <button class="sds-button"
      type="button"
      data-sds-variant="text"
      command="close"
      data-sds-return-value="cancel"
    >
      Cancel
    </button>
    <button class="sds-button"
      type="button"
      command="close"
      data-sds-return-value="confirm"
    >
      Confirm
    </button>
  </footer>
</dialog>
```

The footer aligns actions right and places primary buttons after other variants.

### Related

[Panel](#panel), [action hierarchy](./actions.md#action-hierarchy),
[dialog troubleshooting](../troubleshooting.md#a-dialog-does-not-open).

## Panel

Use direct `header`, `main` or `section`, and `footer` children:

```html
<button class="sds-button" type="button" commandfor="help-panel" command="show-modal">
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
    <button class="sds-button"
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
    <button class="sds-button" type="button" command="close">Done</button>
  </footer>
</dialog>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-side` | `left`, `right`, `bottom` | `right` |
| `data-sds-width` | `sm`, `md`, `lg`, `xl` | `md` |

For side panels size controls width; for bottom panels it controls height.
Header and footer remain visible while `main` consumes the flexible space.
`setupSds()` automatically adds an iOS-style pill handle; no additional markup
is required.

### Events

Panels use native dialog events. Drag dismissal emits cancelable `cancel`;
prevent it to return the panel to its open position.

### Accessibility

Use the dialog's naming and focus rules. Always provide a close control rather
than requiring a gesture. Drag toward the attached edge to dismiss; short or
slow drags settle back into place.

### Related

[Dialog](#dialog), [commands and dismissal](#commands-and-dismissal).

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
