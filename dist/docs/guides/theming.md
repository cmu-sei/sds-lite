# Theming and customization

[Documentation](../README.md) / Guides / Theming

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
| `data-sds-root` | Presence | Required scope |
| `data-sds-theme` | `forge`, `plaid` | Forge appearance |
| `data-sds-color-scheme` | `light`, `dark`, `system` | `light` |

Nested SDS roots may use independent themes. Forge uses sans-serif headings
and rounded controls. Plaid uses serif headings and square corners.
Importing the stylesheet does not change the host document's color scheme.
An explicit SDS root defaults to light; recipes outside a root inherit the
host's scheme.

A theme root supplies design values, not automatic element styling. Use
explicit recipe classes such as `.sds-button`, `.sds-input`, and `.sds-text-h3`
to apply SDS appearance. Add `.sds-document` for page presentation or
`.sds-prose` for document typography. Choose `.sds-text-h1` through
`.sds-text-h6` independently of semantic heading level. Typography utilities
switch scales at `48rem`; `data-sds-size="sm"` or `"lg"` fixes the scale.

SDS Lite references `"Open Sans"` and `"Source Serif"` but does not download
fonts. Load them in the host application when exact typography is required;
otherwise system fallbacks are used.

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
  `--sds-typography-*`;
  they are implementation details.
- Treat undocumented selectors and custom properties as private.

SDS Lite intentionally does not expose a second, exhaustive token for every
component declaration. Add a public component token only when a real
application cannot express a supported customization through a semantic token
or documented option. This keeps themes portable and avoids coupling
applications to recipe implementation details.

See the [CSS reference](../reference/css.md) for every public token.
