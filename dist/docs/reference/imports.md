# Package imports

[Documentation](../README.md) / [Reference](./README.md) / Imports

## NPM entries

| Import | Provides |
|---|---|
| `@cmu-sei/sds-lite` | Side-effect-free `defineSds()`, `notify()`, and public types |
| `@cmu-sei/sds-lite/auto` | Automatically registers every behavior |
| `@cmu-sei/sds-lite/dialog` | Dialog registration |
| `@cmu-sei/sds-lite/dropdown` | Dropdown class and registration |
| `@cmu-sei/sds-lite/popover` | Popover class and registration |
| `@cmu-sei/sds-lite/tabs` | Tabs class and registration |
| `@cmu-sei/sds-lite/tooltip` | Tooltip class and registration |
| `@cmu-sei/sds-lite/toast` | Toast class, helpers, registration, and types |
| `@cmu-sei/sds-lite/react` | Generated React JSX custom-element types |
| `@cmu-sei/sds-lite/vue` | Generated Vue custom-element types |
| `@cmu-sei/sds-lite/html-data.json` | Editor HTML custom data |
| `@cmu-sei/sds-lite/interface-manifest.json` | Machine-readable recipe interface |
| `@cmu-sei/sds-lite/sds.css` | Core, layouts, prose, tokens, and utilities |
| `@cmu-sei/sds-lite/core.css` | Foundations and common recipes |
| `@cmu-sei/sds-lite/layouts.css` | Grid, flex, page, action, and sidebar layouts |
| `@cmu-sei/sds-lite/prose.css` | Long-form content |
| `@cmu-sei/sds-lite/brand.css` | SEI application and brochure shells |

Recommended:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

Hydration-safe:

```js
import '@cmu-sei/sds-lite/sds.css'
import { defineSds } from '@cmu-sei/sds-lite'

hydrateApplication()
defineSds()
```

## CDN entries

Stable top-level browser files:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/auto.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/core.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/layouts.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/prose.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/brand.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/dialog.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/dropdown.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/popover.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/tabs.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/tooltip.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/toast.js
```

Top-level CDN modules mirror the NPM entry names. For example:

```html
<script type="module">
  import { registerSdsTabs } from
    'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/tabs.js'

  registerSdsTabs()
</script>
```

Pin an exact package version in production.

## Side effects

- The root JavaScript entry is side-effect-free.
- `/auto` registers all behavior when evaluated in a browser.
- `/react` and `/vue` have empty runtime modules; their value is generated
  TypeScript augmentation.
- Registration functions define their documented custom elements.
- CSS imports add global rules scoped to `[data-sds-root]`.
- `notify()` creates DOM only when called.

Every JavaScript entry can be imported in an SSR environment.
