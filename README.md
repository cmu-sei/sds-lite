# SDS Lite

SDS Lite makes semantic HTML production-ready with polished styles and
accessible behavior where the browser needs help. It has no runtime
dependencies and works with plain HTML, React, Vue, Angular, Svelte, server
templates, and static sites.

## Start in 60 seconds

### NPM

Configure npm for GitHub Packages as described in the
[installation guide](./docs/installation/npm.md), then install:

```sh
npm install @cmu-sei/sds-lite
```

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

### CDN

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css"
>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/auto.js"
></script>
```

### HTML

Add an SDS root and use native elements:

```html
<main data-sds-root>
  <h1>Project Atlas</h1>
  <p>Your project is ready.</p>
  <button type="button">Open project</button>
</main>
```

That is enough for headings, text, links, buttons, inputs, selects,
checkboxes, and radio buttons. Add an SDS recipe only for larger patterns:

```html
<article class="sds-card">
  <h2>Science project</h2>
  <p>Your project is ready to share.</p>
  <button type="button">Open project</button>
</article>
```

Native elements and CSS recipes use namespaced options such as
`data-sds-tone="danger"`. Namespaced custom elements use ordinary reflected
attributes such as `<sds-tabs variant="underline">`.

## Accessible behavior without boilerplate

```html
<sds-tabs>
  <div aria-label="Project sections">
    <button type="button" aria-selected="true">Overview</button>
    <button type="button">Files</button>
  </div>
  <section>Overview content</section>
  <section>Files content</section>
</sds-tabs>
```

```html
<sds-dropdown>
  <button type="button">Actions</button>
  <menu>
    <li><button type="button">Rename</button></li>
    <li><button type="button">Duplicate</button></li>
  </menu>
</sds-dropdown>
```

SDS Lite supplies the missing client-side classes, IDs, relationships, state,
positioning, and keyboard behavior. Server-rendered applications can author
the complete pre-upgrade markup for zero hydration mutations.

## Notifications

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

`notify()` registers its own toast behavior; it does not require `/auto`.

## Themes

Forge is the default. Select a theme and color scheme on any SDS root:

```html
<main
  data-sds-root
  data-sds-theme="plaid"
  data-sds-color-scheme="system"
>
  ...
</main>
```

Themes are `forge` and `plaid`. Schemes are `light`, `dark`, and `system`.
Specialized SEI application and brochure shells use an additional import:

```js
import '@cmu-sei/sds-lite/brand.css'
```

## Documentation

The documentation is organized for both learning and lookup:

- **[Documentation home](./docs/README.md)** — choose a path by task.
- **[5-minute quick start](./docs/getting-started.md)** — build a useful page.
- **[NPM](./docs/installation/npm.md)** or
  **[CDN](./docs/installation/cdn.md)** — complete installation instructions.
- **[Component guides](./docs/components/README.md)** — focused, copy-ready
  recipes.
- **[Framework integration](./docs/guides/frameworks.md)** — React, Vue,
  Angular, Svelte, and server templates.
- **[Migration guides](./docs/migration/index.md)** — crosswalks and a
  conservative codemod for existing design systems.
- **[Server rendering](./docs/guides/server-rendering.md)** — hydration-safe
  lifecycle and authored markup.
- **[Accessibility](./docs/guides/accessibility.md)** — application contract
  and release checklist.
- **[API reference](./docs/reference/README.md)** — imports, exports, events,
  classes, attributes, and tokens.

The published [`interface-manifest.json`](./interface-manifest.json) is the
machine-readable source for recipes, attributes, classes, custom elements,
editor metadata, and generated framework types.

The repository's [`index.html`](./index.html) is a runnable interactive
playground containing every component, option family, theme, and color scheme.

## Browser support

SDS Lite targets modern browsers and ships no polyfills. Interactive recipes
use Custom Elements, the Popover API, and `HTMLDialogElement`; styles use
modern CSS including cascade layers, `:where()`, `:has()`, `light-dark()`, and
`color-mix()`.

See [Browser support](./docs/guides/browser-support.md) for integration policy
and fallback guidance.

## Server rendering

Every JavaScript entry is safe to import without browser globals. Hydrating
applications should import the side-effect-free root, hydrate, and then
register behavior:

```js
import { defineSds } from '@cmu-sei/sds-lite'

hydrateApplication()
defineSds()
```

Static and client-only applications can use `/auto`.
