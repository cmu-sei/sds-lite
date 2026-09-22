# Install from a CDN

[Documentation](../README.md) / [Installation](../getting-started.md) / CDN

CDN installation works in a plain HTML file with no package manager, build
tool, or local server configuration. jsDelivr serves the committed `dist/`
directory directly from protected release tags in the official
[`cmu-sei/sds-lite`](https://github.com/cmu-sei/sds-lite) repository. It does
not read packages from GitHub Packages.

The URL format is:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@vVERSION/dist/FILE
```

For example, release `v0.1.0` provides `dist/sds.css` at:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css
```

## Complete starter page

Save this as `index.html` and open it through any web server:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My SDS Lite application</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css"
    >
    <script
      type="module"
      src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/auto.js"
    ></script>
  </head>
  <body
    data-sds-root
    data-sds-color-scheme="system"
  >
    <main class="sds-page">
      <header class="sds-section-header">
        <div>
          <p class="sds-eyebrow">Welcome</p>
          <h1>My application</h1>
          <p>SDS Lite is ready.</p>
        </div>
        <button type="button">Get started</button>
      </header>
    </main>
  </body>
</html>
```

## Always pin the release tag

Use the exact protected Git tag for the release:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css
```

An exact version prevents a future release from changing a deployed page
without your review. Do not use `main`, a branch name, or an unversioned URL in
production. Upgrade the `vX.Y.Z` tag deliberately after testing the new
release.

## CSS-only page

If the page has no SDS custom elements or dialogs, omit the script:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css"
>
```

## Import JavaScript functions

Use an inline module when you need `notify()` or another export:

```html
<script type="module">
  import {
    notify,
  } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.js'

  document.querySelector('#save').addEventListener('click', () => {
    notify('Your changes were saved.', {
      title: 'Saved',
      tone: 'success',
    })
  })
</script>
```

The stable `auto.js` file is for automatic registration. Selective top-level
modules use the same names as NPM entries: `dialog.js`, `dropdown.js`,
`popover.js`, `tabs.js`, `tooltip.js`, and `toast.js`.

For example, register only tabs:

```html
<script type="module">
  import {
    registerSdsTabs,
  } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/tabs.js'

  registerSdsTabs()
</script>
```

## Add brand shells

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/brand.css"
>
```

Use it in addition to `sds.css` for SEI application or brochure layouts.

## Content Security Policy

SDS Lite does not inject external scripts, evaluate strings, or require inline
styles for ordinary recipes. A Content Security Policy must allow
`https://cdn.jsdelivr.net` in `style-src` for CDN stylesheets and in
`script-src` for CDN modules. If you use an inline module like the examples
above, authorize it with your application's nonce or move it into an external
JavaScript file. Self-host the release files when third-party origins are not
allowed.

## Self-hosting

Download the `dist/` directory from the same protected release tag used by the
CDN URL. The simplest and safest option is to copy the entire directory to a
versioned location on your server.

For the standard stylesheet and automatic behavior, these paths are
load-bearing:

```text
dist/
|-- auto.js
|-- sds.css
`-- package/
```

Keep that relative layout unchanged because `auto.js` imports
`./package/auto.js` and the selective top-level modules re-export their built
modules from `package/`. Keep `brand.css` and `package/assets/` together when
using branded shells. The remaining top-level CSS, JavaScript, and metadata
files can be copied when your application uses those entries.

[Browse component recipes →](../components/README.md)
