# Navigation

[Documentation](../README.md) / [Components](./README.md) / Navigation

Find: [breadcrumb](#breadcrumb), [skip link](#skip-link), [tabs](#tabs),
[pagination](#pagination), [dropdown](#dropdown-menu), or [disclosure](#disclosure).

## Breadcrumb

Use a navigation landmark and an ordered list:

```html
<nav class="sds-breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><span aria-current="page">Atlas</span></li>
  </ol>
</nav>
```

### Options

`data-sds-size` accepts `sm`, `md`, or `lg`; the default is `md`.

### Accessibility

Label the navigation landmark. Mark the current page with `aria-current="page"`
and plain text when it should not link to itself.

### Related

[Page layout](./layout.md#page-and-section), [pagination](#pagination).

## Skip link

Place a skip link before repeated navigation and target the main content:

```html
<a class="sds-skip-link" href="#main-content">Skip to main content</a>
<header>...</header>
<main id="main-content">...</main>
```

### Options

`data-sds-size` accepts `sm` or `md` and defaults to `sm`. Its action color is
fixed so the same keyboard affordance is recognizable on every page.

### Accessibility

The link appears on keyboard focus. Use a unique target at the start of the
primary content and place the link before repeated navigation.

### Related

[Application shells](./layout.md#sei-application-shells), [keyboard accessibility](../guides/accessibility.md#keyboard-behavior).

## Tabs

For client-rendered markup, provide a named tab list and one panel per tab:

```html
<sds-tabs>
  <div aria-label="Project settings">
    <button class="sds-button">Profile</button>
    <button class="sds-button" aria-selected="true">Security</button>
  </div>
  <section>Profile settings</section>
  <section>Security settings</section>
</sds-tabs>
```

SDS Lite supplies missing classes, roles, IDs, relationships, tab order, and
panel visibility. `aria-selected="true"` chooses the initial enabled tab; the
first enabled tab is used when it is omitted.

### Options

| Option | Values | Default |
|---|---|---|
| `variant` | `folder`, `block`, `underline` | `folder` |
| `size` | `md`, `lg` | `md` |
| `tone` | All semantic tones | `info` |
| `activation` | `automatic`, `manual` | `automatic` |
| `orientation` | `horizontal`, `vertical` | `horizontal` |
| `value` | Selected tab value | Selected tab's `value` or `id` |
| `value` on a tab button | Any string | Tab `id` |
| `aria-selected="true"` | Initial selection | First enabled tab |
| `disabled` | Disabled button tab | Enabled |
| `aria-disabled="true"` | Disabled tab | Enabled |

### Events

User selection emits `sds-change` with `detail.index` and `detail.value`.
Programmatic value changes do not emit it.

```js
document.querySelector('sds-tabs')?.addEventListener('sds-change', (event) => {
  console.log(event.detail.index, event.detail.value)
})
```

### Accessibility

Name the tab list and provide one panel per tab. Automatic activation selects
on focus; manual activation waits for click, Enter, or Space. Horizontal tabs
use Left/Right, vertical tabs Up/Down, and Home/End reach the first/last enabled tab.

### More examples

The supplied visual recipe is a horizontal scrolling row. Applications using
vertical orientation provide their own panel placement while retaining roles
and relationships.

Each tab button may provide a native `value`. The host reflects the selected
value and supports programmatic selection without synthesizing user input:

```js
const tabs = document.querySelector('sds-tabs')
tabs.value = 'security'
```

Setting an unknown or disabled value throws `RangeError`. Programmatic changes
do not dispatch `sds-change`, matching native form-control behavior.

Route-backed tabs may use `<a class="sds-tab" role="tab" href="...">`. Arrow
keys move focus; activating a link navigates. Render the requested route with
its corresponding link selected and panel visible.

### Related

[Fully authored SSR tabs](../guides/server-rendering.md), [framework events](../guides/frameworks.md).

## Pagination

Pagination is ordinary navigation. Prefer links so each page has a URL and
works without JavaScript:

```html
<nav class="sds-pagination" aria-label="Search result pages">
  <ul>
    <li>
      <a href="?page=1" aria-label="Previous page">
        <svg aria-hidden="true" viewBox="0 0 8 13">...</svg>
      </a>
    </li>
    <li><a href="?page=1" aria-label="Page 1">1</a></li>
    <li>
      <a href="?page=2" aria-label="Page 2" aria-current="page">2</a>
    </li>
    <li><a href="?page=3" aria-label="Page 3">3</a></li>
    <li><span aria-hidden="true">&hellip;</span></li>
    <li><a href="?page=8" aria-label="Page 8">8</a></li>
    <li>
      <a href="?page=3" aria-label="Next page">
        <svg aria-hidden="true" viewBox="0 0 8 13">...</svg>
      </a>
    </li>
  </ul>
  <p class="sds-pagination-status">Showing 11-20 of 78 results</p>
</nav>
```

### Options

Use `aria-current="page"` for the current page. Page count, URLs, truncated
range, and loading state belong to the application; there are no recipe options.

### Accessibility

Name the navigation landmark and icon-only links. Add `aria-live="polite"` to
`.sds-pagination-status` when the result range changes without navigation.

### More examples

Use `aria-current="page"` on the current page. For unavailable previous or next actions, render a noninteractive link
placeholder:

```html
<a role="link" aria-disabled="true" tabindex="-1" aria-label="Previous page">
  <svg aria-hidden="true" viewBox="0 0 8 13">...</svg>
</a>
```

Client-rendered applications may use buttons instead of links when changing
pages does not change the URL.

Previous and next controls use compact, accessible icon links. The current
page uses the established subtle blue surface and border rather than a
solid-button treatment.

### Related

[Table](./data-display.md#table), [empty state](./loading.md#empty-state).

## Dropdown menu

```html
<sds-dropdown>
  <button class="sds-button">Actions</button>
  <menu>
    <li><button class="sds-button" type="button">Rename</button></li>
    <li><a href="/duplicate">Duplicate</a></li>
    <li><button class="sds-button" type="button" data-sds-tone="danger">Delete</button></li>
  </menu>
</sds-dropdown>
```

### Options

| Option | Values | Default |
|---|---|---|
| `width` | `auto`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `placement` | Logical side, optionally followed by `-start` or `-end` | `block-end-start` |
| `offset` | Nonnegative CSS pixels | `5` |
| `hide-caret` | Presence hides the trigger caret | Caret shown |
| `open` | Presence | Closed |

Logical sides are `block-start`, `block-end`, `inline-start`, and
`inline-end`. Placement is preferred rather than fixed; the menu flips when
the requested side would overflow.

### Events

`sds-toggle` reports actual visibility through `detail.open`. The reflected
`open` property and `show()`/`hide()` methods support application control:

```js
const dropdown = document.querySelector('sds-dropdown')
dropdown.show()
dropdown.addEventListener('sds-toggle', (event) => {
  console.log(event.detail.open)
})
```

### Accessibility

Dropdowns support:

- Enter, Space, Arrow Down, or Arrow Up to open and focus an item;
- Arrow keys, Home, and End to navigate enabled items;
- Escape to close and return focus;
- close after activation;
- synchronized `aria-expanded`;
- repositioning during document and nested-container scrolling.

Use `aria-disabled="true"` on unavailable menu items. Unlike a native disabled
button, an ARIA-disabled menu item remains in the arrow-key sequence; SDS Lite
prevents its activation. The trigger and menu must be direct children. SDS Lite defaults an omitted
trigger `type` to `button`; an explicit type is preserved. Invalid
or ambiguous structures are not enhanced and produce a console warning.

### More examples

Use `hide-caret` when the trigger already communicates that it opens a
menu, such as an icon-only action or avatar-group overflow count.

### Related

Use a [popover](./overlays.md#popover) for rich content rather than menu actions.
See [SSR menu markup](../guides/server-rendering.md) for server rendering.

## Disclosure

Use native `<details>` and `<summary>`:

```html
<details class="sds-disclosure">
  <summary>What does this setting do?</summary>
  <p>This setting controls project notifications.</p>
</details>
```

### Options

Use native `open` for initial state. No JavaScript import is required.

### Events

Listen for native `toggle` if application state needs to follow disclosure state.

### Accessibility

The summary must clearly describe the content it reveals.

### Related

[Accordion groups](../guides/composition-patterns.md), [popover](./overlays.md#popover).
