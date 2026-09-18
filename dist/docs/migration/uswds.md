# Migrate from the U.S. Web Design System

[Migration index](./index.md) ·
[Official USWDS button](https://designsystem.digital.gov/components/button/) ·
[Official USWDS form controls](https://designsystem.digital.gov/components/form/)

```sh
npx sds-lite-migrate --from uswds src/application.html
```

## Automated button crosswalk

| USWDS | SDS Lite |
|---|---|
| `usa-button` | `sds-button`, `data-sds-variant="primary"`, `data-sds-tone="accent"` |
| `usa-button--secondary` | `data-sds-variant="secondary"` |
| `usa-button--accent-cool` | `data-sds-tone="info"` |
| `usa-button--accent-warm` | `data-sds-tone="warning"` |
| `usa-button--base` | `data-sds-tone="neutral"` |
| `usa-button--outline` | `data-sds-variant="tertiary"` |
| `usa-button--unstyled` | `data-sds-variant="ghost"` |
| `usa-button--big` | `data-sds-size="lg"` |

Native elements are retained:

```html
<!-- Before -->
<a class="usa-button usa-button--outline" href="/help">Help</a>

<!-- After -->
<a
  class="sds-button"
  href="/help"
  data-sds-variant="tertiary"
  data-sds-tone="accent"
>
  Help
</a>
```

## Automated form crosswalk

| USWDS | SDS Lite |
|---|---|
| `usa-input` | `sds-input` |
| `usa-textarea` | `sds-input` |
| `usa-select` | `sds-select` |

The tool preserves native form attributes and does not rebuild surrounding
field markup.

## Manual work

- Recreate `usa-form-group`, labels, hints, prefixes/suffixes, error messages,
  character counts, date pickers, file inputs, checks, radios, and combo boxes
  with the appropriate SDS Lite/native structure.
- USWDS secondary and accent colors are not semantic equivalents of every SDS
  Lite tone. Confirm the intended hierarchy and meaning.
- `usa-button--outline-inverse`, custom theme tokens, and utility classes need
  manual review.
- Remove USWDS JavaScript initialization and styles only after all dependent
  components have been replaced.
- Dynamic class expressions are warned about and left unchanged.

