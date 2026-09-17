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
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/sds.css
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/auto.js
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/core.css
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/layouts.css
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/prose.css
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/brand.css
```

Direct ES modules live under `package/`:

```text
package/sds.js
package/auto.js
package/dialog.js
package/dropdown.js
package/popover.js
package/tabs.js
package/tooltip.js
package/toast.js
```

Pin an exact package version in production.

## Side effects

- The root JavaScript entry is side-effect-free.
- `/auto` registers all behavior when evaluated in a browser.
- Registration functions define their documented custom elements.
- CSS imports add global rules scoped to `[data-sds-root]`.
- `notify()` creates DOM only when called.

Every JavaScript entry can be imported in an SSR environment.
