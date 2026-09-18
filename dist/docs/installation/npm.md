# Install from NPM

[Documentation](../README.md) / [Installation](../getting-started.md) / NPM

Use NPM installation for applications that bundle JavaScript or process CSS.

## Configure GitHub Packages

SDS Lite is published to GitHub Packages rather than npmjs.org. GitHub
requires authentication to install public packages.

For a zero-account, zero-token setup, use the
[CDN installation](./cdn.md) instead. Authentication is a GitHub Packages
requirement, not an SDS Lite runtime requirement.

For local development, create a classic personal access token with
`read:packages`, then authenticate once:

```sh
npm login --scope=@cmu-sei --auth-type=legacy --registry=https://npm.pkg.github.com
```

Enter your GitHub username and use the token as the password. npm stores the
credential in your user configuration; never commit a token to the project.

For CI, configure the scope and inject a read-only token through the
environment:

```ini
@cmu-sei:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Use the workflow's `GITHUB_TOKEN` when the workflow repository has package
access. Otherwise use a secret containing a token with only `read:packages`.

## Install

```sh
npm install @cmu-sei/sds-lite
```

The package has no runtime or peer dependencies.

## Recommended setup

Import the complete stylesheet and automatic behavior once from your browser
entry:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

Then scope SDS Lite to your application:

```html
<div data-sds-root>
  <button type="button">Continue</button>
</div>
```

`sds.css` includes foundations, common recipes, layout recipes, prose, tokens,
and utilities. `/auto` registers dialogs, panels, dropdowns, popovers, tabs,
tooltips, and toasts.

## Where imports belong

| Application type | CSS import | JavaScript import |
|---|---|---|
| Client-rendered SPA | Top-level client entry | Top-level client entry |
| SSR framework | Framework stylesheet entry | Client entry after hydration |
| Static site generator | Global stylesheet or layout | Shared browser script |
| Component library | Consumer-facing stylesheet entry | Prefer selective registration |

Avoid importing global SDS CSS inside a component that can mount more than
once. Import it once at the application boundary.

## CSS-only usage

Omit JavaScript if you only use native controls and CSS recipes:

```js
import '@cmu-sei/sds-lite/sds.css'
```

Buttons, links, forms, cards, grids, lists, tables, timelines, disclosure
elements, spinners, skeletons, and prose do not require SDS JavaScript.
Dropdowns, tooltips, popovers, tabs, toasts, and dialog command fallbacks do.

## TypeScript

All JavaScript entries ship declarations. Types are inferred when importing
exports or querying a registered custom element:

```ts
import type { SdsToastElement } from '@cmu-sei/sds-lite/toast'

const toast = document.querySelector<SdsToastElement>('#saved-toast')
toast?.show()
```

SDS Lite augments `HTMLElementTagNameMap` and `HTMLElementEventMap`, so common
DOM queries and custom-event listeners receive the correct types.

Import the generated framework augmentation when using typed custom-element
markup:

```ts
import '@cmu-sei/sds-lite/react'
// or
import '@cmu-sei/sds-lite/vue'
```

These entries have no runtime behavior. See
[Framework integration](../guides/frameworks.md) for the required framework
configuration.

## Editor metadata

`html-data.json`, `custom-elements.json`, and `interface-manifest.json` are
published with the package. VS Code projects can enable recipe-attribute and
custom-element completion:

```json
{
  "html.customData": [
    "./node_modules/@cmu-sei/sds-lite/html-data.json"
  ]
}
```

The interface manifest also records every public recipe class and the valid
option values for documentation, linting, and migration tools.

## Specialized application shells

SEI application and brochure shells are intentionally not in the lightweight
default CSS. Add:

```js
import '@cmu-sei/sds-lite/brand.css'
```

Use `brand.css` with the markup in [Layout](../components/layout.md). It
includes the official wordmark asset and specialized shell recipes.

## Verify the setup

Render this smoke test:

```html
<main data-sds-root>
  <h1>SDS Lite is ready</h1>
  <button type="button">Test button</button>
</main>
```

If the button is unstyled, confirm that the CSS import is included in the
browser build and that the button is inside `[data-sds-root]`. If a custom
element does not respond, confirm that `/auto` is loaded in the browser.

[Use only selected modules →](./selective-imports.md)
