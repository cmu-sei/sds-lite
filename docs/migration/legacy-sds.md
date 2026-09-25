# Migrate from legacy SDS

[Migration index](./index.md)

This guide covers the Vue-based SEI Design System. The migrator recognizes
static `<SdsButton>`, `<SdsInput>`, and `<SdsTextarea>` usage plus common
rendered `btn*` and `form-control*` classes.

```sh
npx sds-lite-migrate --from legacy-sds src/ProjectForm.vue
```

## Automated button crosswalk

| Legacy SDS | SDS Lite |
|---|---|
| `kind="primary"` | `data-sds-variant="filled"` |
| `kind="secondary"` | `data-sds-variant="tonal"` |
| `kind="tertiary"` | `data-sds-variant="outlined"` |
| `kind="ghost"` | `data-sds-variant="text"` |
| `variant="blue"` | `data-sds-tone="info"` |
| `variant="gray"` or `"white"` | `data-sds-tone="neutral"` |
| `variant="red"` | `data-sds-tone="danger"` |
| `size="xs\|sm\|md\|lg"` | `data-sds-size="xs\|sm\|md\|lg"` |
| `block` | `data-sds-block` |
| `pending` | `aria-busy="true"` and `disabled` |
| `type="cta"` | native `type="button"` |

For example:

```html
<!-- Before -->
<SdsButton kind="ghost" variant="red" size="sm">
  Delete
</SdsButton>

<!-- After -->
<button
  class="sds-button"
  type="button"
  data-sds-variant="text"
  data-sds-tone="danger"
  data-sds-size="sm"
>
  Delete
</button>
```

The tool also converts static rendered classes such as `btn-secondary`,
`btn-red`, `btn-sm`, and `btn-block`. It retains unrelated classes.

## Automated form crosswalk

Self-closing or empty fields without component-generated label/help content
can become native controls:

```html
<!-- Before -->
<SdsInput v-model="email" type="email" size="sm" required />
<SdsTextarea v-model="notes" rows="5" />

<!-- After -->
<input
  class="sds-input"
  v-model="email"
  type="email"
  data-sds-size="sm"
  required
>
<textarea class="sds-input" v-model="notes" rows="5"></textarea>
```

Rendered `form-control` becomes `sds-input`; a rendered select receives
`sds-select`. Native state attributes are retained.

## Manual work

- `<SdsSelect>` options come from an object model. Rewrite them as native
  `<option>` elements and preserve the submitted values yourself.
- `count-characters`, validation props, textarea resize policy, and generated
  validation classes need explicit native markup and application logic.
- Dynamic `kind`, `variant`, `size`, `block`, and class bindings are warned
  about and left unchanged.
- Review `active`; decide whether the result is a toggle with
  `aria-pressed`, a selected item, or only application styling.
- Replace imports and registrations after converting all uses.

Legacy SDS source and API documentation may differ by release; use the exact
version installed by the application as the authority for manual work.

