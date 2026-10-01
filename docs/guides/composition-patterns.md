# Composition patterns

[Documentation](../README.md) / Guides / Composition patterns

These common interfaces compose existing SDS Lite recipes. They do not add
new classes or custom elements.

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
  <button type="button">Save</button>
  <sds-dropdown hide-caret>
    <button type="button" data-sds-variant="tonal" aria-label="Other save options">
      More
    </button>
    <menu>
      <li><button type="button">Save and close</button></li>
      <li><button type="button">Save as copy</button></li>
    </menu>
  </sds-dropdown>
</div>
```

The first button must remain a complete action. Do not make its behavior
depend on the last menu choice.

## Mode selection

Use native radios when exactly one mode is submitted with a form:

```html
<fieldset class="sds-cluster" data-sds-gap="md">
  <legend>View</legend>
  <label class="sds-choice">
    <input type="radio" name="view" value="grid" checked>
    Grid
  </label>
  <label class="sds-choice">
    <input type="radio" name="view" value="list">
    List
  </label>
</fieldset>
```

Use buttons with `aria-pressed` only when each control is an immediate action
rather than a form value; application code then owns state coordination.

## Sortable table

Put the sort action in the header and report state with `aria-sort`:

```html
<div class="sds-table-container">
  <table class="sds-table">
    <thead>
      <tr>
        <th scope="col" aria-sort="ascending">
          <button type="button" data-sds-variant="text">Project</button>
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