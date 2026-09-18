# Feedback

[Documentation](../README.md) / [Components](./README.md) / Feedback

Choose feedback by purpose:

| Need | Recipe |
|---|---|
| Compact status or category | Badge |
| Category, filter, or removable label | Tag |
| Contextual message in the page | Callout |
| Temporary application notification | Toast |

## Badge

```html
<span class="sds-badge" data-sds-tone="success">Complete</span>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-tone` | All semantic tones | `neutral` |
| `data-sds-variant` | `light`, `light-border`, `dark` | Solid tone |

Badges are short, noninteractive labels.

## Tag

Choose the native element that matches the interaction:

```html
<span class="sds-tag">Research</span>
<a class="sds-tag" href="/topics/security">Security</a>
<button class="sds-tag" type="button">Filter by active</button>
```

`data-sds-size` accepts `sm` or `md`; `sm` is the default.

Compose a counter, linked label, and independent action when needed:

```html
<span class="sds-tag" data-sds-size="md">
  <span class="sds-tag-counter">12</span>
  <a class="sds-tag-label" href="/topics/security">Security</a>
  <button
    class="sds-tag-action"
    type="button"
    data-sds-tone="danger"
    aria-label="Remove Security tag"
  >
    <span aria-hidden="true">&times;</span>
  </button>
</span>
```

Application code updates counters and handles actions. SDS Lite intentionally
does not hide tag state behind a component event API.

## Callout

```html
<aside class="sds-callout" data-sds-tone="warning">
  <strong>Session ending soon</strong>
  <span>Save your work in the next five minutes.</span>
  <time class="sds-callout-timestamp" datetime="2026-09-17T11:00:00-04:00">
    Updated five minutes ago
  </time>
</aside>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-tone` | All semantic tones | `neutral` |
| `data-sds-variant` | `outline`, `bold` | Tinted surface |
| `data-sds-size` | `xs`, `sm`, `md`, `lg` | `md` |
| `data-sds-inset` | Presence; removes rounding | Rounded |

An optional `[data-sds-callout-close]` control receives close-button positioning.
Application code owns dismissal:

```html
<aside id="tip" class="sds-callout" data-sds-tone="info">
  <strong>Tip</strong>
  <span>You can rename this project later.</span>
  <button
    type="button"
    data-sds-shape="icon"
    data-sds-callout-close
    aria-label="Dismiss tip"
  >
    &times;
  </button>
</aside>
```

## Toast

For ordinary application notifications, prefer `notify()`:

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

| Option | Values | Default |
|---|---|---|
| `container` | An `HTMLElement` or toaster owner | First SDS root, then `body` |
| `title` | String | `Notification` |
| `tone` | All semantic tones | `info` |
| `duration` | Positive milliseconds | `5000` |
| `persistent` | Boolean | `false` |
| `urgent` | Boolean; changes role to `alert` | `false` |

`notify()` creates or reuses `.sds-toaster`, registers `<sds-toast>`, and
removes the closed toast after its exit motion. It can be imported during SSR
but must only be called in a browser. Invalid durations throw `RangeError`.

### Authored toast

```html
<button type="button" data-sds-toast-open="saved-toast">Show notification</button>

<section class="sds-toaster" aria-label="Notifications">
  <sds-toast
    id="saved-toast"
    tone="success"
    role="status"
    aria-atomic="true"
  >
    <strong>Project saved</strong>
    <span>Your changes are now available.</span>
    <button
      type="button"
      data-sds-shape="icon"
      data-sds-toast-close
      aria-label="Close notification"
    >
      &times;
    </button>
  </sds-toast>
</section>
```

| Interface | Values | Default |
|---|---|---|
| `open` | Presence | Closed |
| `tone` | All semantic tones | `info` |
| `duration` | Positive milliseconds | `5000` |
| `persistent` | Presence | Auto-dismiss |
| `data-sds-toast-open="id"` | Target toast on any trigger | None |
| `data-sds-toast-close` | Descendant close control | None |
| `role` | `status`, `alert` | `status` |
| `aria-atomic` | `"true"` | Added on upgrade |

Use `role="alert"` only for urgent, time-sensitive information. Toasts pause
their timer while hovered or while focus is inside. Persistent toasts need a
close control. Use a persistent toast whenever a user must read or act on its
content; reserve automatic dismissal for brief, nonessential status that is
also available elsewhere.

```ts
import type { SdsToastElement } from '@cmu-sei/sds-lite/toast'

const toast = document.querySelector<SdsToastElement>('#saved-toast')
if (toast) {
  toast.tone = 'success'
  toast.duration = 8000
  toast.persistent = true
  toast.show()
  toast.close('programmatic')
}
```
