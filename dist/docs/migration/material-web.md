# Migrate from Material Web

[Migration index](./index.md) ·
[Official Material Web buttons](https://material-web.dev/components/button/) ·
[Official Material Web text fields](https://material-web.dev/components/text-field/)

```sh
npx sds-lite-migrate --from material src/settings.html
```

## Automated button crosswalk

| Material Web | SDS Lite |
|---|---|
| `<md-filled-button>` | native button/link, `data-sds-variant="filled"` |
| `<md-filled-tonal-button>` | `data-sds-variant="tonal"` |
| `<md-elevated-button>` | `data-sds-variant="tonal"` |
| `<md-outlined-button>` | `data-sds-variant="outlined"` |
| `<md-text-button>` | `data-sds-variant="text"` |

All automated button mappings use `data-sds-tone="accent"`. A static `href`
produces an `<a class="sds-button">`; otherwise the result is a native
`<button type="button">`. Existing `type="submit"` is retained.

```html
<!-- Before -->
<md-outlined-button href="/account">Account</md-outlined-button>

<!-- After -->
<a
  class="sds-button"
  href="/account"
  data-sds-variant="outlined"
  data-sds-tone="accent"
>
  Account
</a>
```

## Automated text fields

An empty or self-closing `<md-filled-text-field>` or
`<md-outlined-text-field>` can become `<input class="sds-input">` when it does
not use component-generated label, help, error, icon, prefix, suffix, or
multiline features.

```html
<label for="email">Email</label>
<md-outlined-text-field id="email" type="email"></md-outlined-text-field>
```

becomes:

```html
<label for="email">Email</label>
<input id="email" class="sds-input" type="email">
```

## Manual work

- A Material `label` prop renders internal visible content. Rebuild it as a
  native `<label>` before replacing the field.
- Supporting/error text, leading/trailing icons, prefixes, suffixes, textarea
  mode, selects, switches, checkboxes, and radios require authored native
  structure.
- `soft-disabled` deliberately remains focusable and has no direct safe native
  button mapping; the tool leaves it unchanged.
- Dynamic appearance or semantic props are left unchanged with a warning.
- Material elevation, shape, typography, state layers, and design tokens are
  not translated.
- Replace imports, custom-element registration, and Material theme styles
  after markup migration and behavior testing.

