# Composition patterns

[Documentation](../README.md) / Guides / Composition patterns

These common interfaces compose existing SDS Lite recipes. They do not add
new classes or custom elements.

Complete standalone **HTML + JavaScript** examples are shipped for
[selection](../examples/selection.html),
[table actions](../examples/table-selection.html),
[multiple selection](../examples/multiple-selection.html),
[input actions](../examples/input-actions.html),
[date ranges](../examples/date-range.html), and
[uploads](../examples/file-upload.html).
These pages are generated from the playground and included in the NPM archive
under `docs/examples/`, with their matching scripts. Serve the package root
over HTTP to run them locally; keep relative paths intact. The CDN distribution
also includes them under `dist/docs/examples/`.

When embedding a recipe in your own application, copy its markup and script,
and load SDS CSS and `/auto` once at your application boundary. Copy a recipe
once per page, or change its IDs and matching script selectors before
repeating it. These scripts are application examples, not extra SDS APIs.
Each script runs its exported setup function when its form is already present,
as on its standalone page. Importing a script before rendering or during server
rendering does not initialize it or require a browser document.
Bundled applications should import and call that function
explicitly after the markup exists, rather than relying on an import solely
for side effects. Setup is idempotent for each form, so repeated calls do not
duplicate listeners or reset application state. Calling setup before its form
exists still reports a missing-form error.

## Accordion group

Use adjacent native disclosures. Each section remains independently operable
without JavaScript:

```html
<section aria-labelledby="faq-title">
  <h2 id="faq-title">Frequently asked questions</h2>
  <details class="sds-disclosure">
    <summary>Who can create a project?</summary>
    <p>Project administrators can create projects.</p>
  </details>
  <details class="sds-disclosure">
    <summary>How are projects archived?</summary>
    <p>Use the archive action in project settings.</p>
  </details>
</section>
```

Let several sections remain open. Requiring one-at-a-time behavior adds state
management without improving the disclosure semantics.

## Error summary

Use a danger callout containing links to invalid controls. After a failed
submission, application code should reveal the summary and move focus to it:

```html
<section class="sds-callout" data-sds-tone="danger" tabindex="-1">
  <h2>Correct 2 errors</h2>
  <ul>
    <li><a href="#email">Enter a valid email address</a></li>
    <li><a href="#owner">Choose a project owner</a></li>
  </ul>
</section>
```

Keep the connected error beside each field as well. The summary supplements
`aria-invalid` and `aria-describedby`; it does not replace them.

## Step progress

Use the timeline recipe when steps describe progress through a workflow. The
application owns navigation and which step is current:

```html
<ol class="sds-timeline" data-sds-orientation="horizontal" tabindex="0">
  <li class="sds-timeline-item" data-sds-tone="success">Account</li>
  <li class="sds-timeline-item" data-sds-tone="info" aria-current="step">
    Details
  </li>
  <li class="sds-timeline-item">Review</li>
</ol>
```

Do not use the timeline itself as a tab interface. Add ordinary Previous and
Next buttons to the form when the user can move between steps.

## Split action

Keep the primary command separate from related alternatives:

```html
<div class="sds-cluster" data-sds-gap="xs">
  <button class="sds-button" type="button">Save</button>
  <sds-dropdown hide-caret>
    <button class="sds-button" type="button" data-sds-variant="tonal" aria-label="Other save options">
      More
    </button>
    <menu>
      <li><button class="sds-button" type="button">Save and close</button></li>
      <li><button class="sds-button" type="button">Save as copy</button></li>
    </menu>
  </sds-dropdown>
</div>
```

The first button must remain a complete action. Do not make its behavior
depend on the last menu choice.

## Mode selection

Use native radios when exactly one mode is submitted with a form:

```html
<fieldset class="sds-fieldset">
  <legend>View</legend>
  <div class="sds-segmented">
    <label class="sds-segment">
      <input class="sds-radio" type="radio" name="view" value="grid" checked>
      Grid
    </label>
    <label class="sds-segment">
      <input class="sds-radio" type="radio" name="view" value="list">
      List
    </label>
  </div>
</fieldset>
```

Use buttons with `aria-pressed` only when each control is an immediate action
rather than a form value; application code then owns state coordination.
See [segmented controls](../components/forms.md#segmented-controls) for
multiple choices and native reset behavior.

## Sortable table

Put the sort action in the header and report state with `aria-sort`:

```html
<div class="sds-table-container">
  <table class="sds-table">
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending">
          <button class="sds-button" type="button" data-sds-variant="text">Project</button>
        </th>
        <th scope="col">Owner</th>
      </tr>
    </thead>
    <tbody>...</tbody>
  </table>
</div>
```

Application code sorts the rows and moves `aria-sort` to the active column.
Keep filtering, pagination, and selection as separate controls rather than
turning a semantic table into an application grid.

## Table selection and bulk actions

Copy the [advanced task table](../examples/table-selection.html) and
its [application script](../examples/table-selection.js).
It combines 25 task records with a compact filter/search toolbar, assignee
avatars, semantic status badges, row action menus, a native detail dialog,
sorting, pagination, page-size selection, and CSV downloads. The example's
assignee for **My tasks** and **Assign to me** is Jamie Carter.

Bulk actions only appear after selecting rows. Selection is explicitly
scoped to the current page; filtering, sorting, or changing pages/page size
clears it so a command cannot unexpectedly affect invisible records.
The header checkbox uses native `.indeterminate` for partial selection and
is disabled for zero results. Named `task[]` checkboxes preserve native
submitted IDs.

**Mark approved** and row assignment change records locally. Reset restores
the original records, filters, sort order, and page size. Export downloads a
real CSV, with quoted fields and spreadsheet-formula prefix protection.
Replace local mutation handlers with application commands and expose
pending, failure, and success states. Server pagination requires its own
data adapter and an explicit cross-page selection policy; this example
makes no server-persistence promises.

## Multiple-selection form

Copy the [working form](../examples/multiple-selection.html) and
its [application script](../examples/multiple-selection.js).
The combobox searches choices; a `Set` owns selected IDs. Each selected
record gets a named hidden input and a removable tag. The query is unnamed.

The recipe prevents duplicates, restores initial IDs on reset, requires at
least one selection using native custom validity, announces changes, and
moves focus to an adjacent remove button or the query after removal.
Submitting demonstrates `FormData.getAll('topic')`, not visible labels.
Validate IDs and permissions on the server.

## Input actions

Copy the [working input actions](../examples/input-actions.html)
and their [application script](../examples/input-actions.js).
Each field uses one `.sds-input-group` with its input and action as direct
children. Icons and buttons sit within the shared field border, without
internal dividing lines or attached button segments.
The wrapper's size (or the input's size when the wrapper has none)
automatically scales its icons and action buttons.
Password visibility preserves the field value and updates a stable
toggle's `aria-pressed`. Clearing search dispatches a bubbling standard
`input` event and returns focus. Copying uses the Clipboard API and
reports failures with a manual-copy alternative.

Keep input labels and native autocomplete attributes. Use `type="button"`
for each action so it cannot submit a containing form. Reset conceals the
password again. Clipboard access normally requires a secure context and
user activation; never copy passwords automatically.

## Date range

Copy the [working date range](../examples/date-range.html) and its
[application script](../examples/date-range.js).
The recipe uses native date inputs, required values, an end-date minimum,
connected error text, custom validity, and reset cleanup.
Date-order errors use a polite live announcement rather than interrupting
the current announcement.
The public `.sds-form` limits the form width, while a responsive `.sds-grid`
keeps the date fields aligned and stacks them on narrow screens. The preset
has its own compact row, separate from the primary apply action.

The preset selects seven inclusive local calendar dates ending today.
It uses calendar arithmetic rather than subtracting fixed milliseconds,
so daylight-saving changes do not shorten or lengthen the date count.
Submission exposes `YYYY-MM-DD` strings. Decide the reporting time zone
and inclusive/exclusive timestamp conversion in your application; validate
the range again on the server.

## Upload workflow

Copy the [working file queue](../examples/file-upload.html) and its
[application script](../examples/file-upload.js).
It uses the existing `.sds-file-upload` drop zone, with a native file input
covering the surface for click, keyboard, and drag-and-drop selection.
The `.sds-file-list` contains `.sds-file-item` rows with a decorative file
icon, `.sds-file-details` (filename, readable size, status, and progress),
and a small `.sds-action-group`. Actions sit beside the details on wide
screens and below them on narrow screens; long filenames wrap without
truncating their accessible text. Upload becomes Cancel while sending and
Retry after failure or cancellation. Completed and invalid files retain
only Remove, rather than a row of disabled controls.
Remove and Clear file queue use text buttons with `data-sds-tone="danger"`
to distinguish discarding queue entries from uploading. They do not delete
files from disk or remove previously uploaded files from the server.
The recipe adds file names, duplicate prevention, removal, per-file progress,
cancellation, retry, and explicit HTTP, network, and timeout errors.
Reset aborts requests and clears the queue. `formdata` reflects the retained
queue rather than a stale native file list.

**Configure a real endpoint before uploading.** The example posts each file
as multipart field `attachment` to the form's `/api/uploads` action. The
playground supplies no server and does not simulate success. Only a 2xx
response marks a file uploaded. Add your application's authentication and
CSRF mechanism, and adjust the response contract before production use.

The example allows PDFs smaller than 10 MiB (10,485,760 bytes, labeled
"10 MB" in the example UI). Client extension/size checks
are usability hints, not content validation: enforce authorization, limits,
file-type verification, storage policy, and any malware scanning on the
server. A filename or `accept` attribute does not establish a safe file type.