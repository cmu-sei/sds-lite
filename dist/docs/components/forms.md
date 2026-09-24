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
    <button type="button" data-sds-variant="ghost">Cancel</button>
  </div>
</form>
```

Use stable IDs to connect labels and messages. Do not rely on placeholder text
as a label.

## Combobox

Use `<sds-combobox>` when users need to search choices. For a short fixed list,
prefer a native `<select>`. The input remains a native, named form control:
typed text is allowed, and the submitted value is the visible text, not an
internal option ID.

```html
<div class="sds-field">
  <label for="project">Project</label>
  <sds-combobox>
    <input id="project" name="project" type="search" autocomplete="off">
    <ul hidden>
      <li>Atlas</li>
      <li>Orion</li>
      <li>Vega</li>
    </ul>
    <output></output>
  </sds-combobox>
</div>
```

Automatic filtering matches option text without case sensitivity. Arrow Down
and Arrow Up move the active suggestion without moving input focus; Enter or
click selects it and fires native `input` and `change` events on the input.
Escape closes suggestions; Tab leaves the typed value alone. An option with
`aria-disabled="true"` cannot be selected. Give the input a visible label or
another accessible name; keep the input and list as direct children. The
suggestion list uses the Popover API and stays anchored while scrolling.
Add an optional, initially empty `<output>` after the list to show
**No results found.** in a floating dropdown for a nonempty query with no
matching options. Its implicit `status` role announces the update politely
without putting a non-option inside the listbox. Override the text with
`<output data-empty-message="No matching projects."></output>`.
The message clears when results return, the query clears, or the input loses
focus. Escape dismisses it. For `filter="manual"`, mark the list
`aria-busy="true"` while loading so an empty list does not announce a
premature no-results message.

### Rich suggestions and record IDs

Options can contain noninteractive HTML such as a name and description.
Automatic filtering searches the option's `textContent`, including the
description. Add a nonempty `data-label` when selecting the option should put
only its name in the input; otherwise SDS Lite uses the option's full
`textContent`. An empty `data-label` warns and prevents selection.
The option remains accessible by its visible contents. Do not put links or
buttons inside a listbox option.

Keep record identity in application data. An application-owned ID on each
`<li>` lets the `sds-select` event identify the original record without
teaching SDS Lite a record schema:

```html
<form id="project-form">
  <label for="record-query">Project</label>
  <sds-combobox id="record-picker">
    <input id="record-query" name="projectQuery" type="search" autocomplete="off">
    <ul hidden>
      <li data-label="Atlas" data-project-id="p-atlas">
        <span class="sds-stack" data-sds-gap="none">
          <strong>Atlas</strong>
          <small>Research · owner Avery</small>
        </span>
      </li>
      <li data-label="Vega" data-project-id="p-vega">
        <span class="sds-stack" data-sds-gap="none">
          <strong>Vega</strong>
          <small>Engineering · owner Casey</small>
        </span>
      </li>
    </ul>
    <output></output>
  </sds-combobox>
  <input id="record-id" name="projectId" type="hidden">
  <p id="selected-project" role="status"></p>
  <button type="submit">Submit project</button>
</form>
```

```js
const records = new Map([
  ['p-atlas', { id: 'p-atlas', name: 'Atlas', team: 'Research', owner: 'Avery' }],
  ['p-vega', { id: 'p-vega', name: 'Vega', team: 'Engineering', owner: 'Casey' }],
])
const picker = document.querySelector('#record-picker')
const query = document.querySelector('#record-query')
const id = document.querySelector('#record-id')
const selected = document.querySelector('#selected-project')

query.addEventListener('input', () => {
  id.value = ''
  selected.textContent = ''
})
picker.addEventListener('sds-select', (event) => {
  const record = records.get(event.detail.option.dataset.projectId)
  if (!record) throw new Error('Selected project is missing from the catalog')
  id.value = record.id
  selected.textContent = `Selected project: ${record.name}`
  query.value = ''
  // Use record.team, record.owner, etc. in application state as needed.
})
document.querySelector('#project-form').addEventListener('reset', () => {
  id.value = ''
  selected.textContent = ''
})
```

Without `keep-open`, SDS Lite sets the visible input to `data-label`, then
fires native `input` and `change` on that input **before** `sds-select`.
Clearing the stored ID on `input` and setting it on `sds-select` therefore
keeps the ID tied to an actual selection. Clear the query *after* storing
the ID; assigning `query.value = ''` does not dispatch another `input`
event or erase the chosen ID. Show the selected record separately (as the
playground does), since the search field is empty again. Subsequent edits
invalidate the ID.
Clear the ID on a form reset as well. If application code later changes the
query without selecting a record, invalidate the ID explicitly: assigning
`input.value` does not emit `input`.
The query input submits an empty `projectQuery` after selection; the separate
hidden input submits `projectId`. Before JavaScript runs, the query still
submits typed text. SDS Lite does **not** submit IDs, store objects, or validate
that the selected ID still exists. Validate IDs on the server. Without
JavaScript, the input remains usable for free text but the hidden ID stays
empty; use a native `<select>` fallback when choosing a valid ID without
JavaScript is required. Server templates should render the options and the
application's lookup from the same record data. The
[playground](../../index.html#record-form) runs this example.

Add `keep-open` to select several suggestions without closing the list.
Selection writes `data-label` (or the option text) to the input and fires
native `input` and `change` before `sds-select`, whose `event.detail.option`
is the chosen `<li>`. Other matches from the last search remain available
until the user edits the input; the application owns selected values, tags,
and any form submission. Use a search input without a `name` when its
displayed value should not be submitted alongside the selected values.
Disable selected options with `aria-disabled="true"` to prevent duplicates,
and remove that attribute when a tag is removed. The list stays open while
there are other matching options; Escape or moving focus away still closes
it. Without `keep-open`, the combobox writes the chosen text, fires native
events, and closes; application code may then clear the input.
With `keep-open`, use `sds-select` rather than input events to track
*which* option was chosen; `input` and `change` report its display text.
The [playground](../../index.html#forms) shows a removable tag list using
this small interface. Its `sds-select` handler adds a tag, then sets
`input.value = ''` in either mode. That is application logic, not a combobox
option. Because assigning `.value` does not emit `input`, `keep-open` can
continue showing the last search's other matches; without it, the list closes.
The same handler works with the CDN script or an NPM import.

For suggestions from a server or a large catalog, set `filter="manual"`
and render only the matching `li` children in response to input. Automatic
filtering checks every authored option's text on each edit. SDS Lite observes
the list and opens it when results arrive while the input has focus. The
application owns fetching, loading/error messages, stale-response cancellation,
and validation; set
`aria-busy` on the list while fetching and connect any status message to the
input with `aria-describedby`. Do not add untrusted HTML with `innerHTML`;
create option nodes and set `textContent`.

```js
const input = document.querySelector('sds-combobox[filter="manual"] > input')
const list = document.querySelector('sds-combobox[filter="manual"] > ul')
const teams = ['Accessibility', 'Engineering', 'Research']

input.addEventListener('input', () => {
  const matches = teams.filter((team) =>
    team.toLowerCase().includes(input.value.toLowerCase()))
  list.replaceChildren(...matches.map((team) => {
    const option = document.createElement('li')
    option.textContent = team
    return option
  }))
})
```

When the server response must include the fully enhanced accessibility state,
render the complete closed-state markup *before* hydration (including IDs,
roles, and `hidden`, plus an empty `<output>` when used). Otherwise, the
beginner markup can be enhanced after hydration. In either case, call
`setupSds()` after hydration. The
[server-rendering guide](../guides/server-rendering.md#fully-authored-combobox)
has a copy-ready example. A simple `<input>` still accepts free text and
submits normally before JavaScript runs.

## Controls

SDS Lite automatically styles:

```text
input[type=text], input[type=email], input[type=tel], input[type=url],
input[type=password], input[type=number], input[type=search],
input[type=date], input[type=datetime-local], input[type=time],
input[type=month], input[type=week], input[type=file], select, textarea
```

`.sds-input` and `.sds-select` are explicit hooks when needed:

```html
<input class="sds-input" type="text">
<select class="sds-select"><option>Choose an option</option></select>
```

| Option | Values | Default |
|---|---|---|
| `data-sds-size` | `sm`, `md`, `lg` | `md` |
| `disabled` | Native disabled state | Enabled |
| `readonly` | Native input/textarea state | Editable |
| `aria-invalid="true"` | Invalid semantics and appearance | Valid or unknown |

## Help and validation

Place required or optional context in the label and connect every message:

```html
<div class="sds-field">
  <label for="email">
    Email <small data-sds-tone="danger">Required</small>
  </label>
  <input
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

Set `aria-invalid="true"` only after validation determines that the value is
invalid. Move focus to, or summarize, errors after a failed submission.

`data-sds-tone` accepts any semantic tone on a field's direct help text or
label's small context. Putting it on the field container does not color
either message.

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
  <small id="slug-status" data-sds-tone="success">This URL is available.</small>
</div>
```

Application code owns validation timing and message content.

## Horizontal fields

```html
<div class="sds-field" data-sds-orientation="horizontal">
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

## Switch

A switch is a native checkbox with switch semantics. Keep the input inside its
label so the complete visible label remains clickable:

```html
<label class="sds-switch">
  <input
    type="checkbox"
    role="switch"
    name="automaticUpdates"
    checked
  >
  Automatic updates
</label>
```

The native `checked`, `disabled`, `required`, and form-submission behavior
remain intact.

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on label | `sm`, `md`, `lg` | `md` |
| `data-sds-tone` on label | Any semantic tone | Accent |
| `checked` on input | Native checked state | Unchecked |
| `disabled` on input | Native disabled state | Enabled |
| `aria-invalid="true"` on input | Invalid semantics and appearance | Valid or unknown |

Use a checkbox rather than a switch when the user is selecting an item for a
later submit action. Use a switch when changing the value takes effect
immediately.

## File input

Native file inputs are styled automatically inside an SDS root. Use
`.sds-file-input` as an explicit hook outside that scope:

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

Use native `accept`, `multiple`, `required`, and `disabled` attributes.
Applications remain responsible for validating file content and size,
displaying selected-file previews, and performing uploads. Do not treat
`accept` as security validation; validate files again on the server.

`.sds-file-upload`, `.sds-file-upload-surface`, and
`.sds-file-upload-action` reproduce the established dashed SDS upload area.
The transparent native input covers the complete surface. Clicking anywhere
opens the file picker; dropping files onto it uses the browser's native drop
behavior where supported. SDS Lite does not implement custom drag-and-drop
handling. Omit those wrappers when the visible compact native input is
preferred.

| Option | Values | Default |
|---|---|---|
| `data-sds-size` on `.sds-file-upload` or `.sds-file-input` | `sm`, `md`, `lg` | `md` |

On a composed upload, size adjusts the outer padding, drop-area padding,
action, icon, and supporting text together. On a native file input, it adjusts
the visible file-selector button.
