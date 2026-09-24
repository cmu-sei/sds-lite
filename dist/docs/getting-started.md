# Get started in five minutes

[Documentation](./README.md) / Getting started

This guide builds a small page with a card, form, tabs, dropdown, and
notification. Choose NPM when your application has a build step. Choose CDN
for plain HTML or a quick prototype.

## 1. Load SDS Lite

### NPM

First complete the one-time
[GitHub Packages setup](./installation/npm.md#configure-github-packages), then:

```sh
npm install @cmu-sei/sds-lite
```

Import the stylesheet and automatic behavior once in the browser entry for
your application:

```js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

### CDN

Add these version-pinned tags to `<head>`:

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

## 2. Add an SDS root

`data-sds-root` scopes SDS Lite styles and defines its design tokens. It can
go on `<body>`, the application shell, or a smaller embedded region.

```html
<body data-sds-root>
  <!-- Your application -->
</body>
```

Forge and the light color scheme are the defaults. A production page that
follows the operating system can be explicit:

```html
<body
  data-sds-root
  data-sds-color-scheme="system"
>
```

## 3. Use native HTML

Common elements need no SDS classes:

```html
<main class="sds-page">
  <header class="sds-section-header">
    <div>
      <p class="sds-eyebrow">Workspace</p>
      <h1>Project Atlas</h1>
      <p>Review the project details before continuing.</p>
    </div>
    <button type="button">Create review</button>
  </header>

  <article class="sds-card">
    <h2>Project details</h2>
    <form class="sds-form">
      <div class="sds-field">
        <label for="project-name">Project name</label>
        <input
          id="project-name"
          name="projectName"
          value="Atlas"
          aria-describedby="project-name-help"
          required
        >
        <small id="project-name-help">Use a short, recognizable name.</small>
      </div>
      <div class="sds-action-group">
        <button type="submit">Save</button>
        <button type="button" data-sds-variant="ghost">Cancel</button>
      </div>
    </form>
  </article>
</main>
```

SDS Lite automatically styles the native heading, text, button, and input.
Classes describe larger recipes such as a page, card, form field, or action
group. Attributes such as `data-sds-variant` change a documented option.

## 4. Add accessible behavior

Custom elements enhance ordinary light-DOM markup. For a client-rendered page,
SDS Lite can supply classes, IDs, relationships, and initial state:

```html
<sds-tabs>
  <div aria-label="Project sections">
    <button aria-selected="true">Overview</button>
    <button>Activity</button>
  </div>

  <section>Overview content</section>
  <section>Activity content</section>
</sds-tabs>
```

```html
<sds-dropdown>
  <button data-sds-variant="ghost">Actions</button>
  <menu>
    <li><button type="button">Rename</button></li>
    <li><button type="button" data-sds-tone="danger">Delete</button></li>
  </menu>
</sds-dropdown>
```

For server-rendered applications, author the complete pre-upgrade markup shown
in the [server-rendering guide](./guides/server-rendering.md).

## 5. Send a notification

With NPM, call `notify()` from your browser code:

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

With CDN, import `notify()` from the `auto.js` module already loaded in
step 1:

```html
<script type="module">
  import { notify } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/auto.js'

  notify('Your project was saved.', {
    title: 'Saved',
    tone: 'success',
  })
</script>
```

`notify()` sets up the toast behavior it needs, creates or reuses a toaster,
and supplies accessible markup. It does not require the `/auto` import.

## What to read next

- [NPM installation](./installation/npm.md) for build-tool and import details.
- [CDN installation](./installation/cdn.md) for complete HTML files.
- [Component guides](./components/README.md) for copy-ready recipes.
- [Framework integration](./guides/frameworks.md) for React, Vue, Angular,
  Svelte, and server templates.
