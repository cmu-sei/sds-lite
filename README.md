# SDS Lite

SDS Lite makes ordinary HTML look polished and adds accessible behavior where
the browser needs help. It has no runtime dependencies and works with plain
HTML, React, Vue, Angular, Svelte, server templates, and static sites.

## Start in 60 seconds

Install it:

```sh
npm install @cmu-sei/sds-lite
```

Import the styles and behavior once in your application entry:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite'
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
    <button type="button">Files</button>
  </div>

  <section>Overview content</section>
  <section>Files content</section>
</sds-tabs>
```

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

Put the trigger first and its short description second:

```html
<sds-tooltip>
  <button type="button">What is a slug?</button>
  <span>A short name used in the project's URL.</span>
</sds-tooltip>
```

### A popover

Use a popover for richer or interactive content. It opens after a short hover
delay and remains open while the pointer is over its content:

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

The short examples above can be emitted by a server and are completed when
their custom elements upgrade in the browser. Hydrating frameworks should
render the complete IDs, roles, ARIA relationships, classes, and state so the
DOM does not change before hydration. This also provides accessibility and
correct interactive state before JavaScript loads. SDS Lite preserves valid
authored values and only fills in missing details.

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
  src="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/package/sds.js"
></script>

<main data-sds-root>
  <h1>Hello!</h1>
  <button type="button">Continue</button>
</main>
```

## Learn more

The [complete interface reference](./REFERENCE.md) contains every recipe,
option, event, CSS custom property, advanced import, and SSR contract.
