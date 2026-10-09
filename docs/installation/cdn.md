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

For example, release `v0.6.0` provides `dist/sds.css` at:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/sds.css
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
      href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/sds.css"
    >
    <script
      type="module"
      src="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/auto.js"
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
        <button class="sds-button" type="button">Get started</button>
      </header>
    </main>
  </body>
</html>
```

For searchable choices, start with the
[plain combobox markup](../components/forms.md#combobox). A
[`sds-select` handler](../components/forms.md#rich-suggestions-and-record-ids)
can store an ID or tag and clear the search; the same HTML and JavaScript
work with the CDN tags above or NPM imports.

## Always pin the release tag

Use the exact protected Git tag for the release:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/sds.css
```

An exact version prevents a future release from changing a deployed page
without your review. Do not use `main`, a branch name, or an unversioned URL in
production. Upgrade the `vX.Y.Z` tag deliberately after testing the new
release.

## CSS-only page

If the page uses only CSS recipes and native controls, and does not rely on
SDS dialog, panel, or mobile-sidebar compatibility behavior, omit the script:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/sds.css"
>
```

## Import JavaScript functions

Add this inside the SDS root when you need `notify()` alongside automatic
behavior:

```html
<button class="sds-button" id="save" type="button">Save</button>
<script type="module">
  import {
    notify,
  } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/auto.js'

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
  import { setupSds } from 'https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/sds.js'

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
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.0/dist/brand.css"
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
