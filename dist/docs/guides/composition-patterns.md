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

## Linked rows and numeric columns

Keep one real link per record. Extend its hit area with application CSS, not
an `onclick` on the row. The link still supports keyboard activation,
open-in-new-tab, and the browser's link menu. Keep the table in its normal
semantic structure:

```html
<div class="sds-table-container">
  <table class="sds-table record-table" data-sds-row-highlight>
    <caption>Travel requests</caption>
    <thead><tr><th scope="col">Request</th><th scope="col" class="numeric">Amount</th><th scope="col">Actions</th></tr></thead>
    <tbody>
      <tr>
        <th scope="row"><a class="sds-link record-link" href="/requests/42">TR-42</a></th>
        <td class="numeric">$123,456.78</td>
        <td><button class="sds-button" type="button" data-sds-variant="text">Export</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.record-table tbody tr { position: relative; }
.record-link::after { position: absolute; inset: 0; content: ""; }
.record-table td :is(a, button, input, select) { position: relative; z-index: 1; }
.record-table tr:focus-within { outline: 2px solid var(--sds-color-focus-ring); outline-offset: -2px; }
.record-table .numeric { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.record-table .numeric > button { margin-inline-start: auto; }
```

Apply `numeric` to both the header and cells of a number or currency column.
Format values using the application's locale and currency rules; align the
formatted text without parsing or changing submitted values. The stretched
link prevents ordinary text selection in the row. Omit it for editable tables
or tables where copying cell text is the primary workflow. Do not duplicate
links in every cell or add `role="link"` and `tabindex` to the row.

## Detail lists

Use a native description list for labels and values. The following
application CSS provides two columns and stacks them based on the list's
available width, including inside side panels:

```html
<dl class="record-details">
  <div><dt>Request</dt><dd>TR-42</dd></div>
  <div><dt>Requested by</dt><dd>Alex Morgan</dd></div>
  <div><dt>Total</dt><dd>$123,456.78</dd></div>
</dl>
```

```css
.record-details { container-type: inline-size; margin: 0; }
.record-details > div { display: grid; grid-template-columns: minmax(8rem, 1fr) minmax(0, 2fr); gap: var(--sds-space-sm) var(--sds-space-lg); padding-block: var(--sds-space-sm); }
.record-details dt { font-weight: 600; }
.record-details dd { margin: 0; overflow-wrap: anywhere; }
@container (max-width: 30rem) {
  .record-details > div { grid-template-columns: minmax(0, 1fr); }
}
```

Keep each term before its description. A missing value should have meaningful
text such as "Not assigned" rather than an empty cell.

## Main content and side panel

Use normal document flow for persistent supplementary information, not
`.sds-sidebar-layout` (navigation) or `.sds-panel` (a modal drawer).
The following application layout keeps the main content first on small screens:

```html
<div class="record-layout">
  <section class="sds-stack" aria-labelledby="request-title">
    <h2 id="request-title">Travel request TR-42</h2>
    <p>Request details and supporting documents.</p>
  </section>
  <aside class="sds-stack" aria-labelledby="history-title">
    <h2 id="history-title">Status history</h2>
    <ol class="sds-timeline">
      <li class="sds-timeline-item">Submitted</li>
      <li class="sds-timeline-item" aria-current="step">In review</li>
    </ol>
  </aside>
</div>
```

```css
.record-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr); gap: var(--sds-space-xl); }
.record-layout > * { min-inline-size: 0; }
@media (max-width: 64rem) {
  .record-layout { grid-template-columns: minmax(0, 1fr); }
}
```

## Account menu and responsive navigation

In a Simple shell, put a primary `<nav><ul>...</ul></nav>` directly in
`.sds-app-header`. At widths up to `48rem`, it moves to its own scrolling
row without widening the page. Give the navigation an accessible name.

Use a popover for account information and a native POST form for logout;
this keeps the form out of an ARIA action menu:

```html
<sds-popover>
  <button class="sds-button" type="button" data-sds-variant="text" aria-label="Account: Alex Morgan" popovertarget="account-menu">
    <span class="sds-avatar" data-sds-size="sm" aria-hidden="true">AM</span>
    <span class="account-name">Alex Morgan</span>
  </button>
  <section id="account-menu" class="sds-popover-content" popover="auto" aria-label="Account">
    <p>Alex Morgan</p>
    <form method="post" action="/logout">
      <button class="sds-button" type="submit" data-sds-variant="text">Log out</button>
    </form>
  </section>
</sds-popover>
```

```css
@media (max-width: 30rem) {
  .account-name { display: none; }
}
```

Render the application's CSRF token in the logout form and use its actual
logout URL. The trigger retains its full accessible name when the visible
name is hidden. Keep only the initials decorative; do not hide the button
itself or remove it from the keyboard order.

## Submit once for native forms

Copy [submit-once.js](../examples/submit-once.js) into your application and
initialize each ordinary server-submitted form after rendering:

```html
<form id="request-form" class="sds-form" action="/requests" method="post">
  <div class="sds-field">
    <label for="request-name">Request name</label>
    <input id="request-name" class="sds-input" name="name" required>
  </div>
  <button class="sds-button" type="submit" name="intent" value="save">Save</button>
</form>
```

```js
import { setupSubmitOnce } from './submit-once.js'

const reset = setupSubmitOnce(document.querySelector('#request-form'))
```

The recipe ignores repeated submit events, adds an `aria-hidden` spinner,
marks the form and clicked button busy, and restores them on `pageshow`,
including Back/Forward cache restoration. Native validation still runs.
It does not disable the submitter, so its `name` and `value` reach the server.
A canceled submit remains retryable; `method="dialog"` is left alone.
Calling setup twice does not add duplicate listeners.

Include your CSRF token. Use this recipe for full-page native submissions;
AJAX applications should own their pending state and call their own reset
after success or failure. Call the returned `reset()` after any application
abort that does not navigate. `form.submit()` bypasses submit events; use
`requestSubmit()` for programmatic submission. A client guard cannot prevent
network retries or requests from another tab: use server-side idempotency
or duplicate validation for important writes. `/auto` deliberately does not
intercept all forms.

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
shows a checkmark and "Copied URL" accessible label for two seconds,
then restores the original icon and name. Reset also clears the copied state.
Failures retain a manual-copy alternative and are announced in the live region.

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