# Layout

[Documentation](../README.md) / [Components](./README.md) / Layout

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
| `data-columns` | `1`, `2`, `3`, `4`, `5`, `6` | Automatic fit |
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `lg` |

The automatic grid uses a 14rem minimum column width. Exact column counts stay
exact; use the default when content must choose its own responsive count.
Vertical orientation creates one column and takes precedence over
`data-columns`.

## Flex

```html
<div
  class="sds-flex"
  data-wrap
  data-align="center"
  data-justify="between"
  data-gap="sm"
>
  <div data-grow>Uses remaining space</div>
  <button type="button" data-no-shrink>Action</button>
</div>
```

| Option | Values | Default |
|---|---|---|
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-wrap` | Presence | No wrapping |
| `data-align` | `start`, `center`, `end`, `stretch` | `stretch` |
| `data-justify` | `start`, `center`, `end`, `between` | `start` |
| `data-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `lg` |
| `data-grow` on a direct child | Presence | Content-sized |
| `data-no-shrink` on a direct child | Presence | May shrink |

## Page and section

`.sds-page` centers content at a maximum width of 80rem and supplies section
spacing. `.sds-page-header` is the sticky application title and action row.
`.sds-section-header` aligns section context and actions.

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

This layout stacks at viewport widths of 48rem or less. Do not add `popover`
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

| `data-variant` | Purpose |
|---|---|
| `application` or omitted | Tool-like UI with persistent desktop and popover mobile sidebar |
| `simple` | Application framing without a sidebar |
| `brochure` | Public Plaid site with CMU/SEI masthead and footer |

### Application shell

```html
<div class="sds-app" data-variant="application">
  <header class="sds-app-mobile-header">
    <button
      type="button"
      data-shape="icon"
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
          data-shape="icon"
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
        <button type="button" data-variant="ghost">Discard</button>
        <button type="button">Save</button>
      </aside>
    </div>
  </div>
</div>
```

The desktop sidebar and mobile header remain fixed while `.sds-app-body`
scrolls. `popover="auto"` lets the same sidebar become a light-dismiss mobile
surface. Match `popovertarget` to the sidebar `id`. Mark the current page with
`aria-current="page"`.

Keep the footer brand and both legal paragraphs. Render the current year from
the server or build. The wordmark artwork is bundled; the empty span needs no
image URL.

### Simple application

```html
<div class="sds-app" data-variant="simple">
  <header class="sds-app-header">
    <a class="sds-app-brand" href="/">
      <span class="sds-app-brand-prefix">SEI</span>
      Project Atlas
    </a>
    <div class="sds-action-group" aria-label="User actions">
      <button type="button" data-density="compact">Alex Morgan</button>
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

The brochure shell automatically uses the Plaid theme and square corners. It
composes `.sds-brochure-header`, `.sds-brochure-masthead`,
`.sds-brochure-navigation`, `.sds-brochure-main`, and the brochure footer
regions. Preserve the canonical CMU/SEI links, sponsorship language, legal
navigation, `.sds-cmu-wordmark`, and `.sds-sei-wordmark` from the SEI Design
System. Customize the organization subtitle, primary navigation, and page
content.

The runnable catalog in [`index.html`](../../index.html) contains the complete
brochure structure for copying and visual inspection.
