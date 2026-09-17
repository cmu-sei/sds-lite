# Prose

[Documentation](../README.md) / [Components](./README.md) / Prose

Import `sds.css` or the selective `prose.css` stylesheet, then add
`.sds-prose` to a long-form content container:

```html
<article class="sds-prose">
  <h1>Article title</h1>
  <p class="sds-prose-lead">A short introduction to the article.</p>

  <p>
    Body text supports <a href="/details">links</a>,
    <strong>strong text</strong>, <em>emphasis</em>,
    <code>inline code</code>, and <kbd>keyboard input</kbd>.
  </p>

  <blockquote>A quotation with semantic emphasis.</blockquote>

  <h2>Details</h2>
  <ul>
    <li>Lists and nested content</li>
    <li>Consistent readable spacing</li>
  </ul>

  <pre><code>const ready = true</code></pre>

  <figure>
    <img src="/diagram.png" alt="Request flow">
    <figcaption>How a request moves through the system.</figcaption>
  </figure>
</article>
```

Supported semantic descendants include:

```text
h1-h6, p, a, strong, b, em, kbd, code, pre, blockquote,
ol, ul, li, dl, dt, dd, figure, figcaption, picture, img,
svg, video, hr, table, caption, thead, tbody, tfoot, tr, th, td
```

| Option | Values | Default |
|---|---|---|
| `data-size` | `sm`, `md` | `md` |
| `data-tone` | All semantic tones | Neutral text links |
| `data-sds-theme` | `forge`, `plaid` | Inherited |
| `.sds-prose-lead` | Introductory text | Normal paragraph |
| `.sds-not-prose` | Excluded subtree | Prose styles apply |

Use `.sds-not-prose` when embedding another SDS recipe:

```html
<article class="sds-prose">
  <p>Article text.</p>
  <aside class="sds-callout sds-not-prose" data-tone="info">
    <strong>Related information</strong>
    <span>This callout keeps its own typography.</span>
  </aside>
</article>
```

Write a useful heading hierarchy, descriptive link text, alternative text for
meaningful images, captions for data tables, and language metadata for the
document. Prose styling does not replace content accessibility.
