# Selective imports

[Documentation](../README.md) / [Installation](../getting-started.md) /
Selective imports

The recommended setup is `sds.css` plus `/auto`. Use selective imports only
when bundle policy or application architecture requires explicit control.

## CSS layers

Start with the foundations and common component recipes:

```js
import '@cmu-sei/sds-lite/core.css'
```

Add only the larger recipe groups you use:

```js
import '@cmu-sei/sds-lite/layouts.css'
import '@cmu-sei/sds-lite/prose.css'
import '@cmu-sei/sds-lite/brand.css'
```

| Stylesheet | Contents |
|---|---|
| `sds.css` | Complete default bundle: core, layouts, and prose |
| `core.css` | Tokens, foundations, controls, components, and utilities |
| `layouts.css` | Grid, flex, page, action, and sidebar layouts |
| `prose.css` | Long-form semantic content |
| `brand.css` | SEI application and brochure shells |

`brand.css` is separate from `sds.css`; add it rather than replacing the
default stylesheet with it.

## Behavior modules

Import a registration function and call it once:

```js
import { registerSdsDropdown } from '@cmu-sei/sds-lite/dropdown'
import { registerSdsTabs } from '@cmu-sei/sds-lite/tabs'

registerSdsDropdown()
registerSdsTabs()
```

Registration functions are idempotent when SDS Lite already owns the custom
element definition. They throw if a different implementation has registered
the same custom-element name, preventing mixed incompatible constructors.

| Entry | Registration |
|---|---|
| `@cmu-sei/sds-lite/dialog` | `registerSdsDialog()` |
| `@cmu-sei/sds-lite/dropdown` | `registerSdsDropdown()` |
| `@cmu-sei/sds-lite/popover` | `registerSdsPopover()` |
| `@cmu-sei/sds-lite/tabs` | `registerSdsTabs()` |
| `@cmu-sei/sds-lite/tooltip` | `registerSdsTooltip()` |
| `@cmu-sei/sds-lite/toast` | `registerSdsToast()` |

`defineSds()` registers every behavior without the automatic side effect:

```js
import { defineSds } from '@cmu-sei/sds-lite'

defineSds()
```

Use it after hydration or when application startup should control the exact
registration time.

## Avoid accidental duplication

These are valid:

```js
import '@cmu-sei/sds-lite/auto'
```

```js
import { defineSds } from '@cmu-sei/sds-lite'
defineSds()
```

```js
import { registerSdsTabs } from '@cmu-sei/sds-lite/tabs'
registerSdsTabs()
```

Do not spread registration calls across unrelated feature components. Put
them in one application integration module so behavior availability does not
depend on render order.

[Review all package entries →](../reference/imports.md)
