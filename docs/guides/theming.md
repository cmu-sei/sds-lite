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

## Component options before CSS

Use documented attributes before writing an override:

```html
<button data-size="lg" data-tone="danger">Delete</button>
<div class="sds-grid" data-columns="3" data-gap="xl">...</div>
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
- Do not depend on `--sds-tone-*`, `--sds-button-*`, `--sds-prose-*`,
  `--sds-tab-*`, `--sds-timeline-*`, `--sds-datapoint-*`, or
  `--sds-floating-*`; they are implementation details.
- Treat undocumented selectors and custom properties as private.

See the [CSS reference](../reference/css.md) for every public token.
