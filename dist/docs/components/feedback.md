# Feedback

[Documentation](../README.md) / [Components](./README.md) / Feedback

Choose feedback by purpose:

| Need | Recipe |
|---|---|
| Compact status or category | [Badge](#badge) |
| Category, filter, or removable label | [Tag](#tag) |
| Contextual message in the page | [Callout](#callout) |
| Temporary application notification | [Toast](#toast) |

## Badge

```html
<span class="sds-badge" data-sds-tone="success">Complete</span>
<a class="sds-badge" data-sds-size="sm" data-sds-tone="accent" href="/projects/atlas">
  Project Atlas
</a>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-tone` | All semantic tones | `neutral` |
| `data-sds-variant` | `light`, `light-border`, `dark` | Solid tone |
| `data-sds-size` | `sm`, `md` | `md` |

### Accessibility

Badges are short labels. Use an anchor with `.sds-badge` when the badge itself
navigates to a related resource; linked badges receive tone-aware hover styling.
Use `data-sds-size="sm"` when a badge sits inline with body text or other
compact content.

### Related

[Tag](#tag), [callout](#callout).

## Tag

Choose the native element that matches the interaction:

```html
<span class="sds-tag">Research</span>
<a class="sds-tag" href="/topics/security">Security</a>
<button class="sds-tag" type="button">Filter by active</button>
```

### Options

`data-sds-size` accepts `sm` or `md`; `sm` is the default.
`data-sds-tone="danger"` customizes interactive color on a `button.sds-tag`
or `.sds-tag-action`; other semantic tones are not tag options.

### Accessibility

Use text for a label, a link for navigation, and a button for an action.
Name remove actions and avoid nesting interactive controls inside each other.

### More examples

For a removable tag without a separate link, make the entire tag one button.
Its danger tone highlights the whole tag on hover, with a single keyboard
focus target. The icon is decorative; application code handles the click:

```html
<button class="sds-tag" type="button" data-sds-tone="danger" aria-label="Remove Security">
  <span class="sds-tag-label">Security</span>
  <span class="sds-tag-action" data-sds-tone="danger" aria-hidden="true">&times;</span>
</button>
```

If the label links elsewhere, keep the link and action independent instead:

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

### Related

[Multiple-selection combobox](../guides/combobox.md#multiple-selections), [badge](#badge).

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

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-tone` | All semantic tones | `neutral` |
| `data-sds-variant` | `outline`, `bold` | Subtle surface |
| `data-sds-size` | `xs`, `sm`, `md`, `lg` | `md` |
| `data-sds-inset` | Presence; removes rounding | Rounded |

Callout sizes scale typography and padding together. Use `xs` and `sm` for
compact inline feedback, `md` for ordinary notices, and `lg` for prominent
page-level guidance.

### Accessibility

Explain status in text, not color alone. Add an alert role only when a dynamic
message must interrupt announcements. Name dismissal controls.

### More examples

An optional `[data-sds-callout-close]` control receives close-button positioning.
Application code owns dismissal:

```html
<aside id="tip" class="sds-callout" data-sds-tone="info">
  <strong>Tip</strong>
  <span>You can rename this project later.</span>
  <button class="sds-button"
    type="button"
    data-sds-shape="icon"
    data-sds-callout-close
    aria-label="Dismiss tip"
  >
    &times;
  </button>
</aside>
```

### Related

[Validation messages](./forms.md#help-and-validation), [toast](#toast).

## Toast

For ordinary application notifications, prefer `notify()`:

```js
import { notify } from '@cmu-sei/sds-lite'

notify('Your project was saved.', {
  title: 'Saved',
  tone: 'success',
})
```

### Options

| Option | Values | Default |
|---|---|---|
| `container` | An `HTMLElement`, including an existing toaster | Search the document for a toaster; otherwise create one in the first SDS root or `body` |
| `title` | String | `Notification` |
| `tone` | All semantic tones | `info` |
| `duration` | Positive milliseconds | `5000` |
| `persistent` | Boolean | `false` |
| `urgent` | Boolean; changes role to `alert` | `false` |
| `dismissLabel` | Localized close-button name | `Dismiss notification` |
| `regionLabel` | Localized name for a new or unnamed toaster | `Notifications` |

`notify()` creates or reuses `.sds-toaster`, registers `<sds-toast>`, and
removes the closed toast after its exit motion. It can be imported during SSR
but must only be called in a browser. Invalid durations throw `RangeError`.
Empty or non-string `dismissLabel` and `regionLabel` values throw `TypeError`.
With `container`, the toaster search is scoped to that element; a new toaster
is appended there if none exists.
Use `title`, `dismissLabel`, and `regionLabel` to translate generated text.
An existing toaster's authored accessible name is preserved:

```js
notify('Modifications enregistrees.', {
  title: 'Enregistre',
  dismissLabel: 'Fermer la notification',
  regionLabel: 'Notifications du projet',
})
```

### Events

The returned toast emits bubbling `sds-open` and `sds-close` events. Close
detail contains `reason`: `dismiss`, `programmatic`, or `timeout`.
`notify()` opens synchronously; listen on its container before calling it
to observe `sds-open`. Authored toasts emit these events through `show()` and
`close()`, not direct changes to the `open` attribute.

### Accessibility

Use `urgent: true` or `role="alert"` only for urgent information. Hover and focus
cancel the timer; the full duration restarts after both end.
Persistent toasts need a close control; use persistence
when users must read or act. Auto-dismiss only nonessential status available elsewhere.

### Authored toast

```html
<button class="sds-button" type="button" data-sds-toast-open="saved-toast">Show notification</button>

<section class="sds-toaster" aria-label="Notifications">
  <sds-toast
    id="saved-toast"
    tone="success"
    role="status"
    aria-atomic="true"
  >
    <strong>Project saved</strong>
    <span>Your changes are now available.</span>
    <button class="sds-button"
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

#### Options

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

Invalid authored `duration` attributes fall back to `5000`; assigning an
invalid `.duration` property throws `RangeError`.

#### Programmatic control

```ts
import { setupSds } from '@cmu-sei/sds-lite'

setupSds()
const toast = document.querySelector('sds-toast')
if (toast) {
  toast.tone = 'success'
  toast.duration = 8000
  toast.persistent = true
  toast.show()
  toast.close('programmatic')
}
```

### Related

[CDN function imports](../installation/cdn.md#import-javascript-functions),
[notification accessibility](../guides/accessibility.md#notifications), [callout](#callout).
