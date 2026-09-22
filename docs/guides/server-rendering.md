# Server rendering and hydration

[Documentation](../README.md) / Guides / Server rendering

Every SDS Lite JavaScript entry is safe to import when `window`, `document`,
`HTMLElement`, and `customElements` do not exist. The root entry has no
setup side effects.

## The simple path

Import CSS through the framework's stylesheet path so it appears in the first
response:

```js
import '@cmu-sei/sds-lite/sds.css'
```

Render the same beginner markup on the server:

```html
<sds-tabs>
  <div aria-label="Project sections">
    <button type="button" aria-selected="true">Overview</button>
    <button type="button">Activity</button>
  </div>
  <section>Overview content</section>
  <section>Activity content</section>
</sds-tabs>
```

Hydrate the application, then set up SDS Lite:

```js
import { setupSds } from '@cmu-sei/sds-lite'

hydrateApplication()
setupSds()
```

This avoids hydration mismatches because SDS Lite does not enhance the markup
until the framework has finished comparing its server and client output.
`setupSds()` may then add classes, IDs, ARIA relationships, and initial state.

Do not import `/auto` in a shared SSR entry. It sets up custom elements as soon
as the browser evaluates it, which may be before hydration. Use `/auto` only
from a framework hook that is guaranteed to run after hydration, or use
`setupSds()` as shown above.

See [Framework integration](./frameworks.md#copy-ready-ssr-setups) for Next.js,
Nuxt, SvelteKit, Astro, Remix, and Angular examples.

## The pre-authored path

Some applications want the initial response to contain the same accessible
structure and state that SDS Lite produces during setup. For that requirement,
render the complete markup shown below. SDS Lite still attaches behavior and
may update runtime state or floating-position styles. Most applications do not
need this extra authoring.

### Server contract

Render:

- final semantic element structure;
- visible text and accessible names;
- stable, unique IDs and ARIA relationships;
- native and ARIA state;
- exactly one selected tab and matching visible panel;
- dialog, popover, and toast initial visibility;
- required roles and tab order.

When markup is complete, behavior modules update state and temporary
positioning without moving, wrapping, cloning, replacing, or generating
application nodes. `notify()` is the intentional exception: it creates a
transient toast in the browser.

### Fully authored tabs

```html
<sds-tabs value="overview" variant="underline">
  <div class="sds-tab-list" role="tablist" aria-label="Project sections">
    <button
      id="overview-tab"
      class="sds-tab"
      type="button"
      role="tab"
      aria-controls="overview-panel"
      aria-selected="true"
      tabindex="0"
      value="overview"
    >
      Overview
    </button>
    <button
      id="activity-tab"
      class="sds-tab"
      type="button"
      role="tab"
      aria-controls="activity-panel"
      aria-selected="false"
      tabindex="-1"
      value="activity"
    >
      Activity
    </button>
  </div>
  <section
    id="overview-panel"
    class="sds-tab-panel"
    role="tabpanel"
    aria-labelledby="overview-tab"
  >
    Overview content
  </section>
  <section
    id="activity-panel"
    class="sds-tab-panel"
    role="tabpanel"
    aria-labelledby="activity-tab"
    hidden
  >
    Activity content
  </section>
</sds-tabs>
```

### Fully authored dropdown

```html
<sds-dropdown>
  <button
    type="button"
    popovertarget="project-actions"
    aria-controls="project-actions"
    aria-expanded="false"
    aria-haspopup="menu"
  >
    Actions
  </button>
  <menu
    id="project-actions"
    class="sds-dropdown-menu"
    popover="auto"
    role="menu"
    aria-orientation="vertical"
  >
    <li role="none">
      <button type="button" role="menuitem" tabindex="-1">Rename</button>
    </li>
    <li role="none">
      <a href="/duplicate" role="menuitem" tabindex="-1">Duplicate</a>
    </li>
  </menu>
</sds-dropdown>
```

### Fully authored tooltip and popover

```html
<sds-tooltip>
  <button type="button" aria-describedby="slug-help">What is a slug?</button>
  <span
    id="slug-help"
    class="sds-tooltip-content"
    role="tooltip"
    popover="manual"
  >
    A short name used in the project's URL.
  </span>
</sds-tooltip>
```

```html
<sds-popover>
  <button type="button" popovertarget="project-details">
    Project details
  </button>
  <section
    id="project-details"
    class="sds-popover-content"
    popover="auto"
  >
    <h2>Project Atlas</h2>
    <p>Updated five minutes ago.</p>
  </section>
</sds-popover>
```

## Browser-only helpers

Importing `notify()` on the server is safe. Calling it is not, because it
creates DOM. SDS Lite throws a clear error instead of silently succeeding:

```js
if (typeof document !== 'undefined') {
  notify('Hydration complete')
}
```

Prefer calling it from an event or client lifecycle rather than adding an
environment branch to shared render code.

## Avoid flashes and mismatches

- Include SDS CSS in the initial response.
- Render inactive tab panels with `hidden`.
- Render `aria-expanded="false"` on closed dropdown triggers.
- Do not generate IDs independently on server and client.
- Do not call `setupSds()` until hydration has completed.
- Avoid rendering a toast both on the server and through `notify()` on startup.

[Review the accessibility contract →](./accessibility.md)
