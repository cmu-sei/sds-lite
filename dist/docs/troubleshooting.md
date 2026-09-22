# Troubleshooting

[Documentation](./README.md) / Troubleshooting

## Nothing is styled

1. Confirm `sds.css` is present in the browser build.
2. Confirm the element is inside `[data-sds-root]`.
3. Check the network panel for a failed CDN request.
4. Check whether application CSS intentionally overrides the layered rules.

```html
<body data-sds-root>
  <button type="button">Styled button</button>
</body>
```

## A custom element does not respond

Confirm one behavior setup is loaded in the browser:

```js
import '@cmu-sei/sds-lite/auto'
```

or:

```js
import { setupSds } from '@cmu-sei/sds-lite'
setupSds()
```

Check the console. Invalid tabs and dropdown structures produce warnings
instead of guessing an ambiguous relationship.

## Hydration reports a mismatch

Use the side-effect-free entry, hydrate first, and set up SDS Lite second:

```js
import { setupSds } from '@cmu-sei/sds-lite'

hydrateApplication()
setupSds()
```

If the mismatch happens before `setupSds()` runs, it comes from application
markup rather than SDS Lite. To minimize changes after setup, render complete
IDs, roles, ARIA relationships, selected state, tab order, and `hidden` panels
on the server. See
[Server rendering](./guides/server-rendering.md).

## A dropdown, tooltip, or popover is misplaced

- Keep the trigger and surface as direct children of the custom element.
- Use a valid logical `placement`.
- Use a nonnegative numeric `offset`.
- Do not position the surface with application CSS.
- Confirm the surface is not constrained by a transformed third-party
  container.

Placement is preferred, not fixed. SDS Lite flips the surface when the
requested side would overflow.

## A link marked disabled still activates

`aria-disabled="true"` supplies semantics and appearance but cannot cancel
navigation. Remove `href` only if the control is no longer a link, or prevent
activation in application code. Prefer native `disabled` on buttons.

## A dialog does not open

Confirm:

- the target is a native `<dialog>` with `.sds-dialog` or `.sds-panel`;
- `commandfor` exactly matches its unique `id`;
- `command` is `show-modal`, `close`, or `request-close`;
- dialog behavior is registered;
- the browser supports `HTMLDialogElement`.

## Dark mode does not follow the system

Set the scheme explicitly:

```html
<body data-sds-root data-sds-color-scheme="system">
```

Without the attribute, the default is light.

## `notify()` throws during SSR

Importing it is safe; calling it creates browser DOM. Call it from a browser
event or client lifecycle. Do not replace the error with a silent fallback.

## TypeScript does not recognize a custom tag

Ensure the package declarations are included by the consuming TypeScript
project. Some framework JSX compilers also require a local intrinsic-element
declaration or compiler setting even when the DOM types are available.

## Still blocked

Reduce the problem to:

1. the loaded SDS imports;
2. one `[data-sds-root]`;
3. the smallest documented recipe;
4. no application overrides.

Then add application code and styles back one at a time.
