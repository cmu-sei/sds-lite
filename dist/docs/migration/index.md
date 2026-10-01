# Migrate to SDS Lite

The SDS Lite migrator makes conservative, mechanical changes to common static
markup. It is a starting point for a migration, not a full-project converter.
It does not remove old packages, rewrite imports, replace framework state,
convert complex components, or prove visual and accessibility parity.

## Source guides

- [Legacy SDS](./legacy-sds.md)
- [Bootstrap](./bootstrap.md)
- [U.S. Web Design System](./uswds.md)
- [Material Web](./material-web.md)
- [Web Awesome](./web-awesome.md)
- [Spectrum Web Components](./spectrum.md)

## Run the migrator

First [install `@cmu-sei/sds-lite` in the project](../installation/npm.md).
`sds-lite-migrate` is the executable included with that package; the
following `npx` commands run the project's installed executable, not a
separate package named `sds-lite-migrate`. Use explicit file paths. The
default is a dry run:

```sh
npx sds-lite-migrate --from bootstrap src/page.html
npx sds-lite-migrate --from uswds src/form.html src/account.vue
```

The preview prints the complete transformed contents of each changed file.
Warnings identify unsafe transformations that were skipped. Separate review
items summarize recognized source-system classes, custom elements, and
behavior attributes still present after conversion. Review all three before
writing:

```sh
npx sds-lite-migrate --from bootstrap --write src/page.html
```

Accepted source names are `legacy-sds`, `bootstrap`, `uswds`, `material`,
`web-awesome`, and `spectrum`. Unknown sources, unknown flags, directories,
and missing files are errors. Files are processed in the order provided.

Run the command on version-controlled files and inspect the diff afterward.
The tool intentionally leaves unsupported or dynamic source markup unchanged.
Use the retained-marker report as a manual migration checklist; repeated
markers are grouped per file.

## Final SDS Lite conventions

Native elements and CSS recipes use namespaced data attributes:

```html
<button
  type="button"
  data-sds-variant="tonal"
  data-sds-tone="danger"
  data-sds-size="sm"
>
  Delete
</button>

<div class="sds-grid" data-sds-gap="lg"></div>
```

Custom elements use ordinary host attributes because their tag names already
provide the namespace:

```html
<sds-tabs
  value="overview"
  activation="manual"
  orientation="vertical"
  variant="underline"
  size="lg"
  tone="accent"
>
  <div aria-label="Project sections">
    <button type="button" value="overview">Overview</button>
  </div>
  <section>Overview content</section>
</sds-tabs>

<sds-dropdown hide-caret>
  <button type="button">Actions</button>
  <menu><li><button type="button">Rename</button></li></menu>
</sds-dropdown>

<sds-popover placement="block-end" offset="8" width="lg">
  <button type="button">Details</button>
  <section>Project details</section>
</sds-popover>

<sds-tooltip placement="block-start" offset="6">
  <button type="button">Help</button>
  <span>Helpful context.</span>
</sds-tooltip>

<sds-toast open tone="success" duration="5000" persistent>
  <strong>Saved</strong>
  <span>Your changes are available.</span>
  <button type="button" data-sds-toast-close aria-label="Dismiss">&times;</button>
</sds-toast>
```

Behavior hooks on descendants remain namespaced:

```html
<button type="button" data-sds-toast-open="saved-toast">Show notification</button>
<button type="button" data-sds-toast-close>Dismiss</button>
<button type="button" data-sds-callout-close>Dismiss callout</button>
<button
  type="button"
  commandfor="confirm-dialog"
  command="close"
  data-sds-return-value="confirm"
>Confirm</button>
```

Tabs use the native button `value` attribute:

```html
<sds-tabs value="activity">
  <div role="tablist" aria-label="Project sections">
    <button type="button" value="overview">Overview</button>
    <button type="button" value="activity">Activity</button>
  </div>
  <section>Overview content</section>
  <section>Activity content</section>
</sds-tabs>
```

## What always requires review

1. Confirm every `<button>` still performs an action and every `<a href>`
   still navigates. The migrator preserves those semantics when it can.
2. Rebuild labels, help text, validation messages, icons, loading indicators,
   menus, and component slots that generated internal markup.
3. Replace framework component imports and remove the old styles only after no
   source markup depends on them.
4. Test keyboard behavior, focus, form submission, validation, responsive
   layout, dark mode, and high contrast.
5. Compare the result visually. Crosswalks map intent, not exact pixels.
