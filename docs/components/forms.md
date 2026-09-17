# Forms

[Documentation](../README.md) / [Components](./README.md) / Forms

SDS Lite styles native form controls, preserving browser validation,
autofill, keyboard behavior, and form submission.

## Form and field

`.sds-form` creates a vertical form with a readable maximum width. A
`.sds-field` groups one label, its control, and optional help or validation.

```html
<form class="sds-form">
  <div class="sds-field">
    <label for="project-name">Project name</label>
    <input
      id="project-name"
      name="projectName"
      type="text"
      aria-describedby="project-name-help"
      required
    >
    <small id="project-name-help">Use a short, recognizable name.</small>
  </div>

  <div class="sds-action-group">
    <button type="submit">Save project</button>
    <button type="button" data-variant="ghost">Cancel</button>
  </div>
</form>
```

Use stable IDs to connect labels and messages. Do not rely on placeholder text
as a label.

## Controls

SDS Lite automatically styles:

```text
input[type=text], input[type=email], input[type=tel], input[type=url],
input[type=password], input[type=number], input[type=search],
input[type=date], input[type=datetime-local], input[type=time],
input[type=month], input[type=week], select, textarea
```

`.sds-input` and `.sds-select` are explicit hooks when needed:

```html
<input class="sds-input" type="text">
<select class="sds-select"><option>Choose an option</option></select>
```

| Option | Values | Default |
|---|---|---|
| `data-size` | `sm`, `md`, `lg` | `md` |
| `disabled` | Native disabled state | Enabled |
| `readonly` | Native input/textarea state | Editable |
| `aria-invalid="true"` | Invalid semantics and appearance | Valid or unknown |

## Help and validation

Place required or optional context in the label and connect every message:

```html
<div class="sds-field">
  <label for="email">
    Email <small data-tone="danger">Required</small>
  </label>
  <input
    id="email"
    name="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    required
  >
  <small id="email-error" data-tone="danger">
    Enter a valid email address.
  </small>
</div>
```

Set `aria-invalid="true"` only after validation determines that the value is
invalid. Move focus to, or summarize, errors after a failed submission.

Native `:user-valid` provides positive appearance after interaction with a
constrained control:

```html
<div class="sds-field">
  <label for="slug">Project URL</label>
  <input
    id="slug"
    name="slug"
    value="atlas"
    pattern="[a-z0-9-]+"
    aria-describedby="slug-status"
  >
  <small id="slug-status" data-tone="success">This URL is available.</small>
</div>
```

Application code owns validation timing and message content.

## Horizontal fields

```html
<div class="sds-field" data-orientation="horizontal">
  <label for="owner">Owner</label>
  <select id="owner" name="owner" aria-describedby="owner-help">
    <option>Alex</option>
    <option>Jordan</option>
  </select>
  <small id="owner-help">The person responsible for this project.</small>
</div>
```

The field stacks below 40rem.

## Checkbox and radio

Wrap the native input in `.sds-choice`:

```html
<fieldset class="sds-form">
  <legend>Notifications</legend>
  <label class="sds-choice">
    <input type="checkbox" name="notifications" checked>
    Send email notifications
  </label>
  <label class="sds-choice">
    <input type="checkbox" name="digest">
    Send a weekly digest
  </label>
</fieldset>
```

```html
<fieldset class="sds-form">
  <legend>Visibility</legend>
  <label class="sds-choice">
    <input type="radio" name="visibility" value="private" checked>
    Private
  </label>
  <label class="sds-choice">
    <input type="radio" name="visibility" value="public">
    Public
  </label>
</fieldset>
```

Use `fieldset` and `legend` for related choices. Use native `checked` and
`disabled` state.
