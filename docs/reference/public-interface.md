# Public interface index

[Documentation](../README.md) / [Reference](./README.md) / Public interface

If a class, attribute, custom element, JavaScript export, event, or CSS custom
property is not documented in this directory, treat it as an implementation
detail.

The generated [recipe interface](./recipes.md) is authoritative for recipe
classes, options, custom-element attributes, properties, methods, and events.

## Root and shared attributes

| Interface | Values or purpose |
|---|---|
| `data-sds-root` | Establish theme tokens and color scheme without styling native elements |
| `data-sds-theme` | `forge`, `plaid` |
| `data-sds-color-scheme` | `light`, `dark`, `system` |
| `data-sds-variant` | Recipe-specific visual treatment |
| `data-sds-tone` | `neutral`, `accent`, `info`, `success`, `warning`, `danger` |
| `data-sds-size` | Recipe-specific size |
| `data-sds-width` | Recipe or overlay width |
| `data-sds-orientation` | `horizontal`, `vertical` |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl` |

Spacing utilities accept `none`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`,
`3xl`, or `4xl`:

| Padding | Margin | Sides |
|---|---|---|
| `data-sds-padding` | `data-sds-margin` | Every side |
| `data-sds-padding-block` | `data-sds-margin-block` | Logical block axis |
| `data-sds-padding-inline` | `data-sds-margin-inline` | Logical inline axis |
| `data-sds-padding-block-start` | `data-sds-margin-block-start` | Block start |
| `data-sds-padding-block-end` | `data-sds-margin-block-end` | Block end |
| `data-sds-padding-inline-start` | `data-sds-margin-inline-start` | Inline start |
| `data-sds-padding-inline-end` | `data-sds-margin-inline-end` | Inline end |

Other documented recipe options include `data-sds-block`,
`data-sds-callout-close`, `data-sds-columns`, `data-sds-column-span`,
`data-sds-density`, `data-sds-divided`, `data-sds-inset`,
`data-sds-min-column-width`, `data-sds-return-value`, `data-sds-stack-at`,
`data-sds-row-highlight`, `data-sds-shape`, `data-sds-side`, `data-sds-standalone`,
`data-sds-sticky`, `data-sds-toast-close`, and `data-sds-toast-open`.

Native state remains native: `disabled`, `checked`, `open`, `hidden`,
`popover`, `closedby`, `command`, `commandfor`, and ARIA attributes.

## CSS classes

> Class and element inventories are generated from the interface manifest.

### Foundations, actions, and forms

| Class | Purpose |
|---|---|
| `.sds-fieldset` | Explicit border and shape for a native fieldset. |
| `.sds-button` | Action styling for native buttons and links. |
| `.sds-link` | Link styling with semantic tone and emphasis. |
| `.sds-field` | Label, control, help, and validation layout. |
| `.sds-form` | Narrow vertical form layout. |
| `.sds-input` | Explicit hooks for native form controls. |
| `.sds-select` | Explicit hooks for native form controls. |
| `.sds-input-group` | Native form control with a visible prefix or suffix. |
| `.sds-input-addon` | Native form control with a visible prefix or suffix. |
| `.sds-range` | Native range input styling. |
| `.sds-combobox-list` | Suggestion list for a native text input. |
| `.sds-choice` | Checkbox or radio with label text. |
| `.sds-checkbox` | Checkbox or radio with label text. |
| `.sds-radio` | Checkbox or radio with label text. |
| `.sds-switch` | Native checkbox with switch appearance. |
| `.sds-file-input` | Native file input and composed upload surface. |
| `.sds-file-upload` | Native file input and composed upload surface. |
| `.sds-file-upload-action` | Native file input and composed upload surface. |
| `.sds-file-upload-surface` | Native file input and composed upload surface. |
| `.sds-action-group` | Responsive layout for related actions. |

### Feedback and loading

| Class | Purpose |
|---|---|
| `.sds-badge` | Compact status or category. |
| `.sds-tag` | Static or interactive category with an optional counter. |
| `.sds-tag-counter` | Static or interactive category with an optional counter. |
| `.sds-tag-label` | Static or interactive category with an optional counter. |
| `.sds-tag-action` | Independent action inside a tag. |
| `.sds-callout` | Contextual message in page content. |
| `.sds-callout-timestamp` | Contextual message in page content. |
| `.sds-toaster` | Fixed notification region. |
| `.sds-spinner` | Animated loading indicator. |
| `.sds-progress` | Native task progress styling. |
| `.sds-meter` | Native scalar measurement with semantic threshold colors. |
| `.sds-skeleton` | Loading placeholder. |
| `.sds-empty-state` | Empty-result message. |

### Content and data

| Class | Purpose |
|---|---|
| `.sds-avatar` | Person image or initials and overlapping groups. |
| `.sds-avatar-group` | Person image or initials and overlapping groups. |
| `.sds-card` | Raised content container, muted label, and optional stretched primary link. |
| `.sds-card-label` | Raised content container, muted label, and optional stretched primary link. |
| `.sds-card-link` | Raised content container, muted label, and optional stretched primary link. |
| `.sds-datapoint` | Label, value, and context. |
| `.sds-list` | Structured content list. |
| `.sds-list-item` | Structured content list. |
| `.sds-list-marker` | Structured content list. |
| `.sds-timeline` | Vertical or horizontal event sequence. |
| `.sds-timeline-item` | Vertical or horizontal event sequence. |
| `.sds-timeline-marker` | Vertical or horizontal event sequence. |
| `.sds-table` | Application data table and overflow container. |
| `.sds-table-container` | Application data table and overflow container. |
| `.sds-table-footer` | Application data table and overflow container. |

### Layout

| Class | Purpose |
|---|---|
| `.sds-grid` | Responsive equal-width column layout. |
| `.sds-cluster` | Wrapping flex row for related content. |
| `.sds-stack` | Vertical content flow with consistent spacing. |
| `.sds-page` | Page content, headers, and section context. |
| `.sds-page-header` | Page content, headers, and section context. |
| `.sds-section-header` | Page content, headers, and section context. |
| `.sds-eyebrow` | Page content, headers, and section context. |
| `.sds-sidebar` | Persistent or mobile navigation layout. |
| `.sds-sidebar-close` | Persistent or mobile navigation layout. |
| `.sds-sidebar-layout` | Persistent or mobile navigation layout. |

### Navigation and overlays

| Class | Purpose |
|---|---|
| `.sds-dialog` | Native dialog surface and action layout. |
| `.sds-dialog-header` | Native dialog surface and action layout. |
| `.sds-dialog-footer` | Native dialog surface and action layout. |
| `.sds-panel` | Edge-attached native dialog. |
| `.sds-disclosure` | Native details disclosure. |
| `.sds-pagination` | Page navigation and result status. |
| `.sds-pagination-status` | Page navigation and result status. |
| `.sds-breadcrumb` | Hierarchical page navigation. |
| `.sds-skip-link` | Keyboard-visible link that bypasses repeated content. |
| `.sds-tab` | Generated or server-rendered tab structure. |
| `.sds-tab-list` | Generated or server-rendered tab structure. |
| `.sds-tab-panel` | Generated or server-rendered tab structure. |
| `.sds-dropdown-menu` | Dropdown menu surface, separator, and label. |
| `.sds-dropdown-divider` | Dropdown menu surface, separator, and label. |
| `.sds-dropdown-label` | Dropdown menu surface, separator, and label. |
| `.sds-popover-content` | Popover and tooltip surfaces. |
| `.sds-tooltip-content` | Popover and tooltip surfaces. |

### Prose and utilities

| Class | Purpose |
|---|---|
| `.sds-document` | Opt-in standalone page typography, background, and margin reset. |
| `.sds-text-h1` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-h2` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-h3` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-h4` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-h5` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-h6` | Explicit SEI heading scale independent of semantic level, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-lead` | Explicit SEI lead, body, and caption typography, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-body` | Explicit SEI lead, body, and caption typography, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-caption1` | Explicit SEI lead, body, and caption typography, responsive at 48rem unless a fixed size is selected. |
| `.sds-text-caption2` | Explicit SEI lead, body, and caption typography, responsive at 48rem unless a fixed size is selected. |
| `.sds-prose` | Long-form semantic typography and opt-out. |
| `.sds-prose-lead` | Long-form semantic typography and opt-out. |
| `.sds-not-prose` | Long-form semantic typography and opt-out. |
| `.sds-sr-only` | Long-form semantic typography and opt-out. |

### Application shell

| Class | Purpose |
|---|---|
| `.sds-app` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-action-bar` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-body` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-brand` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-brand-prefix` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer-brand` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer-content` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer-legal` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer-middle` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-footer-top` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-header` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-layout` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-main` | SEI application, simple, documentation, and brochure shells. |
| `.sds-app-mobile-header` | SEI application, simple, documentation, and brochure shells. |
| `.sds-docs-layout` | SEI application, simple, documentation, and brochure shells. |
| `.sds-docs-masthead` | SEI application, simple, documentation, and brochure shells. |
| `.sds-docs-navigation` | SEI application, simple, documentation, and brochure shells. |
| `.sds-docs-toc` | SEI application, simple, documentation, and brochure shells. |
| `.sds-sei-wordmark` | SEI application, simple, documentation, and brochure shells. |

### Brochure shell

| Class | Purpose |
|---|---|
| `.sds-brochure-brand` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-container` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-about` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-actions` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-content` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-legal` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-links` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-main` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-footer-navigation` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-header` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-main` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-masthead` | SEI application, simple, documentation, and brochure shells. |
| `.sds-brochure-navigation` | SEI application, simple, documentation, and brochure shells. |
| `.sds-cmu-wordmark` | SEI application, simple, documentation, and brochure shells. |
## Custom elements

| Element | Purpose |
|---|---|
| `<sds-combobox>` | Enhances a native text input and suggestion list with accessible combobox keyboard behavior. |
| `<sds-dropdown>` | Enhances a direct child button and menu with Popover positioning and menu keyboard behavior. |
| `<sds-popover>` | Enhances a direct child button and rich Popover surface with delayed hover and focus behavior. |
| `<sds-tabs>` | Coordinates a tab list and one panel per tab. |
| `<sds-tooltip>` | Enhances a direct child trigger and short description with accessible tooltip behavior. |
| `<sds-toast>` | A timed or persistent notification. |

There are intentionally no custom elements for buttons, links, inputs, tags,
dialogs, panels, or disclosures. Native HTML supplies their semantics.
## JavaScript and CSS

- [Package imports](./imports.md)
- [JavaScript exports and events](./javascript.md)
- [Public CSS custom properties](./css.md)
