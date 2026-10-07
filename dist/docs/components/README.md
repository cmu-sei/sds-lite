# Component guides

[Documentation](../README.md) / Components

Find a feature below, then copy its smallest example. Load SDS CSS and use an
SDS root as shown in the [quick start](../getting-started.md). Custom elements
also need `/auto` or `setupSds()`; native controls and CSS recipes do not.

## Feature index

| Feature or familiar name | Recipe |
|---|---|
| Action buttons, icon buttons | [Button](./actions.md#button) |
| Action toolbar, grouped buttons | [Action group](./actions.md#action-group) |
| Alert, notice, validation summary | [Callout](./feedback.md#callout) |
| Application header, mobile navigation | [SEI application shells](./layout.md#sei-application-shells) |
| Article, rich text, Markdown content | [Document typography](./prose.md#document-typography) |
| Avatar, initials, people group | [Avatar](./data-display.md#avatar) |
| Badge, count, status label | [Badge](./feedback.md#badge) |
| Breadcrumb trail | [Breadcrumb](./navigation.md#breadcrumb) |
| Brochure, public-site shell | [Brochure shell](./layout.md#brochure-shell) |
| Card | [Card](./data-display.md#card) |
| Checkbox, radio button | [Checkbox and radio](./forms.md#checkbox-and-radio) |
| Chip, removable tag | [Tag](./feedback.md#tag) |
| Collapsible content, disclosure | [Disclosure](./navigation.md#disclosure) |
| Columns, responsive grid | [Grid](./layout.md#grid) |
| Dialog, modal | [Dialog](./overlays.md#dialog) |
| Dropdown, action menu | [Dropdown menu](./navigation.md#dropdown-menu) |
| Empty state, no results | [Empty state](./loading.md#empty-state) |
| File upload | [File input](./forms.md#file-input) |
| Form, label, field | [Form and field](./forms.md#form-and-field) |
| Heading, body, lead, caption | [Explicit typography](./prose.md#explicit-typography) |
| Help text, error message, validation | [Help and validation](./forms.md#help-and-validation) |
| Horizontal form | [Horizontal fields](./forms.md#horizontal-fields) |
| Inline group, wrapping row | [Cluster](./layout.md#cluster) |
| Input prefix, suffix, currency field | [Input prefix and suffix](./forms.md#input-prefix-and-suffix) |
| Link | [Link](./actions.md#link) |
| List, description list | [List](./data-display.md#list) |
| Loading indicator | [Spinner](./loading.md#spinner) |
| Loading placeholder | [Skeleton](./loading.md#skeleton) |
| Margin, padding, spacing | [Spacing utilities](./layout.md#spacing-utilities) |
| Metric, statistic | [Datapoint](./data-display.md#datapoint) |
| Notification, toast | [Toast](./feedback.md#toast) |
| Page, section header | [Page and section](./layout.md#page-and-section) |
| Pagination, page links | [Pagination](./navigation.md#pagination) |
| Panel, drawer, sheet | [Panel](./overlays.md#panel) |
| Popover, floating content | [Popover](./overlays.md#popover) |
| Progress bar, meter | [Progress and measurement](./loading.md#progress-and-measurement) |
| Record picker, selected record ID | [Advanced combobox](../guides/combobox.md#rich-suggestions-and-record-ids) |
| Searchable select, autocomplete | [Combobox](./forms.md#combobox) |
| Select, text input, textarea | [Controls](./forms.md#controls) |
| Sidebar | [Standalone sidebar](./layout.md#standalone-sidebar) |
| Skip navigation | [Skip link](./navigation.md#skip-link) |
| Slider | [Range](./forms.md#range) |
| Tabs | [Tabs](./navigation.md#tabs) |
| Timeline | [Timeline](./data-display.md#timeline) |
| Toggle | [Switch](./forms.md#switch) |
| Tooltip | [Tooltip](./overlays.md#tooltip) |
| Vertical group | [Stack](./layout.md#stack) |
| Table | [Table](./data-display.md#table) |

## Browse by category

| Need | Guide | Recipes |
|---|---|---|
| Actions and navigation links | [Actions](./actions.md) | Button, link, action group |
| Data entry | [Forms](./forms.md) | Form, field, input, select, range, input group, combobox, textarea, checkbox, radio, switch, file input |
| Status and notifications | [Feedback](./feedback.md) | Badge, tag, callout, toast |
| Structured information | [Data display](./data-display.md) | Avatar, card, datapoint, list, timeline, table |
| Page composition | [Layout](./layout.md) | Grid, Cluster, Stack, page, sidebar |
| SEI-branded shells | [Layout](./layout.md#sei-application-shells) | Application, simple application, brochure |
| Selection and menus | [Navigation](./navigation.md) | Breadcrumb, skip link, tabs, pagination, dropdown, disclosure |
| Floating and modal content | [Overlays](./overlays.md) | Tooltip, popover, dialog, panel |
| Waiting and no-results states | [Loading](./loading.md) | Progress, meter, spinner, skeleton, empty state |
| Long-form content | [Prose](./prose.md) | Article typography and embedded recipes |

For accordions, error summaries, workflow steps, split actions, mode selection,
and sortable tables, use [composition patterns](../guides/composition-patterns.md).

## Shared option vocabulary

Recipe classes opt elements into styling; attributes configure them. A root
supplies theme tokens, not automatic native-element styling.

| Attribute | Meaning |
|---|---|
| `data-sds-variant` | Visual treatment |
| `data-sds-tone` | Semantic color intent |
| `data-sds-size` | Visual scale |
| `data-sds-width` | Width or overlay extent |
| `data-sds-orientation` | Horizontal or vertical arrangement |
| `placement` on a floating custom element | Preferred position for floating content |
| `data-sds-gap` | Layout spacing |
| `data-sds-padding*` | Tokenized logical padding |
| `data-sds-margin*` | Tokenized logical margin |

Semantic tones are:

```text
neutral | accent | info | success | warning | danger
```

Options and size tiers are recipe-specific. Each guide lists useful options;
the [recipe reference](../reference/recipes.md) lists every value and default.

`info` is blue; `accent` is purple. Buttons, links, switches, tabs, and toasts
default to `info`. `primary` is not a semantic tone; it is reserved for action hierarchy.

## Native state first

Use the platform attribute instead of inventing component state:

```html
<button class="sds-button" disabled>Unavailable</button>
<input class="sds-checkbox" type="checkbox" checked>
<details open>...</details>
<section hidden>...</section>
```

SDS Lite styles and coordinates these states but does not replace them.
