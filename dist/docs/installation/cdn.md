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

If the page uses only CSS recipes and native controls, and does not rely on
SDS dialog, panel, or mobile-sidebar compatibility behavior, omit the script:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css"
>
```

## Import JavaScript functions

Use an inline module when you need `notify()` or `setupSds()`:

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

The stable, self-contained `auto.js` file sets up all SDS Lite behavior. The
complete script is about 7.3 KB compressed, so there are no public per-element
CDN entries to choose or coordinate.

## Add brand shells

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/brand.css"
>
```

Use it in addition to `sds.css` for SEI application or brochure layouts.

## Content Security Policy

SDS Lite does not inject external scripts or evaluate strings. Ordinary
recipes do not require inline styles, but dropdowns, popovers, and tooltips
write `left`, `top`, and arrow-position custom properties to their floating
surface. A strict policy must therefore permit these element style
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

Keep `brand.css` and `package/assets/` together when using branded shells.
Copy the complete `dist/` directory when using `sds.js` for `notify()` or
`setupSds()`, because that module loads its implementation from `package/`.

[Browse component recipes →](../components/README.md)
