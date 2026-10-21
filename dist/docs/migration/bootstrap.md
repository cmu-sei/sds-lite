# Migrate from Bootstrap

[Migration index](./index.md) ·
[Official Bootstrap buttons](https://getbootstrap.com/docs/5.3/components/buttons/) ·
[Official Bootstrap forms](https://getbootstrap.com/docs/5.3/forms/overview/)

```sh
npx sds-lite-migrate --from bootstrap src/page.html src/form.jsx
```

## Automated button crosswalk

The tool recognizes a static `btn` class on native `<button>`, `<a>`, and
`<input>` elements. It does not change the element type, so actions stay
buttons and navigation stays links.

| Bootstrap | SDS Lite |
|---|---|
| `btn btn-primary` | `sds-button`, `data-sds-variant="filled"`, `data-sds-tone="info"` |
| `btn btn-secondary` | `data-sds-variant="tonal"`, `data-sds-tone="neutral"` |
| `btn btn-success` | `data-sds-tone="success"` |
| `btn btn-danger` | `data-sds-tone="danger"` |
| `btn btn-warning` | `data-sds-tone="warning"` |
| `btn btn-info` | `data-sds-tone="info"` |
| `btn btn-outline-*` | `data-sds-variant="outlined"` plus a matching semantic tone |
| `btn btn-link` | `data-sds-variant="text"` |
| `btn-sm`, `btn-lg` | `data-sds-size="sm"`, `"lg"` |

Button modifiers require the base `btn` class. For `btn-outline-*`, supported
suffixes are `primary`, `secondary`, `success`, `danger`, `warning`, `info`,
`light`, and `dark`; light/dark map to neutral. Although the tool also assigns
`sds-button` to `<input class="btn">`, the documented button recipe targets
buttons and links; review input-button markup manually.

```html
<!-- Before -->
<a class="btn btn-outline-primary" href="/projects">Projects</a>

<!-- After -->
<a
  class="sds-button"
  href="/projects"
  data-sds-variant="outlined"
  data-sds-tone="info"
>
  Projects
</a>
```

## Automated form crosswalk

| Bootstrap | SDS Lite |
|---|---|
| `form-control` on input/textarea | `sds-input` |
| `form-select` | `sds-select` |
| `form-control-sm`, `form-select-sm` | `data-sds-size="sm"` |
| `form-control-lg`, `form-select-lg` | `data-sds-size="lg"` |

Size modifiers require `form-control` or `form-select` on the same element.

Native `type`, `name`, `value`, `required`, `disabled`, and ARIA attributes
are preserved.

## Automated recipe crosswalk

| Bootstrap | SDS Lite |
|---|---|
| `alert alert-{context}` | `sds-callout` with the matching semantic tone |
| `badge bg-*` or `badge text-bg-*` | `sds-badge` with the matching semantic tone |
| `spinner-border`, `spinner-grow` | `sds-spinner` |
| `spinner-border-sm`, `spinner-grow-sm` | `data-sds-size="sm"` |
| Spinner `text-{context}` | Matching `data-sds-tone` |
| `table` | `sds-table` |
| `table-hover` | `data-sds-row-highlight` |
| `table-sm` | `data-sds-size="sm"` |

Size and visual modifiers require the corresponding base recipe class.
Supported context colors are `primary` → `info`, `secondary` → `neutral`,
`success`, `danger`, `warning`, `info`, and `light`/`dark` → `neutral`.
Other spinner text-color utilities are retained rather than mapped.

Dismissible alerts and tables with unsupported visual modifiers remain
unchanged with a warning because they require structural or design review.
Alerts and badges with unknown context colors also remain unchanged rather
than being assigned a guessed semantic tone.

## Manual work

- Input groups, floating labels, checks/radios, switches, validation feedback,
  button groups, dropdown toggles, and JavaScript plugins require structural
  changes.
- Bootstrap layout and utility classes are retained. Replace them separately;
  the migrator cannot infer the intended SDS Lite layout. Recognized utility
  families are included in the retained-marker report.
- `data-bs-*` behavior, Sass variables, icons, and application scripts are not
  converted.
- Dynamic `class`/`className` values are warned about and skipped. Native
  control mappings also check Vue `:class` bindings, but recipe mappings such
  as alerts can still rewrite a static class alongside a dynamic binding.
  Review mixed static/dynamic classes manually.
- Review light/dark button mappings. They become a neutral SDS Lite tone, not
  an exact Bootstrap color.
