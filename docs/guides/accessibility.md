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

SDS Lite implements documented keyboard interaction for tabs and dropdowns
and preserves native interaction for dialogs, popovers, buttons, links,
details, and form controls.

Applications must still:

- keep controls in a logical DOM and focus order;
- avoid positive `tabindex`;
- restore or move focus meaningfully after application-driven changes;
- provide skip navigation for large page shells;
- avoid shortcuts that conflict with browser or assistive-technology keys.

## Notifications

Use `role="status"` for ordinary updates. Use `role="alert"` only for urgent
information that must interrupt the current announcement.

Do not put focus into a toast just to announce it. A persistent toast must
have a keyboard-accessible close control.

## Motion, contrast, and zoom

SDS Lite respects reduced motion and supplies theme contrast, but custom token
overrides can break it. Test:

- light and dark schemes;
- forced colors when required by your support policy;
- 200% and 400% zoom;
- text reflow at narrow widths;
- focus visibility;
- every custom semantic-color assignment.

## Release checklist

1. Navigate the complete workflow using only a keyboard.
2. Verify names, roles, states, and announcements with a screen reader.
3. Run automated accessibility checks.
4. Test error recovery, loading, empty, and success states.
5. Test zoom, reflow, reduced motion, light, and dark schemes.
6. Re-test after any token, content, or framework integration change.

Automated checks catch only part of the contract; keyboard and
assistive-technology testing remain required.
