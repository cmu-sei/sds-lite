# Install from a CDN

[Documentation](../README.md) / [Installation](../getting-started.md) / CDN

Use the CDN for plain HTML or playgrounds without an account, token, or build
step. jsDelivr serves release files from
[`cmu-sei/sds-lite`](https://github.com/cmu-sei/sds-lite), not GitHub Packages.

The URL format is:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@vVERSION/dist/FILE
```

## Complete starter page

Serve this complete HTML document through a web server. In an HTML playground, use the
stylesheet and script tags plus the contents of `<body>`; put its root
attributes and `sds-document` class on the outer `<main>`.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My SDS Lite application</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.1/dist/sds.css"
    >
    <script
      type="module"
      src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.1/dist/auto.js"
    ></script>
  </head>
  <body
    data-sds-root
    data-sds-color-scheme="system"
    class="sds-document"
  >
    <main class="sds-page">
      <header class="sds-section-header">
        <div>
          <p class="sds-eyebrow">Welcome</p>
          <h1 class="sds-text-h3">My application</h1>
          <p>SDS Lite is ready.</p>
        </div>
        <button class="sds-button" type="button">Get started</button>
      </header>
    </main>
  </body>
</html>
```

This starter lets SDS own the page's typography and background. For an
existing application, choose the appropriate
[styling boundary](../guides/theming.md#choose-a-styling-boundary).

## Always pin the release tag

Keep the exact `vX.Y.Z` tag shown in the starter. Do not use `main`, a branch,
or an unversioned URL in production: deployed pages must not change without
review. Upgrade all SDS assets to the same release after testing.

## CSS-only page

Omit the script when using only CSS recipes and native controls. Keep it for
SDS custom elements or dialog, panel, and mobile-sidebar compatibility behavior.

## Import JavaScript functions

Add this inside the SDS root when you need `notify()` alongside automatic
behavior:

```html
<button class="sds-button" id="save" type="button">Save</button>
<script type="module">
  import {
    notify,
  } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.1/dist/auto.js'

  document.querySelector('#save').addEventListener('click', () => {
    notify('Your changes were saved.', {
      title: 'Saved',
      tone: 'success',
    })
  })
</script>
```

The self-contained `auto.js` file sets up all SDS Lite behavior and exports
`notify()`. Importing it again from the same URL reuses the loaded module.
If you need to control setup yourself, use the standalone, side-effect-free
`sds.js` instead and call `setupSds()` after the DOM is ready (or after
hydration). For a plain HTML page, omit the `auto.js` tag and use:

```html
<script type="module">
  import { setupSds } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.1/dist/sds.js'

  setupSds()
</script>
```

Do not load both independently bundled entries on one page:
they contain distinct custom-element constructors. There are no public
per-element CDN entries to choose or coordinate.

## Add brand shells

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.1/dist/brand.css"
>
```

Use it in addition to `sds.css` for SEI application or brochure layouts.

## Content Security Policy

SDS Lite does not inject external scripts or evaluate strings. Ordinary
recipes do not require inline styles, but comboboxes, dropdowns, popovers,
and tooltips set inline positioning, sizing, and arrow styles on floating
surfaces; draggable panels set inline transform, transition, and handle
styles. A strict policy must therefore permit these element style
attributes. A Content Security Policy must also allow
`https://cdn.jsdelivr.net` in `style-src` for CDN stylesheets and in
`script-src` for CDN modules. If you use an inline module like the examples
above, authorize it with your application's nonce or move it into an external
JavaScript file. Self-host the release files when third-party origins are not
allowed.

## Self-hosting

Download files from the same protected release tag used by the CDN URL.

The recommended setup only needs `sds.css` and `auto.js`. Copy these two
independent files:

```text
dist/
|-- auto.js
`-- sds.css
```

Import `notify()` from `auto.js` when using automatic behavior. For manual
setup instead, copy `sds.js` alongside the stylesheet and import
`setupSds()` or `notify()` from it; it has no dependent files. Keep
`brand.css` and `package/assets/` together when using branded shells,
because `brand.css` references the wordmark from `package/assets/`.

[Browse component recipes →](../components/README.md)
