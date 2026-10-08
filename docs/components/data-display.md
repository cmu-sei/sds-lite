# Data display

[Documentation](../README.md) / [Components](./README.md) / Data display

Find: [avatar](#avatar), [card](#card), [metric](#datapoint), [list](#list),
[timeline](#timeline), or [table](#table).

## Avatar

Use an image when a portrait is available:

```html
<img
  class="sds-avatar"
  src="/people/alex-morgan.jpg"
  alt="Alex Morgan"
>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-sds-shape` | `circle`, `square`, `portrait` | `circle` |
| `data-sds-variant` | `subtle`, `solid`, `outline` | `subtle` |
| `data-sds-tone` | Any semantic tone | Neutral |

### Accessibility

Use empty `alt=""` only when the adjacent text already identifies the person.
An initials avatar needs `role="img"` and an `aria-label` unless equivalent
visible text is present.

### More examples

SDS Lite does not derive initials from names:

```html
<span class="sds-avatar" role="img" data-sds-tone="accent" aria-label="Alex Morgan">
  AM
</span>
```

### Avatar group

An avatar group is a list of people, not a generated image collection:

```html
<ul class="sds-avatar-group" aria-label="Reviewers">
  <li>
    <span
      class="sds-avatar"
      role="img"
      data-sds-tone="accent"
      aria-label="Alex Morgan"
    >
      AM
    </span>
  </li>
  <li>
    <span
      class="sds-avatar"
      role="img"
      data-sds-tone="success"
      aria-label="Sam Rivera"
    >
      SR
    </span>
  </li>
  <li>
    <sds-dropdown placement="block-end-end" width="sm" hide-caret>
      <button
        class="sds-avatar sds-button"
        type="button"
        aria-label="View 4 more reviewers"
      >+4</button>
      <menu>
        <li>
          <a href="/people/casey-kim">
            <span
              class="sds-avatar"
              data-sds-size="xs"
              data-sds-tone="info"
              aria-hidden="true"
            >CK</span>
            <span>Casey Kim</span>
          </a>
        </li>
        <li>
          <a href="/people/riley-jones">
            <span
              class="sds-avatar"
              data-sds-size="xs"
              data-sds-tone="success"
              aria-hidden="true"
            >RJ</span>
            <span>Riley Jones</span>
          </a>
        </li>
      </menu>
    </sds-dropdown>
  </li>
</ul>
```

Add `data-sds-density="condensed"` to increase overlap. Applications decide how
many people to show. Compose the existing dropdown for the overflow list;
hovering avatars does not change their stacking order.

### Related

[Dropdown menu](./navigation.md#dropdown-menu), [badge](./feedback.md#badge).

## Card

```html
<article class="sds-card">
  <p class="sds-card-label">Open findings</p>
  <h2 class="sds-text-h3">12</h2>
  <p>Three require your attention.</p>
</article>
```

For a clickable card, add `.sds-card-link` to its primary link:

```html
<article class="sds-card sds-stack" data-sds-gap="md">
  <h2 class="sds-text-h3">
    <a class="sds-link sds-card-link" href="/projects/atlas">Project Atlas</a>
  </h2>
  <p>Security research and analysis.</p>
  <button class="sds-button" type="button">Archive</button>
</article>
```

The link covers the card without extra markup or JavaScript. Hover raises the
shadow, and keyboard focus outlines the card. Other links, buttons, and native
form controls remain independently operable without positioning classes.

### Options

`.sds-card`, `.sds-card-label`, and `.sds-card-link` have no variants. Compose
typography and spacing explicitly. Only cards containing a `.sds-card-link[href]`
receive the clickable-card behavior.

### Accessibility

Use `<article>` for independently meaningful content, `<section>` for a titled
region in the page outline, or `<div>` for a purely visual group.

Use one primary card link with descriptive text. Keep its wrappers unpositioned
so the link target spans the card. Do not wrap other interactive controls inside
the link. The overlay makes ordinary card text harder to select; for form-heavy
or text-heavy cards, prefer individual links and controls.

### Related

[Grid](./layout.md#grid), [datapoint](#datapoint).

## Datapoint

The label is followed by a `<div>` containing a `<strong>` value and optional
context:

```html
<div class="sds-datapoint" data-sds-size="lg" data-sds-tone="success">
  <span>Resolved findings</span>
  <div>
    <strong>104</strong>
    <span>this month</span>
  </div>
</div>
```

### Options

`data-sds-size` accepts `sm`, `md`, `lg`, or `xl`; `data-sds-tone` accepts all
semantic tones. See the [recipe reference](../reference/recipes.md) for defaults.
Use smaller sizes for several metrics and `xl` for a primary summary metric.

### Accessibility

Include a readable label, value, and any units. Explain meaning in text, not color alone.

### Related

[Card](#card), [measurement](./loading.md#progress-and-measurement).

## List

```html
<ul class="sds-list" data-sds-divided>
  <li class="sds-list-item">
    <span class="sds-list-marker" aria-hidden="true">1</span>
    <div>
      <h3>Application review</h3>
      <p>Review the submitted material.</p>
    </div>
  </li>
  <li class="sds-list-item">
    <span class="sds-list-marker" aria-hidden="true">2</span>
    <div>
      <h3>Decision</h3>
      <p>Record the final outcome.</p>
    </div>
  </li>
</ul>
```

### Options

`data-sds-divided` adds separators; they are absent by default. Omit
`.sds-list-marker` for single-column items. `--sds-list-marker-width` defaults to `auto`.

### Accessibility

Use an ordered list when sequence matters and an unordered list otherwise.
Hide decorative markers, but keep meaningful status in visible text.

### More examples

Set a consistent marker column when needed:

```html
<ol class="sds-list" style="--sds-list-marker-width: 2rem">
  ...
</ol>
```

### Related

[Timeline](#timeline), [disclosure](./navigation.md#disclosure).

## Timeline

```html
<ol class="sds-timeline">
  <li class="sds-timeline-item" data-sds-tone="success">
    <h3>Submitted</h3>
    <p>The package entered the review queue.</p>
    <time datetime="2026-09-17T09:00:00-04:00">9:00 AM</time>
  </li>
  <li class="sds-timeline-item" data-sds-tone="info" aria-current="step">
    <h3>Security review</h3>
    <p>The security team is reviewing the package.</p>
    <time datetime="2026-09-17T10:30:00-04:00">Now</time>
  </li>
</ol>
```

### Options

| Option | Target | Values | Default |
|---|---|---|---|
| `data-sds-orientation` | `.sds-timeline` | `horizontal`, `vertical` | `vertical` |
| `data-sds-tone` | `.sds-timeline-item` | All semantic tones | Unaccented |

### Accessibility

Mark the current event with `aria-current="step"` and use meaningful time text.
For a horizontal sequence, set `data-sds-orientation="horizontal"` and
`tabindex="0"` on `.sds-timeline`. The tab stop lets keyboard users reach
content that overflows the viewport.

### More examples

Replace a generated dot with a direct marker:

```html
<li class="sds-timeline-item">
  <span class="sds-timeline-marker" aria-hidden="true">&#10003;</span>
  <h3>Complete</h3>
</li>
```

### Related

[List](#list), [workflow steps](../guides/composition-patterns.md).

## Table

Use native structure, a caption, and scoped headers:

```html
<div class="sds-table-container">
  <table class="sds-table" data-sds-row-highlight>
    <caption>Project members</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col" data-sds-sticky="end">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alex Morgan</td>
        <td>Owner</td>
        <td data-sds-sticky="end">Active</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on table | `sm`, `md`, `lg` | `md` |
| `data-sds-density` on table | `compact` | Comfortable when omitted |
| `data-sds-standalone` on table | Presence | No raised shadow |
| `data-sds-row-highlight` on table | Presence | No hover surface |
| `data-sds-sticky` on cells | `start`, `end` | Normal cell |

Apply the same `data-sds-sticky` value to the header and every cell in that
column. Table size changes body-row padding: `sm` uses 4px, `md` uses 8px,
and `lg` uses 16px. Headers and footers retain their standard spacing.
`data-sds-density="compact"` overrides body-row padding to 4px at any size.
Row headers share the body cells' typography and surface.
Use `.sds-table-container` whenever content can exceed the viewport.
For a standalone table, add `data-sds-standalone` to the table inside that
container. The container shares the standard card's border, corners, surface,
and raised shadow, with no extra padding around the cells. Its frame includes
the native caption and remains intact when columns scroll horizontally.

Inside a spanning `<tfoot>` cell, `.sds-table-footer` places a
`.sds-pagination-status` count on the left, native `.sds-pagination` navigation
in the center, and an optional rows-per-page form on the right. The footer
wraps on narrow viewports. Applications supply the result count, page URLs,
and query handling; the recipe does not fetch or paginate data.

### Accessibility

Provide a caption and scoped headers. Do not convey row state by hover or color alone.

### More examples

Keep visually hidden headers in the accessibility tree:

```html
<thead class="sds-sr-only">
  <tr>
    <th scope="col">Name</th>
    <th scope="col">Status</th>
  </tr>
</thead>
```

### Related

[Pagination](./navigation.md#pagination), [sortable tables](../guides/composition-patterns.md).
