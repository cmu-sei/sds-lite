# Install from a CDN

[Documentation](../README.md) / [Installation](../getting-started.md) / CDN

CDN installation works in a plain HTML file with no package manager, build
tool, or local server configuration.

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
      href="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/sds.css"
    >
    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/auto.js"
    ></script>
  </head>
  <body
    data-sds-root
    data-sds-theme="forge"
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

## Pin the version

Always use an exact version in production:

```text
https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/sds.css
```

An exact version prevents a future release from changing a deployed page
without your review. Upgrade the version deliberately after testing.

## CSS-only page

If the page has no SDS custom elements or dialogs, omit the script:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/sds.css"
>
```

## Import JavaScript functions

Use an inline module when you need `notify()` or another export:

```html
<script type="module">
  import {
    notify,
  } from 'https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/sds.js'

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

## Add brand shells

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@cmu-sei/sds-lite@0.1.0/brand.css"
>
```

Use it in addition to `sds.css` for SEI application or brochure layouts.

## Content Security Policy

SDS Lite does not inject external scripts, evaluate strings, or require inline
styles for ordinary recipes. If your policy blocks CDN resources, self-host
the published package files and update the URLs. If you use an inline module
like the example above, allow it with your application's nonce or move it into
an external JavaScript file.

## Self-hosting

Copy these published files to the same versioned asset directory:

```text
sds.css
auto.js
package/
```

Keep their relative layout unchanged because `auto.js` imports
`./package/auto.js` and the selective top-level modules re-export their built
modules from `package/`. Include `brand.css` and `package/assets/` when using
branded shells.

[Browse component recipes →](../components/README.md)
