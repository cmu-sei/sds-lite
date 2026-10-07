# Package imports

[Documentation](../README.md) / [Reference](./README.md) / Imports

## NPM entries

| Import | Provides |
|---|---|
| `@cmu-sei/sds-lite` | Side-effect-free `setupSds()`, `notify()`, and public types |
| `@cmu-sei/sds-lite/auto` | Automatically sets up every behavior and exports `notify()` |
| `@cmu-sei/sds-lite/react` | Generated React JSX custom-element types |
| `@cmu-sei/sds-lite/vue` | Generated Vue custom-element types |
| `@cmu-sei/sds-lite/html-data.json` | Editor HTML custom data |
| `@cmu-sei/sds-lite/interface-manifest.json` | Machine-readable recipe interface |
| `@cmu-sei/sds-lite/sds.css` | Core, layout primitives, prose, tokens, and spacing utilities |
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
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/sds.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/auto.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/brand.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/sds.js
```

Pin an exact package version in production.

Both `auto.js` and `sds.js` are self-contained. A CDN or self-hosted page
using the recommended setup only needs `sds.css` and `auto.js`, which also
exports `notify()`. Use `sds.js` instead of `auto.js` when you want to call
`setupSds()` yourself after hydration. Do not mix the two CDN scripts on
the same page; each bundle includes its own custom-element constructors.
Neither JavaScript entry needs the internal `package/` directory.

## Side effects

- The root JavaScript entry is side-effect-free.
- `/auto` sets up all behavior when evaluated in a browser and exports `notify()`.
- `/react` and `/vue` have empty runtime modules; their value is generated
  TypeScript augmentation.
- CSS imports define tokens on `:root` and SDS roots. Native HTML elements
  are not automatically styled. Explicit `.sds-*` recipe classes opt into
  presentation and also apply outside a root. Containers such as `.sds-prose`
  style their owned content. Color scheme defaults apply only to explicit SDS
  roots; the host document's scheme is unchanged.
- `notify()` creates DOM only when called.

Every JavaScript entry can be imported in an SSR environment.

## Delivery budgets

The package check enforces these gzip limits on built browser assets:

| Asset | Maximum |
|---|---|
| `sds.css` | 22,000 bytes |
| `brand.css` | 3,000 bytes |
| `auto.js` or `sds.js` | 13,000 bytes each |

These are regression budgets, not installed-package sizes. CSS-only pages
omit JavaScript, and ordinary pages omit `brand.css`. SDS Lite has no runtime,
peer, or optional dependencies.
