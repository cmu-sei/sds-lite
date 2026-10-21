# CSS API

[Documentation](../README.md) / [Reference](./README.md) / CSS

## Cascade layers

All distributed rules live in:

```css
@layer sds.tokens, sds.base, sds.components, sds.utilities;
```

Recipe defaults live in `sds.components`. Layout and spacing utilities live in
the later `sds.utilities` layer, so composition can override recipe defaults.
SDS uses `:where()` to keep selector specificity generally low or zero.

Unlayered application CSS overrides SDS Lite without specificity escalation.

## Interaction cursors

SDS actions and choice controls use `pointer`, including buttons, pagination,
selects, checkboxes, radios, and their recipe labels. Text inputs and textareas
keep text-selection cursors, including readonly fields. Panel drag handles use
`grab` and `grabbing`. Static content and unrelated host controls are not changed.

Unavailable controls use `not-allowed` styling. Native `disabled` prevents
activation without suppressing pointer hit testing. Recipes that block pointer
events for ARIA-disabled or busy actions keep that behavior; the cursor may come
from the element underneath. Application code must still prevent keyboard and
programmatic activation of ARIA-disabled actions.

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
```

Use a spacing attribute when a token value is enough:

```html
<div data-sds-padding-inline="lg" data-sds-margin-block-end="sm">
  Content
</div>
```

See [Layout](../components/layout.md#spacing-utilities) for the complete
logical-property interface. Use authored CSS for values outside the token scale.

`--sds-surface-inset` defaults to `--sds-space-xl` (24px) and controls default
card padding, dialog padding, and panel-region padding. Spacing attributes
remain explicit per-element overrides.

## Control metrics

```text
--sds-control-height-xs
--sds-control-height-sm
--sds-control-height-md
--sds-control-height-lg
--sds-control-height-xl
```

Defaults are `1.5rem`, `2rem`, `2.5rem`, `3rem`, and `3.5rem`. Comfortable
buttons use all five; inputs, selects, and input wrappers use `sm` through
`lg`. Border widths are included in their shared single-line metrics, while
multiline text and textareas can grow. Compact and icon buttons retain their
own sizing.

## Radius

```text
--sds-radius-sm
--sds-radius-md
--sds-radius-lg
--sds-radius-full
--sds-radius-control
--sds-radius-container
--sds-radius-floating
```

## Elevation

```text
--sds-shadow-sm
--sds-shadow-raised
--sds-shadow-lg
--sds-shadow-xl
--sds-shadow-overlay
--sds-shadow-floating
--sds-shadow-modal
```

Cards use the raised shadow. Dropdowns, popovers, combobox surfaces, and toasts
share the floating shadow (an alias of `--sds-shadow-lg`); dialogs and panels
share the modal shadow (an alias of `--sds-shadow-xl`). Tooltips retain the
lighter raised shadow. Borders remain independently semantic: form borders
are stronger than decorative surface borders.

## Motion

```text
--sds-duration-fast
--sds-duration-normal
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
--sds-typography-heading-weight
--sds-type-title-size
--sds-type-title-leading
--sds-type-title-weight
--sds-type-body-size
--sds-type-body-leading
--sds-type-body-size-sm
--sds-type-body-leading-sm
```

Shared heading metrics are also public: `--sds-type-h{1-6}-size`,
`--sds-type-h{1-6}-leading`, `--sds-type-h{1-6}-size-sm`, and
`--sds-type-h{1-6}-leading-sm` (replace `{1-6}` with a heading level).
The complete property list is:

```text
--sds-type-h1-size
--sds-type-h1-leading
--sds-type-h1-size-sm
--sds-type-h1-leading-sm
--sds-type-h2-size
--sds-type-h2-leading
--sds-type-h2-size-sm
--sds-type-h2-leading-sm
--sds-type-h3-size
--sds-type-h3-leading
--sds-type-h3-size-sm
--sds-type-h3-leading-sm
--sds-type-h4-size
--sds-type-h4-leading
--sds-type-h4-size-sm
--sds-type-h4-leading-sm
--sds-type-h5-size
--sds-type-h5-leading
--sds-type-h5-size-sm
--sds-type-h5-leading-sm
--sds-type-h6-size
--sds-type-h6-leading
--sds-type-h6-size-sm
--sds-type-h6-leading-sm
```

Default-size prose headings use the large metrics; prose's explicit `sm` and
`lg` variants retain their own heading scales. Explicit SEI heading utilities
use the small or large metrics according to their responsive rules. Article
flow, letter spacing, and editorial font choices remain separate from UI titles.

The UI title defaults are `1.25rem` / `1.75rem`, weight 500 in Forge and
400 in Plaid. Existing SEI heading sizes and caption styles are unchanged.
See [typography](../components/prose.md).

## Semantic colors

General roles:

```text
--sds-color-background
--sds-color-text-default
--sds-color-text-muted
--sds-color-text-disabled
--sds-color-action-text

--sds-color-overlay

--sds-color-surface-default
--sds-color-surface-subtle
--sds-color-surface-raised

--sds-color-border-default
--sds-color-border-strong
--sds-color-focus-border
--sds-color-focus-ring
--sds-color-brand

--sds-color-action-primary
--sds-color-action-primary-hover
--sds-color-action-primary-active
--sds-color-interactive-subtle-hover

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
Form borders use `--sds-color-form-border` (gray 400 in light mode, gray 500
in dark mode).

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
