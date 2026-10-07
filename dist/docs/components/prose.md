# Prose

[Documentation](../README.md) / [Components](./README.md) / Prose

Find: [heading and text utilities](#explicit-typography) or [article typography](#document-typography).

## Explicit typography

Use the SEI typography utilities on any element. The class selects visual
appearance; the HTML element still determines document semantics.

```html
<h1 class="sds-text-h6">Compact page heading</h1>
<h2 class="sds-text-h1">Prominent section heading</h2>
<p class="sds-text-lead">A short introduction.</p>
<p class="sds-text-body">Body content.</p>
<p class="sds-text-caption1">An emphasized caption.</p>
<small class="sds-text-caption2">Supporting information.</small>
```

### Options

These utilities match the SEI `text-h1` through `text-h6`, `text-lead`,
`text-body`, `text-caption1`, and `text-caption2` font sizes and line heights.
Measurements below assume a `16px` root font size:

| Class | Small size / line height | Large size / line height |
|---|---|---|
| `.sds-text-h1` | 30px / 38px | 36px / 42px |
| `.sds-text-h2` | 24px / 28px | 30px / 36px |
| `.sds-text-h3` | 20px / 26px | 24px / 32px |
| `.sds-text-h4` | 18px / 20px | 20px / 28px |
| `.sds-text-h5` | 12px / 20px | 14px / 20px |
| `.sds-text-h6` | 12px / 20px | 14px / 20px |
| `.sds-text-lead` | 20px / 24px | 24px / 32px |
| `.sds-text-body` | 14px / 20px | 16px / 24px |
| `.sds-text-caption1` | 18px / 24px | 20px / 24px |
| `.sds-text-caption2` | 12px / 20px | 14px / 20px |

The default, also selected by `data-sds-size="md"`, switches to the large
scale at `48rem`. `sm` and `lg` keep a fixed scale.

Forge uses semibold sans-serif H1-H4 styles; Plaid uses regular serif styles.
H4 and H5 are uppercase. H5-H6 remain semibold body-font styles in both themes.
Captions are italic; caption 2 uses the semantic muted text color.

Typography utilities reset their element's margins and use zero letter spacing.
Compose spacing with stacks or spacing attributes instead of inheriting SEI
document margins. The utilities live in `sds.utilities`, so an explicit class
also overrides the corresponding default inside `.sds-prose`.

### Accessibility

Choose heading levels for document structure, independently of visual size.
Typography classes do not change semantics.

### More examples

Keep a fixed scale at any viewport:

```html
<h2 class="sds-text-h3" data-sds-size="sm">Compact panel heading</h2>
<p class="sds-text-body" data-sds-size="lg">Fixed body size.</p>
```

### Related

[Document typography](#document-typography), [spacing](./layout.md#spacing-utilities), [theme fonts](../guides/theming.md).

## Document typography

Add `.sds-prose` to a long-form content container:

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

### Options

Supported semantic descendants include:

```text
h1-h6, p, a, strong, b, em, kbd, code, pre, blockquote,
ol, ul, li, dl, dt, dd, figure, figcaption, picture, img,
svg, video, hr, table, caption, thead, tbody, tfoot, tr, th, td
```

| Option | Values | Default |
|---|---|---|
| `data-sds-size` | `sm`, `md`, `lg` | `md` |
| `data-sds-tone` | All semantic tones | Neutral text links |
| `data-sds-theme` | `forge`, `plaid` | Inherited |
| `.sds-prose-lead` | Introductory text | Normal paragraph |
| `.sds-not-prose` | Excluded subtree | Prose styles apply |

Use `sm` for narrow supporting documentation, `md` for general content, and
`lg` for editorial articles with an `18px` body size and a narrower readable
line length.

### Accessibility

Use a meaningful heading hierarchy, descriptive links, image alternatives,
table captions, and document language metadata. Styling does not replace content accessibility.

### More examples

Use `.sds-not-prose` when embedding another SDS recipe:

```html
<article class="sds-prose">
  <p>Article text.</p>
  <aside class="sds-callout sds-not-prose" data-sds-tone="info">
    <strong>Related information</strong>
    <span>This callout keeps its own typography.</span>
  </aside>
</article>
```

### Related

[Explicit typography](#explicit-typography), [callout](./feedback.md#callout), [accessibility](../guides/accessibility.md).
