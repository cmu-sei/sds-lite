# Quick start

[Documentation](./README.md) / Getting started

Build a styled form with no account, token, build step, or JavaScript.
For a bundled application, use [NPM installation](./installation/npm.md) instead.

## 1. Add the stylesheet

Add this version-pinned link to `<head>`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.6.2/dist/sds.css"
>
```

Keeping Tailwind, Bootstrap, or Material? Follow the
[coexistence setup](./guides/theming.md#combine-design-systems) before loading styles.

## 2. Add a form

Paste this into the page body or your playground's HTML panel. It includes
an SDS typography root and standalone page presentation:

```html
<main data-sds-root class="sds-document sds-page">
  <article class="sds-card">
    <h1 class="sds-text-h3">Project details</h1>
    <form class="sds-form">
      <div class="sds-field">
        <label for="project-name">Project name</label>
        <input
          class="sds-input"
          id="project-name"
          name="projectName"
          value="Atlas"
          aria-describedby="project-name-help"
          required
        >
        <small id="project-name-help">Use a short, recognizable name.</small>
      </div>
      <div class="sds-action-group">
        <button class="sds-button" type="submit">Save</button>
        <button class="sds-button" type="button" data-sds-variant="text">Cancel</button>
      </div>
    </form>
  </article>
</main>
```

The input and buttons should now be styled. Browser validation and form
submission remain native; your application supplies save and cancel behavior.

For an embedded region, omit `sds-document` to keep page background and sizing
unchanged. When you control the whole document, move `data-sds-root` and
`sds-document` to `<body>` and keep `sds-page` on `<main>`; this also removes
the browser's default body margin. See [styling boundaries](./guides/theming.md#choose-a-styling-boundary)
for host typography overrides, or [themes](./guides/theming.md#theme-and-color-scheme)
to change the default Forge/light appearance.

## Scaffold a page from the playground

1. Open [Page starters](../index.html#layouts), choose a layout, and select
  **Copy page** for a complete document with version-pinned assets and behavior.
  Use **Copy layout** instead when SDS is already loaded in your application.
2. Copy a dashboard, directory, settings, or article from
  [Page patterns](../index.html#patterns) into the layout's `id="page-content"`
  section. Keep the surrounding header, navigation, and footer.
3. Replace sample content, links, IDs, and form endpoints. Update matching
  labels and ARIA references whenever an ID changes.

Applications and documentation use Forge; the brochure uses Plaid. Exported
markup excludes playground controls and scripts. Your application supplies
search results and save behavior; the documentation starter's GET search
targets `/search`. Update its sidebar and table-of-contents links too.

## Add only what you need

| Next task | Guide |
|---|---|
| Find a button, input, grid, or other feature | [Feature index](./components/README.md#feature-index) |
| Add tabs, a menu, or a notification | [Interactive setup](./installation/cdn.md#complete-starter-page), then [tabs](./components/navigation.md#tabs), [dropdown](./components/navigation.md#dropdown-menu), or [toast](./components/feedback.md#toast) |
| Use React, Vue, Angular, or Svelte | [Framework integration](./guides/frameworks.md) |
| Render on the server | [Server rendering](./guides/server-rendering.md) |
| Fix an unstyled control | [Troubleshooting](./troubleshooting.md#button-is-unstyled) |
