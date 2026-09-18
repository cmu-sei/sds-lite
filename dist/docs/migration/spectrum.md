# Migrate from Spectrum Web Components

[Migration index](./index.md) ·
[Official Spectrum button](https://opensource.adobe.com/spectrum-web-components/components/button/) ·
[Official Spectrum text field](https://opensource.adobe.com/spectrum-web-components/components/textfield/)

```sh
npx sds-lite-migrate --from spectrum src/editor.html
```

## Automated button crosswalk

| Spectrum | SDS Lite |
|---|---|
| `variant="accent"` | `data-sds-variant="primary"`, `data-sds-tone="accent"` |
| `variant="primary"` | `data-sds-variant="primary"`, `data-sds-tone="neutral"` |
| `variant="secondary"` | `data-sds-variant="secondary"`, `data-sds-tone="neutral"` |
| `variant="negative"` | `data-sds-variant="primary"`, `data-sds-tone="danger"` |
| `treatment="outline"` | `data-sds-variant="tertiary"` |
| `size="s\|m\|l\|xl"` | `data-sds-size="sm\|md\|lg\|xl"` |
| `pending` | `aria-busy="true"` and `disabled` |
| `icon-only label="Help"` | `data-sds-shape="icon" aria-label="Help"` |

Spectrum documents native anchors as the preferred replacement for deprecated
`href` behavior on `<sp-button>`. The migrator follows that guidance:

```html
<!-- Before -->
<sp-button href="/reports" variant="accent">Reports</sp-button>

<!-- After -->
<a
  class="sds-button"
  href="/reports"
  data-sds-variant="primary"
  data-sds-tone="accent"
>
  Reports
</a>
```

## Automated text fields

An empty or self-closing `<sp-textfield>` can become
`<input class="sds-input">` when it has no component-generated label, help,
invalid, quiet, or growth behavior. Static sizes `s`, `m`, and `l` map to
`sm`, `md`, and `lg`.

## Manual work

- Convert `label` to a visible native `<label>`. Rebuild
  `<sp-field-label>`, help-text slots, and negative-help-text slots as native
  associated content.
- `static-color` depends on the surrounding surface and is left unchanged.
- Review slotted Spectrum icons. Their `slot` attributes and icon package
  imports are not automatically rewritten.
- Buttons with dynamic variant/treatment/size/href state are left unchanged.
- Action groups, action buttons, picker/select, checkboxes, radios, switches,
  number fields, and complex validation need manual structure and behavior.
- Remove Spectrum registrations, packages, theme, and scale styles only after
  no Spectrum elements remain.

