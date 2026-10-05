# Accessibility

[Documentation](../README.md) / Guides / Accessibility

SDS Lite supplies styling and behavior, but the application still owns
content, names, state, focus decisions, and end-to-end testing.

## Start with semantic HTML

- Use `<button>` for actions and `<a href>` for navigation.
- Use `<label>` with form controls and `<fieldset>`/`<legend>` for groups.
- Use native headings in a meaningful hierarchy.
- Use `<table>`, `<caption>`, and scoped headers for tabular data.
- Use `<dialog>`, `<details>`, `<nav>`, lists, and landmarks for their intended
  purposes.

Semantic HTML preserves keyboard, assistive-technology, form, and browser
behavior before SDS Lite loads.

## Accessible names

Every control needs a name. Visible text is best. Icon-only controls need
`aria-label` or another explicit relationship:

```html
<button type="button" data-sds-shape="icon" aria-label="Close dialog">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>
```

Every tab list, navigation landmark, dialog, panel, toaster, and meaningful
busy region needs a useful label.

## State

Use native state whenever it exists:

```html
<button disabled>Save</button>
<input type="checkbox" checked>
<details open>...</details>
<section hidden>...</section>
```

Use documented ARIA state only where native HTML has no equivalent:

```html
<a aria-current="page" href="/projects">Projects</a>
<input aria-invalid="true">
```

`aria-disabled="true"` does not block keyboard activation. Prefer native
`disabled` for buttons and controls; otherwise application code must prevent
the action.

For rich combobox suggestions, keep each `<li>` as one option with readable
text for its label and description. Do not nest links or buttons in an
option. The optional `data-label` changes the input's selected text, **not**
the option's accessible name. Keep the no-results `<output>` outside the
listbox so its implicit status role announces it without posing as an
option. If the application submits a separate record ID, clear it when the
user edits the query and validate it on the server.

## Validation

Connect help and error messages with `aria-describedby`:

```html
<div class="sds-field">
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
  >
  <small id="email-error" data-sds-tone="danger">
    Enter a valid email address.
  </small>
</div>
```

Do not rely on color alone. The message must explain the problem and how to
fix it. After failed submission, move focus to an error summary or the first
invalid field according to the application's validation pattern.

## Visually hidden content

`.sds-sr-only` hides content visually while keeping it available to assistive
technology:

```html
<span class="sds-spinner" role="status">
  <span class="sds-sr-only">Loading projects</span>
</span>
```

Use native `hidden` when content should be absent visually and from the
accessibility tree:

```html
<section id="advanced-settings" hidden>...</section>
```

SDS Lite reinforces ordinary `[hidden]` inside an SDS root so component
display rules cannot reveal it. `hidden="until-found"` retains native
find-in-page behavior.

## Keyboard behavior

SDS Lite implements documented keyboard interaction for comboboxes, tabs, and dropdowns
and preserves native interaction for dialogs, popovers, buttons, links,
details, and form controls.

Applications must still:

- keep controls in a logical DOM and focus order;
- avoid positive `tabindex`;
- restore or move focus meaningfully after application-driven changes;
- provide skip navigation for large page shells;
- avoid shortcuts that conflict with browser or assistive-technology keys.

Place a skip link before repeated page navigation in large shells:

```html
<a class="sds-skip-link" href="#main-content">Skip to main content</a>
<main id="main-content">...</main>
```

The link becomes visible on focus. Point it to a stable, unique target at the
start of the primary content.

## Notifications

Use `role="status"` for ordinary updates. Use `role="alert"` only for urgent
information that must interrupt the current announcement.

Do not put focus into a toast just to announce it. A persistent toast must
have a keyboard-accessible close control. Use automatic dismissal only for
brief, nonessential information that remains available elsewhere.

## Motion, contrast, and zoom

SDS Lite respects reduced motion and supplies theme contrast, but custom token
overrides can break it. Test:

- light and dark schemes;
- forced colors when required by your support policy;
- 200% and 400% zoom;
- text reflow at narrow widths;
- focus visibility;
- every custom semantic-color assignment.

## Automated release checks

1. The required **Build and test** check runs HTML conformance, executable
  contrast checks, and axe checks across Chromium, Firefox, and WebKit.
2. Finalize Release reruns validation and the three-browser matrix on the
  merged release commit before publication approval.

Manual keyboard, screen-reader, zoom, motion, and branded-browser testing may
be added when a change's risk warrants it, but evidence is not required for
publication. Do not claim WCAG conformance without a reviewed conformance
assessment covering the released version.
