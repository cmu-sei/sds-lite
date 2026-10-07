# Quick start

[Documentation](./README.md) / Getting started

Build a styled form with no account, token, build step, or JavaScript.
For a bundled application, use [NPM installation](./installation/npm.md) instead.

## 1. Add the stylesheet

Add this version-pinned link to `<head>`:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.2.1/dist/sds.css"
>
```

Keeping Tailwind, Bootstrap, or Material? Follow the
[coexistence setup](./guides/theming.md#combine-design-systems) before loading styles.

## 2. Add a form

```html
<main data-sds-root class="sds-page">
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

## What to remember

- `data-sds-root` supplies theme tokens. Recipe classes opt elements into styling.
- Option attributes change a recipe, not an unmarked element. Unmarked HTML retains host styling.
- Heading tags express structure; `.sds-text-h1` through `.sds-text-h6` choose visual size.
- Add `.sds-document` when SDS should own page typography and background.

Forge and light are the defaults. To follow the operating system, add
`data-sds-color-scheme="system"` to the root.

## Add only what you need

| Next task | Guide |
|---|---|
| Find a button, input, grid, or other feature | [Feature index](./components/README.md#feature-index) |
| Add tabs, a menu, or a notification | [Interactive setup](./installation/cdn.md#complete-starter-page), then [tabs](./components/navigation.md#tabs), [dropdown](./components/navigation.md#dropdown-menu), or [toast](./components/feedback.md#toast) |
| Use React, Vue, Angular, or Svelte | [Framework integration](./guides/frameworks.md) |
| Render on the server | [Server rendering](./guides/server-rendering.md) |
| Fix an unstyled control | [Troubleshooting](./troubleshooting.md#button-is-unstyled) |
