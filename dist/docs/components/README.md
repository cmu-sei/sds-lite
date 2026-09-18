# Component guides

[Documentation](../README.md) / Components

SDS Lite components are semantic HTML recipes. Start with the native element
that expresses the interaction, then copy the smallest documented structure.

| Need | Guide | Recipes |
|---|---|---|
| Actions and navigation links | [Actions](./actions.md) | Button, link, action group |
| Data entry | [Forms](./forms.md) | Form, field, input, select, textarea, checkbox, radio, switch, file input |
| Status and notifications | [Feedback](./feedback.md) | Badge, tag, callout, toast |
| Structured information | [Data display](./data-display.md) | Avatar, card, datapoint, list, timeline, table |
| Page composition | [Layout](./layout.md) | Grid, flex, page, section, sidebar, application shells |
| Selection and menus | [Navigation](./navigation.md) | Tabs, pagination, dropdown, disclosure |
| Floating and modal content | [Overlays](./overlays.md) | Tooltip, popover, dialog, panel |
| Waiting and no-results states | [Loading](./loading.md) | Spinner, skeleton, empty state |
| Long-form content | [Prose](./prose.md) | Article typography and embedded recipes |

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

Use `accent` for emphasized brand actions. `primary` is not a semantic tone; it is
reserved for action hierarchy through `data-sds-variant="primary"`.

## Native state first

Use the platform attribute instead of inventing component state:

```html
<button disabled>Unavailable</button>
<input type="checkbox" checked>
<details open>...</details>
<section hidden>...</section>
```

SDS Lite styles and coordinates these states but does not replace them.
