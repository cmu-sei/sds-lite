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
The tool skips many recognized unsupported features and dynamic mapping
bindings, but it is not a source-framework parser or a complete prop validator.
Other attributes, bindings, event handlers, and child markup may survive a
conversion without equivalent native behavior. Use the retained-marker report
as a partial manual migration checklist; repeated markers are grouped per file.
It does not report every leftover dependency: for example, legacy SDS rendered
classes are not included in that report.

## Final SDS Lite conventions

Recipe classes opt native elements into styling; namespaced data attributes
configure their options. A theme root alone does not apply a recipe:

```html
<button
  class="sds-button"
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
provide the namespace. These examples assume SDS Lite CSS is loaded, an ancestor
has `data-sds-root`, and JavaScript behavior is registered with `setupSds()` or
the `@cmu-sei/sds-lite/auto` entry point:

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
  <button class="sds-button" type="button">Actions</button>
  <menu><li><button class="sds-button" type="button">Rename</button></li></menu>
</sds-dropdown>

<sds-popover placement="block-end" offset="8" width="lg">
  <button class="sds-button" type="button">Details</button>
  <section>Project details</section>
</sds-popover>

<sds-tooltip placement="block-start" offset="6">
  <button class="sds-button" type="button">Help</button>
  <span>Helpful context.</span>
</sds-tooltip>

<sds-toast id="saved-toast" open tone="success" persistent>
  <strong>Saved</strong>
  <span>Your changes are available.</span>
  <button class="sds-button" type="button" data-sds-shape="icon" data-sds-toast-close aria-label="Dismiss">&times;</button>
</sds-toast>
```

Behavior hooks on descendants remain namespaced. Toast close controls belong
inside their toast, as above; an open control targets its ID. Dialog commands
target a native SDS Lite dialog:

```html
<button class="sds-button" type="button" data-sds-toast-open="saved-toast">Show notification</button>
<button
  class="sds-button"
  type="button"
  commandfor="confirm-dialog"
  command="show-modal"
>Review confirmation</button>
<dialog class="sds-dialog" id="confirm-dialog" aria-label="Confirm changes">
  <p>Apply these changes?</p>
  <button
    class="sds-button"
    type="button"
    commandfor="confirm-dialog"
    command="close"
    data-sds-return-value="confirm"
  >Confirm</button>
</dialog>
```

`data-sds-callout-close` is an application-owned hook: `setupSds()` does not
install a callout dismissal handler. Add your own click handler when using it.
Likewise, `aria-disabled="true"` on a migrated link does not prevent navigation;
application code must enforce the disabled state.

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
