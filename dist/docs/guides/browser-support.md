# Browser support

[Documentation](../README.md) / Guides / Browser support

SDS Lite targets the current stable releases of Chrome, Edge, Firefox, and
Safari and does not ship polyfills. Every pull request runs the browser suite
against the Chromium, Firefox, and WebKit revisions pinned by the repository's
Playwright version. A release is supported only when that matrix passes.

The Playwright engines are reproducible compatibility proxies, not a
substitute for release smoke tests in the branded browsers. Release testing
must cover the current stable Chrome, Edge, Firefox, and Safari versions.
Mobile layouts are responsive, but mobile browser and assistive-technology
support is not claimed until it is tested and recorded.

## Required platform features

| Feature | Used by |
|---|---|
| Custom Elements | Comboboxes, dropdowns, popovers, tabs, tooltips, and toasts |
| Popover API | Combobox, dropdown, popover, tooltip, and mobile application sidebar |
| `HTMLDialogElement` | Dialogs and panels |
| CSS cascade layers | Predictable application overrides |
| CSS container queries | Flex layouts that stack within narrow containers |
| `:where()` and `:has()` | Low-specificity recipes and relationship styling |
| `light-dark()` and `color-mix()` | Themes, schemes, and semantic colors |

Check these requirements against your application's browser policy. Browsers
outside the rolling support window may work when they provide the required
features, but they are not part of the release contract.

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
