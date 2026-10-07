# Advanced combobox workflows

[Documentation](../README.md) / [Forms](../components/forms.md#combobox) / Advanced combobox

Start with the [basic combobox](../components/forms.md#combobox) and load behavior
once. Use this guide only when your application needs more than searchable text.

| Need | Example |
|---|---|
| Submit a record ID instead of text | [Rich suggestions and record IDs](#rich-suggestions-and-record-ids) |
| Keep several selected records | [Multiple selections](#multiple-selections) |
| Supply server or large-catalog results | [Application-supplied results](#application-supplied-results) |
| Coordinate a React form | [React 19 record picker](#react-19-record-picker) |
| Coordinate a Vue form | [Vue record picker](#vue-record-picker) |
| Render complete initial accessibility state | [Server rendering](./server-rendering.md#fully-authored-combobox) |

## Rich suggestions and record IDs

Use `data-label` for selected display text and `data-sds-value` for identity.
Rich options may contain descriptions, but not interactive controls.

```html
<form id="project-form">
  <label for="record-query">Project</label>
  <sds-combobox id="record-picker">
    <input class="sds-input" id="record-query" name="projectQuery" type="search" autocomplete="off">
    <ul hidden>
      <li data-label="Atlas" data-sds-value="p-atlas">
        <strong>Atlas</strong> <small>Research, owner Avery</small>
      </li>
      <li data-label="Vega" data-sds-value="p-vega">
        <strong>Vega</strong> <small>Engineering, owner Casey</small>
      </li>
    </ul>
    <output></output>
  </sds-combobox>
  <input id="record-id" name="projectId" type="hidden">
  <p id="selected-project" role="status"></p>
  <button class="sds-button" type="submit">Submit project</button>
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
  const record = records.get(event.detail.value)
  if (!record) throw new Error('Selected project is missing from the catalog')
  id.value = record.id
  selected.textContent = `Selected project: ${record.name}`
  query.value = ''
})
document.querySelector('#project-form').addEventListener('reset', () => {
  id.value = ''
  selected.textContent = ''
})
```

### Options

Filtering searches all option text, including descriptions. A nonempty
`data-label` changes selected text, not the accessible name. An empty label
warns and prevents selection. Without `data-sds-value`, the event value is
the selected display text.

### Events and state

Native `input` and `change` fire **before** `sds-select`, in both selection
modes. Clear stored identity on edits; set it on selection. Clear it on reset
and unrelated programmatic query changes too: assigning `.value` emits no event.
Clearing the query after storing a selection is intentional; show the selected
record separately. This example submits an empty `projectQuery` plus `projectId`.

### Accessibility and validation

Validate IDs on the server. SDS Lite neither stores records nor verifies that
an ID exists. Render options and the lookup from the same application data.
Without JavaScript the hidden ID stays empty; use a native
`<select class="sds-select">` fallback if valid-ID selection must work without it.

Related: [runnable record form](../../index.html#record-form),
[stale-ID troubleshooting](../troubleshooting.md#selected-record-id-is-stale).

## Multiple selections

Add `keep-open` to the basic combobox. Track chosen options with `sds-select`,
not input events; the application owns selected records, tags, and submission.

- Disable selected options with `aria-disabled="true"` to prevent duplicates;
  remove it when their tags are removed.
- Omit the query input's `name` if display text should not be submitted.
- Selection writes display text. Clear `.value` in your handler if desired;
  this does not emit `input`, so other matches from the last query stay available.
- The list closes when no other matches remain, on Escape, or when focus leaves.

Related: [tag recipe](../components/feedback.md#tag),
[runnable multiple-selection example](../../index.html#forms).

## Application-supplied results

Set `filter="manual"` and replace the direct `li` children as results arrive.
Automatic mode scans every authored option on each edit; manual mode lets
your application fetch or filter only the relevant results.

```html
<label for="team-query">Team</label>
<sds-combobox filter="manual">
  <input class="sds-input" id="team-query" type="search" autocomplete="off">
  <ul hidden></ul>
  <output></output>
</sds-combobox>
```

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

For asynchronous results, the application owns requests, stale-response
cancellation, errors, and validation. Set `aria-busy="true"` on the list while
loading to suppress premature no-results announcements; remove it when loading
finishes. Connect additional status text with `aria-describedby`. SDS Lite
observes list changes and opens results while the input has focus. Create nodes
with `textContent`, not untrusted `innerHTML`.

## React 19 record picker

Use the [React setup](./frameworks.md#react). Keep the hidden ID in React state;
the visible query stays native because SDS Lite writes its value on selection.

```tsx
import { useRef, useState } from 'react'

function RecordPicker() {
  const [projectId, setProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const queryRef = useRef<HTMLInputElement>(null)

  return (
    <form onReset={() => {
      setProjectId('')
      setProjectName('')
    }}>
      <label htmlFor="record-query">Project</label>
      <sds-combobox
        onsds-select={(event) => {
          const id = event.detail.option.dataset.projectId
          const name = event.detail.option.dataset.label
          if (!id || !name) throw new Error('Selected project has no ID or label')
          setProjectId(id)
          setProjectName(name)
          if (queryRef.current) queryRef.current.value = ''
        }}
      >
        <input className="sds-input" ref={queryRef} id="record-query" name="projectQuery" type="search"
          role="combobox" aria-autocomplete="list"
          aria-controls="record-options" aria-expanded={false}
          onInput={() => {
            setProjectId('')
            setProjectName('')
          }} />
        <ul id="record-options" className="sds-combobox-list"
          role="listbox" popover="manual" hidden>
          <li id="record-atlas" role="option" aria-selected="false"
            data-label="Atlas" data-project-id="p-atlas">
            <strong>Atlas</strong> - Research
          </li>
        </ul>
      </sds-combobox>
      <input type="hidden" name="projectId" value={projectId} readOnly />
      <p role="status">{projectId ? `Selected project: ${projectName}` : ''}</p>
      <button className="sds-button" type="submit">Submit project</button>
    </form>
  )
}
```

Apply the ID validation and fallback policy above. Clear identity explicitly
for unrelated programmatic query changes. On React 18 or earlier, attach
`sds-select` with the [ref pattern](./frameworks.md#react).

## Vue record picker

Use the [Vue setup](./frameworks.md#vue). Listen with `@sds-select="onSelect"`
and clear identity with `@input="projectId = ''"`. Read `event.detail.value`
when options use `data-sds-value`, or read the original option's dataset.
Bind `:value="projectId"` on an application-owned hidden input and clear it
on reset. To empty the query after storing a selection, assign its native
`.value` and show the selected record separately. A `v-model` on the visible
input must also synchronize the value SDS Lite writes on selection.