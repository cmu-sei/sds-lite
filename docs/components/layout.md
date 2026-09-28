# Layout

[Documentation](../README.md) / [Components](./README.md) / Layout

## Responsive composition

SDS Lite favors layouts that respond to their own available space instead of
viewport-specific utility variants. Start with the smallest interface that
describes the content:

| Need | Use |
|---|---|
| Cards or fields that should add columns when space permits | `.sds-grid` |
| A row that should stack when its container becomes narrow | `.sds-flex[data-sds-stack-at]` |
| Content that is always vertical | `.sds-stack` |
| Fluid gap or padding between supported bounds | Authored CSS with `clamp()` and SDS spacing tokens |
| An unusual structural threshold | A small authored container query |

Grid and flex respond to the space available to the layout, so the same markup
works in a page, sidebar, dialog, or embedded region. Use media queries for
viewport-owned behavior such as application navigation, not as the default way
to compose local content.

### Fluid spacing

Use a documented option when one token value is enough. When spacing should
grow gradually, override the standard CSS property with bounded token values:

```css
.project-grid {
  gap: clamp(
    var(--sds-space-md),
    2vw,
    var(--sds-space-xl)
  );
}
```

Unlayered application CSS overrides SDS Lite's layered defaults without
specificity escalation. `clamp()` is best for scalar values such as `gap` and
`padding`; use grid, flex, or a container query for structural changes.

### Custom thresholds

The built-in flex thresholds cover most compositions. When content has a
specific minimum width that does not match them, keep that decision local:

```html
<div class="sds-flex report-actions">
  <button type="button">Export report</button>
  <button type="button">Create report</button>
</div>
```

```css
.report-actions {
  container-type: inline-size;
  flex-wrap: wrap;
}

@container (max-width: 36rem) {
  .report-actions > * {
    flex-basis: 100%;
  }
}
```

Prefer this local escape hatch over adding application-specific responsive
attributes to SDS Lite.

## Grid

`.sds-grid` creates responsive equal-width columns:

```html
<div class="sds-grid">
  <article class="sds-card">First</article>
  <article class="sds-card">Second</article>
  <article class="sds-card">Third</article>
</div>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-columns` | `1`, `2`, `3`, `4`, `5`, `6` | Automatic fit |
| `data-sds-min-column-width` | `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-sds-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` | `lg` |
| `data-sds-place-items` | `start`, `center`, `end`, `stretch` | `stretch` |
| `data-sds-column-span` on a direct child | `full` | One column |
| `data-sds-place-self` on a direct child | `start`, `center`, `end`, `stretch` | Inherits the grid |

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
column would otherwise become narrower than `18rem`. Vertical orientation
creates one column, takes precedence over both, and keeps its rows packed at
their intrinsic height instead of stretching them to fill a taller container.

Use `data-sds-column-span="full"` when one direct child, such as a file upload
or summary, should occupy every available grid column.

Use `data-sds-place-items` to align every item within its grid area on both
axes. Add `data-sds-place-self` to a direct child when one item needs different
alignment:

```html
<div class="sds-grid" data-sds-place-items="center">
  <span class="sds-badge">Centered</span>
  <span class="sds-badge" data-sds-place-self="end">End aligned</span>
</div>
```

Both attributes intentionally accept a single logical value. For independent
axis control or track distribution, use authored layout CSS rather than
expanding the utility interface with the full CSS Box Alignment grammar.

## Flex

```html
<div
  class="sds-flex"
  data-sds-stack-at="md"
  data-sds-align="center"
  data-sds-justify="between"
  data-sds-gap="sm"
>
  <div data-sds-grow>Uses remaining space</div>
  <button type="button" data-sds-no-shrink>Action</button>
</div>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-sds-wrap` | Presence | No wrapping |
| `data-sds-stack-at` | `sm`, `md`, `lg`, `xl` | No automatic stacking |
| `data-sds-align` | `start`, `center`, `end`, `stretch` | `stretch` |
| `data-sds-justify` | `start`, `center`, `end`, `between` | `start` |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` | `lg` |
| `data-sds-grow` on a direct child | Presence | Content-sized |
| `data-sds-no-shrink` on a direct child | Presence | May shrink |

`data-sds-stack-at` keeps direct children in a row while they have enough
space and gives each child a full row when the flex container reaches the
selected width:

| Value | Stack at or below |
|---|---:|
| `sm` | `30rem` |
| `md` | `40rem` |
| `lg` | `48rem` |
| `xl` | `64rem` |

```html
<header
  class="sds-flex"
  data-sds-stack-at="md"
  data-sds-align="center"
  data-sds-justify="between"
>
  <div>
    <h1>Projects</h1>
    <p>Manage active projects.</p>
  </div>
  <div class="sds-action-group">
    <button type="button">Import</button>
    <button type="button">New project</button>
  </div>
</header>
```

The threshold uses the flex container's own available width, so the same
markup works in a full page, sidebar, dialog, or embedded region. It does not
depend on the viewport. Explicit vertical orientation remains vertical at
every width.

## Stack

Use `.sds-stack` for intrinsic vertical content instead of configuring a grid
or flex layout:

```html
<article class="sds-card sds-stack" data-sds-gap="xl">
  <h2>Project details</h2>
  <p>Review the project before continuing.</p>
  <div class="sds-action-group">...</div>
</article>
```

`data-sds-gap` accepts the shared gap scale and defaults to `lg`.
`data-sds-align` accepts `start`, `center`, `end`, or `stretch`, and defaults
to `stretch`.

## Spacing utilities

Add tokenized margin or padding to any element without writing CSS:

```html
<section
  data-sds-padding="lg"
  data-sds-margin-block-end="xl"
>
  Section content
</section>
```

Every spacing attribute accepts:

```text
none | 2xs | xs | sm | md | lg | xl | 2xl | 3xl | 4xl
```

`none` removes the selected spacing. The other values use the corresponding
[`--sds-space-*` token](../reference/css.md#spacing).

| Padding | Margin | Sides |
|---|---|---|
| `data-sds-padding` | `data-sds-margin` | Every side |
| `data-sds-padding-block` | `data-sds-margin-block` | Block start and end |
| `data-sds-padding-inline` | `data-sds-margin-inline` | Inline start and end |
| `data-sds-padding-block-start` | `data-sds-margin-block-start` | Usually top |
| `data-sds-padding-block-end` | `data-sds-margin-block-end` | Usually bottom |
| `data-sds-padding-inline-start` | `data-sds-margin-inline-start` | Usually left |
| `data-sds-padding-inline-end` | `data-sds-margin-inline-end` | Usually right |

Logical directions adapt automatically to the page's writing direction. In a
right-to-left language, for example, `inline-start` is the right side.

Combine attributes from broadest to most specific:

```html
<div
  data-sds-padding="lg"
  data-sds-padding-block="sm"
  data-sds-padding-block-start="none"
>
  No padding at the top, small padding at the bottom, and large padding
  at the sides.
</div>
```

One-sided attributes override axis attributes, and axis attributes override
the all-sides attribute. Spacing utilities also override spacing supplied by
an SDS recipe, while unlayered application CSS can override the utility as
usual. For unusual values, use standard CSS with an SDS token:

```html
<div style="margin-block-start: calc(var(--sds-space-lg) * 1.5)">
  Custom spacing
</div>
```

## Page and section

`.sds-page` centers content at a maximum width of 80rem and supplies section
spacing. `.sds-page-header` is the sticky application title and action row.
It wraps actions naturally as space narrows and stacks below 40rem.
`.sds-section-header` aligns section context and actions. The default rhythm
uses 4XL space between page sections, 2XL space within a section, and 2XL card
padding that reduces to XL on narrow screens.

```html
<main>
  <header class="sds-page-header">
    <div>
      <p class="sds-eyebrow">Project</p>
      <h1>Overview</h1>
    </div>
    <div class="sds-action-group">
      <button type="button">Create review</button>
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

This layout stacks at viewport widths of 64rem or less. Do not add `popover`
to a contained standalone sidebar. Override its desktop width on the layout:

```html
<div class="sds-sidebar-layout" style="--sds-sidebar-width: 22rem">
```

## SEI application shells

Specialized shells require:

```js
import '@cmu-sei/sds-lite/brand.css'
```

`.sds-app` supports:

| `data-sds-variant` | Purpose |
|---|---|
| `application` or omitted | Tool-like UI with persistent desktop and popover mobile sidebar |
| `simple` | Application framing without a sidebar |
| `brochure` | Public Plaid site with CMU/SEI masthead and footer |

### Application shell

```html
<div class="sds-app">
  <header class="sds-app-mobile-header">
    <button
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
          class="sds-sidebar-close"
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
        <button type="button" data-sds-variant="text">Discard</button>
        <button type="button">Save</button>
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
      <button type="button" data-sds-density="compact" data-sds-variant="text">Alex Morgan</button>
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
