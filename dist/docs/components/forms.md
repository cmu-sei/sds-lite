# Forms

[Documentation](../README.md) / [Components](./README.md) / Forms

Browser validation, autofill, keyboard behavior, and submission remain native.
For styling and setup, follow the [quick start](../getting-started.md).

Find: [fields](#form-and-field), [combobox](#combobox), [inputs and selects](#controls),
[range](#range), [validation](#help-and-validation), [choices](#checkbox-and-radio),
[switch](#switch), or [file upload](#file-input).

## Form and field

`.sds-form` creates a vertical form with a readable maximum width. A
`.sds-field` groups one label, its control, and optional help or validation.

```html
<form class="sds-form">
  <div class="sds-field">
    <label for="project-name">Project name</label>
    <input class="sds-input"
      id="project-name"
      name="projectName"
      type="text"
      aria-describedby="project-name-help"
      required
    >
    <small id="project-name-help">Use a short, recognizable name.</small>
  </div>

  <div class="sds-action-group">
    <button class="sds-button" type="submit">Save project</button>
    <button class="sds-button" type="button" data-sds-variant="text">Cancel</button>
  </div>
</form>
```

### Options

Fields default to vertical. Use `data-sds-orientation="horizontal"` for the
[horizontal layout](#horizontal-fields); configure control size on the control.

### Accessibility

Use stable IDs to connect labels and messages. Do not rely on placeholder text
as a label.

### Related

[Controls](#controls), [help and validation](#help-and-validation).

## Combobox

Use `<sds-combobox>` when users need to search choices. For a short fixed list,
prefer a native `<select class="sds-select">`. The input remains a native, named form control:
typed text is allowed, and the submitted value is the visible text, not an
internal option ID.

```html
<div class="sds-field">
  <label for="project">Project</label>
  <sds-combobox>
    <input class="sds-input" id="project" name="project" type="search" autocomplete="off">
    <ul hidden>
      <li>Atlas</li>
      <li>Orion</li>
      <li>Vega</li>
    </ul>
    <output></output>
  </sds-combobox>
</div>
```

### Options

| Option | Values | Default |
|---|---|---|
| `filter` | `automatic`, `manual` | `automatic` |
| `keep-open` | Presence | Close after selection |
| `data-label` on an option | Nonempty selected display text | Option text |
| `data-sds-value` on an option | Application value | Selected display text |
| `data-empty-message` on `output` | No-results message | `No results found.` |

Automatic filtering matches option text case-insensitively. The optional
empty `output` shows a message for a nonempty query with no matches; it clears
when matches return, the query clears, or focus leaves. Escape dismisses it.

### Events

Enter or click selects an option. Native `input` and `change` fire first,
then `sds-select` exposes `detail.value` and the original `detail.option`.
The named input submits visible text, not a separate record ID.

### Accessibility

Label the input and keep the input, list, and optional `output` as direct
children. Do not put interactive controls in options. Arrow keys move the
active suggestion; Escape closes it; Tab preserves typed text.
`aria-disabled="true"` prevents option selection. The output's native status
role announces no results outside the listbox.

### Related

- [Record IDs, rich options, multiple selections, and server results](../guides/combobox.md).
- [Fully authored SSR markup](../guides/server-rendering.md#fully-authored-combobox).
- [Combobox submission troubleshooting](../troubleshooting.md#a-combobox-submits-text-instead-of-a-record-id).

### Rich suggestions and record IDs

Moved to [Advanced combobox workflows](../guides/combobox.md#rich-suggestions-and-record-ids).

## Controls

Use `.sds-input` for text-like inputs and textareas, `.sds-select` for selects,
`.sds-range` for range inputs, and `.sds-file-input` for file inputs. These
classes opt native controls into SDS appearance while retaining native behavior.
Text-like input types include:

```text
input[type=text], input[type=email], input[type=tel], input[type=url],
input[type=password], input[type=number], input[type=search],
input[type=date], input[type=datetime-local], input[type=time],
input[type=month], input[type=week]
```

Apply the recipe class directly to the control:

```html
<input class="sds-input" type="text">
<select class="sds-select"><option>Choose an option</option></select>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-size` | `sm`, `md`, `lg` | `md` |
| `disabled` | Native disabled state | Enabled |
| `readonly` | Native input/textarea state | Editable |
| `aria-invalid="true"` | Invalid semantics and appearance | Valid or unknown |

### Accessibility

Give every control a label and use `name` for submitted values. Connect help
with `aria-describedby`; use native types and constraints before custom validation.

### Related

[Form fields](#form-and-field), [validation](#help-and-validation), [combobox](#combobox).

## Input prefix and suffix

Use `.sds-input-group` when a visible unit or symbol belongs next to a native
control. Keep the accessible name on the control; hide a decorative symbol or
include meaningful unit text in the label.

```html
<div class="sds-field">
  <label for="budget">Budget in U.S. dollars</label>
  <div class="sds-input-group">
    <span class="sds-input-addon" aria-hidden="true">$</span>
    <input class="sds-input" id="budget" name="budget" type="number" min="0">
    <span class="sds-input-addon">USD</span>
  </div>
</div>
```

### Options

`data-sds-size` on `.sds-input-group` accepts `sm`, `md`, or `lg` and sizes the
control and add-ons together. The default is `md`.

### Accessibility

Include meaningful units in the label and hide decorative symbols. SDS Lite
supplies shared borders and spacing; validation and submission remain native.

### Related

[Controls](#controls), [help and validation](#help-and-validation).

## Range

Native range inputs opt into styling with `.sds-range` and retain platform
keyboard, pointer, and form behavior:

```html
<div class="sds-field">
  <label for="confidence">Confidence: 70%</label>
  <input class="sds-range" id="confidence" name="confidence" type="range" value="70">
</div>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-tone` | Any semantic tone | `info` |
| `data-sds-size` | `sm`, `md`, `lg` | `md` |

### Accessibility

Label the range and keep live displayed values synchronized in application code.
Use a number input when users must enter or verify an exact value.

### Related

[Controls](#controls), [measurement](./loading.md#progress-and-measurement).

## Help and validation

Place required or optional context in the label and connect every message:

```html
<div class="sds-field">
  <label for="email">
    Email <small data-sds-tone="danger">Required</small>
  </label>
  <input class="sds-input"
    id="email"
    name="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    required
  >
  <small id="email-error" data-sds-tone="danger">
    Enter a valid email address.
  </small>
</div>
```

### Options

`data-sds-tone` accepts any semantic tone on a field's direct help text or
label's small context. Putting it on the field container does not color
either message.

### Accessibility

Set `aria-invalid="true"` only after validation identifies an error. Connect
messages with `aria-describedby` and explain errors in text. After a failed
submission, summarize errors or move focus according to the application's policy.

### More examples

Native `:user-valid` provides positive appearance after interaction with a
constrained control:

```html
<div class="sds-field">
  <label for="slug">Project URL</label>
  <input class="sds-input"
    id="slug"
    name="slug"
    value="atlas"
    pattern="[a-z0-9-]+"
    aria-describedby="slug-status"
  >
  <small id="slug-status" data-sds-tone="success">This URL is available.</small>
</div>
```

Application code owns validation timing and message content.

### Related

[Error summaries](../guides/composition-patterns.md), [callout](./feedback.md#callout).

## Horizontal fields

```html
<div class="sds-field" data-sds-orientation="horizontal">
  <label for="owner">Owner</label>
  <select class="sds-select" id="owner" name="owner" aria-describedby="owner-help">
    <option>Alex</option>
    <option>Jordan</option>
  </select>
  <small id="owner-help">The person responsible for this project.</small>
</div>
```

### Options

Use `data-sds-orientation="horizontal"` on `.sds-field`. It stacks below `40rem`;
the default orientation is vertical.

### Accessibility

Keep label, control, and help in reading order even when they appear side by side.

### Related

[Form and field](#form-and-field), [responsive composition](./layout.md#responsive-composition).

## Checkbox and radio

Wrap the native input in `.sds-choice`:

```html
<fieldset class="sds-form sds-fieldset">
  <legend>Notifications</legend>
  <label class="sds-choice">
    <input class="sds-checkbox" type="checkbox" name="notifications" checked>
    Send email notifications
  </label>
  <label class="sds-choice">
    <input class="sds-checkbox" type="checkbox" name="digest">
    Send a weekly digest
  </label>
</fieldset>
```

### Options

Use native `checked`, `disabled`, and `required`. Give radio options the same
`name` and different submitted `value`s.

### Accessibility

Group related choices with `fieldset` and `legend`, and label every input.

### More examples

Radio buttons select one value from a group:

```html
<fieldset class="sds-form sds-fieldset">
  <legend>Visibility</legend>
  <label class="sds-choice">
    <input class="sds-radio" type="radio" name="visibility" value="private" checked>
    Private
  </label>
  <label class="sds-choice">
    <input class="sds-radio" type="radio" name="visibility" value="public">
    Public
  </label>
</fieldset>
```

### Related

[Switch](#switch) for immediately applied settings, [form and field](#form-and-field).

## Switch

A switch is a native checkbox with switch semantics. Keep the input inside its
label so the complete visible label remains clickable:

```html
<label class="sds-switch">
  <input class="sds-checkbox"
    type="checkbox"
    role="switch"
    name="automaticUpdates"
    checked
  >
  Automatic updates
</label>
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on label | `sm`, `md`, `lg` | `md` |
| `data-sds-tone` on label | Any semantic tone | `info` |
| `checked` on input | Native checked state | Unchecked |
| `disabled` on input | Native disabled state | Enabled |
| `aria-invalid="true"` on input | Invalid semantics and appearance | Valid or unknown |

### Accessibility

Use a checkbox rather than a switch when the user is selecting an item for a
later submit action. Use a switch when changing the value takes effect
immediately. Keep the input inside its label; native constraints and submission remain intact.

### Related

[Checkbox and radio](#checkbox-and-radio), [validation](#help-and-validation).

## File input

For a compact native file picker:

```html
<label for="attachment">Attachment</label>
<input class="sds-file-input" id="attachment" name="attachment" type="file">
```

### Options

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on `.sds-file-upload` or `.sds-file-input` | `sm`, `md`, `lg` | `md` |

Use native `accept`, `multiple`, `required`, and `disabled` attributes.

### Accessibility

Label the input and describe file restrictions. Applications own size/content
validation, previews, and uploads. `accept` is a picker hint, not security
validation; validate again on the server.

### More examples

For a full upload surface:

```html
<div class="sds-field">
  <label for="supporting-files">Supporting files</label>
  <div class="sds-file-upload">
    <div class="sds-file-upload-surface">
      <input
        id="supporting-files"
        class="sds-file-input"
        name="supportingFiles"
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        aria-describedby="supporting-files-help"
      >
      <span class="sds-file-upload-action" aria-hidden="true">
        <svg viewBox="0 0 16 16">...</svg>
        Upload files
      </span>
      <strong>Click to upload or drag and drop files here</strong>
      <small id="supporting-files-help">
        Select PDF or Word files. Each file must be smaller than 10 MB.
      </small>
    </div>
  </div>
</div>
```

`.sds-file-upload`, `.sds-file-upload-surface`, and
`.sds-file-upload-action` reproduce the established dashed SDS upload area.
The transparent native input covers the complete surface. Clicking anywhere
opens the file picker; dropping files onto it uses the browser's native drop
behavior where supported. SDS Lite does not implement custom drag-and-drop
handling. Omit those wrappers when the visible compact native input is
preferred.

On a composed upload, size adjusts the outer padding, drop-area padding,
action, icon, and supporting text together. On a native file input, it adjusts
the visible file-selector button.

### Related

[Form fields](#form-and-field), [progress](./loading.md#progress-and-measurement).
