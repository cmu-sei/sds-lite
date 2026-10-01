# Migrate from Web Awesome

[Migration index](./index.md) ·
[Official Web Awesome button](https://webawesome.com/docs/components/button/) ·
[Official Web Awesome input](https://webawesome.com/docs/components/input/)

```sh
npx sds-lite-migrate --from web-awesome src/profile.html
```

## Automated button crosswalk

Web Awesome separates semantic `variant` from visual `appearance`; SDS Lite
uses tone and variant for the same two decisions.

| Web Awesome | SDS Lite |
|---|---|
| `variant="brand"` | `data-sds-tone="accent"` |
| `variant="neutral"` | `data-sds-tone="neutral"` |
| `variant="success"` | `data-sds-tone="success"` |
| `variant="warning"` | `data-sds-tone="warning"` |
| `variant="danger"` | `data-sds-tone="danger"` |
| `appearance="accent"` or `"filled"` | `data-sds-variant="filled"` |
| `appearance="filled-outlined"` | `data-sds-variant="tonal"` |
| `appearance="outlined"` | `data-sds-variant="outlined"` |
| `appearance="plain"` | `data-sds-variant="text"` |
| `size="small\|medium\|large"` | `data-sds-size="sm\|md\|lg"` |
| `loading` | `aria-busy="true"` and `disabled` |

A button with a static `href` becomes an anchor; an action remains a native
button.

```html
<!-- Before -->
<wa-button variant="success" appearance="outlined" href="/done">
  Done
</wa-button>

<!-- After -->
<a
  class="sds-button"
  href="/done"
  data-sds-variant="outlined"
  data-sds-tone="success"
>
  Done
</a>
```

## Automated fields

Empty or self-closing `<wa-input>` and `<wa-textarea>` elements are converted
when they do not rely on generated labels, hints, clear/password controls, or
slotted content. Native form attributes and static small/medium/large sizes
are retained.

## Manual work

- Convert `label` and `hint` props/slots to native `<label>` and connected help
  text before replacing a field.
- Start/end slots, clear buttons, password toggles, pill buttons, carets,
  selects, checkboxes, radios, switches, and validation presentation require
  manual composition.
- Confirm event names and form serialization after replacing form-associated
  custom elements with native controls.
- Dynamic mapping props and spreads are warned about and left unchanged.
- Remove Web Awesome imports, registration, styles, and icon dependencies only
  after all remaining `<wa-*>` elements have been addressed.

