# Package imports

[Documentation](../README.md) / [Reference](./README.md) / Imports

## NPM entries

| Import | Provides |
|---|---|
| `@cmu-sei/sds-lite` | Side-effect-free `setupSds()`, `notify()`, and public types |
| `@cmu-sei/sds-lite/auto` | Automatically sets up core behavior and exports `notify()` |
| `@cmu-sei/sds-lite/documentation` | Opt-in documentation controls and TOC tracking; exports `setupSdsDocumentation()` |
| `@cmu-sei/sds-lite/documentation.css` | Documentation refinements, code blocks, pagination, and search-result presentation |
| `@cmu-sei/sds-lite/react` | Generated React JSX custom-element types |
| `@cmu-sei/sds-lite/vue` | Generated Vue custom-element types |
| `@cmu-sei/sds-lite/html-data.json` | Editor HTML custom data |
| `@cmu-sei/sds-lite/interface-manifest.json` | Machine-readable recipe interface |
| `@cmu-sei/sds-lite/package.json` | Package metadata |
| `@cmu-sei/sds-lite/sds.css` | Core, layout primitives, prose, tokens, and spacing utilities |
| `@cmu-sei/sds-lite/brand.css` | SEI shell layouts and bundled wordmark asset |

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
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.8.0/dist/sds.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.8.0/dist/auto.js
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.8.0/dist/brand.css
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.8.0/dist/sds.js
```

Pin an exact package version in production.

Both `auto.js` and `sds.js` are self-contained. A CDN or self-hosted page
using the recommended setup only needs `sds.css` and `auto.js`, which also
exports `notify()`. Use `sds.js` instead of `auto.js` when you want to call
`setupSds()` yourself after hydration. Do not mix the two CDN scripts on
the same page; each bundle includes its own custom-element constructors.
Neither JavaScript entry needs the internal `package/` directory.

Optional `dist/documentation.css` and `dist/documentation.js` are independently
self-hostable alongside these files. Load their CSS after `brand.css` and their
module alongside `auto.js` for [documentation presentation](../components/layout.md#documentation-presentation).
The documentation module does not include or register custom elements.

## Side effects

- The root JavaScript entry is side-effect-free.
- `/auto` sets up core behavior in the browser and exports `notify()`.
  Documentation controls require the separate `/documentation` entry.
- `/documentation` automatically sets up its opt-in controls in the browser.
  `setupSdsDocumentation()` is idempotent and can also be called after mounting.
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
| `sds.css` | 23,000 bytes |
| `brand.css` | 3,200 bytes |
| `auto.js` or `sds.js` | 13,000 bytes each |

These are regression budgets, not installed-package sizes. CSS-only pages
omit JavaScript, and ordinary pages omit `brand.css`. SDS Lite has no runtime,
peer, or optional dependencies.
The opt-in documentation files are not included in the default browser bundles.

The default CDN setup has a separately enforced combined budget of 35,000
bytes gzipped (`sds.css` plus `auto.js`). "Lightweight" refers to these project budgets,
not a universal industry threshold. Run `npm run build` followed by
`npm run check:package` in the repository to report current raw and gzip
sizes, remaining budget, and the compressed NPM archive size.

NPM applications bundle the root or `/auto` entry and its imported modules;
the small entry file alone is not the JavaScript payload. Tree shaking and
minification depend on the consuming bundler. The NPM archive also contains
documentation, types, and editor metadata that browsers do not download.
It is limited separately to 100 files and 850,000 bytes unpacked.
Gzip measurements exclude HTTP headers and reflect local compression, not
a guarantee of the CDN's negotiated transfer encoding. Optional `brand.css`
also references `package/assets/sei-wordmark.svg`, a separate image request.
Theme fonts are supplied by the host application and are not included in
these budgets.
