# Layout

[Documentation](../README.md) / [Components](./README.md) / Layout

Find: [Grid](#grid), [Cluster](#cluster), [Stack](#stack), [spacing](#spacing-utilities),
[page](#page-and-section), [sidebar](#standalone-sidebar), or [SEI shells](#sei-application-shells).

Choose Grid for columns, Cluster for wrapping rows, and Stack for vertical flow.
For fluid spacing or custom thresholds, see [responsive composition](#responsive-composition).

## Grid

`.sds-grid` creates responsive equal-width columns and can shrink safely when
nested in a flex or grid parent:

```html
<div class="sds-grid">
  <article class="sds-card">First</article>
  <article class="sds-card">Second</article>
  <article class="sds-card">Third</article>
</div>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-columns` | `1`, `2`, `3`, `4`, `5`, `6` | Automatic fit |
| `data-sds-min-column-width` | `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` | `lg` |
| `data-sds-column-span` on a direct child | `full` | One column |

The automatic grid chooses its column count from the space available to the
grid, rather than the viewport. Use `data-sds-min-column-width` to describe
how much room each column's content needs:

| Value | Minimum column width |
|---|---:|
| `sm` | `10rem` |
| `md` | `14rem` |
| `lg` | `18rem` |
| `xl` | `24rem` |
| `2xl` | `32rem` |

### Accessibility

Keep content in reading order and test reflow at narrow widths and zoom.
Do not use visual column placement to imply a different sequence.

### More examples

```html
<div
  class="sds-grid"
  data-sds-columns="3"
  data-sds-min-column-width="lg"
>
  <article class="sds-card">First</article>
  <article class="sds-card">Second</article>
  <article class="sds-card">Third</article>
</div>
```

By itself, `data-sds-columns` creates an exact column count. When combined
with `data-sds-min-column-width`, it becomes the maximum column count: the
example above uses up to three columns and collapses to two or one when each
column would otherwise become narrower than `18rem`.

Use `data-sds-column-span="full"` when one direct child, such as a file upload
or summary, should occupy every available grid column.

For item alignment, custom tracks, or other application-specific grid behavior,
use authored CSS. SDS Lite intentionally does not mirror the full CSS Grid
interface through attributes.

### Related

[Card](./data-display.md#card), [Cluster](#cluster), [custom thresholds](#custom-thresholds).

## Cluster

```html
<div
  class="sds-cluster"
  data-sds-stack-at="md"
  data-sds-gap="sm"
>
  <span class="sds-badge">Research</span>
  <span class="sds-badge">Engineering</span>
  <button class="sds-button" type="button">Add team</button>
</div>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-stack-at` | `sm`, `md`, `lg`, `xl` | No automatic stacking |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` | `lg` |

Cluster is a wrapping flex row. It arranges related items horizontally, centers
them on the cross axis, and wraps when necessary. `data-sds-stack-at` gives
each direct child a full row when the cluster reaches the selected width:

| Value | Stack at or below |
|---|---:|
| `sm` | `30rem` |
| `md` | `40rem` |
| `lg` | `48rem` |
| `xl` | `64rem` |

### Accessibility

Keep related items in meaningful DOM order when they wrap or stack.

### More examples

```html
<header
  class="sds-cluster"
  data-sds-stack-at="md"
>
  <div>
    <h1>Projects</h1>
    <p>Manage active projects.</p>
  </div>
  <div class="sds-action-group">
    <button class="sds-button" type="button">Import</button>
    <button class="sds-button" type="button">New project</button>
  </div>
</header>
```

The threshold uses the cluster's own available width, so the same
markup works in a full page, sidebar, dialog, or embedded region. It does not
depend on the viewport. Use authored CSS when an application needs different
alignment or distribution.

### Related

[Action group](./actions.md#action-group), [Grid](#grid), [Stack](#stack).

## Stack

Use `.sds-stack` for vertical content flow instead of configuring a Grid or
Cluster:

```html
<article class="sds-card sds-stack" data-sds-gap="xl">
  <h2>Project details</h2>
  <p>Review the project before continuing.</p>
  <div class="sds-action-group">...</div>
</article>
```

### Options

`data-sds-gap` accepts the shared gap scale and defaults to `lg`.

### Accessibility

Use semantic containers and a meaningful heading hierarchy; Stack only supplies layout.

### Related

[Card](./data-display.md#card), [spacing utilities](#spacing-utilities).

## Spacing utilities

Add tokenized margin or padding without a build step or application stylesheet:

```html
<section
  data-sds-padding="lg"
  data-sds-margin-block-end="xl"
>
  Section content
</section>
```

### Options

Every spacing attribute accepts:

```text
none | 2xs | xs | sm | md | lg | xl | 2xl | 3xl | 4xl
```

| Padding | Margin | Sides |
|---|---|---|
| `data-sds-padding` | `data-sds-margin` | Every side |
| `data-sds-padding-block` | `data-sds-margin-block` | Block axis |
| `data-sds-padding-inline` | `data-sds-margin-inline` | Inline axis |
| `data-sds-padding-block-start` | `data-sds-margin-block-start` | Block start |
| `data-sds-padding-block-end` | `data-sds-margin-block-end` | Block end |
| `data-sds-padding-inline-start` | `data-sds-margin-inline-start` | Inline start |
| `data-sds-padding-inline-end` | `data-sds-margin-inline-end` | Inline end |

The explicit logical names remain understandable without remembering shorthand
and adapt to the document's writing direction. For unusual values, use
standard CSS with an SDS token.

### Accessibility

Test reflow and zoom when adding spacing, especially around controls.

### More examples

```html
<div style="margin-block-start: calc(var(--sds-space-lg) * 1.5)">
  Custom spacing
</div>
```

### Related

[Spacing tokens](../reference/css.md#spacing), [fluid spacing](#fluid-spacing).

## Page and section

```html
<main>
  <header class="sds-page-header">
    <div>
      <p class="sds-eyebrow">Project</p>
      <h1>Overview</h1>
    </div>
    <div class="sds-action-group">
      <button class="sds-button" type="button">Create review</button>
    </div>
  </header>

  <div class="sds-page">
    <section>
      <header class="sds-section-header">
        <div>
          <h2>Recent work</h2>
          <p>Changes made by your team.</p>
        </div>
      </header>
    </section>
  </div>
</main>
```

### Options

No recipe-specific options. `.sds-page` centers content at up to `80rem`.
`.sds-page-header` is a sticky title/action row that stacks below `40rem`;
`.sds-section-header` aligns section context and actions. Default spacing is
4XL between sections, 2XL within sections, and 2XL card padding (XL when narrow).

### Accessibility

Use one primary `main`, meaningful headings, and descriptive action names.
Check that sticky headers do not obscure focused content.

### Related

[Explicit typography](./prose.md#explicit-typography), [SEI shells](#sei-application-shells).

## Standalone sidebar

```html
<div class="sds-sidebar-layout">
  <aside class="sds-sidebar">
    <header><strong>Project Atlas</strong></header>
    <nav aria-label="Project">
      <ul>
        <li><a href="/" aria-current="page">Overview</a></li>
        <li><a href="/team">Team</a></li>
      </ul>
    </nav>
  </aside>
  <main>Project content</main>
</div>
```

### Options

This layout stacks at viewport widths of `64rem` or less.
`--sds-sidebar-width` defaults to `18rem`; set it on the layout.

### Accessibility

Label navigation and mark the current page with `aria-current="page"`.
Do not add `popover` to a contained standalone sidebar.

### More examples

Override desktop width:

```html
<div class="sds-sidebar-layout" style="--sds-sidebar-width: 22rem">
```

### Related

[Application shell](#application-shell) for popover mobile navigation, [skip link](./navigation.md#skip-link).

## Responsive composition

Grid and Cluster respond to their own available width, so the same markup works
in a page, sidebar, or dialog. Use media queries for viewport-owned behavior
such as application navigation, not as the default for local composition.

### Primitive names

Grid means responsive columns; Cluster means a wrapping row; Stack means
vertical flow. These are patterns, not exhaustive CSS Grid or Flexbox APIs.
Use authored CSS for custom tracks, alignment, distribution, growth, or shrinking.

### Fluid spacing

Use an option for fixed token spacing and bounded CSS for fluid spacing:

```css
.project-grid {
  gap: clamp(var(--sds-space-md), 2vw, var(--sds-space-xl));
}
```

Unlayered application CSS overrides SDS defaults. Use `clamp()` for scalar
values such as gap and padding, and container queries for structural changes.

### Custom thresholds

Keep content-specific thresholds local:

```html
<div class="sds-cluster report-actions">
  <button class="sds-button" type="button">Export report</button>
  <button class="sds-button" type="button">Create report</button>
</div>
```

```css
.report-actions { container-type: inline-size; }

@container (max-width: 36rem) {
  .report-actions > * { flex-basis: 100%; }
}
```

## SEI application shells

Specialized shells require:

```js
import '@cmu-sei/sds-lite/brand.css'
```

### Options

`.sds-app` supports:

| `data-sds-variant` | Purpose |
|---|---|
| `application` or omitted | Tool-like UI with persistent desktop and popover mobile sidebar |
| `simple` | Application framing without a sidebar |
| `brochure` | Public Plaid site with CMU/SEI masthead and footer |

### Accessibility

Label navigation and icon controls, use a main landmark and skip link, and
mark the current page. Preserve required brand and legal content. Mobile
sidebar behavior also needs [JavaScript setup](../installation/npm.md#recommended-setup).

### Application shell

```html
<div class="sds-app">
  <header class="sds-app-mobile-header">
    <button class="sds-button"
      type="button"
      data-sds-shape="icon"
      popovertarget="project-sidebar"
      aria-label="Open navigation"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M4 6h16M4 12h16M4 18h16"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="2"
        ></path>
      </svg>
    </button>
    <a class="sds-app-brand" href="/">
      <span class="sds-app-brand-prefix">SEI</span>
      Project Atlas
    </a>
  </header>

  <div class="sds-app-layout">
    <aside
      id="project-sidebar"
      class="sds-sidebar"
      popover="auto"
      aria-label="Project navigation"
    >
      <header>
        <a class="sds-app-brand" href="/">
          <span class="sds-app-brand-prefix">SEI</span>
          Project Atlas
        </a>
        <button
          type="button"
          class="sds-sidebar-close sds-button"
          data-sds-shape="icon"
          popovertarget="project-sidebar"
          popovertargetaction="hide"
          aria-label="Close navigation"
        >
          &times;
        </button>
      </header>
      <nav aria-label="Project">
        <ul>
          <li><a href="/" aria-current="page">Overview</a></li>
          <li>
            <details open>
              <summary>Reviews</summary>
              <ul>
                <li><a href="/reviews/open">Open reviews</a></li>
                <li><a href="/reviews/complete">Completed reviews</a></li>
              </ul>
            </details>
          </li>
        </ul>
      </nav>
      <footer>Signed in as Alex</footer>
    </aside>

    <div class="sds-app-body">
      <main class="sds-app-main">
        <header class="sds-page-header"><h1>Overview</h1></header>
        <div class="sds-page">Page content</div>
      </main>
      <footer class="sds-app-footer">
        <div class="sds-app-footer-content">
          <div class="sds-app-footer-brand">
            <a href="https://sei.cmu.edu" aria-label="Software Engineering Institute">
              <span class="sds-sei-wordmark" aria-hidden="true"></span>
            </a>
          </div>
          <div class="sds-app-footer-middle">Application information</div>
          <div class="sds-app-footer-legal">
            <p>&copy; <time datetime="2026">2026</time> Carnegie Mellon University</p>
            <p>Proprietary. SEI Internal Use Only</p>
          </div>
        </div>
      </footer>
      <aside class="sds-app-action-bar" aria-label="Pending changes">
        <span>You have unsaved changes.</span>
        <button class="sds-button" type="button" data-sds-variant="text">Discard</button>
        <button class="sds-button" type="button">Save</button>
      </aside>
    </div>
  </div>
</div>
```

The desktop sidebar and mobile header remain fixed while `.sds-app-body`
scrolls. `popover="auto"` lets the same sidebar become a light-dismiss mobile
surface. Match `popovertarget` to the sidebar `id`. Mark the current page with
`aria-current="page"`. The sidebar animates when opened and disappears
with the matching exit motion when explicitly closed. An already-closed
desktop sidebar disappears immediately when the layout crosses into the mobile
breakpoint.

Keep the footer brand and both legal paragraphs. Render the current year from
the server or build. The wordmark artwork is bundled; the empty span needs no
image URL.

### Simple application

```html
<div class="sds-app" data-sds-variant="simple">
  <header class="sds-app-header">
    <a class="sds-app-brand" href="/">
      <span class="sds-app-brand-prefix">SEI</span>
      Project Atlas
    </a>
    <div class="sds-action-group" aria-label="User actions">
      <button class="sds-button" type="button" data-sds-density="compact" data-sds-variant="text">Alex Morgan</button>
    </div>
  </header>
  <div class="sds-app-body">
    <main class="sds-app-main">
      <header class="sds-page-header"><h1>Settings</h1></header>
      <div class="sds-page">Page content</div>
    </main>
  </div>
</div>
```

### Brochure shell

The brochure shell uses Plaid-style serif headings and square corners. Add
`data-sds-theme="plaid"` when the shell should also use the complete Plaid
color palette. It composes `.sds-brochure-header`, `.sds-brochure-masthead`,
`.sds-brochure-navigation`, `.sds-brochure-main`, and the brochure footer
regions. Preserve the canonical CMU/SEI links, sponsorship language, legal
navigation, `.sds-cmu-wordmark`, and `.sds-sei-wordmark` from the SEI Design
System. Customize the organization subtitle, primary navigation, and page
content.

The runnable catalog in [`index.html`](../../index.html) contains the complete
brochure structure for copying and visual inspection.

### Related

[Standalone sidebar](#standalone-sidebar), [SEI token bridge](../guides/theming.md#sei-adoption),
[brand imports](../installation/npm.md#specialized-application-shells).
