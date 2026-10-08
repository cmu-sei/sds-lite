# JavaScript API and events

[Documentation](../README.md) / [Reference](./README.md) / JavaScript

## Root exports

```ts
import {
  notify,
  setupSds,
} from '@cmu-sei/sds-lite'
```

The root also exports these types (generated from the root entry):

- `SdsNotifyOptions`
- `SdsToastElement`
- `SdsToastCloseReason`
- `SdsToastTone`
- `SdsComboboxElement`
- `SdsComboboxSelectDetail`
- `SdsDropdownElement`
- `SdsPopoverElement`
- `SdsTabsChangeDetail`
- `SdsTabsElement`
- `SdsTooltipElement`
- `SdsGap`
- `SdsOrientation`
- `SdsPlacement`
- `SdsSize`
- `SdsTabsActivation`
- `SdsTabsSize`
- `SdsTabsVariant`
- `SdsToggleDetail`
- `SdsTone`
- `SdsTooltipSize`
- `SdsWidth`

### `setupSds()`

Sets up comboboxes, dialogs, panels, dropdowns, popovers, mobile sidebars,
tabs, tooltips, and toasts.
Repeated calls are safe. Call it after hydration when using SSR.

### `notify(message, options?)`

Creates an accessible toast notification. See
[Feedback](../components/feedback.md#toast) for options and examples.

It chooses the supplied `container`, then an existing toaster, then the first
SDS root, then `body`. When no root exists, it creates a self-contained root
for the toaster. It sets up `<sds-toast>` without `/auto`.

`duration` must be a positive finite number. Calling `notify()` outside a
browser throws because it creates DOM.

## Toast element

```ts
import '@cmu-sei/sds-lite'

const toast = document.querySelector('sds-toast')
toast?.show()
toast?.close('programmatic')
```

| Member | Type | Meaning |
|---|---|---|
| `open` | `boolean` | Reflects the open attribute. |
| `tone` | `SdsTone` | Reflects the tone attribute. |
| `duration` | `number` | Reflects the duration attribute. |
| `persistent` | `boolean` | Reflects the persistent attribute. |
| `show()` | `void` | Opens the toast and starts its timer. |
| `close(reason = 'programmatic')` | `void` | Closes the toast. |

Changing `open` directly updates visibility and timing without dispatching
open or close events.

## Tabs element

`<sds-tabs>` reflects `value`, `activation`, `orientation`, `size`, `tone`,
and `variant` through typed properties. Setting `value` selects the enabled
tab whose native `value` attribute matches. An unknown value throws
`RangeError`; setting a property does not dispatch `sds-change`.

## Dropdown and popover elements

`<sds-dropdown>` and `<sds-popover>` expose:

| Member | Type | Meaning |
|---|---|---|
| `open` | `boolean` | Reflects the open attribute. |
| `placement` | `SdsPlacement` | Reflects the placement attribute. |
| `offset` | `number` | Reflects the offset attribute. |
| `width` | `SdsWidth` | Reflects the width attribute. |
| `show()` | `void` | Opens the popover. |
| `hide()` | `void` | Closes the popover. |

Dropdowns additionally expose `hideCaret: boolean`. Both dispatch
`sds-toggle` with `{ open: boolean }` after their state changes.

`<sds-tooltip>` exposes reflected `placement`, `size`, `offset` properties but no
programmatic open state because its visibility follows hover and focus.

## Events

SDS custom events bubble and cross shadow roots.

| Event | Target | Detail | When |
|---|---|---|---|
| `sds-select` | `<sds-combobox>` | `{ option: HTMLLIElement; value: string }` | Dispatched when an option is selected; detail.value is data-sds-value or the displayed value, and detail.option is the selected li. |
| `sds-toggle` | `<sds-dropdown>`, `<sds-popover>` | `{ open: boolean }` | Dispatched after the open state changes. |
| `sds-change` | `<sds-tabs>` | `{ index: number; value: string }` | Dispatched when user interaction selects a new tab. |
| `sds-open` | `<sds-toast>` | None | Dispatched when show() opens the toast. |
| `sds-close` | `<sds-toast>` | `{ reason: SdsToastCloseReason }` | Dispatched when the toast closes. |

```ts
document.querySelector('sds-tabs')?.addEventListener('sds-change', (event) => {
  const { index, value } = event.detail
  console.log(index, value)
})
```

Native dialogs retain `cancel` and `close`; read `dialog.returnValue` after
close. Popover surfaces retain native `beforetoggle` and `toggle`.

The combobox's `detail.option` is the selected DOM `<li>`. Read
application-owned attributes such as `option.dataset.projectId` and look up
the original record yourself; SDS Lite never creates or submits a record ID.
An optional `data-label` on the option controls the text written to the input
in either mode. The combobox dispatches native `input` and `change` on the
input before `sds-select`. With `keep-open`, the other matches from the last
query remain available until the user edits the input. Applications can set
the native input's `.value = ''` in `sds-select` after saving a record ID or
adding a tag; this does not dispatch another `input` event or clear
application-owned state.
