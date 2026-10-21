# Component guides

[Documentation](../README.md) / Components

Find a feature below, then copy its smallest example. Load SDS CSS and use an
SDS root as shown in the [quick start](../getting-started.md). Custom elements
and SDS dialog/panel enhancements also need `/auto` or `setupSds()`;
native controls and CSS-only recipes do not. `notify()` registers its own toast behavior.

## Choose by purpose

Similar-looking recipes are not always interchangeable:

| Decision | Use |
|---|---|
| Label and help layout, or a composed field surface? | [Field](./forms.md#form-and-field) for the label and help; [input group](./forms.md#input-group) for one control with icons, actions, or affixes. They compose together. |
| One labeled control, or related choices? | [Field](./forms.md#form-and-field) for one control; native [fieldset and legend](./forms.md#checkbox-and-radio) for related controls. |
| Actions, or arbitrary wrapping content? | [Action group](./actions.md#action-group) for buttons with responsive page-header behavior; [Cluster](./layout.md#cluster) for general wrapping rows. |
| Status, or a category/filter token? | Prefer [Badge](./feedback.md#badge) for status and counts; [Tag](./feedback.md#tag) for categories, filters, and removable selections. |
| Fixed choices, or searchable suggestions? | Native [select](./forms.md#controls) for fixed choices; [Combobox](./forms.md#combobox) when typing and suggestion behavior are needed. |
| Focused task, or secondary workflow? | [Dialog](./overlays.md#dialog) for a centered task; [Panel](./overlays.md#panel) for an edge-attached workflow. Both use native dialog behavior. |

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
| Segmented buttons, single or multiple choice | [Segmented controls](./forms.md#segmented-controls) |
| Selectable cards, radio cards | [Selectable cards](./forms.md#selectable-cards) |
| Chip, removable tag | [Tag](./feedback.md#tag) |
| Toggle button, selectable filter chip | [Toggle buttons](./actions.md#toggle-buttons) |
| Collapsible content, disclosure | [Disclosure](./navigation.md#disclosure) |
| Columns, responsive grid | [Grid](./layout.md#grid) |
| Dialog, modal | [Dialog](./overlays.md#dialog) |
| Dropdown, action menu | [Dropdown menu](./navigation.md#dropdown-menu) |
| Empty state, no results | [Empty state](./loading.md#empty-state) |
| File upload | [File input](./forms.md#file-input) |
| Form, label, field | [Form and field](./forms.md#form-and-field) |
| Heading, body, lead, caption | [Explicit typography](./prose.md#explicit-typography) |
| Compact UI title, dialog or panel heading | [UI titles](./prose.md#ui-titles) |
| Help text, error message, validation | [Help and validation](./forms.md#help-and-validation) |
| Horizontal form | [Horizontal fields](./forms.md#horizontal-fields) |
| Inline group, wrapping row | [Cluster](./layout.md#cluster) |
| Input prefix, suffix, currency field | [Input group](./forms.md#input-group) |
| Embedded icons, integrated field actions | [Input group](./forms.md#embedded-icons-and-actions) |
| Password visibility, clear input, copy value | [Input actions](../guides/composition-patterns.md#input-actions) |
| Date range, reporting period | [Date range](../guides/composition-patterns.md#date-range) |
| Multi-select, submitted record IDs | [Multiple-selection form](../guides/composition-patterns.md#multiple-selection-form) |
| Bulk actions, select-all, table filters | [Table selection](../guides/composition-patterns.md#table-selection-and-bulk-actions) |
| Upload progress, cancellation, retry | [Upload workflow](../guides/composition-patterns.md#upload-workflow) |
| Link | [Link](./actions.md#link) |
| List | [List](./data-display.md#list) |
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

## Coverage and ownership

**Built in** means SDS supplies appearance and, where documented, behavior.
**Composition** means a working application example combines recipes; its
JavaScript is copied into and maintained by your application, not registered
by `/auto`. Search the playground by familiar name to find either kind.

| Capability | Coverage | Application responsibility |
|---|---|---|
| Buttons, toggles, filter chips | Built-in appearance | Commands and `aria-pressed` changes |
| Segments and selectable cards | Built-in native choice recipes | Labels, values, and application effects |
| Checkbox mixed state | Built-in appearance | Set native `.indeterminate` |
| Combobox | Built-in filtering and keyboard behavior | Record identity, requests, validation |
| Multiple-selection form | Composition | Selected IDs, hidden fields, reset, removal |
| Tables | Built-in appearance; selection/filter/sort composition | Data, pagination, persistence, bulk commands |
| Input actions | Composition | Password visibility, clear events, clipboard errors |
| File uploads | Built-in picker appearance; queue/request composition | Endpoint, authorization, content validation, server storage |
| Date range | Native date inputs plus composition | Inclusive range rules, time zone, server validation |
| Accordion, split action, workflow steps | Composition | Workflow and navigation state |
| Rich-text editor, spreadsheet grid, custom calendar engine | Not provided | Integrate a specialized library if required |

## Browse by category

| Need | Guide | Recipes |
|---|---|---|
| Actions and navigation links | [Actions](./actions.md) | Button, link, action group |
| Data entry | [Forms](./forms.md) | Form, field, input, select, range, input group, combobox, textarea, checkbox, radio, segments, selectable cards, switch, file input |
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

`info` is blue; `accent` is purple. Non-icon buttons, ordinary links, switches,
tabs, and toasts default to `info`; icon buttons default to `neutral`.
Link variants can override the default color.
`primary` is not a semantic tone; it is reserved for action hierarchy.

## Native state first

Use the platform attribute instead of inventing component state:

```html
<button class="sds-button" disabled>Unavailable</button>
<input class="sds-checkbox" type="checkbox" checked>
<details open>...</details>
<section hidden>...</section>
```

SDS Lite styles and coordinates these states but does not replace them.
