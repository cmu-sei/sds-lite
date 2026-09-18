# Browser support

[Documentation](../README.md) / Guides / Browser support

SDS Lite targets modern browsers and does not ship polyfills.

## Required platform features

| Feature | Used by |
|---|---|
| Custom Elements | Dropdowns, popovers, tabs, tooltips, and toasts |
| Popover API | Dropdown, popover, tooltip, and mobile application sidebar |
| `HTMLDialogElement` | Dialogs and panels |
| CSS cascade layers | Predictable application overrides |
| `:where()` and `:has()` | Low-specificity recipes and relationship styling |
| `light-dark()` and `color-mix()` | Themes, schemes, and semantic colors |

Check support against your application's browser policy rather than relying
on a fixed browser-version table that can become stale.

## Graceful behavior

The CSS-first recipes remain semantic HTML when JavaScript is unavailable.
Custom elements retain their light-DOM content, but interactive enhancement
requires the platform features above.

SDS Lite implements the documented `commandfor` and `command` dialog actions,
so Invoker Commands are not required. `closedby` remains a native-dialog
feature; SDS Lite additionally implements pointer backdrop dismissal for
`closedby="any"`.

## Polyfills

Supply polyfills at the application level if your browser policy requires
them. Load and validate polyfills before registering SDS behavior. SDS Lite
does not select, bundle, or configure polyfills because that choice belongs to
the consuming application's compatibility and security policy.

## Reduced motion and color scheme

SDS Lite respects the operating system's reduced-motion setting. Use
`data-sds-color-scheme="system"` to follow the user's light or dark
preference:

```html
<body data-sds-root data-sds-color-scheme="system">
```

Test explicit `light`, explicit `dark`, and `system` in the browsers your
application supports.
