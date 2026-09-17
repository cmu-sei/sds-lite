# SDS Lite

SDS Lite makes ordinary HTML look polished and adds accessible behavior where
the browser needs help. It has no runtime dependencies and works with plain
HTML, React, Vue, Angular, Svelte, server templates, and static sites.

## Start in 60 seconds

Install it:

```sh
npm install @cmu-sei/sds-lite
```

Import the complete styles and automatic browser behavior once:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

Add `data-sds-root` around the part of the page SDS Lite should style:

```html
<main data-sds-root>
  <h1>Hello!</h1>
  <p>You are using SDS Lite.</p>
  <button type="button">Continue</button>
</main>
```

That is enough for headings, text, links, buttons, inputs, selects,
checkboxes, and radio buttons.

## Copy-paste examples

### A card

```html
<article class="sds-card">
  <h2>Science project</h2>
  <p>Your project is ready to share.</p>
  <button type="button">Open project</button>
</article>
```

### Tabs

SDS Lite supplies the classes, IDs, relationships, and initial state:

```html
<sds-tabs>
  <div aria-label="Project sections">
    <button type="button">Overview</button>
    <button type="button" aria-selected="true">Files</button>
  </div>

  <section>Overview content</section>
  <section>Files content</section>
</sds-tabs>
```

Set `aria-selected="true"` on any enabled tab to make it the initial tab. If
you omit it, SDS Lite selects the first enabled tab.

### A dropdown

SDS Lite supplies the popover wiring and menu keyboard behavior:

```html
<sds-dropdown>
  <button type="button">Actions</button>
  <menu>
    <li><button type="button">Rename</button></li>
    <li><button type="button">Duplicate</button></li>
  </menu>
</sds-dropdown>
```

### A tooltip

Put the trigger first and its short description second. Tooltips appear
immediately on hover or focus:

```html
<sds-tooltip>
  <button type="button">What is a slug?</button>
  <span>A short name used in the project's URL.</span>
</sds-tooltip>
```

### A popover

Use a popover for richer or interactive content. Hovering or focusing its
button opens the content after a half-second delay. The button also supports
native click and touch activation:

```html
<sds-popover>
  <button type="button">Project details</button>
  <section>
    <h2>Project Atlas</h2>
    <p>Updated five minutes ago.</p>
  </section>
</sds-popover>
```

### A tag

Tags use native HTML and do not require JavaScript:

```html
<span class="sds-tag">Research</span>
<a class="sds-tag" href="/topics/security">Security</a>
```

### A notification

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

## Themes

Forge is the default. Change the theme or color scheme on any SDS root:

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
`system`.

## Server rendering

Every JavaScript entry is safe to import when `window`, `document`,
`HTMLElement`, and `customElements` do not exist. Calling `notify()` during
server rendering throws a clear error because it creates browser DOM.

The root module has no registration side effects. Hydrating applications
should render complete IDs, roles, relationships, classes, and state, hydrate,
then register behavior:

```js
import { defineSds } from '@cmu-sei/sds-lite'

hydrateApplication()
defineSds()
```

This keeps custom-element upgrades from changing the DOM before hydration.
Static and client-only applications may use the `/auto` entry instead.

Import CSS through the framework's normal stylesheet entry so the server can
include it in the initial page:

```js
import '@cmu-sei/sds-lite/sds.css'
```

See the [complete interface reference](./REFERENCE.md#ssr-contract) for
fully authored SSR examples.

## Plain HTML

Use a version-pinned CDN URL:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/package/sds.css"
>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/package/auto.js"
></script>

<main data-sds-root>
  <h1>Hello!</h1>
  <button type="button">Continue</button>
</main>
```

## Learn more

The [complete interface reference](./REFERENCE.md) contains every recipe,
option, event, CSS custom property, advanced import, and SSR contract.
