# Package imports

[Documentation](../README.md) / [Reference](./README.md) / Imports

## NPM entries

| Import | Provides |
|---|---|
| `@cmu-sei/sds-lite` | Side-effect-free `setupSds()`, `notify()`, and public types |
| `@cmu-sei/sds-lite/auto` | Automatically sets up every behavior |
| `@cmu-sei/sds-lite/react` | Generated React JSX custom-element types |
| `@cmu-sei/sds-lite/vue` | Generated Vue custom-element types |
| `@cmu-sei/sds-lite/html-data.json` | Editor HTML custom data |
| `@cmu-sei/sds-lite/interface-manifest.json` | Machine-readable recipe interface |
| `@cmu-sei/sds-lite/sds.css` | Core, layouts, prose, tokens, and utilities |
| `@cmu-sei/sds-lite/brand.css` | SEI application and brochure shells |

Recommended:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

Hydration-safe:

```js
import '@cmu-sei/sds-lite/sds.css'
import { setupSds } from '@cmu-sei/sds-lite'

// Run from the framework's post-hydration client lifecycle.
setupSds()
```

## CDN entries

Stable top-level browser files:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/auto.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/brand.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.js
```

Pin an exact package version in production.

`auto.js` is self-contained. A CDN or self-hosted page using the recommended
setup only needs `sds.css` and `auto.js`; it does not need the internal
`package/` directory.

## Side effects

- The root JavaScript entry is side-effect-free.
- `/auto` sets up all behavior when evaluated in a browser.
- `/react` and `/vue` have empty runtime modules; their value is generated
  TypeScript augmentation.
- CSS imports add global rules scoped to `[data-sds-root]`.
- `notify()` creates DOM only when called.

Every JavaScript entry can be imported in an SSR environment.
