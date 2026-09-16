# Recommendation: A Framework-Neutral, CDN-First SEI Design System

## Executive summary

The next version of the SEI Design System should be a standards-first styling
system with an optional Web Components behavior layer.

Its public interface should consist of:

- Native HTML elements
- Namespaced `sds-*` CSS classes
- `data-*` attributes for visual options
- Native and ARIA attributes for state
- CSS custom properties for theming
- Standard DOM events
- A small set of custom elements for behavior that native HTML cannot provide

Vue, React, Svelte, Python templates, Ruby templates, static HTML, and other
stacks would all consume the same browser-level interface. Tailwind, Lit,
TypeScript, Floating UI, or another implementation dependency could still be
used to build the system, but consumers would not install or configure them.

The guiding rule should be:

> CSS owns appearance. Native HTML owns semantics and final server-rendered
> structure. Web Components add only behavior that HTML cannot provide.

This creates a deep module at the browser seam: consumers learn a small HTML and
CSS interface, while the design system hides theming, responsive behavior,
interaction states, accessibility behavior, and implementation details behind
it.

## Why the current project is a useful starting point

The current project already has several parts worth preserving:

- Theme primitives and component-specific custom properties in
  `tailwindcss/theme/**`
- Reusable CSS recipes such as `btn`, `form-control`, `link`, `tabs`, and
  `table-prose`
- Forge and Plaid theme differences expressed through custom properties
- Dark-mode behavior
- Shared interaction logic such as overlay, focus-trap, escape-key, and
  scroll-lock behavior
- Existing accessibility markup that establishes useful behavioral
  requirements

The principal limitation is the consumer interface. The package currently
exposes Vue as a peer dependency, and its Tailwind source contains build-time
directives and source scanning. Even though a UMD build exists, Vue is still an
external runtime dependency. This is not a self-contained CDN interface.

The next version should treat Tailwind as an optional implementation detail and
publish ordinary, precompiled CSS and dependency-free browser JavaScript.

## Recommended architecture

| Module | CDN artifact | Responsibility |
|---|---|---|
| Tokens | `tokens.css`, `tokens.json` | Color, type, spacing, radius, elevation, motion, and breakpoints |
| Foundations | `foundations.css` | Font faces, typography, focus behavior, and narrowly scoped browser defaults |
| Recipes | `components/*.css` source, aggregated into `sds.css` | One file per button, control, badge, callout, table, navigation, or other visual pattern |
| Layout | Co-located with each owning recipe | Application, page, form, action-group, grid, and flex composition |
| Themes | `themes/forge.css`, `themes/plaid.css` | Theme-specific semantic token assignments |
| Behavior elements | `sds.js` and individual element exports | Idempotent enhancement for dialogs, panels, tabs, menus, and toasts |
| Complete bundle | `sds.css`, `sds.js` | One-link and one-script onboarding |
| Optional adapters | Separate npm packages | Vue or React convenience wrappers, where demand justifies them |
| Optional visualization | `visualization.css`, `visualization.js` | Charts and their larger categorical palette |

The complete beginner installation should be:

```html
<link
  rel="stylesheet"
  href="https://design.sei.cmu.edu/sds/5.0.0/sds.min.css"
>
<script
  type="module"
  src="https://design.sei.cmu.edu/sds/5.0.0/sds.min.js"
></script>
```

CSS-only consumers should not need the script. Advanced consumers should be
able to load individual modules:

```html
<link
  rel="stylesheet"
  href="https://design.sei.cmu.edu/sds/5.0.0/tokens.min.css"
>
<link
  rel="stylesheet"
  href="https://design.sei.cmu.edu/sds/5.0.0/components.min.css"
>
<script type="module">
  import "https://design.sei.cmu.edu/sds/5.0.0/dialog.js";
</script>
```

### SSR rendering contract

The canonical representation is complete semantic light DOM. Servers emit
native dialogs, authored Popover attributes, tab IDs and ARIA relationships,
selected states, hidden states, and visible toast state. Client modules attach
behavior without moving, wrapping, cloning, replacing, or generating
essential nodes.

Declarative Shadow DOM is not the canonical representation for the current
recipes. Native dialog, Popover, forms, links, and authored light DOM create a
deeper browser seam with less consumer knowledge and better interoperability.
DSD should be introduced only if a future module genuinely owns private
structure that semantic light DOM cannot represent cleanly.

## CSS architecture

### Cascade layers

All distributed styles should be placed in named cascade layers:

```css
@layer sds.tokens, sds.base, sds.components, sds.utilities;
```

The system should avoid unlayered rules. Unlayered application CSS will then
override SDS rules without specificity escalation. Selectors within SDS should
use `:where()` for low-specificity defaults.

### Scope and namespaces

The system should not globally restyle every element on the page. Consumers
should opt an application or subtree into the design system:

```html
<body
  data-sds-root
  data-sds-theme="forge"
  data-sds-color-scheme="light"
>
  ...
</body>
```

The recommended root and theme selectors are:

```css
:where([data-sds-root]) {}
:where([data-sds-theme="forge"]) {}
:where([data-sds-theme="plaid"]) {}
:where([data-sds-color-scheme="light"]) {}
:where([data-sds-color-scheme="dark"]) {}
:where([data-sds-density="compact"]) {}
```

Themes must work on containers rather than only on `html` or `body`. This
allows embedded applications and multiple themed regions on one page.

Public classes, custom elements, custom properties, events, and parts should
all use an `sds-` prefix:

```text
.sds-button
<dialog class="sds-dialog">
--sds-color-text-default
sds-close
```

### Selector design rules

Each visual recipe should expose one base class and a small number of
orthogonal attributes:

```html
<button
  class="sds-button"
  data-variant="primary"
  data-tone="brand"
  data-size="md"
>
  Save changes
</button>
```

This is preferable to requiring consumers to understand combinations such as
`btn btn-primary btn-blue btn-md`. The implementation can continue composing
small internal utilities, but that composition should not leak into the public
interface.

Use these attribute categories consistently:

| Attribute | Meaning | Recommended values |
|---|---|---|
| `data-variant` | Visual hierarchy or treatment | `primary`, `secondary`, `tertiary`, `ghost`; recipe-specific values only where necessary |
| `data-tone` | Semantic color intent | `neutral`, `brand`, `info`, `success`, `warning`, `danger` |
| `data-size` | Control or recipe size | `xs`, `sm`, `md`, `lg`; add `xl` only where current use supports it |
| `data-orientation` | Layout direction | `horizontal`, `vertical` |
| `data-placement` | Floating-element placement | Logical values such as `block-start`, `inline-end` |
| `data-density` | Content density | `comfortable`, `compact` |

Native and ARIA attributes should represent state. Do not create parallel
visual-only state classes:

```css
:where(.sds-button:disabled) {}
:where(.sds-button[aria-disabled="true"]) {}
:where(.sds-button[aria-busy="true"]) {}
:where(.sds-button[aria-pressed="true"]) {}
:where(.sds-input[aria-invalid="true"]) {}
:where(.sds-tab[aria-selected="true"]) {}
:where(.sds-pagination [aria-current="page"]) {}
:where([aria-expanded="true"]) {}
```

Use native and ARIA state only. Do not retain parallel visual-only state
classes.

Hover behavior should be guarded for hover-capable devices, focus should use
`:focus-visible`, and animation should honor reduced motion:

```css
@media (hover: hover) {
  :where(.sds-button:hover) {}
}

:where(.sds-button:focus-visible) {}

@media (prefers-reduced-motion: reduce) {
  :where([data-sds-root] *) {
    scroll-behavior: auto;
  }
}
```

## Recommended public selector catalog

This catalog is based on repeated structures and existing recipe families in
the current components. It is intentionally smaller than the current set of
Vue components and raw Tailwind combinations.

### Actions

Buttons, compact actions, square icon controls, dropdown triggers, filters,
and sort controls share one interaction interface.

```css
.sds-button {}

.sds-button[data-variant="primary"] {}
.sds-button[data-variant="secondary"] {}
.sds-button[data-variant="tertiary"] {}
.sds-button[data-variant="ghost"] {}

.sds-button[data-tone="neutral"] {}
.sds-button[data-tone="brand"] {}
.sds-button[data-tone="info"] {}
.sds-button[data-tone="success"] {}
.sds-button[data-tone="warning"] {}
.sds-button[data-tone="danger"] {}

.sds-button[data-size="xs"] {}
.sds-button[data-size="sm"] {}
.sds-button[data-size="md"] {}
.sds-button[data-size="lg"] {}
.sds-button[data-size="xl"] {}

.sds-button[data-density="compact"] {}
.sds-button[data-shape="icon"] {}
.sds-button[data-block] {}
.sds-button[aria-busy="true"] {}
.sds-button[aria-pressed="true"] {}
.sds-button:disabled {}
```

Ordinary `<button>` elements receive the recipe automatically inside an SDS
root. `.sds-button` lets links use the same appearance. Density and shape are
orthogonal modifiers rather than separate button modules.

### Links

The current link family uses primary, secondary, tertiary, blue, red, white,
inline, CTA, up, and down combinations. The condensed interface should be:

```css
.sds-link {}
.sds-link[data-variant="primary"] {}
.sds-link[data-variant="secondary"] {}
.sds-link[data-variant="tertiary"] {}
.sds-link[data-variant="inline"] {}
.sds-link[data-variant="cta"] {}
.sds-link[data-tone="brand"] {}
.sds-link[data-tone="danger"] {}
```

Text links and button-shaped links remain one native `<a>` element with
different opt-in recipes.

### Form controls

`form-control` and `input-group` are among the most reused existing recipes.
They appear in `Input`, `Select`, `Textarea`, `ComboBox`, `Datepicker`,
`DropdownInputItem`, and `Calendar`.

```css
.sds-field {}
.sds-label {}
.sds-control {}
.sds-input {}
.sds-select {}
.sds-textarea {}
.sds-choicebox {}
.sds-radio {}
.sds-switch {}
.sds-control-group {}
.sds-control-addon {}
.sds-help-text {}
.sds-error-text {}

.sds-control[data-size="sm"] {}
.sds-control[data-size="md"] {}
.sds-control[data-size="lg"] {}
.sds-control[aria-invalid="true"] {}
.sds-control:disabled {}
.sds-control:read-only {}
.sds-field:has(.sds-control[aria-invalid="true"]) {}
```

Basic controls must remain native form elements. Do not introduce
`<sds-input>` or `<sds-button>` custom elements. Native submission, validation,
autofill, password managers, and keyboard behavior are more valuable than
encapsulation.

### Feedback and status

Badges, tags, callouts, indicators, toasts, loading spinners, and skeletons
account for most repeated status styling:

```css
.sds-badge {}
.sds-callout {}
.sds-spinner {}
.sds-skeleton {}

.sds-badge[data-tone] {}
.sds-callout[data-tone] {}

.sds-badge[data-variant="light"] {}
.sds-badge[data-variant="light-border"] {}
.sds-badge[data-variant="dark"] {}
.sds-callout[data-variant="outline"] {}
.sds-callout[data-variant="bold"] {}
```

The default tones should be semantic: `neutral`, `info`, `success`, `warning`,
and `danger`. Arbitrary hue names should not be the primary interface for
messages because color alone does not communicate meaning.

### Content and containers

```css
.sds-card {}
.sds-panel {}
.sds-sidebar-layout {}
.sds-sidebar {}
.sds-list {}
.sds-list-item {}
.sds-list-marker {}
.sds-timeline {}
.sds-timeline-item {}
.sds-timeline-marker {}
.sds-prose {}
.sds-table {}
.sds-empty-state {}

.sds-table[data-size="sm"] {}
.sds-table[data-size="md"] {}
.sds-table[data-size="lg"] {}
.sds-table[data-header="hidden"] {}
.sds-table[data-standalone] {}
.sds-table[data-density="compact"] {}
```

`table-prose`, its size classes, header-hiding class, and standalone class map
directly to `.sds-table` options. Descendant selectors should remain
low-specificity:

```css
:where(.sds-table th) {}
:where(.sds-table td) {}
:where(.sds-table tbody tr:hover) {}
:where(.sds-table [aria-sort]) {}
:where(.sds-table [data-selected]) {}
```

### Navigation

```css
.sds-tab-list {}
.sds-tab {}
.sds-tab-panel {}
.sds-pagination {}
.sds-nav {}
.sds-nav-item {}
.sds-menu {}
.sds-menu-item {}

.sds-tab-list[data-variant="folder"] {}
.sds-tab-list[data-variant="underline"] {}
.sds-tab-list[data-variant="block"] {}
.sds-tab-list[data-orientation="horizontal"] {}
.sds-tab-list[data-orientation="vertical"] {}
.sds-tab[aria-selected="true"] {}
.sds-tab:disabled {}
.sds-nav-item[aria-current="page"] {}
.sds-menu-item[aria-checked="true"] {}
```

The current `tabs`, `tab`, `tab-folder`, `tab-underline`, `tab-block`,
indicator, color, and size classes can be represented by this smaller
interface. JavaScript should own keyboard navigation and ARIA coordination;
CSS should respond to the resulting attributes.

### Layout

The component inventory contains approximately 75 display/alignment candidates
and 120 spacing candidates. Exposing all of those raw combinations would make
the CDN interface nearly as large as exposing Tailwind. Most usage can instead
be covered by a few layout primitives:

```css
.sds-container {}
.sds-stack {}
.sds-cluster {}
.sds-grid {}
.sds-split {}
.sds-center {}
.sds-sidebar-layout {}
.sds-cover {}
.sds-sr-only {}

.sds-stack[data-space="xs"] {}
.sds-stack[data-space="sm"] {}
.sds-stack[data-space="md"] {}
.sds-stack[data-space="lg"] {}
.sds-cluster[data-align="center"] {}
.sds-cluster[data-justify="between"] {}
.sds-grid[data-columns="2"] {}
.sds-grid[data-columns="3"] {}
.sds-grid[data-min-item-width="sm"] {}
```

Each layout recipe should also accept a custom property escape hatch:

```html
<div class="sds-stack" style="--sds-stack-space: 2rem">
  ...
</div>
```

An optional utility sheet can provide a deliberately small set of escape
hatches:

```css
.sds-u-hidden {}
.sds-u-block {}
.sds-u-flex {}
.sds-u-grid {}
.sds-u-grow {}
.sds-u-shrink-0 {}
.sds-u-w-full {}
.sds-u-h-full {}
.sds-u-overflow-auto {}
.sds-u-text-left {}
.sds-u-text-center {}
.sds-u-text-right {}
```

Avoid publishing raw responsive color, spacing, arbitrary-value, and complex
selector utilities. Those are implementation details and create an effectively
unbounded public interface.

## Color inventory and recommended palette

### What the current usage shows

An inventory of component implementation files, excluding tests and stories,
shows the following concentration:

| Hue | Component files using the hue | Main reasons it exists |
|---|---:|---|
| Gray | Broadly used throughout the system | Text, surfaces, borders, disabled states, dark mode |
| Red | 23 | Destructive actions, validation, navigation branding, status variants |
| Blue | 21 | Primary actions, focus, selected state, informational status |
| Green | 11 | Success, valid controls, switches, status variants |
| Orange | 8 | Warning status and decorative variants |
| Purple | 6 | Primarily Badge, Callout, Avatar, Datapoint, Timeline, and TopFiveChart |
| Yellow | 5 | Primarily Badge, Avatar, Datapoint, Timeline, and TopFiveChart |
| Indigo | 4 | Badge, Callout, Datapoint, and TopFiveChart |
| Teal | 4 | Badge, Callout, Datapoint, and TopFiveChart |
| Tan | 3 | Badge, Datapoint, and TopFiveChart |

The broad palette is therefore not evidence that every application needs ten
general-purpose hue ramps. Much of it comes from four highly configurable
decorative recipes and data visualization.

The current non-chart components directly reference 108 primitive hue/stop
combinations. That number is inflated by APIs such as Badge and Callout that
repeat four visual treatments across as many as ten hues. Reproducing those
combinations as public utility classes would not create a condensed system.

### Public versus internal color interface

Primitive ramps should be implementation inputs. Semantic tokens should be the
public customization interface.

For example:

```css
:where([data-sds-root]) {
  --sds-color-text-default: var(--sds-gray-900);
  --sds-color-text-muted: var(--sds-gray-600);
  --sds-color-text-disabled: var(--sds-gray-400);
  --sds-color-action-text: var(--sds-white);

  --sds-color-surface-default: var(--sds-white);
  --sds-color-surface-subtle: var(--sds-gray-25);
  --sds-color-surface-raised: var(--sds-white);

  --sds-color-border-default: var(--sds-gray-300);
  --sds-color-border-strong: var(--sds-gray-600);
  --sds-color-focus-ring: var(--sds-blue-300);

  --sds-color-action-primary: var(--sds-blue-600);
  --sds-color-action-primary-hover: var(--sds-blue-500);
  --sds-color-action-primary-active: var(--sds-blue-700);
}
```

Consumers should customize `--sds-color-action-primary`, not depend on
`--sds-blue-600`. Primitive names may remain available in the optional utility
and visualization distributions, but they should not be the documented
theming interface.

### Recommended core primitive palette

The following primitive set is sufficient to retain the current neutral,
action, form, and semantic-status character without shipping every decorative
color as a core utility.

| Family | Keep in core | Reason |
|---|---|---|
| Absolute | `transparent`, `current`, `white`, `black` | Overlays, inheritance, contrast, and native integration |
| Gray | `25`, `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `750`, `800`, `850`, `900`, `950` | Every stop is used; `750` and `850` are meaningful dark-surface steps |
| Blue | `25`, `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950` | Brand actions, focus, selection, informational feedback, and dark mode use the full ramp |
| Red | `25`, `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950` | Destructive actions, validation, feedback, branding, and dark mode use the full ramp |
| Green | `25`, `50`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900` | Success, validation, switches, badges, and dark-mode status surfaces |
| Orange | `25`, `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900` | Warning states and current Badge, Callout, Avatar, and Timeline treatments |

This is the **visual-parity core**. A more aggressive initial release could
remove green and orange stops that are used only by decorative variants, but it
would need approved visual remapping rather than a mechanical port.

Do not include purple, indigo, teal, yellow, or tan as general-purpose core
utilities. Place them in an optional extended palette:

```text
extended-colors.css
visualization.css
```

The optional extended palette should retain the existing values so migrated
charts and categorical displays remain visually familiar.

### Recommended semantic status tokens

Each status tone needs a complete light and dark treatment rather than a public
numeric ramp:

```css
--sds-color-neutral-surface
--sds-color-neutral-border
--sds-color-neutral-text
--sds-color-neutral-strong

--sds-color-info-surface
--sds-color-info-border
--sds-color-info-text
--sds-color-info-strong

--sds-color-success-surface
--sds-color-success-border
--sds-color-success-text
--sds-color-success-strong

--sds-color-warning-surface
--sds-color-warning-border
--sds-color-warning-text
--sds-color-warning-strong

--sds-color-danger-surface
--sds-color-danger-border
--sds-color-danger-text
--sds-color-danger-strong
```

These roles cover the existing Badge, Callout, Tag, Indicator, Toast,
validation, and destructive-action use cases. Theme and color-scheme selectors
assign their values once; individual recipes consume the semantic tokens.

### Visualization palette

Charts should not depend on utility class names such as `text-teal-400`.
Publish explicit series tokens in the optional visualization module:

```css
--sds-chart-series-1
--sds-chart-series-2
--sds-chart-series-3
--sds-chart-series-4
--sds-chart-series-5
--sds-chart-series-6
--sds-chart-axis
--sds-chart-grid
--sds-chart-label
--sds-chart-tooltip-surface
```

The existing six-series line palette provides a reasonable starting mapping:

| Series | Light | Dark |
|---|---|---|
| 1 | Blue 400 | Blue 600 |
| 2 | Teal 400 | Teal 600 |
| 3 | Red 400 | Red 600 |
| 4 | Green 400 | Green 600 |
| 5 | Orange 200 | Orange 400 |
| 6 | Indigo 400 | Indigo 600 |

Chart consumers should be able to override the series tokens without importing
the entire raw extended palette.

## Other foundational scales

### Spacing

Current components use spacing values corresponding to Tailwind steps:

```text
0, 0.5, 1, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 6, 8, 12, 16, 24, 40
```

The irregular values are mostly internal control and icon alignment. The public
spacing interface should be semantic:

```css
--sds-space-0: 0;
--sds-space-2xs: 0.125rem;
--sds-space-xs: 0.25rem;
--sds-space-sm: 0.5rem;
--sds-space-md: 0.75rem;
--sds-space-lg: 1rem;
--sds-space-xl: 1.5rem;
--sds-space-2xl: 2rem;
--sds-space-3xl: 3rem;
--sds-space-4xl: 4rem;
```

Component-specific values such as very wide application-shell gutters should
be private recipe tokens, not additions to the global spacing scale.

### Typography

Current components use `xs`, `sm`, `md`, `base`, `lg`, `xl`, and `2xl` through
`6xl`, while the existing typography recipes define headings, lead text, body
text, and two caption levels. Preserve the semantic recipes:

```css
.sds-heading-1 {}
.sds-heading-2 {}
.sds-heading-3 {}
.sds-heading-4 {}
.sds-heading-5 {}
.sds-heading-6 {}
.sds-text-lead {}
.sds-text-body {}
.sds-text-caption {}
.sds-text-overline {}
.sds-prose {}
.sds-prose[data-size="sm"] {}
```

The theme may continue selecting Open Sans for Forge and Source Serif for
Plaid headings. Font files should be offered separately and included by the
complete `sds.css` bundle.

### Radius

Current components use `none`, `sm`, `md`, `lg`, `xl`, `full`, and
theme-relative radius utilities. The public interface only needs:

```css
--sds-radius-sm
--sds-radius-md
--sds-radius-lg
--sds-radius-full
--sds-radius-control
--sds-radius-container
```

Forge can map these to rounded values and Plaid can map the theme-relative
values to zero.

### Elevation

Current usage includes `sm`, `md`, `lg`, `xl`, and inset shadows. Expose
semantic elevation:

```css
--sds-shadow-raised
--sds-shadow-overlay
--sds-shadow-inset
```

### Motion

Current components use durations from 50ms through 300ms. A smaller public
scale is sufficient:

```css
--sds-duration-fast: 75ms;
--sds-duration-normal: 150ms;
--sds-duration-slow: 250ms;
--sds-easing-standard
--sds-easing-enter
--sds-easing-exit
```

The existing shake, pulse, and spin behavior can remain recipe-specific.

### Breakpoints

Current component implementations use `sm`, `md`, `lg`, `xl`, and `2xl`
responsive variants. Retain those five breakpoints in the build implementation.
The custom 390px `xs` breakpoint is not currently used as a component
responsive variant and does not need to become part of the public contract.

Prefer container queries inside reusable recipes so their layout responds to
available space rather than the application viewport.

## Web Components behavior layer

### Initial core

The first JavaScript release should remain deliberately small:

```text
<dialog class="sds-dialog">
<dialog class="sds-panel">
<sds-dropdown>
<sds-tabs>
<sds-toast>
```

Native dialogs and Popover own top-layer behavior and light dismissal. The
small enhancement modules add consistent command handling, selection,
keyboard navigation, placement, and toast timing.

`<sds-combobox>` should follow only after native form participation,
autocomplete semantics, validation, and server-rendered fallback behavior are
fully specified. Calendar, datepicker, data table, charts, file uploader,
application shell, and navigation composites should not be in the first core.

### Element interface rules

Custom elements should:

- Consume complete server-rendered semantic light DOM
- Leave the authored DOM shape unchanged during registration and reconnection
- Reflect observable state to attributes
- Emit bubbling and composed `CustomEvent`s
- Use native `<dialog>`, Popover, `<details>`, and top-layer behavior where
  appropriate
- Avoid teleporting content to `body`, which can escape local theme scopes
- Avoid framework-specific two-way binding conventions
- Avoid `:defined` as a requirement for correct initial presentation

Example:

```html
<button commandfor="delete-confirmation" command="show-modal">
  Delete record
</button>

<dialog
  id="delete-confirmation"
  class="sds-dialog"
  closedby="any"
  aria-labelledby="delete-heading"
>
  <h2 id="delete-heading">Delete record?</h2>
  <p>This action cannot be undone.</p>
  <div class="sds-dialog-footer">
    <button
      class="sds-button"
      commandfor="delete-confirmation"
      command="close"
    >
      Cancel
    </button>
    <button
      class="sds-button"
      data-variant="primary"
      data-tone="danger"
      commandfor="delete-confirmation"
      command="close"
      data-return-value="delete"
    >
      Delete
    </button>
  </div>
</dialog>
```

The dialog's stable interface includes:

```text
Element: native HTMLDialogElement
Classes: sds-dialog or sds-panel
Attributes: open, closedby, size, side, aria-labelledby, aria-describedby
Commands: show, show-modal, close, request-close
Methods: show(), showModal(), close(), requestClose()
Events: sds-open, sds-close, sds-cancel
```

## Distribution and compatibility

Publish immutable, versioned assets:

```text
/sds/5.0.0/sds.min.css
/sds/5.0.0/sds.min.js
/sds/5.0.0/tokens.min.css
/sds/5.0.0/foundations.min.css
/sds/5.0.0/components.min.css
/sds/5.0.0/layout.min.css
/sds/5.0.0/themes/forge.min.css
/sds/5.0.0/themes/plaid.min.css
/sds/5.0.0/elements/dialog.js
/sds/5.0.0/elements/tabs.js
/sds/5.0.0/visualization.min.css
/sds/5.0.0/assets/...
```

An unversioned `latest` alias may be provided for prototypes, but production
documentation should always use a pinned version and provide Subresource
Integrity hashes.

The JavaScript distribution should:

- Be native ESM
- Bundle runtime dependencies
- Avoid `eval` and runtime template compilation
- Avoid inline event handlers
- Register custom elements idempotently
- Resolve asset and dynamic-import URLs relative to the module
- Provide one auto-registering convenience bundle and individual element
  modules

The CSS distribution should:

- Contain compiled browser CSS, not Tailwind directives
- Require no source scanner or consumer build step
- Avoid broad global resets outside `[data-sds-root]`
- Keep all selectors in cascade layers
- Preserve logical properties and writing-mode compatibility
- Work without JavaScript

## Proposed repository structure

```text
packages/
  tokens/
    src/
    dist/
  styles/
    src/
      foundations/
      recipes/
      layout/
      themes/
  elements/
    src/
      dialog/
      tabs/
      menu/
      popover/
      tooltip/
      toast/
  visualization/
  adapters/
    vue/
    react/
  docs/
  integration-tests/
    vanilla/
    python/
    react/
    vue/
    svelte/
```

The plain HTML integration should be canonical. Framework examples should
demonstrate that no adapter is required.

## Migration plan

1. **Inventory and freeze the current public interface.** Record shipped
   classes, custom properties, Vue properties, events, slots, themes, and
   accessibility behavior. Mark each as retained, replaced, deprecated, or
   excluded.
2. **Create semantic tokens.** Place semantic color, typography, spacing,
   radius, elevation, and motion tokens over the existing primitive values.
3. **Build static CSS artifacts.** Compile the existing Tailwind-authored source
   during release so consumers receive ordinary CSS with no Tailwind peer
   dependency.
4. **Introduce the new selector interface.** Implement only the canonical
   selectors in this document so obsolete vocabulary does not expand the
   learning or maintenance surface.
5. **Move native visual recipes first.** Buttons, links, controls, badges,
   callouts, tables, typography, and layout provide immediate value without
   JavaScript.
6. **Build the small behavior core.** Start with dialog, tabs, menu,
   popover/tooltip, and toast. Port existing accessibility and focus behavior
   rather than porting Vue rendering code.
7. **Make the Vue library the first adapter.** Update current Vue components to
   consume the new CSS and, where appropriate, delegate behavior to the custom
   elements.
8. **Prove framework neutrality.** Maintain browser tests for static HTML,
   server-rendered Python templates, React, Vue, and Svelte.
9. **Extract optional modules.** Move charts and broad categorical colors into
   visualization artifacts. Keep application shells and other product-level
   composites outside the universal core until they demonstrate a stable,
   small interface.
10. **Publish a major-version migration guide.** Include old-to-new selector,
    property, event, and token mappings with an explicit deprecation window.

## Validation requirements

The design system should be tested through the same browser interface that
consumers use:

- Plain HTML with CSS only
- Plain HTML with the complete JavaScript bundle
- Python-rendered HTML without a frontend build
- React, Vue, and Svelte rendering custom elements
- Keyboard-only operation
- Screen-reader-oriented role, name, state, and relationship assertions
- Automated accessibility checks
- Light, dark, Forge, and Plaid visual snapshots
- Reduced-motion behavior
- Forms, validation, and autofill
- Content Security Policy without `unsafe-eval`
- CDN cache headers, SRI, and immutable version URLs

Size budgets should be established before implementation. The full CSS and
JavaScript bundles should be measured independently, and individual element
modules should remain useful for consumers that cannot accept the complete
bundle.

## Decisions to avoid

- Do not rewrite every Vue component as a custom element.
- Do not ship Tailwind's browser runtime compiler.
- Do not require framework wrappers.
- Do not expose every internal utility as public consumer interface.
- Do not use closed shadow roots.
- Do not replace native form controls without a demonstrated accessibility and
  form-participation need.
- Do not make hue names the primary interface for semantic feedback.
- Do not force themes to live on `body`.
- Do not publish only an unversioned CDN URL.
- Do not make charts and application shells part of the first universal core.

The recommended first release is therefore a complete static styling system
with semantic tokens and native-HTML recipes, plus approximately six deeply
designed behavioral custom elements. This provides immediate CDN usability
while avoiding a second framework-specific implementation of the current
component catalog.
