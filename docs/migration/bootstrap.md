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
| `btn btn-primary` | `sds-button`, `data-sds-variant="primary"`, `data-sds-tone="accent"` |
| `btn btn-secondary` | `data-sds-variant="secondary"`, `data-sds-tone="neutral"` |
| `btn btn-success` | `data-sds-tone="success"` |
| `btn btn-danger` | `data-sds-tone="danger"` |
| `btn btn-warning` | `data-sds-tone="warning"` |
| `btn btn-info` | `data-sds-tone="info"` |
| `btn btn-outline-*` | `data-sds-variant="tertiary"` plus a matching semantic tone |
| `btn btn-link` | `data-sds-variant="ghost"` |
| `btn-sm`, `btn-lg` | `data-sds-size="sm"`, `"lg"` |

```html
<!-- Before -->
<a class="btn btn-outline-primary" href="/projects">Projects</a>

<!-- After -->
<a
  class="sds-button"
  href="/projects"
  data-sds-variant="tertiary"
  data-sds-tone="accent"
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

Native `type`, `name`, `value`, `required`, `disabled`, and ARIA attributes
are preserved.

## Manual work

- Input groups, floating labels, checks/radios, switches, validation feedback,
  button groups, dropdown toggles, and JavaScript plugins require structural
  changes.
- Bootstrap layout and utility classes are retained. Replace them separately;
  the migrator cannot infer the intended SDS Lite layout.
- `data-bs-*` behavior, Sass variables, icons, and application scripts are not
  converted.
- Dynamic `class`, `className`, or Vue `:class` values are left unchanged with
  a warning. Make the Bootstrap classes static or migrate that expression by
  hand.
- Review light/dark button mappings. They become a neutral SDS Lite tone, not
  an exact Bootstrap color.

