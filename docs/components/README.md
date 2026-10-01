# Component guides

[Documentation](../README.md) / Components

SDS Lite components are semantic HTML recipes. Start with the native element
that expresses the interaction, then copy the smallest documented structure.

## Interface levels

| Level | What to author | Examples |
|---|---|---|
| Native | A semantic HTML element; SDS Lite styles it inside an SDS root | Button, input, range, progress, meter |
| CSS recipe | Semantic HTML plus an `sds-*` class that names a larger structure | Field, breadcrumb, card, pagination |
| Enhanced element | An `sds-*` custom element around ordinary light-DOM markup | Combobox, tabs, dropdown, tooltip |

Start at the first level and move down only when the interface needs more
structure or behavior. Enhanced elements require automatic setup or an
explicit `setupSds()` call; native elements and CSS recipes do not.

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

For patterns built from several existing recipes, use the
[composition guide](../guides/composition-patterns.md). Accordion groups,
error summaries, workflow steps, split actions, mode selection, and sortable
tables do not require additional SDS Lite components.

## Shared option vocabulary

SDS recipes use a consistent set of attributes:

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

Size values are recipe-specific rather than a promise that every recipe
supports every tier. Controls intentionally stop at their useful interaction
sizes, while content and layout recipes may provide larger tiers such as
`xl` or `2xl`.

`info` uses the blue palette; `accent` uses the purple palette. Buttons, links,
switches, tabs, and toasts default to `info`; choose `accent` when a purple
action is intended. Button variants describe treatment: `filled`, `tonal`,
`outlined`, and `text`. They combine with semantic tones to create the desired
action hierarchy. `primary` is not a semantic tone; it is
reserved for action hierarchy in other recipe APIs.

## Native state first

Use the platform attribute instead of inventing component state:

```html
<button disabled>Unavailable</button>
<input type="checkbox" checked>
<details open>...</details>
<section hidden>...</section>
```

SDS Lite styles and coordinates these states but does not replace them.
