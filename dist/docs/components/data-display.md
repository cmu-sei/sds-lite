# Data display

[Documentation](../README.md) / [Components](./README.md) / Data display

## Avatar

Use an image when a portrait is available:

```html
<img
  class="sds-avatar"
  src="/people/alex-morgan.jpg"
  alt="Alex Morgan"
>
```

Use text initials when there is no image. Supply the full name as the
accessible label; SDS Lite does not derive initials from names:

```html
<span
  class="sds-avatar"
  role="img"
  data-sds-tone="accent"
  aria-label="Alex Morgan"
>
  AM
</span>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-size` | `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-sds-shape` | `circle`, `square`, `portrait` | `circle` |
| `data-sds-variant` | `subtle`, `solid`, `outline` | `subtle` |
| `data-sds-tone` | Any semantic tone | Neutral |

Use empty `alt=""` only when the adjacent text already identifies the person.
An initials avatar needs `role="img"` and an `aria-label` unless equivalent
visible text is present.

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
        class="sds-avatar"
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

## Card

```html
<article class="sds-card">
  <p class="sds-card-label">Open findings</p>
  <h2>12</h2>
  <p>Three require your attention.</p>
</article>
```

`.sds-card` and `.sds-card-label` have no variants. Use an `<article>` when
the card is independently meaningful, `<section>` when it has a heading in the
current page outline, or `<div>` for a purely visual group.

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

`data-sds-size` accepts `sm`, `md`, `lg`, or `xl`. Use `xl` for a primary
metric in a dashboard summary or report hero; smaller sizes are preferable
when several metrics appear together. `data-sds-tone` accepts every semantic
tone.

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

`data-sds-divided` adds separators. Omit `.sds-list-marker` for a single-column
item. Set a consistent marker column when needed:

```html
<ol class="sds-list" style="--sds-list-marker-width: 2rem">
  ...
</ol>
```

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

Each item accepts any semantic tone. Mark the current event with
`aria-current="step"`.

| Option | Target | Values | Default |
|---|---|---|---|
| `data-sds-orientation` | `.sds-timeline` | `horizontal`, `vertical` | `vertical` |
| `data-sds-tone` | `.sds-timeline-item` | All semantic tones | Unaccented |

For a horizontal sequence, set `data-sds-orientation="horizontal"` and
`tabindex="0"` on `.sds-timeline`. The tab stop lets keyboard users reach
content that overflows the viewport.

Replace a generated dot with a direct marker:

```html
<li class="sds-timeline-item">
  <span class="sds-timeline-marker" aria-hidden="true">&#10003;</span>
  <h3>Complete</h3>
</li>
```

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

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on table | `sm`, `md`, `lg` | `md` |
| `data-sds-standalone` on table | Presence | No raised shadow |
| `data-sds-row-highlight` on table | Presence | No hover surface |
| `data-sds-sticky` on cells | `start`, `end` | Normal cell |

Apply the same `data-sds-sticky` value to the header and every cell in that
column. Table size changes header, body, and footer row density together. Use
`.sds-table-container` whenever content can exceed the viewport.

Keep visually hidden headers in the accessibility tree:

```html
<thead class="sds-sr-only">
  <tr>
    <th scope="col">Name</th>
    <th scope="col">Status</th>
  </tr>
</thead>
```
