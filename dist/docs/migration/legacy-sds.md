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
| `size="xs\|sm\|md\|lg\|xl"` | `data-sds-size="xs\|sm\|md\|lg\|xl"` |
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
`btn-red`, `btn-sm`, and `btn-block` when the base `btn` class is present.
It retains unrelated classes. Unknown component `kind` values currently fall
back to `filled`; validate them manually rather than relying on a warning.

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
`sds-select`. `form-control-sm` maps to `data-sds-size="sm"` only alongside
`form-control`; other rendered size modifiers are retained. Component fields
support `sm`, `md`, and `lg` sizes, not the full button size range. Native state
attributes are retained.

## Manual work

- `<SdsSelect>` options come from an object model. Rewrite them as native
  `<option>` elements and preserve the submitted values yourself.
- `count-characters`, validation props, textarea resize policy, and generated
  validation classes need explicit native markup and application logic.
- Dynamic `kind`, `variant`, `size`, `block`, and class bindings are warned
  about on buttons and left unchanged. Field conversion checks dynamic
  field-shaping props, but does not validate every binding or generated prop.
- Review `v-model`, component event handlers, and non-native props after a
  conversion; retaining their text does not guarantee native-control parity.
- Review `active`; decide whether the result is a toggle with
  `aria-pressed`, a selected item, or only application styling.
- Replace imports and registrations after converting all uses.

Legacy SDS source and API documentation may differ by release; use the exact
version installed by the application as the authority for manual work.
