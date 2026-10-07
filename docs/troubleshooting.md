# Troubleshooting

[Documentation](./README.md) / Troubleshooting

Find the symptom, apply the smallest fix, then follow the linked recipe if needed.

| Symptom | Check |
|---|---|
| Button or input is unstyled | [CSS and recipe classes](#button-is-unstyled) |
| Tailwind or Bootstrap changes SDS controls | [Cascade layers](#tailwind-or-bootstrap-overrides-my-controls) |
| Tabs or a menu do not respond | [Behavior setup and markup](#tabs-or-a-menu-do-not-respond) |
| SSR hydration mismatch | [Registration timing](#hydration-reports-a-mismatch) |
| Floating content is misplaced | [Structure and placement](#a-dropdown-tooltip-or-popover-is-misplaced) |
| Combobox submits the wrong value | [Record identity](#a-combobox-submits-text-instead-of-a-record-id) |
| Selected record ID is stale | [Selection invalidation](#selected-record-id-is-stale) |
| Disabled link still activates | [Native versus ARIA state](#a-link-marked-disabled-still-activates) |
| Dialog does not open | [Target and command](#a-dialog-does-not-open) |
| Dark mode does not follow the system | [Root scheme](#dark-mode-does-not-follow-the-system) |
| Notification throws during SSR | [Browser-only calls](#notify-throws-during-ssr) |
| Custom tag has a type or compiler error | [Framework configuration](#typescript-does-not-recognize-a-custom-tag) |

## Button is unstyled

**Cause:** CSS is missing, or the native control has no recipe class.

**Fix:** Load `sds.css`, add `.sds-button` or `.sds-input`, and use a root for
theme tokens. Check failed requests in the network panel. A root or option
attribute alone does not style a control.

```html
<body data-sds-root>
  <button class="sds-button" type="button">Styled button</button>
</body>
```

More: [installation](./installation/npm.md#verify-the-setup).

## Tailwind or Bootstrap overrides my controls

**Cause:** Host resets are unlayered or were loaded before the shared layer order.

**Fix:** Declare the layer order before loading either system. Place resets
below SDS and application utilities above it; remove separate unlayered host
imports. See the [copy-ready coexistence setup](./guides/theming.md#combine-design-systems).

## Tabs or a menu do not respond

**Cause:** Behavior is not registered, or the child structure is invalid.

**Fix:** Load one behavior entry in the browser:

```js
import '@cmu-sei/sds-lite/auto'
```

or:

```js
import { setupSds } from '@cmu-sei/sds-lite'
setupSds()
```

Check console warnings and compare the direct children with the
[tabs](./components/navigation.md#tabs) or [dropdown](./components/navigation.md#dropdown-menu)
example. For SSR, use the registration timing below.

## Hydration reports a mismatch

**Cause:** Registration changed markup before the framework hydrated it.

**Fix:** Use the side-effect-free entry and register after hydration:

```js
import { setupSds } from '@cmu-sei/sds-lite'

// Run after the framework has hydrated this subtree.
setupSds()
```

If no SDS behavior ran before the mismatch, inspect application markup.
For complete initial accessibility state, use the
[server-rendering recipes](./guides/server-rendering.md).

## A dropdown, tooltip, or popover is misplaced

**Cause:** Invalid child structure or application positioning overrides.

**Fix:** Keep trigger and surface as direct children, use a documented
`placement` and nonnegative `offset`, and remove application positioning.
Check transformed host containers. Placement may flip to avoid overflow.

For a [combobox](./components/forms.md#combobox), keep the input, `ul`, and
optional empty `output` as direct children. See [overlays](./components/overlays.md).

## A combobox submits text instead of a record ID

**Cause:** A named native input submits its visible text, not a record ID.

**Fix:** Put identity in `data-sds-value`, read `event.detail.value` in
`sds-select`, and store it in a separate named input. Validate IDs server-side.
If a description appears in the query, add a nonempty `data-label` to the option.
See [rich suggestions and record IDs](./components/forms.md#rich-suggestions-and-record-ids).

## Selected record ID is stale

**Cause:** Query edits or a form reset did not invalidate the stored selection.

**Fix:** Clear the ID on input edits and reset, then set it on `sds-select`.
Unrelated programmatic query changes must clear it explicitly: assigning
`.value` does not emit `input`. Clearing the query inside `sds-select` after
storing the ID is intentional and does not invalidate that selection.
See the [record-picker example](./components/forms.md#rich-suggestions-and-record-ids).

## A link marked disabled still activates

**Cause:** `aria-disabled="true"` supplies semantics, not activation prevention.

**Fix:** Prevent activation in application code, or remove `href` if the
control is no longer a link. Prefer native `disabled` on buttons.
See [link accessibility](./components/actions.md#link).

## A dialog does not open

**Cause:** The command target or browser behavior is missing.

**Fix:** Target a native `<dialog class="sds-dialog">` or `.sds-panel` with a
unique `id`. Match it in `commandfor`, use `show-modal`, `close`, or
`request-close`, and load behavior in a browser supporting `HTMLDialogElement`.
See [dialog commands](./components/overlays.md#commands-and-dismissal).

## Dark mode does not follow the system

**Cause:** An SDS root defaults to light rather than the operating-system scheme.

**Fix:** Set the scheme explicitly:

```html
<body data-sds-root data-sds-color-scheme="system">
```

More: [themes and color schemes](./guides/theming.md#theme-and-color-scheme).

## `notify()` throws during SSR

**Cause:** Calling `notify()` creates browser DOM; importing it does not.

**Fix:** Call it from a browser event or client lifecycle, not server rendering.
See [notifications](./components/feedback.md#toast).

## TypeScript does not recognize a custom tag

**Cause:** Framework types or custom-element compiler settings are missing.

**Fix:** Import `/react` or `/vue` for typed markup. Vue also needs
`isCustomElement`; Angular needs `CUSTOM_ELEMENTS_SCHEMA`. Check the
[framework setup](./guides/frameworks.md) for your application.

## Still blocked

Reduce the problem to:

1. the loaded SDS imports;
2. one `[data-sds-root]`;
3. the smallest documented recipe;
4. no application overrides.

Then add application code and styles back one at a time.
