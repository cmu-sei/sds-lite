# CSS API

[Documentation](../README.md) / [Reference](./README.md) / CSS

## Cascade layers

All distributed rules live in:

```css
@layer sds.tokens, sds.base, sds.components, sds.utilities;
```

Recipe defaults live in `sds.components`. Layout and spacing utilities live in
the later `sds.utilities` layer, so composition can override recipe defaults
while keeping zero-specificity selectors.

Unlayered application CSS overrides SDS Lite without specificity escalation.

## Layout properties

| Property | Default | Owner |
|---|---|---|
| `--sds-sidebar-width` | `18rem` | `.sds-app-layout` or `.sds-sidebar-layout` |
| `--sds-list-marker-width` | `auto` | `.sds-list` |

## Spacing

```text
--sds-space-0
--sds-space-2xs
--sds-space-xs
--sds-space-sm
--sds-space-md
--sds-space-lg
--sds-space-xl
--sds-space-2xl
--sds-space-3xl
--sds-space-4xl
--sds-space-button-gap
```

Use a spacing attribute when a token value is enough:

```html
<div data-sds-padding-inline="lg" data-sds-margin-block-end="sm">
  Content
</div>
```

See [Layout](../components/layout.md#spacing-utilities) for the complete
logical-property interface. Use authored CSS for values outside the token scale.

## Radius

```text
--sds-radius-sm
--sds-radius-md
--sds-radius-lg
--sds-radius-full
--sds-radius-control
--sds-radius-container
```

## Elevation

```text
--sds-shadow-sm
--sds-shadow-raised
--sds-shadow-lg
--sds-shadow-xl
--sds-shadow-overlay
```

## Motion

```text
--sds-duration-fast
--sds-duration-normal
--sds-duration-medium
--sds-duration-slow
--sds-easing-standard
--sds-easing-enter
--sds-easing-exit
```

## Typography

```text
--sds-font-sans
--sds-font-serif
--sds-font-body
--sds-font-heading
```

## Semantic colors

General roles:

```text
--sds-color-background
--sds-color-text-default
--sds-color-text-muted
--sds-color-text-label
--sds-color-text-disabled
--sds-color-action-text

--sds-color-overlay
--sds-color-overlay-strong
--sds-color-shadow-subtle

--sds-color-surface-default
--sds-color-surface-subtle
--sds-color-surface-raised

--sds-color-border-default
--sds-color-border-control
--sds-color-border-strong
--sds-color-focus-ring
--sds-color-brand

--sds-color-action-primary
--sds-color-action-primary-hover
--sds-color-action-primary-active
--sds-color-interactive-subtle-hover
--sds-color-interactive-subtle-active

--sds-color-form-border
--sds-color-form-disabled-background
--sds-color-form-disabled-text
--sds-color-form-readonly-background
--sds-color-form-readonly-text
--sds-color-form-invalid
--sds-color-form-valid
--sds-color-form-chevron
--sds-color-choice-checked
```

Focusable controls share `--sds-color-focus-ring` (blue 300 in light mode,
blue 700 in dark mode).
Form borders default to `--sds-color-border-control` through
`--sds-color-form-border` (gray 300 in light mode, gray 600 in dark mode).

Every semantic tone has the same six roles:

```text
--sds-color-{tone}-surface
--sds-color-{tone}-border
--sds-color-{tone}-text
--sds-color-{tone}-strong
--sds-color-{tone}-strong-hover
--sds-color-{tone}-on-strong
```

Replace `{tone}` with `neutral`, `accent`, `info`, `success`, `warning`, or
`danger`.
`accent` uses the purple palette; `info` uses the blue palette.

## Primitive colors

Prefer semantic roles for application customization. Primitive colors are
available for defining a semantic assignment:

```text
--sds-white
--sds-black

--sds-gray-{25,50,100,200,300,400,500,600,700,750,800,850,900,950}
--sds-purple-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-blue-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-red-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-green-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-orange-{25,50,100,200,300,400,500,600,700,800,900,950}
```

## Private properties

Only the properties listed above, `--sds-sidebar-width`, and
`--sds-list-marker-width` are public. Every other component-scoped
`--sds-*` property is an implementation detail. Use a public semantic token or
documented data attribute instead.
