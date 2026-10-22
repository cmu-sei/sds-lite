# SDS Lite

SDS Lite makes semantic HTML production-ready with polished styles and
accessible behavior where the browser needs help. It has no runtime
dependencies and works with plain HTML, React, Vue, Angular, Svelte, server
templates, and static sites.

## Start in 60 seconds

### 1. Choose one installation method

#### CDN

No account, token, or build step is required. Add these two tags to the page:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.7.1/dist/sds.css"
>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.7.1/dist/auto.js"
></script>
```

#### NPM

For bundled applications, configure GitHub Packages once using the
[NPM installation guide](./docs/installation/npm.md), then install SDS Lite:

```sh
npm install @cmu-sei/sds-lite
```

Load the stylesheet and automatic browser setup:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

When keeping Tailwind, Bootstrap, or another design system, use the
[coexistence setup](./docs/guides/theming.md#combine-design-systems) instead
of separate CSS imports.

### 2. Write semantic HTML

Add `data-sds-root` to the element that contains your interface. For a standalone
page, put it and `sds-document` on `<body>`:

```html
<body data-sds-root class="sds-document">
  <main class="sds-page">
    <h1 class="sds-text-h3">Project Atlas</h1>
    <p>Your project is ready.</p>
    <button class="sds-button" type="button">Open project</button>
  </main>
</body>
```

`data-sds-root` supplies the theme and inherited body typography.
`sds-document` adds page background, zero margin, and minimum viewport height.
For an embedded region, use `data-sds-root` on its container without
`sds-document`. Recipe classes still opt controls into SDS appearance.
See [which root to use](./docs/guides/theming.md#choose-a-styling-boundary) for
host typography overrides and font-loading requirements.

## Add components

Place recipe markup inside the root above. Classes opt components into SDS
appearance; recipes can also style their owned descendants, such as field
labels and prose content. Unrelated host elements are not globally restyled:

```html
<article class="sds-card">
  <h2 class="sds-text-h3">Science project</h2>
  <p>Your project is ready to share.</p>
  <button class="sds-button" type="button">Open project</button>
</article>
```

Heading levels express document structure, not visual size. Choose a style from
`.sds-text-h1` through `.sds-text-h6` independently of the heading level, or use
`.sds-text-title` for compact dialog, panel, and popover titles.

## Interactive behavior

Use a custom element when native HTML needs accessible keyboard behavior,
relationships, state, or positioning:

```html
<sds-tabs>
  <div aria-label="Project sections">
    <button class="sds-button" type="button" aria-selected="true">Overview</button>
    <button class="sds-button" type="button">Files</button>
  </div>
  <section>Overview content</section>
  <section>Files content</section>
</sds-tabs>
```

The `/auto` entry adds the required classes, IDs, ARIA relationships, and
keyboard behavior. It also supplies dialog, panel, and mobile-sidebar
compatibility behavior. Omit the script for CSS-only pages that need none of
these behaviors.

For searchable choices, `<sds-combobox>` enhances a native text input and
suggestion list. See the [form guide](./docs/components/forms.md#combobox)
for automatic filtering, application-supplied results, and SSR markup.

## Call JavaScript

With automatic setup, import functions from the same entry:

```js
import { notify } from '@cmu-sei/sds-lite/auto'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

For manual setup, use `setupSds()` from the root entry instead of `/auto`.
See [package imports](./docs/reference/imports.md) for entry selection and
[server rendering](./docs/guides/server-rendering.md) for hydration timing.

## Options and themes

CSS recipes use namespaced options such as `data-sds-tone="danger"`.
Namespaced custom elements use ordinary reflected attributes such as
`<sds-tabs variant="underline">`.

Forge is the default theme. Select a theme and color scheme on any SDS root:

```html
<main
  data-sds-root
  data-sds-theme="plaid"
  data-sds-color-scheme="system"
>
  ...
</main>
```

Themes are `forge` and `plaid`. Color schemes are `light`, `dark`, and
`system`. Specialized SEI application, simple application, documentation, and
brochure shells use one additional stylesheet:

```js
import '@cmu-sei/sds-lite/brand.css'
```

## Browser support

SDS Lite targets modern browsers and ships no polyfills. Interactive recipes
use Custom Elements, the Popover API, and `HTMLDialogElement`. Styles use
modern CSS including cascade layers, `:where()`, `:has()`, `light-dark()`,
`color-mix()`, container queries, and `@scope` for application-shell styling.

See [Browser support](./docs/guides/browser-support.md) for integration policy
and fallback guidance.

## Learn more

| Goal | Guide |
|---|---|
| Build a useful page | [Quick start](./docs/getting-started.md) |
| Install the package | [NPM](./docs/installation/npm.md) or [CDN](./docs/installation/cdn.md) |
| Find a feature or copy a recipe | [Feature index](./docs/components/README.md#feature-index) |
| Integrate a framework | [Framework integration](./docs/guides/frameworks.md) |
| Keep another design system | [Coexistence setup](./docs/guides/theming.md#combine-design-systems) |
| Configure server rendering | [Server rendering](./docs/guides/server-rendering.md) |
| Check accessibility responsibilities | [Accessibility guide](./docs/guides/accessibility.md) |
| Migrate an existing interface | [Migration guides](./docs/migration/index.md) |
| Look up imports, attributes, events, or tokens | [Interface reference](./docs/reference/README.md) |

Start from the [documentation home](./docs/README.md) when you are not sure
which guide you need.

The published [`interface-manifest.json`](./interface-manifest.json) is the
machine-readable source for recipes, attributes, classes, custom elements,
editor metadata, and generated framework types. The repository's
[`index.html`](./index.html) is a runnable playground containing every
component, option family, theme, and color scheme.
