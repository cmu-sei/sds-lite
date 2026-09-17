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
| `data-sds-root` | Scope foundations and tokens |
| `data-sds-theme` | `forge`, `plaid` |
| `data-sds-color-scheme` | `light`, `dark`, `system` |
| `data-sds-unstyled` | Opt a link out of automatic styling |
| `data-sds-variant` | Recipe-specific visual treatment |
| `data-sds-tone` | `neutral`, `accent`, `info`, `success`, `warning`, `danger` |
| `data-sds-size` | Recipe-specific size |
| `data-sds-width` | Recipe or overlay width |
| `data-sds-orientation` | `horizontal`, `vertical` |
| `data-sds-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |

Other documented recipe options include `data-sds-align`,
`data-sds-avatar`, `data-sds-block`, `data-sds-callout-close`, `data-sds-columns`,
`data-sds-density`, `data-sds-divided`, `data-sds-grow`, `data-sds-inset`,
`data-sds-justify`, `data-sds-no-shrink`, `data-sds-return-value`,
`data-sds-row-highlight`, `data-sds-shape`, `data-sds-side`, `data-sds-standalone`,
`data-sds-sticky`, `data-sds-toast-close`, `data-sds-toast-open`, and
`data-sds-wrap`.

Native state remains native: `disabled`, `checked`, `open`, `hidden`,
`popover`, `closedby`, `command`, `commandfor`, and ARIA attributes.

## CSS classes

### Foundations, actions, and forms

| Class | Purpose |
|---|---|
| `.sds-action-group` | Responsive related-action layout |
| `.sds-button` | Button appearance for a button or link |
| `.sds-choice` | Checkbox or radio with label text |
| `.sds-field` | Label, control, help, and validation layout |
| `.sds-file-input` | Explicit native file-input hook |
| `.sds-file-upload` | Dashed file-upload container |
| `.sds-file-upload-action` | Upload icon and action label |
| `.sds-file-upload-surface` | Centered native file-input content |
| `.sds-form` | Narrow vertical form |
| `.sds-input` | Explicit text-control hook |
| `.sds-link` | Explicit link recipe |
| `.sds-select` | Explicit select-control hook |
| `.sds-switch` | Native checkbox with switch appearance |

### Feedback and loading

| Class | Purpose |
|---|---|
| `.sds-badge` | Compact status or category |
| `.sds-callout` | Contextual message |
| `.sds-callout-timestamp` | Secondary callout timestamp |
| `.sds-empty-state` | Empty-result message |
| `.sds-skeleton` | Loading placeholder |
| `.sds-spinner` | Loading indicator |
| `.sds-tag` | Static or interactive category |
| `.sds-tag-action` | Independent tag action |
| `.sds-tag-counter` | Leading tag count |
| `.sds-tag-label` | Truncating tag label |
| `.sds-toaster` | Fixed notification region |

### Content and data

| Class | Purpose |
|---|---|
| `.sds-avatar` | Person image or initials |
| `.sds-avatar-group` | Overlapping list of people |
| `.sds-card` | Raised content container |
| `.sds-card-label` | Muted card label |
| `.sds-datapoint` | Label, value, and context |
| `.sds-list` | Structured content list |
| `.sds-list-item` | Direct list item |
| `.sds-list-marker` | Marker column |
| `.sds-table` | Application data table |
| `.sds-table-container` | Horizontally scrollable table wrapper |
| `.sds-timeline` | Event sequence |
| `.sds-timeline-item` | Timeline event |
| `.sds-timeline-marker` | Custom event marker |

### Layout

| Class | Purpose |
|---|---|
| `.sds-flex` | Configurable flex layout |
| `.sds-grid` | Responsive equal-width grid |
| `.sds-page` | Centered page content |
| `.sds-page-header` | Sticky page title and actions |
| `.sds-section-header` | Section title, description, and actions |
| `.sds-sidebar` | Persistent or mobile navigation |
| `.sds-sidebar-close` | Mobile-sidebar close control |
| `.sds-sidebar-layout` | Contained sidebar and content |

### Navigation and overlays

| Class | Purpose |
|---|---|
| `.sds-dialog` | Native dialog surface |
| `.sds-dialog-footer` | Dialog action layout |
| `.sds-dialog-header` | Dialog title and close layout |
| `.sds-disclosure` | Native details disclosure |
| `.sds-dropdown-divider` | Menu separator |
| `.sds-dropdown-label` | Noninteractive menu group label |
| `.sds-dropdown-menu` | Dropdown surface |
| `.sds-panel` | Edge-attached native dialog |
| `.sds-pagination` | Page navigation and controls |
| `.sds-pagination-status` | Current result range |
| `.sds-popover-content` | Interactive anchored content |
| `.sds-tab` | Tab button or route link |
| `.sds-tab-list` | Tab-list row |
| `.sds-tab-panel` | Tab-controlled content |
| `.sds-tooltip-content` | Anchored descriptive text |

### Prose and utilities

| Class | Purpose |
|---|---|
| `.sds-eyebrow` | Small uppercase context |
| `.sds-not-prose` | Exclude subtree from prose styles |
| `.sds-prose` | Long-form semantic typography |
| `.sds-prose-lead` | Introductory prose paragraph |
| `.sds-sr-only` | Visually hide accessible text |

### Application shell

| Class | Purpose |
|---|---|
| `.sds-app` | Application, simple, or brochure shell |
| `.sds-app-action-bar` | Sticky pending-action area |
| `.sds-app-body` | Independently scrolling body |
| `.sds-app-brand` | Application brand link |
| `.sds-app-brand-prefix` | Emphasized brand prefix |
| `.sds-app-footer` | Application footer |
| `.sds-app-footer-brand` | SEI wordmark region |
| `.sds-app-footer-content` | Responsive footer row |
| `.sds-app-footer-legal` | CMU copyright and handling statement |
| `.sds-app-footer-middle` | Application-specific footer information |
| `.sds-app-footer-top` | Optional footer content |
| `.sds-app-header` | Simple-application header |
| `.sds-app-layout` | Sidebar and body columns |
| `.sds-app-main` | Flexible application content |
| `.sds-app-mobile-header` | Mobile menu and identity header |
| `.sds-sei-wordmark` | Official SEI wordmark |

### Brochure shell

| Class | Purpose |
|---|---|
| `.sds-brochure-brand` | Brochure identity and organization |
| `.sds-brochure-container` | Centered brochure content width |
| `.sds-brochure-footer-about` | Official identity and address |
| `.sds-brochure-footer-actions` | Public action links |
| `.sds-brochure-footer-content` | Footer identity and navigation layout |
| `.sds-brochure-footer-legal` | Legal-navigation footer row |
| `.sds-brochure-footer-links` | Light pre-footer action region |
| `.sds-brochure-footer-main` | Dark primary footer |
| `.sds-brochure-footer-navigation` | Footer navigation groups |
| `.sds-brochure-header` | Brochure masthead and navigation |
| `.sds-brochure-main` | Brochure content region |
| `.sds-brochure-masthead` | Carnegie Mellon masthead |
| `.sds-brochure-navigation` | Identity and primary navigation |
| `.sds-cmu-wordmark` | Official Carnegie Mellon wordmark |

## Custom elements

| Element | Purpose | Entry |
|---|---|---|
| `<sds-dropdown>` | Menu positioning and keyboard interaction | `/dropdown` |
| `<sds-popover>` | Delayed-hover interactive anchored content | `/popover` |
| `<sds-tabs>` | Tab selection and keyboard interaction | `/tabs` |
| `<sds-toast>` | Timed or persistent notification | `/toast` |
| `<sds-tooltip>` | Hover and focus description | `/tooltip` |

There are intentionally no custom elements for buttons, links, inputs, tags,
dialogs, panels, or disclosures. Native HTML supplies their semantics.

## JavaScript and CSS

- [Package imports](./imports.md)
- [JavaScript exports and events](./javascript.md)
- [Public CSS custom properties](./css.md)
