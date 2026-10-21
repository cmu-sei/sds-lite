# Theming and customization

[Documentation](../README.md) / Guides / Theming

## Choose a styling boundary

An SDS root is a themed region with inherited body typography. Page
presentation is a separate opt-in so embedded regions do not become page-sized.

| Interface | What it changes | Use it when | Omit it when |
|---|---|---|---|
| `data-sds-root` | Theme tokens, color scheme, and inherited body font, size, line height, and text color | Establishing an SDS region or an independent nested theme | Already inside the intended SDS root |
| `.sds-document` | Background, zero margin, and viewport minimum height; no typography changes | SDS owns the page | The host owns the background or embedded-region sizing |
| `.sds-prose` | Typography and spacing for semantic article content | Rendering articles or other long-form content | Styling application controls or preserving host article styles |

For a standalone page, put both on `<body>`:

```html
<body data-sds-root class="sds-document">
  <main class="sds-page">...</main>
</body>
```

For an embedded region, use `data-sds-root` alone. Text inherits the root's
body font; SDS controls inherit it too. Recipe classes such as `.sds-button`
still supply control appearance. Unmarked headings keep native sizing and
weight; explicit heading recipes use the theme's heading font. Add a nested
root only for an independent theme and inherited typography.

Roots do not paint a background. For embedded regions, match
`data-sds-color-scheme` to the host surface or override text and background
colors together to maintain contrast.

Heading levels still express structure:
`.sds-text-h1` through `.sds-text-h6` choose appearance independently.
Typography utilities switch scales at `48rem`; `data-sds-size="sm"` or
`"lg"` fixes the scale.

Compact UI titles use `.sds-text-title` instead: a viewport-independent
`1.25rem` / `1.75rem` size and line height (20px / 28px at a 16px root font
size), with medium-weight Forge or regular-weight Plaid styling shared with
dialog and panel defaults. This does not change the existing SEI heading scale.
See [UI titles](../components/prose.md#ui-titles).

SDS Lite references `"Open Sans"` and `"Source Serif"` but does not download
fonts. Load them in the host application when exact typography is required;
otherwise system fallbacks are used.

### Preserve host typography

Adding a root intentionally changes inherited typography, even without
`sds-document`. To keep the surrounding application's defaults, apply
`class="host-typography"` to the root and load this application CSS:

```css
.host-typography {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}
```

Unlayered application CSS or later-layer utilities override root defaults.
For a specific font, set `--sds-font-body` on the root instead. Explicit
heading recipes still use `--sds-font-heading`; override that token too when
headings should match the application. Tailwind can be used with or without
`sds-document`: typography ownership and layer ordering are separate choices.

## Theme and color scheme

Set theme and scheme on an SDS root:

```html
<main
  data-sds-root
  data-sds-theme="plaid"
  data-sds-color-scheme="system"
>
  ...
</main>
```

| Interface | Values | Default |
|---|---|---|
| `data-sds-root` | Presence | No SDS typography root |
| `data-sds-theme` | `forge`, `plaid` | Forge appearance |
| `data-sds-color-scheme` | `light`, `dark`, `system` | `light` |

Nested SDS roots may use independent themes. Forge uses sans-serif headings
and rounded controls. Plaid uses serif headings and square corners.
Floating menus, popovers, combobox surfaces, and toasts use
`--sds-radius-floating`, which follows the theme's container radius; tooltips
follow its control radius. Pill-shaped tags and avatars remain intentional
shape exceptions.
Importing the stylesheet does not change the host document's color scheme.
An explicit SDS root defaults to light; recipes outside a root inherit the
host's scheme.

## Override semantic tokens

Set public custom properties on an SDS root or a smaller subtree:

```css
.my-application {
  --sds-color-action-primary: #005ea8;
  --sds-color-action-primary-hover: #1a73b8;
  --sds-radius-control: 0.5rem;
}
```

Prefer semantic properties over primitive colors. Changing an action token
updates every recipe that uses that role while preserving component
relationships.

## Cascade behavior

Distributed rules live in:

```css
@layer sds.tokens, sds.base, sds.components, sds.utilities;
```

Ordinary unlayered application CSS overrides layered SDS rules. Keep
application selectors low-specificity and target your application class
rather than SDS implementation structure:

```css
.project-summary {
  max-inline-size: 52rem;
}
```

## Combine design systems

Declare layer order before either system loads. Namespaces prevent class
collisions; layers decide whether resets, recipes, or utilities win. Keep
resets below SDS and application utilities above it. Do not put two systems'
component classes on the same element unless that override is intentional.

### Tailwind CSS 4

Use one application stylesheet instead of separate JavaScript CSS imports:

```css
@layer theme, base, sds, components, utilities;
@import 'tailwindcss';
@import '@cmu-sei/sds-lite/sds.css';
```

Tailwind Preflight runs below SDS recipes, and utilities such as `p-2` run
above them. Import this stylesheet once from the application entry. If using
`brand.css`, import it after `sds.css` in the same file. Declaring the order
after either stylesheet has loaded cannot reorder existing layers.

### Bootstrap and other global stylesheets

Place the host stylesheet in an earlier layer:

```css
@layer vendor, sds, app;
@import 'bootstrap/dist/css/bootstrap.css' layer(vendor);
@import '@cmu-sei/sds-lite/sds.css';

@layer app {
  .project-action { min-inline-size: 8rem; }
}
```

Remove any separate unlayered Bootstrap import. The same pattern works for
other global resets. Unlayered rules override normal layered rules regardless
of import order. Host `!important` utilities still override normal SDS rules;
use them only deliberately.

### Material Design

Material Web components keep their internal styles in shadow DOM. Place them
beside SDS recipes; SDS classes cannot restyle their shadow contents. Bridge
documented Material tokens at a shared boundary when colors should match:

```css
.project-theme {
  --md-sys-color-primary: var(--sds-color-action-primary);
  --md-sys-color-on-primary: var(--sds-color-action-text);
}
```

Apply `.project-theme` to an SDS root. Material libraries that inject global
resets or CSS-in-JS rules need their own layer configuration; use the same
reset-below-SDS policy rather than assuming shadow-DOM isolation.

### SEI adoption

Keep the existing Vue component API while replacing internals incrementally.
Map the current SEI application tokens at a root, not through Lite's private
component properties:

```css
.sei-theme[data-sds-root] {
  --sds-font-body: var(--font-sans);
  --sds-color-action-primary: var(--btn-accent-bg);
  --sds-color-action-primary-hover: var(--btn-accent-bg-hover);
  --sds-color-action-text: var(--btn-accent-text);
}
```

Use this bridge only where the existing SEI stylesheet supplies those tokens.
Synchronize the host theme/scheme with `data-sds-theme` and
`data-sds-color-scheme`. Gradually choose one token source of truth, and let
only one system own a component's behavior. Recheck all states and contrast
after token mapping; a shared palette alone does not prove parity.

## Component options before CSS

Use documented attributes before writing an override:

```html
<button class="sds-button" data-sds-size="lg" data-sds-tone="danger">Delete</button>
<div class="sds-grid" data-sds-columns="3" data-sds-gap="xl">...</div>
```

Attributes preserve the supported design vocabulary and behavior across
themes.

## Public layout properties

| Property | Default | Owner |
|---|---|---|
| `--sds-sidebar-width` | `18rem` | `.sds-app-layout` or `.sds-sidebar-layout` |
| `--sds-list-marker-width` | `auto` | `.sds-list` |

## Token policy

- Override semantic tokens at an application boundary.
- Keep complete light and dark values when changing color assignments.
- Validate text, icon, border, focus, disabled, hover, and active contrast.
- Do not depend on `--sds-tone-*`, `--sds-avatar-*`, `--sds-button-*`,
  `--sds-prose-*`, `--sds-tab-*`, `--sds-timeline-*`,
  `--sds-datapoint-*`, `--sds-floating-*`, `--sds-grid-*`, `--sds-tag-*`, or
  `--sds-typography-*` (except the public `--sds-typography-heading-weight`);
  they are implementation details.
- Treat undocumented selectors and custom properties as private.

SDS Lite intentionally does not expose a second, exhaustive token for every
component declaration. Add a public component token only when a real
application cannot express a supported customization through a semantic token
or documented option. This keeps themes portable and avoids coupling
applications to recipe implementation details.

See the [CSS reference](../reference/css.md) for every public token.
