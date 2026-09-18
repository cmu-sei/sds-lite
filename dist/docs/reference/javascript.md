# JavaScript API and events

[Documentation](../README.md) / [Reference](./README.md) / JavaScript

## Root exports

```ts
import {
  defineSds,
  notify,
} from '@cmu-sei/sds-lite'
```

The root also exports these types:

- `SdsGap`
- `SdsOrientation`
- `SdsPlacement`
- `SdsRecipeAttribute`
- `SdsRecipeClass`
- `SdsSize`
- `SdsTabsActivation`
- `SdsNotifyOptions`
- `SdsTabsSize`
- `SdsTabsChangeDetail`
- `SdsTabsVariant`
- `SdsToggleDetail`
- `SdsToastCloseReason`
- `SdsToastTone`
- `SdsTone`
- `SdsWidth`

### `defineSds()`

Registers dialogs, panels, dropdowns, popovers, tabs, tooltips, and toasts.
Repeated calls are safe. Call it after hydration when using SSR.

### `notify(message, options?)`

Creates an accessible toast notification. See
[Feedback](../components/feedback.md#toast) for options and examples.

It chooses the supplied `container`, then an existing toaster, then the first
SDS root, then `body`. When no root exists, it creates a self-contained root
for the toaster. It registers `<sds-toast>` without `/auto`.

`duration` must be a positive finite number. Calling `notify()` outside a
browser throws because it creates DOM.

## Individual entries

| Entry | Exports |
|---|---|
| `/dialog` | `registerSdsDialog()` |
| `/dropdown` | `SdsDropdownElement`, `registerSdsDropdown()` |
| `/popover` | `SdsPopoverElement`, `registerSdsPopover()` |
| `/tabs` | `SdsTabsElement`, `registerSdsTabs()` |
| `/tooltip` | `SdsTooltipElement`, `registerSdsTooltip()` |
| `/toast` | `SdsToastElement`, `SdsToastCloseReason`, `SdsToastTone`, `SdsNotifyOptions`, `notify()`, `registerSdsToast()` |

Import custom-element classes from their individual entries.

## Toast element

```ts
import type { SdsToastElement } from '@cmu-sei/sds-lite/toast'

const toast = document.querySelector<SdsToastElement>('#saved-toast')
toast?.show()
toast?.close('programmatic')
```

| Member | Meaning |
|---|---|
| `open: boolean` | Reflects the `open` attribute |
| `tone: SdsTone` | Reflects the `tone` attribute |
| `duration: number` | Positive auto-dismiss duration |
| `persistent: boolean` | Reflects the `persistent` attribute |
| `show()` | Opens, starts timing, and dispatches `sds-open` |
| `close(reason?)` | Closes and dispatches `sds-close` |

Changing `open` directly updates visibility and timing without dispatching
open or close events.

## Tabs element

`<sds-tabs>` reflects `value`, `activation`, `orientation`, `size`, `tone`,
and `variant` through typed properties. Setting `value` selects the enabled
tab whose native `value` attribute matches. An unknown value throws
`RangeError`; setting a property does not dispatch `sds-change`.

## Dropdown and popover elements

`<sds-dropdown>` and `<sds-popover>` expose:

| Member | Meaning |
|---|---|
| `open: boolean` | Reflects actual Popover visibility |
| `placement: SdsPlacement` | Preferred logical placement |
| `offset: number` | Nonnegative offset in CSS pixels |
| `width: SdsWidth` | Surface width |
| `show()` | Opens the native Popover surface |
| `hide()` | Closes the native Popover surface |

Dropdowns additionally expose `hideCaret: boolean`. Both dispatch
`sds-toggle` with `{ open: boolean }` after their state changes.

`<sds-tooltip>` exposes reflected `placement` and `offset` properties but no
programmatic open state because its visibility follows hover and focus.

## Events

SDS custom events bubble and cross shadow roots.

| Event | Target | Detail | When |
|---|---|---|---|
| `sds-change` | `<sds-tabs>` | `{ index: number, value: string }` | A new tab is selected |
| `sds-toggle` | `<sds-dropdown>`, `<sds-popover>` | `{ open: boolean }` | Native Popover visibility changes |
| `sds-open` | `<sds-toast>` | None | `show()` opens a closed toast |
| `sds-close` | `<sds-toast>` | `{ reason: 'dismiss' \| 'programmatic' \| 'timeout' }` | A toast closes |

```ts
document.querySelector('sds-tabs')?.addEventListener('sds-change', (event) => {
  const { index, value } = event.detail
  console.log(index, value)
})
```

Native dialogs retain `cancel` and `close`; read `dialog.returnValue` after
close. Popover surfaces retain native `beforetoggle` and `toggle`.
