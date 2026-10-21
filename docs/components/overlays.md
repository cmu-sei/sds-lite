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
Use the [logical placement values](./navigation.md#dropdown-menu); `offset`
is a nonnegative number of CSS pixels.

### Accessibility

Tooltips open on pointer hover or keyboard focus. They close when neither
trigger nor content is hovered or focused, or on Escape.
SDS Lite supplies `aria-describedby` and tooltip semantics.
Keep text short and noninteractive; do not put essential instructions only in a tooltip.

### Related

[Popover](#popover) for controls or long text, [floating-placement troubleshooting](../troubleshooting.md#a-dropdown-tooltip-or-popover-is-misplaced).

## Popover

```html
<sds-popover width="lg">
  <button class="sds-button">Project details</button>
  <section>
    <h2 class="sds-text-title">Project Atlas</h2>
    <p class="sds-text-body" data-sds-size="sm">Updated five minutes ago.</p>
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
  <header class="sds-dialog-header">
    <h2 class="sds-text-title" id="notice-title">Project saved</h2>
  </header>
  <p>Your changes are available.</p>
  <footer class="sds-dialog-footer">
    <button class="sds-button" type="button" command="close">Done</button>
  </footer>
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

### Typography and spacing

Use `.sds-text-title` for dialog and panel titles rather than `.sds-text-h2`.
It stays at `1.25rem` / `1.75rem` (20px / 28px at the default root size)
at every viewport, with weight 500 in Forge and 400 in Plaid. The semantic
heading level remains independent of its appearance. Header headings without
an explicit typography class use the same defaults.

Dialog padding and panel-region padding share `--sds-surface-inset` (24px).
Header descriptions have an 8px top gap, 14px / 20px muted text, and no bottom
margin. Dialog layout gaps, rather than browser paragraph margins, separate
direct paragraphs from adjacent regions. Panel body regions remove only
their first and last children's outside margins, preserving internal flow.

Explicit SEI heading utilities still override these defaults when an
application intentionally needs a larger title; do not combine them with
`.sds-text-title`.

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
      <h2 class="sds-text-title" id="confirm-title">Confirm change</h2>
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

Dialog and panel footers align actions right without reordering them. Author
actions in the desired visual and keyboard order in the DOM, usually secondary
actions before the primary action, as shown above.

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
    <h2 class="sds-text-title" id="help-title">Help</h2>
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
Header and footer are sticky while `main` or `section` consumes the flexible space.
`setupSds()` automatically adds an iOS-style pill handle; no additional markup
is required.

### Events

Panels use native dialog events. Drag dismissal emits cancelable `cancel`;
prevent it to return the panel to its open position.

### Accessibility

Use the dialog's naming and focus rules. Always provide a close control rather
than requiring a gesture. Drag the generated handle toward the attached edge to dismiss. Traveling
48 CSS pixels commits the panel to closing on release, regardless of panel size
or direction. Pausing or pulling back slightly does not undo that commitment.
To cancel, return within 12 CSS pixels of the starting position. Crossing 48px
again recommits the panel to closing.

Before crossing 48px, a quick flick can close sooner through velocity projection.
Release velocity follows a short window of recent movement rather than just
the last pointer event. This tolerates small release wobbles and rapid events
with identical timestamps without including a long stationary hold. Pausing
for more than 80ms or reversing inward by more than 6px disables velocity
projection, but does not undo a committed dismissal. A canceled commitment
cannot be reactivated by leftover velocity; it requires crossing 48px again.
Deliberate drags that never reach 48px settle back into place.
Canceled pointer gestures always settle back open.
You can grab a settling panel again without waiting for its animation to finish;
the new drag continues from its current position.

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
| `closedby="any"` | Escape and backdrop dismissal |
| `closedby="closerequest"` | Close requests, no backdrop dismissal |
| `closedby="none"` | No native implicit dismissal |

Controls inside a dialog or panel infer their nearest dialog when
`commandfor` is omitted. External controls still require `commandfor`.
Close controls and panel-handle dragging remain available regardless of `closedby`.
Native `closedby` behavior depends on browser support; SDS also handles backdrop
clicks for `closedby="any"` by calling `close()` directly.

Native dialog events remain available where the browser supports them.
Prevent `cancel` to reject close requests or panel drag dismissal:

```js
document.querySelector('#editor')?.addEventListener('cancel', (event) => {
  if (hasUnsavedChanges) event.preventDefault()
})
```

An explicit `command="close"` or SDS's backdrop-click handler bypasses `cancel`.
For an unsaved-work guard, avoid `closedby="any"` and use `request-close` controls.
