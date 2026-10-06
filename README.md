# SDS Lite

SDS Lite makes semantic HTML production-ready with polished styles and
accessible behavior where the browser needs help. It has no runtime
dependencies and works with plain HTML, React, Vue, Angular, Svelte, server
templates, and static sites.

## Start in 60 seconds

### 1. Choose one installation method

#### NPM

Configure npm for GitHub Packages as described in the
[NPM installation guide](./docs/installation/npm.md), then install SDS Lite:

```sh
npm install @cmu-sei/sds-lite
```

Load the stylesheet and automatic browser setup:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

#### CDN

Add these two tags to the page:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/sds.css"
>
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/auto.js"
></script>
```

### 2. Write semantic HTML

Add `data-sds-root` to the element that contains your interface:

```html
<main data-sds-root>
  <h1>Project Atlas</h1>
  <p>Your project is ready.</p>
  <button type="button">Open project</button>
</main>
```

That is enough SDS Lite markup for a styled page.

## The four rules

1. Load `sds.css`.
2. Load `/auto` if the page uses interactive SDS custom elements.
3. Put `data-sds-root` around the interface.
4. Write semantic HTML.

SDS Lite styles headings, text, links, buttons, inputs, selects, checkboxes,
and radio buttons without requiring classes. Add a class only for a larger
visual recipe:

```html
<article class="sds-card">
  <h2>Science project</h2>
  <p>Your project is ready to share.</p>
  <button type="button">Open project</button>
</article>
```

## Interactive behavior

Use a custom element when native HTML needs accessible keyboard behavior,
relationships, state, or positioning:

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

The `/auto` entry sets up every SDS custom element on the page. SDS Lite adds
the missing classes, IDs, relationships, state, positioning, and keyboard
behavior.

For searchable choices, `<sds-combobox>` enhances a native text input and
suggestion list. See the [form guide](./docs/components/forms.md#combobox)
for automatic filtering, application-supplied results, and SSR markup.

## JavaScript when you need control

Most browser applications should use `/auto`. Applications that control when
custom elements are registered can instead use the root JavaScript interface:

```js
import '@cmu-sei/sds-lite/sds.css'
import { setupSds } from '@cmu-sei/sds-lite'

setupSds()
```

Call `setupSds()` after the DOM is available. Do not load `/auto` when calling
`setupSds()` yourself.

The root interface also provides notifications:

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

`notify()` sets up its own toast behavior and does not require `/auto` or a
separate `setupSds()` call. If your application already imports `/auto`,
you can import `notify` from that entry instead.

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
`system`. Specialized SEI application and brochure shells use one additional
stylesheet:

```js
import '@cmu-sei/sds-lite/brand.css'
```

## Server rendering

Every JavaScript entry is safe to import without browser globals. Most
hydrating applications can render the same simple HTML shown above, hydrate,
and then set up behavior from the framework's post-hydration client lifecycle:

```js
import { setupSds } from '@cmu-sei/sds-lite'

// Run after the framework has hydrated this subtree.
setupSds()
```

Static and client-only applications can use `/auto`. Applications that want
their initial server markup to include the enhanced accessibility state can
instead author the complete markup described in the
[server-rendering guide](./docs/guides/server-rendering.md).

## Browser support

SDS Lite targets modern browsers and ships no polyfills. Interactive recipes
use Custom Elements, the Popover API, and `HTMLDialogElement`. Styles use
modern CSS including cascade layers, `:where()`, `:has()`, `light-dark()`,
`color-mix()`, and container queries.

See [Browser support](./docs/guides/browser-support.md) for integration policy
and fallback guidance.

## Learn more

| Goal | Guide |
|---|---|
| Build a useful page | [5-minute quick start](./docs/getting-started.md) |
| Install the package | [NPM](./docs/installation/npm.md) or [CDN](./docs/installation/cdn.md) |
| Copy a visual or interactive recipe | [Component guides](./docs/components/README.md) |
| Integrate a framework | [Framework integration](./docs/guides/frameworks.md) |
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
