# SDS Lite

SDS Lite is the dependency-free, framework-neutral core of the SEI Design
System. It provides polished native HTML recipes, theme tokens, and small
behavior modules without requiring a framework, CSS utility library, runtime
dependency, or client-side rendering.

This README is the complete public interface reference. If a class, attribute,
custom element, JavaScript export, event, or CSS custom property is not listed
here, treat it as an implementation detail.

## Contents

- [Install and load](#install-and-load)
- [Rules that apply everywhere](#rules-that-apply-everywhere)
- [Public interface index](#public-interface-index)
- [Root, themes, and color schemes](#root-themes-and-color-schemes)
- [Buttons and links](#buttons-and-links)
- [Forms](#forms)
- [Feedback and loading](#feedback-and-loading)
- [Cards, lists, timelines, and tables](#cards-lists-timelines-and-tables)
- [Application and page layouts](#application-and-page-layouts)
- [Dropdowns and disclosures](#dropdowns-and-disclosures)
- [Tabs](#tabs)
- [Dialogs and panels](#dialogs-and-panels)
- [Toasts](#toasts)
- [Prose](#prose)
- [Accessibility utility](#accessibility-utility)
- [JavaScript exports and events](#javascript-exports-and-events)
- [CSS customization](#css-customization)
- [SSR contract](#ssr-contract)

## Install and load

```sh
npm install @cmu-sei/sds-lite
```

### Easiest setup

Import the stylesheet once and import the eager JavaScript entry once:

```ts
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite'
```

The root entry registers dialogs, panels, dropdowns, tabs, and toasts. It is
safe to import during server rendering because registration waits for browser
globals.

### Load only behavior you use

Always import the same stylesheet. Replace the eager JavaScript entry with one
or more behavior entries:

```ts
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/dropdown'
import '@cmu-sei/sds-lite/tabs'
```

| Import | Enables |
|---|---|
| `@cmu-sei/sds-lite` | Every behavior module |
| `@cmu-sei/sds-lite/dialog` | `.sds-dialog` and `.sds-panel` behavior |
| `@cmu-sei/sds-lite/dropdown` | `<sds-dropdown>` |
| `@cmu-sei/sds-lite/tabs` | `<sds-tabs>` |
| `@cmu-sei/sds-lite/toast` | `<sds-toast>` and declarative toast triggers |
| `@cmu-sei/sds-lite/sds.css` | Every visual recipe, token, and utility |

Choose either the eager JavaScript entry or individual behavior entries for a
page. Importing both remains functionally safe because registration is
idempotent, but it sends duplicate JavaScript to the browser.

### Plain HTML without a bundler

Copy `package/sds.css` and `package/sds.js` from the installed package into
your public assets:

```html
<link rel="stylesheet" href="/assets/sds.css">
<script type="module" src="/assets/sds.js"></script>
```

CSS-only pages may omit the script. Dialogs, panels, dropdowns, tabs, and
toasts need their behavior entry for the complete cross-browser behavior
described here.

## Rules that apply everywhere

1. Put `data-sds-root` on the smallest container that should receive SDS Lite
   styles.
2. Use semantic native HTML first: `<button>`, `<a>`, `<input>`, `<table>`,
   `<dialog>`, `<details>`, `<nav>`, and list elements.
3. Use `data-*` attributes for appearance and native or ARIA attributes for
   state.
4. Author IDs, accessible names, relationships, and initial state in server
   HTML. JavaScript enhances that final DOM; it does not create essential
   markup.
5. Icon-only controls need an accessible name, normally `aria-label`.
6. Links must have `href`. Buttons that do not submit a form should use
   `type="button"`.

Common semantic tones are:

```text
neutral | brand | info | success | warning | danger
```

Apply `data-tone` to the recipe that should carry the tone:

```html
<span class="sds-badge" data-tone="success">Complete</span>
<button data-tone="danger">Delete</button>
<a class="sds-link" data-tone="warning" href="/review">Review</a>
```

Tone inherits through descendants. Put it on a shared parent only when every
tone-aware descendant should use the same intent.

SDS-specific options use the same attribute vocabulary everywhere:

| Attribute | Meaning |
|---|---|
| `data-variant` | Visual treatment |
| `data-tone` | Semantic color intent |
| `data-size` | Size or width tier |
| `data-orientation` | Horizontal or vertical layout |
| `data-placement` | Floating-surface placement |
| `data-gap` | Layout spacing |

Recipe-specific behavior uses descriptive `data-*` attributes such as
`data-activation`, `data-duration`, and `data-persistent`. Native state stays
native: `disabled`, `checked`, `open`, `hidden`, `popover`, and ARIA
attributes are not duplicated.

## Public interface index

### Classes

| Public class | Use it on | Purpose |
|---|---|---|
| `.sds-action-group` | `<div>` | Wraps related buttons or controls with responsive spacing |
| `.sds-app` | Top-level `<div>` | Application, simple-application, or brochure-site shell |
| `.sds-app-header` | Direct child `<header>` | Simple Application suite and user header |
| `.sds-app-mobile-header` | Direct child `<header>` | Application mobile menu and identity header |
| `.sds-app-brand` | `<a>` | Application brand link |
| `.sds-app-brand-prefix` | Child `<span>` | Emphasized brand prefix |
| `.sds-app-layout` | Shell content wrapper | Application sidebar and body columns |
| `.sds-app-body` | Main column wrapper | Independently scrolling content, footer, and action bar |
| `.sds-app-main` | `<main>` | Flexible application content |
| `.sds-app-footer` | `<footer>` | Application or Simple Application branded footer |
| `.sds-app-footer-top` | Footer child | Optional application-specific footer content |
| `.sds-app-footer-content` | Footer child | Standard responsive footer row |
| `.sds-app-footer-brand` | Footer-content child | Required SEI wordmark region |
| `.sds-app-footer-middle` | Footer-content child | Optional application-specific footer information |
| `.sds-app-footer-legal` | Footer-content child | Required CMU copyright and handling statement |
| `.sds-app-action-bar` | `<aside>` | Sticky application action area |
| `.sds-badge` | `<span>` | Compact status or category label |
| `.sds-brochure-brand` | `<a>` | Brochure Site identity and optional organization |
| `.sds-brochure-container` | Container | Centered Brochure Site content width |
| `.sds-brochure-footer-links` | Footer section | Light pre-footer action area |
| `.sds-brochure-footer-main` | Footer section | Dark primary brochure footer |
| `.sds-brochure-footer-legal` | Footer section | Dark legal-navigation footer row |
| `.sds-brochure-header` | `<header>` | Brochure Site masthead and navigation |
| `.sds-brochure-main` | `<main>` | Brochure Site content region |
| `.sds-brochure-masthead` | Header child | Red Carnegie Mellon masthead |
| `.sds-brochure-navigation` | Header child | Brochure identity and primary navigation |
| `.sds-button` | `<a>` or `<button>` | Opts an element into button appearance; native buttons are automatic |
| `.sds-callout` | `<aside>` or `<div>` | Important contextual message |
| `.sds-callout-timestamp` | Child `<time>` or `<span>` | Secondary timestamp in a callout |
| `.sds-card` | `<article>`, `<section>`, or `<div>` | Raised content container |
| `.sds-card-label` | Text child | Muted card label |
| `.sds-grid` | Container | Responsive equal-width grid for any content |
| `.sds-flex` | Container | Configurable row or column flex layout |
| `.sds-choice` | `<label>` | Aligns a checkbox or radio with its label text |
| `.sds-datapoint` | `<div>` | Label, numeric value, and optional context |
| `.sds-dialog` | Native `<dialog>` | Dialog surface; modal dialogs open near the viewport top |
| `.sds-dialog-header` | Dialog child `<header>` | Dialog title, description, and close-control layout |
| `.sds-dialog-footer` | Dialog child `<footer>` or `<div>` | Dialog action layout |
| `.sds-disclosure` | Native `<details>` | Expandable disclosure |
| `.sds-dropdown-menu` | Popover `<menu>` or container | Dropdown surface |
| `.sds-dropdown-label` | Menu child text | Noninteractive menu group label |
| `.sds-dropdown-divider` | Menu child `<hr>` | Menu separator |
| `.sds-empty-state` | Container | Centered empty-result message |
| `.sds-eyebrow` | Text element | Small uppercase page context |
| `.sds-field` | Field wrapper | Label, control, help, and validation layout |
| `.sds-form` | `<form>` | Narrow vertical form layout |
| `.sds-input` | Native `<input>` or `<textarea>` | Explicit text-control styling hook |
| `.sds-link` | Native `<a>` | Explicit link recipe and variants |
| `.sds-list` | `<ul>` or `<ol>` | Structured content list |
| `.sds-list-item` | Direct child `<li>` | List item |
| `.sds-list-marker` | First item child | Optional icon, number, avatar, or marker column |
| `.sds-page` | `<main>` or content `<div>` | Centered page content and section spacing |
| `.sds-page-header` | `<header>` | Sticky page title and actions |
| `.sds-panel` | Native `<dialog>` | Edge-attached overlay panel |
| `.sds-prose` | `<article>` or content container | Long-form semantic typography |
| `.lead` | Descendant of `.sds-prose` | Introductory lead paragraph |
| `.not-prose` | Descendant of `.sds-prose` | Excludes a subtree from prose styling |
| `.sds-section-header` | `<header>` | Section title, description, and actions |
| `.sds-sei-wordmark` | Empty `<span>` | Official SEI wordmark rendered in the application footer |
| `.sds-select` | Native `<select>` | Explicit select styling hook |
| `.sds-sidebar` | `<aside>` | Persistent desktop and Popover mobile navigation |
| `.sds-sidebar-layout` | Container | Responsive sidebar/content layout with independent scrolling |
| `.sds-sidebar-close` | Popover close button | Mobile sidebar close control |
| `.sds-skeleton` | Placeholder element | Animated loading placeholder |
| `.sds-spinner` | Status element | Animated loading indicator |
| `.sds-sr-only` | Any element | Visually hides text while preserving it for assistive technology |
| `.sds-table` | Native `<table>` | Application data table |
| `.sds-table-container` | Table wrapper | Adds horizontal overflow for narrow viewports |
| `.sds-tab-list` | Tab-list container | Visual and scrolling tab row |
| `.sds-tab` | Tab `<button>` or route `<a>` | Interactive tab |
| `.sds-tab-panel` | Tab panel | Content controlled by a tab |
| `.sds-timeline` | `<ol>` | Vertical or horizontal event sequence |
| `.sds-timeline-item` | Direct child `<li>` | Timeline event |
| `.sds-timeline-marker` | First item child | Optional custom timeline marker |

### Custom elements

| Public element | Purpose | Behavior import |
|---|---|---|
| `<sds-dropdown>` | Popover positioning and menu keyboard interaction | `/dropdown` |
| `<sds-tabs>` | Tab selection and keyboard interaction | `/tabs` |
| `<sds-toaster>` | Fixed notification region | CSS only |
| `<sds-toast>` | Timed or persistent notification | `/toast` |

There are intentionally no custom elements for buttons, links, inputs,
dialogs, panels, or disclosures. Native HTML provides their semantics.

## Root, themes, and color schemes

### Minimal page

```html
<body
  data-sds-root
  data-sds-theme="forge"
  data-sds-color-scheme="system"
>
  <main class="sds-page">
    <h1>Hello</h1>
    <p>This page is using SDS Lite.</p>
    <button type="button">Continue</button>
  </main>
</body>
```

| Interface | Values | Default | Meaning |
|---|---|---|---|
| `data-sds-root` | Presence | Required | Scopes foundations and supplies tokens |
| `data-sds-theme` | `forge`, `plaid` | `forge` appearance | Plaid uses serif headings and square corners |
| `data-sds-color-scheme` | `light`, `dark`, `system` | `light` | Explicit scheme or live operating-system preference |
| `data-tone` | All six common tones | Recipe-specific | Semantic color intent inherited by tone-aware descendants |

Theme and scheme attributes may be placed on nested SDS roots to theme
separate regions independently.

SDS Lite references `"Open Sans"` and `"Source Serif"` but does not download
fonts. Load those fonts in the host application when exact typography is
required; otherwise the defined system fallbacks are used.

Inside an SDS root, these native elements receive foundations automatically:

- `h1`, `h2`, and `h3`
- `p`
- unclassed `a`
- `button`, except `.sds-tab`
- supported text-like `input` types, `select`, and `textarea`
- checkbox and radio inputs

## Buttons and links

### Button

Use a native button for an action:

```html
<button type="button">Save</button>
```

Use `.sds-button` on a link only when navigation should look like a button:

```html
<a class="sds-button" href="/projects/new">Create project</a>
```

| Button interface | Values | Default |
|---|---|---|
| `data-variant` | `primary`, `secondary`, `tertiary`, `ghost` | `primary` |
| `data-tone` | All six common tones | Primary action blue |
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl` | `md` |
| `data-density` | `compact` | Comfortable |
| `data-shape` | `icon` | Text button |
| `data-block` | Presence | Intrinsic width |
| `disabled` | Native button state | Enabled |
| `aria-disabled="true"` | Link or custom disabled state | Enabled |
| `aria-busy="true"` | Action is processing | Not busy |

```html
<div class="sds-action-group">
  <button type="submit">Save</button>
  <button type="button" data-variant="secondary">Cancel</button>
  <button type="button" data-variant="tertiary">Preview</button>
  <button type="button" data-variant="ghost">More</button>
</div>
```

Compact actions and icon-only controls use the same button interface:

```html
<button type="button" data-density="compact">Edit</button>

<button type="button" data-shape="icon" aria-label="Close">
  &times;
</button>

<button type="button" data-block>Continue</button>
```

An `svg`, `img`, or descendant marked `data-avatar` is treated as leading
media when SDS calculates compact-button padding:

```html
<button type="button" data-density="compact">
  <img data-avatar src="/people/alex.jpg" alt="">
  Alex
</button>
```

`aria-disabled="true"` changes appearance and pointer behavior but does not
prevent keyboard activation by itself. Application code must suppress the
action. Prefer native `disabled` on `<button>`.

### Action group

`.sds-action-group` wraps related actions, allows wrapping, and gives them a
consistent gap. In a narrow `.sds-page-header`, direct button children share
the available width.

```html
<div class="sds-action-group" aria-label="Project actions">
  <button type="button">Save</button>
  <button type="button" data-variant="secondary">Cancel</button>
</div>
```

### Link

Unclassed links are styled automatically inside an SDS root. Use `.sds-link`
when applying a variant or size, or when another class is already present.
`data-tone` is the only link option that also works on an unclassed link.

```html
<a href="/projects">Projects</a>
<a class="sds-link" href="/projects">Projects</a>
```

| Link interface | Values | Default |
|---|---|---|
| `data-variant` | `secondary`, `tertiary`, `inline`, `cta` | Primary link |
| `data-tone` | All six common tones | Action blue |
| `data-size` | `xs`, `sm`, `md`, `lg`, `xl` | Inherited size |
| `aria-disabled="true"` | Disabled appearance | Enabled |

```html
<p>
  Read the
  <a class="sds-link" data-variant="inline" href="/guide">setup guide</a>.
</p>
<a class="sds-link" data-variant="cta" href="/next">Next step</a>
```

## Forms

### Form and field

`.sds-form` creates a vertical form up to 40rem wide. Each `.sds-field`
contains one label, its control, and optional messages.

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

  <button type="submit">Save project</button>
</form>
```

Use `data-orientation="horizontal"` on `.sds-field` for a desktop label/control
grid. It stacks automatically below 40rem:

```html
<div class="sds-field" data-orientation="horizontal">
  <label for="owner">Owner</label>
  <select id="owner" name="owner">
    <option>Alex</option>
    <option>Jordan</option>
  </select>
  <small id="owner-help">The person responsible for this project.</small>
</div>
```

Field marker and message hooks must be direct children of `.sds-field`:

| Hook | Meaning |
|---|---|
| `data-field-required` | Visible required marker |
| `data-field-optional` | Visible optional marker |
| `data-field-valid` | Positive validation message |
| `data-field-invalid` | Error validation message |

```html
<div class="sds-field">
  <label for="email">Email</label>
  <span data-field-required>Required</span>
  <input
    id="email"
    name="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    required
  >
  <small id="email-error" data-field-invalid>
    Enter a valid email address.
  </small>
</div>
```

For a successfully validated control, pair `data-valid` with a visible
message:

```html
<div class="sds-field">
  <label for="slug">Project URL</label>
  <input id="slug" name="slug" value="atlas" data-valid aria-describedby="slug-ok">
  <small id="slug-ok" data-field-valid>This URL is available.</small>
</div>
```

`data-valid` is visual state. It does not change native validity or announce
anything by itself. `aria-invalid="true"` is the supported invalid state.

### Text inputs, selects, and textareas

Supported text-like inputs, selects, and textareas are styled automatically:

```html
<input type="text">
<input type="email">
<input type="tel">
<input type="url">
<input type="password">
<input type="number">
<input type="search">
<input type="date">
<input type="datetime-local">
<input type="time">
<input type="month">
<input type="week">
<select><option>Option</option></select>
<textarea></textarea>
```

`.sds-input` and `.sds-select` are explicit hooks for native controls that
need the same recipe:

```html
<input class="sds-input" type="text">
<select class="sds-select"><option>Option</option></select>
```

| Control interface | Values | Default |
|---|---|---|
| `data-size` | `sm`, `md`, `lg` | `md` |
| `disabled` | Native disabled state | Enabled |
| `readonly` | Native read-only state on input/textarea | Editable |
| `aria-invalid="true"` | Invalid appearance and semantics | Valid/unknown |
| `data-valid` | Positive validation appearance | Valid/unknown |

### Checkbox and radio choices

Use `.sds-choice` on a label that contains its native input:

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

Use the native `checked` and `disabled` attributes for state. An input inside
`.sds-choice` receives the same styling even when that choice is rendered
outside the application root. The control aligns with the first line of its
label, including when the label wraps.

## Feedback and loading

### Badge

```html
<span class="sds-badge" data-tone="success">Complete</span>
```

| Badge interface | Values | Default |
|---|---|---|
| `data-tone` | All six common tones | `neutral` |
| `data-variant` | `light`, `light-border`, `dark` | Solid semantic tone |

Badges are short labels, not interactive controls. Keep their text concise.

### Callout

```html
<aside class="sds-callout" data-tone="warning">
  <strong>Session ending soon</strong>
  <span>Save your work in the next five minutes.</span>
  <time class="sds-callout-timestamp" datetime="2026-09-16T12:25:00-04:00">
    Updated five minutes ago
  </time>
</aside>
```

| Callout interface | Values | Default |
|---|---|---|
| `data-tone` | All six common tones | `neutral` |
| `data-variant` | `outline`, `bold` | Tinted surface |
| `data-size` | `xs`, `sm`, `md`, `lg` | `md` |
| `data-inset` | Presence | Rounded corners |

An optional `[data-callout-close]` descendant is positioned in the upper
corner. This hook provides appearance only; application code owns dismissal:

```html
<aside id="tip" class="sds-callout" data-tone="info">
  <strong>Tip</strong>
  <span>You can rename this project later.</span>
  <button
    type="button"
    data-shape="icon"
    data-callout-close
    aria-label="Dismiss tip"
    onclick="document.querySelector('#tip').remove()"
  >
    &times;
  </button>
</aside>
```

### Spinner

```html
<span class="sds-spinner" role="status">
  <span class="sds-sr-only">Loading</span>
</span>
```

`data-size` accepts `sm`, `md`, or `lg`; `md` is the default. Any common
`data-tone` changes the spinner color. Use `role="status"` and accessible text
when loading status matters.

### Skeleton

```html
<div aria-busy="true" aria-label="Loading project">
  <div class="sds-skeleton" style="height: 1.5rem" aria-hidden="true"></div>
</div>
```

`.sds-skeleton` fills its container. Give the placeholder or its parent a
useful height. The skeleton itself should normally be hidden from assistive
technology while the containing region reports its busy state.

### Empty state

```html
<section class="sds-empty-state">
  <h3>No projects yet</h3>
  <p>Create a project to get started.</p>
  <button type="button">Create project</button>
</section>
```

The recipe centers and mutes empty-result content. It has no variants.

## Cards, lists, timelines, and tables

### Card and grid

```html
<div class="sds-grid">
  <article class="sds-card">
    <p class="sds-card-label">Open findings</p>
    <h2>12</h2>
  </article>
  <article class="sds-card">
    <p class="sds-card-label">Resolved findings</p>
    <h2>104</h2>
  </article>
</div>
```

`.sds-grid` automatically creates as many columns as fit, with a minimum
column width of 14rem. Its children can be cards or any other content. Set an
exact column count when the layout calls for one:

```html
<div class="sds-grid" data-columns="3">
  <article class="sds-card">First</article>
  <article class="sds-card">Second</article>
  <article class="sds-card">Third</article>
</div>
```

| Grid interface | Values | Default |
|---|---|---|
| `data-columns` | `1`, `2`, `3`, `4`, `5`, `6` | Automatic fit |
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `lg` |

`data-orientation="vertical"` creates one vertical column and takes precedence
over `data-columns`. Exact column counts are intentionally exact; use the
default automatic grid when cards must choose their own responsive count.
`.sds-card` and `.sds-card-label` have no variants.

### Flex layout

`.sds-flex` covers the common Flexbox choices without requiring developers to
write CSS:

```html
<div
  class="sds-flex"
  data-wrap
  data-align="center"
  data-justify="between"
  data-gap="sm"
>
  <div data-grow>Uses remaining space</div>
  <button type="button" data-no-shrink>Action</button>
</div>
```

| Flex interface | Values | Default |
|---|---|---|
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-wrap` | Presence | No wrapping |
| `data-align` | `start`, `center`, `end`, `stretch` | Browser `stretch` |
| `data-justify` | `start`, `center`, `end`, `between` | `start` |
| `data-gap` | `none`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` | `lg` |
| `data-grow` on a direct child | Presence | Content-sized child |
| `data-no-shrink` on a direct child | Presence | Child may shrink |

For a simple vertical stack:

```html
<div class="sds-flex" data-orientation="vertical">
  <div>First</div>
  <div>Second</div>
</div>
```

### Datapoint

The required anatomy is a label followed by a `<div>` containing a `<strong>`
value and optional context:

```html
<div class="sds-datapoint" data-size="lg" data-tone="success">
  <span>Resolved findings</span>
  <div>
    <strong>104</strong>
    <span>this month</span>
  </div>
</div>
```

| Datapoint interface | Values | Default |
|---|---|---|
| `data-tone` | All six common tones | Default text |
| `data-size` | `sm`, `md`, `lg` | `md` |

### List

```html
<ul class="sds-list" data-divided>
  <li class="sds-list-item">
    <span class="sds-list-marker" aria-hidden="true">1</span>
    <div>
      <h3>Application review</h3>
      <p>Review the submitted material.</p>
    </div>
  </li>
  <li class="sds-list-item">
    <span class="sds-list-marker" aria-hidden="true">2</span>
    <div>
      <h3>Decision</h3>
      <p>Record the final outcome.</p>
    </div>
  </li>
</ul>
```

`data-divided` adds separators. Omit `.sds-list-marker` for a single-column
item. Set `--sds-list-marker-width` on the list when all markers need the same
column width:

```html
<ol class="sds-list" style="--sds-list-marker-width: 2rem">
  ...
</ol>
```

### Timeline

```html
<ol class="sds-timeline">
  <li class="sds-timeline-item" data-tone="success">
    <h3>Submitted</h3>
    <p>The package entered the review queue.</p>
    <time datetime="2026-09-16T09:00:00-04:00">9:00 AM</time>
  </li>
  <li class="sds-timeline-item" data-tone="info" aria-current="step">
    <h3>Security review</h3>
    <p>The security team is reviewing the package.</p>
    <time datetime="2026-09-16T10:30:00-04:00">Now</time>
  </li>
</ol>
```

Each item accepts any common `data-tone`. Use `aria-current="step"` for the
current event. Add `data-orientation="horizontal"` to `.sds-timeline` for a
horizontally scrolling sequence.

Place `.sds-timeline-marker` directly inside an item to replace its generated
dot:

```html
<li class="sds-timeline-item">
  <span class="sds-timeline-marker" aria-hidden="true">&#10003;</span>
  <h3>Complete</h3>
</li>
```

### Table

Always use native table structure and column headers:

```html
<div class="sds-table-container">
  <table class="sds-table" data-row-highlight>
    <caption>Project members</caption>
    <thead>
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Role</th>
        <th scope="col" data-sticky="end">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alex Morgan</td>
        <td>Owner</td>
        <td data-sticky="end">Active</td>
      </tr>
    </tbody>
  </table>
</div>
```

| Table interface | Values | Default |
|---|---|---|
| `data-size` on table | `sm`, `md`, `lg` | `md` |
| `data-standalone` on table | Presence | No raised shadow |
| `data-row-highlight` on table | Presence | No row hover surface |
| `data-sticky` on cells | `start`, `end` | Normal cell |

Apply the same `data-sticky` value to the header and every cell in that
column. The table container is required when content may be wider than the
viewport.

When headers should not be visible, keep them in the accessibility tree:

```html
<table class="sds-table">
  <thead class="sds-sr-only">
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

## Application and page layouts

`.sds-app` has three layouts matching the full SDS shells:

| `data-variant` | Use |
|---|---|
| `application` | Tool-like interface with persistent desktop and Popover mobile sidebar |
| `simple` | Application framing without a sidebar |
| `brochure` | Public-facing Plaid site with masthead, navigation, and brochure footer |

Omitting `data-variant` uses the full `application` layout.

### Application

The full Application intentionally has no desktop `.sds-app-header`. Suite and
application identity belong in the sidebar, matching the upstream SDS layout.
The small-screen header exists only to open that same sidebar as a native
Popover:

```html
<div class="sds-app" data-variant="application">
  <header class="sds-app-mobile-header">
    <a class="sds-app-brand" href="/">
      <span class="sds-app-brand-prefix">SEI</span>
      SDS
    </a>
    <button
      type="button"
      data-shape="icon"
      popovertarget="project-sidebar"
      aria-label="Open navigation"
    >
      &#9776;
    </button>
  </header>

  <div class="sds-app-layout">
    <aside
      id="project-sidebar"
      class="sds-sidebar"
      popover="auto"
      aria-label="Project navigation"
    >
      <header>
        <a class="sds-app-brand" href="/">
          <span class="sds-app-brand-prefix">SEI</span>
          SDS
        </a>
        <strong>Project Atlas</strong>
        <button
          type="button"
          class="sds-sidebar-close"
          data-shape="icon"
          popovertarget="project-sidebar"
          popovertargetaction="hide"
          aria-label="Close navigation"
        >
          &times;
        </button>
      </header>

      <nav aria-label="Project">
        <ul>
          <li><a href="/" aria-current="page">Overview</a></li>
          <li>
            <details>
              <summary>Reviews</summary>
              <ul>
                <li><a href="/reviews/open">Open reviews</a></li>
                <li><a href="/reviews/complete">Completed reviews</a></li>
              </ul>
            </details>
          </li>
          <li>
            <a href="/team">Team</a>
          </li>
        </ul>
      </nav>

      <footer>Signed in as Alex</footer>
    </aside>

    <div class="sds-app-body">
      <main class="sds-app-main">
        <header class="sds-page-header">
          <div>
            <p class="sds-eyebrow">Project</p>
            <h1>Overview</h1>
          </div>
          <div class="sds-action-group">
            <button type="button">Create review</button>
          </div>
        </header>

        <div class="sds-page">
          <section>
            <header class="sds-section-header">
              <div>
                <h2>Recent work</h2>
                <p>Changes made by your team.</p>
              </div>
            </header>
          </section>
        </div>
      </main>

      <footer class="sds-app-footer">
        <div class="sds-app-footer-top">Application-specific footer content</div>
        <div class="sds-app-footer-content">
          <div class="sds-app-footer-brand">
            <a
              href="https://sei.cmu.edu"
              aria-label="Software Engineering Institute"
            >
              <span class="sds-sei-wordmark" aria-hidden="true"></span>
            </a>
          </div>
          <div class="sds-app-footer-middle">Application information</div>
          <div class="sds-app-footer-legal">
            <p>
              &copy;
              <time datetime="2026">2026</time>
              Carnegie Mellon University
            </p>
            <p>Proprietary. SEI Internal Use Only</p>
          </div>
        </div>
      </footer>

      <aside class="sds-app-action-bar sds-flex" aria-label="Pending changes">
        <span data-grow>You have unsaved changes.</span>
        <button type="button" data-variant="ghost">Discard</button>
        <button type="button">Save</button>
      </aside>
    </div>
  </div>
</div>
```

The Application and Simple Application footer share the same required legal
contract. Keep `.sds-app-footer-brand`, the linked `.sds-sei-wordmark`, and
both paragraphs in `.sds-app-footer-legal`. The optional
`.sds-app-footer-middle` region is for application-specific information.
Render the current four-digit year on the server or during the consuming
application's build. The official wordmark artwork is bundled with SDS Lite;
the empty wordmark span needs no image URL or JavaScript.

`.sds-app-layout` owns the two desktop columns. `.sds-sidebar` owns a fixed
header and footer with an independently scrolling `<nav>`. `.sds-app-body`
owns the independent content scroll; `.sds-page-header` stays sticky within
it. The mobile application header and desktop sidebar never scroll with the
page content.

`popover="auto"` is required on an Application sidebar so the same authored
navigation becomes a light-dismiss mobile surface. The
`popovertarget="project-sidebar"` values must match the sidebar `id`. No SDS
JavaScript is required for this toggle.

Use `--sds-sidebar-width` on `.sds-app-layout` to change the default 18rem
desktop width:

```html
<div class="sds-app-layout" style="--sds-sidebar-width: 22rem">
  ...
</div>
```

Mark the current link with `aria-current="page"`. Use native `<details>` for a
navigation group. When a current link is inside a collapsed group, its
`<summary>` automatically receives the current-page appearance. Opening the
group returns that appearance to the actual current link. Do not duplicate
`aria-current` on the summary.

```html
<details>
  <summary>Reviews</summary>
  <ul>
    <li><a href="/reviews/open" aria-current="page">Open reviews</a></li>
    <li><a href="/reviews/complete">Completed reviews</a></li>
  </ul>
</details>
```

A link or button with `aria-disabled="true"` receives disabled appearance;
application code must still prevent keyboard activation.

### Simple Application

Simple Application uses the compact top header from the upstream SDS and has
no sidebar:

```html
<div class="sds-app" data-variant="simple">
  <header class="sds-app-header">
    <a class="sds-app-brand" href="/">
      <span class="sds-app-brand-prefix">SEI</span>
      SDS
    </a>
    <div class="sds-action-group" aria-label="User actions">
      <button type="button" data-density="compact">Alex Morgan</button>
    </div>
  </header>

  <div class="sds-app-body">
    <main class="sds-app-main">
      <header class="sds-page-header">
        <h1>Settings</h1>
        <div class="sds-action-group">
          <button type="button">Save</button>
        </div>
      </header>
      <div class="sds-page">Page content</div>
    </main>

    <footer class="sds-app-footer">
      <div class="sds-app-footer-content">
        <div class="sds-app-footer-brand">
          <a
            href="https://sei.cmu.edu"
            aria-label="Software Engineering Institute"
          >
            <span class="sds-sei-wordmark" aria-hidden="true"></span>
          </a>
        </div>
        <div class="sds-app-footer-legal">
          <p>
            &copy;
            <time datetime="2026">2026</time>
            Carnegie Mellon University
          </p>
          <p>Proprietary. SEI Internal Use Only</p>
        </div>
      </div>
    </footer>
  </div>
</div>
```

Only the `.sds-app-body` scrolls. `.sds-app-header` remains outside it and
therefore remains visible.

### Brochure Site

Brochure Site uses Plaid typography and square corners automatically:

```html
<div class="sds-app" data-variant="brochure">
  <main>
    <header class="sds-brochure-header">
      <div class="sds-brochure-masthead">
        <div class="sds-brochure-container">
          <a href="https://www.cmu.edu">Carnegie Mellon University</a>
        </div>
      </div>

      <div class="sds-brochure-navigation sds-brochure-container">
        <a class="sds-brochure-brand" href="/">
          Software Engineering Institute
          <small>CERT Coordination Center</small>
        </a>
        <nav aria-label="Primary">
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/research">Research</a></li>
            <li><a href="/publications">Publications</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <div class="sds-brochure-main sds-brochure-container">
      <article class="sds-prose">
        <h1>Publications and research</h1>
        <p class="lead">Practical guidance for software-driven systems.</p>
      </article>
    </div>
  </main>

  <footer>
    <section class="sds-brochure-footer-links">
      <div class="sds-brochure-container">
        <a class="sds-link" data-variant="cta" href="/subscribe">Subscribe</a>
      </div>
    </section>
    <section class="sds-brochure-footer-main">
      <div class="sds-brochure-container">
        <strong>Software Engineering Institute</strong>
        <address>4500 Fifth Avenue, Pittsburgh, PA 15213-2612</address>
      </div>
    </section>
    <section class="sds-brochure-footer-legal">
      <div class="sds-brochure-container">
        <a href="/privacy">Privacy notice</a>
      </div>
    </section>
  </footer>
</div>
```

The brochure masthead, identity navigation, light pre-footer, dark information
footer, and legal row mirror the upstream Brochure Site structure without
shipping its application-specific links or images.

### Standalone sidebar layout

Use `.sds-sidebar-layout` when a contained region—not a full Application—needs
a persistent sidebar:

```html
<div class="sds-sidebar-layout">
  <aside class="sds-sidebar">
    <header><strong>Project Atlas</strong></header>
    <nav aria-label="Project">
      <ul>
        <li><a href="/" aria-current="page">Overview</a></li>
      </ul>
    </nav>
  </aside>
  <main>Project content</main>
</div>
```

The sidebar stacks above content below 48rem. Do not add `popover` in this
contained layout.

`.sds-page-header` remains sticky while its application body scrolls.
`.sds-page` limits content to 80rem. `.sds-section-header` aligns section
context and actions.

## Dropdowns and disclosures

### Dropdown menu

The server must author the trigger, popover, IDs, ARIA relationships, menu
roles, item tab order, and initial `aria-expanded="false"`:

```html
<sds-dropdown data-size="md" data-placement="bottom-start">
  <button
    type="button"
    data-variant="secondary"
    popovertarget="project-actions"
    aria-controls="project-actions"
    aria-expanded="false"
    aria-haspopup="menu"
  >
    Actions
  </button>

  <menu
    id="project-actions"
    class="sds-dropdown-menu"
    popover="auto"
    role="menu"
    aria-orientation="vertical"
  >
    <li><span class="sds-dropdown-label">Project</span></li>
    <li><button type="button" role="menuitem" tabindex="-1">Rename</button></li>
    <li><a href="/duplicate" role="menuitem" tabindex="-1">Duplicate</a></li>
    <li><hr class="sds-dropdown-divider"></li>
    <li>
      <button type="button" role="menuitem" tabindex="-1" data-tone="danger">
        Delete
      </button>
    </li>
  </menu>
</sds-dropdown>
```

| Dropdown interface | Values | Default |
|---|---|---|
| `data-size` | `auto`, `sm`, `md`, `lg`, `xl`, `2xl` | `md` |
| `data-placement` | `bottom-start`, `bottom-end`, `top-start`, `top-end` | `bottom-start` |
| `data-offset` | Nonnegative pixel number | `5` |
| `data-mode` | `menu`, `popover` | `menu` |

Menu mode provides:

- trigger toggle behavior;
- Enter, Space, Arrow Down, or Arrow Up to open and focus an item;
- Arrow Down or Arrow Up from an already-open trigger to focus an item;
- Arrow keys, Home, and End to move through enabled menu items;
- Escape to close and restore trigger focus;
- close after a menu item is activated;
- live `aria-expanded` synchronization;
- viewport-aware positioning.

Disabled menu items must use native `disabled` on buttons or
`aria-disabled="true"` on other menu-item elements.

Use `data-mode="popover"` for arbitrary non-menu content. It keeps popover toggle,
positioning, and ARIA synchronization but does not add menu-item keyboard
behavior or close when content is clicked:

```html
<sds-dropdown data-mode="popover" data-size="lg">
  <button
    type="button"
    popovertarget="filter-help"
    aria-controls="filter-help"
    aria-expanded="false"
    aria-haspopup="dialog"
  >
    Filter help
  </button>
  <section id="filter-help" class="sds-dropdown-menu" popover="auto">
    <h2>Filter projects</h2>
    <p>Choose one or more project statuses.</p>
  </section>
</sds-dropdown>
```

The trigger must be a direct child `<button>` with `popovertarget`. The target
must also be a direct child, have the matching `id`, have `popover`, and match
the trigger's `aria-controls`. Invalid structures are not enhanced and produce
a console warning.

### Disclosure

Use the native `<details>` structure:

```html
<details class="sds-disclosure">
  <summary>What does this setting do?</summary>
  <p>This setting controls project notifications.</p>
</details>
```

Use native `open` for initial expanded state. No JavaScript import is needed.

## Tabs

The server owns the full initial state. Exactly one enabled tab should have
`aria-selected="true"` and `tabindex="0"`; its panel is visible. Other tabs use
`aria-selected="false"` and `tabindex="-1"`; their panels use `hidden`.

```html
<sds-tabs data-variant="underline" data-activation="automatic">
  <div class="sds-tab-list" role="tablist" aria-label="Project settings">
    <button
      id="profile-tab"
      class="sds-tab"
      type="button"
      role="tab"
      aria-controls="profile-panel"
      aria-selected="true"
      tabindex="0"
      data-value="profile"
    >
      Profile
    </button>
    <button
      id="security-tab"
      class="sds-tab"
      type="button"
      role="tab"
      aria-controls="security-panel"
      aria-selected="false"
      tabindex="-1"
      data-value="security"
    >
      Security
    </button>
  </div>

  <section
    id="profile-panel"
    class="sds-tab-panel"
    role="tabpanel"
    aria-labelledby="profile-tab"
  >
    Profile settings
  </section>
  <section
    id="security-panel"
    class="sds-tab-panel"
    role="tabpanel"
    aria-labelledby="security-tab"
    hidden
  >
    Security settings
  </section>
</sds-tabs>
```

| Tabs interface | Values | Default |
|---|---|---|
| `data-variant` | `folder`, `block`, `underline` | `folder` |
| `data-size` | `md`, `lg` | `md` |
| `data-tone` | All six common tones | Brand treatment |
| `data-activation` | `automatic`, `manual` | `automatic` |
| `data-orientation` | `horizontal`, `vertical` | `horizontal` |
| `data-value` on a tab | Any string | Tab `id` |
| `disabled` on button tab | Native disabled state | Enabled |
| `aria-disabled="true"` | Disabled state for any tab | Enabled |

Automatic activation selects while focus moves. Manual activation moves focus
without selecting; clicking or pressing the platform activation key selects.
Horizontal tabs use Left and Right arrows. Put `data-orientation="vertical"` on
`<sds-tabs>`, or put `aria-orientation="vertical"` on the tab list, to change
keyboard navigation to Up and Down arrows. Home and End move to the first and
last enabled tab.

The supplied visual recipe is a horizontal scrolling tab row. Applications
using vertical orientation must provide their own vertical placement while
retaining the same roles and relationships.

Each tab needs:

- a unique `id`;
- `.sds-tab` and `role="tab"`;
- `aria-controls` matching one panel `id`;
- authored `aria-selected` and `tabindex`.

Each panel needs `.sds-tab-panel`, `role="tabpanel"`, an `id`, and
`aria-labelledby` matching its tab. Invalid structures are not enhanced and
produce a console warning.

Route-backed tabs may use `<a class="sds-tab" role="tab" href="...">`.
Arrow keys move focus without changing local panels; activating the link
navigates. The server should render the requested route with the corresponding
link selected and panel visible.

## Dialogs and panels

The dialog behavior entry powers both native-dialog recipes. It supplies
Invoker Command fallback behavior, backdrop dismissal, and SDS events.

### Dialog

```html
<button type="button" commandfor="confirm-dialog" command="show-modal">
  Open dialog
</button>

<dialog
  id="confirm-dialog"
  class="sds-dialog"
  data-size="md"
  closedby="any"
  aria-labelledby="confirm-title"
  aria-describedby="confirm-description"
>
  <header class="sds-dialog-header">
    <div>
      <h2 id="confirm-title">Confirm change</h2>
      <p id="confirm-description">This action can be reversed later.</p>
    </div>
    <button
      type="button"
      data-shape="icon"
      commandfor="confirm-dialog"
      command="request-close"
      aria-label="Close"
    >
      &times;
    </button>
  </header>

  <p>Continue with this change?</p>

  <footer class="sds-dialog-footer">
    <button
      type="button"
      data-variant="secondary"
      commandfor="confirm-dialog"
      command="close"
      data-return-value="cancel"
    >
      Cancel
    </button>
    <button
      type="button"
      commandfor="confirm-dialog"
      command="close"
      data-return-value="confirm"
    >
      Confirm
    </button>
  </footer>
</dialog>
```

`data-size` accepts `sm`, `md`, `lg`, `xl`, or `2xl`; `md` is the default.
The header and footer classes are optional anatomy, but use them for the
standard title/close and action layouts. A modal dialog starts 4rem from the
top on viewports at least 48rem wide and 0.5rem from the top on narrower
viewports instead of vertically centering. `.sds-dialog-footer` aligns every
action to the right and automatically places primary buttons after other
variants, at the far-right edge.

### Panel

Use direct native `<header>`, `<main>`, and `<footer>` children:

```html
<button type="button" commandfor="help-panel" command="show-modal">
  Open help
</button>

<dialog
  id="help-panel"
  class="sds-panel"
  data-side="right"
  data-size="md"
  closedby="any"
  aria-labelledby="help-title"
>
  <header>
    <h2 id="help-title">Help</h2>
    <button
      type="button"
      data-shape="icon"
      commandfor="help-panel"
      command="request-close"
      aria-label="Close"
    >
      &times;
    </button>
  </header>

  <main>Help content goes here.</main>

  <footer>
    <button type="button" commandfor="help-panel" command="close">
      Done
    </button>
  </footer>
</dialog>
```

| Panel interface | Values | Default |
|---|---|---|
| `data-side` | `left`, `right`, `bottom` | `right` |
| `data-size` | `sm`, `md`, `lg`, `xl` | `md` |

For side panels, size changes width. For bottom panels, size changes height.
The panel header and footer stay visible while `<main>` consumes the flexible
space.

### Shared dialog commands and state

| Interface | Meaning |
|---|---|
| `commandfor="id"` | Targets an SDS dialog or panel by `id` |
| `command="show-modal"` | Opens with modal focus and backdrop behavior |
| `command="close"` | Closes immediately |
| `command="request-close"` | Requests close so cancellation can be prevented |
| `data-return-value="value"` | Supplies `dialog.returnValue` when closing |
| `closedby="any"` | Allows Escape, close controls, and backdrop dismissal |
| `closedby="closerequest"` | Allows close requests but not backdrop dismissal |
| `closedby="none"` | Prevents implicit dismissal |
| `open` | Native initial/open state; normally managed by the dialog methods |

Every target needs a unique `id` and an accessible name through
`aria-labelledby` or `aria-label`. Clicking outside the surface closes it
only when `closedby="any"`. If `closedby` is omitted, native dialog defaults
apply and SDS does not add backdrop dismissal.

## Toasts

Place all notifications in one labeled toaster:

```html
<button type="button" data-toast-open="saved-toast">Save project</button>

<sds-toaster aria-label="Notifications">
  <sds-toast
    id="saved-toast"
    data-tone="success"
    role="status"
    aria-atomic="true"
  >
    <strong>Project saved</strong>
    <span>Your changes are now available.</span>
    <button
      type="button"
      data-shape="icon"
      data-toast-close
      aria-label="Close notification"
    >
      &times;
    </button>
  </sds-toast>
</sds-toaster>
```

| Toast interface | Values | Default |
|---|---|---|
| `data-tone` | All six common tones | `info` appearance |
| `open` | Presence | Closed |
| `data-duration` | Positive milliseconds | `5000` |
| `data-persistent` | Presence | Auto-dismiss |
| `data-toast-open="id"` | Target toast ID on any trigger | None |
| `data-toast-close` | Presence on descendant control | None |
| `role` | `status` or `alert` | Required |
| `aria-atomic` | Must be `"true"` | Required |

Use `role="status"` for ordinary updates and `role="alert"` only for urgent
messages. Toasts pause their auto-dismiss timer while hovered or while focus is
inside them. A persistent toast requires a close control.

The supported child anatomy is:

1. `<strong>` for the title.
2. One non-strong element for the message.
3. An optional control marked `data-toast-close`.

Programmatic control is available from the element:

```ts
import type { SdsToastElement } from '@cmu-sei/sds-lite/toast'

const toast = document.querySelector<SdsToastElement>('#saved-toast')
toast?.show()
toast?.close('programmatic')
```

The `open` Boolean property mirrors the `open` attribute. Use `show()` and
`close()` when integrations depend on `sds-open` and `sds-close`; changing the
property or attribute directly updates visibility and timing without
dispatching those events.

## Prose

`.sds-prose` styles semantic long-form HTML without changing its markup:

```html
<article class="sds-prose">
  <h1>Article title</h1>
  <p class="lead">A short introduction to the article.</p>

  <p>
    Body text supports <a href="/details">links</a>,
    <strong>strong text</strong>, <em>emphasis</em>,
    <code>inline code</code>, and <kbd>keyboard input</kbd>.
  </p>

  <blockquote>A quotation with semantic emphasis.</blockquote>

  <h2>Details</h2>
  <ul>
    <li>Lists and nested content</li>
    <li>Consistent readable spacing</li>
  </ul>

  <pre><code>const ready = true</code></pre>

  <figure>
    <img src="/diagram.png" alt="Request flow">
    <figcaption>How a request moves through the system.</figcaption>
  </figure>
</article>
```

Supported semantic descendants include:

```text
h1-h6, p, a, strong, b, em, kbd, code, pre, blockquote,
ol, ul, li, dl, dt, dd, figure, figcaption, picture, img,
svg, video, hr, table, caption, thead, tbody, tfoot, tr, th, td
```

| Prose interface | Values | Default |
|---|---|---|
| `data-size` | `sm`, `md` | `md` |
| `data-tone` | All six common tones | Neutral text links |
| `data-sds-theme` | `forge`, `plaid` | Inherited root theme |
| `.lead` | Class on introductory text | Normal paragraph |
| `.not-prose` | Class on excluded subtree | Prose styles apply |

Use `.not-prose` when embedding another SDS recipe:

```html
<article class="sds-prose">
  <p>Article text.</p>
  <aside class="sds-callout not-prose" data-tone="info">
    <strong>Related information</strong>
    <span>This callout keeps its own typography.</span>
  </aside>
</article>
```

## Accessibility utility

`.sds-sr-only` visually clips content while keeping it available to screen
readers:

```html
<button type="button">
  <svg aria-hidden="true"><!-- icon --></svg>
  <span class="sds-sr-only">Search</span>
</button>
```

For content that must be absent visually and from the accessibility tree, use
the native `hidden` attribute:

```html
<section id="advanced-settings" hidden>
  ...
</section>
```

SDS Lite reinforces ordinary `[hidden]` with `display: none !important` inside
an SDS root, so recipe display rules cannot accidentally reveal it. Remove or
toggle the native `hidden` property to show the element:

```ts
const settings = document.querySelector<HTMLElement>('#advanced-settings')
if (settings) settings.hidden = false
```

`hidden="until-found"` is intentionally not reinforced. It retains the native
find-in-page behavior that reveals matching content.

## JavaScript exports and events

All registration functions are idempotent and run automatically when their
module is imported. Calling them manually is optional:

```ts
import {
  registerSdsDialog,
  registerSdsDropdown,
  registerSdsTabs,
  registerSdsToast,
} from '@cmu-sei/sds-lite'
```

Individual entries export:

| Entry | Exports |
|---|---|
| `/dialog` | `registerSdsDialog()` |
| `/dropdown` | `SdsDropdownElement`, `registerSdsDropdown()` |
| `/tabs` | `SdsTabsElement`, `registerSdsTabs()` |
| `/toast` | `SdsToastElement`, `SdsToastCloseReason`, `registerSdsToast()` |

### Events

All SDS custom events bubble and cross shadow roots.

| Event | Target | Detail | When it fires |
|---|---|---|---|
| `sds-open` | Dialog or panel | None | SDS command handling opens it |
| `sds-close` | Dialog or panel | `{ returnValue: string }` | Native dialog `close` fires |
| `sds-cancel` | Dialog or panel | None | Before native cancellation; cancelable |
| `sds-change` | `<sds-tabs>` | `{ index: number, value: string }` | SDS selects a new tab |
| `sds-open` | `<sds-toast>` | None | `show()` opens a closed toast |
| `sds-close` | `<sds-toast>` | `{ reason: 'dismiss' \| 'programmatic' \| 'timeout' }` | Toast closes |

Prevent `sds-cancel` to keep a dialog or panel open:

```ts
document.querySelector('#editor')?.addEventListener('sds-cancel', (event) => {
  if (hasUnsavedChanges) event.preventDefault()
})
```

Read typed event details with a narrow event type:

```ts
document.querySelector('sds-tabs')?.addEventListener('sds-change', (event) => {
  const { index, value } = (event as CustomEvent<{
    index: number
    value: string
  }>).detail

  console.log(index, value)
})
```

Dropdown visibility uses the platform `beforetoggle` and `toggle` events from
its Popover element rather than custom events.

## CSS customization

Override public custom properties on an SDS root or a smaller subtree:

```css
.my-application {
  --sds-color-action-primary: #005ea8;
  --sds-color-action-primary-hover: #1a73b8;
  --sds-radius-control: 0.5rem;
}
```

Unlayered application CSS overrides SDS Lite because all distributed rules
live in:

```css
@layer sds.tokens, sds.base, sds.components, sds.utilities;
```

### Public layout properties

| Property | Default | Owner |
|---|---|---|
| `--sds-sidebar-width` | `18rem` | `.sds-app-layout` or `.sds-sidebar-layout` |
| `--sds-list-marker-width` | `auto` | `.sds-list` |

### Public spacing, radius, elevation, motion, and type properties

```text
--sds-space-0
--sds-space-2xs
--sds-space-xs
--sds-space-sm
--sds-space-md
--sds-space-lg
--sds-space-xl
--sds-space-2xl
--sds-space-3xl
--sds-space-4xl

--sds-radius-sm
--sds-radius-md
--sds-radius-lg
--sds-radius-full
--sds-radius-control
--sds-radius-container

--sds-shadow-sm
--sds-shadow-raised
--sds-shadow-lg
--sds-shadow-xl
--sds-shadow-overlay

--sds-duration-fast
--sds-duration-normal
--sds-duration-medium
--sds-duration-slow
--sds-easing-standard
--sds-easing-enter
--sds-easing-exit

--sds-font-sans
--sds-font-serif
--sds-font-body
--sds-font-heading
```

### Public semantic color properties

General roles:

```text
--sds-color-text-default
--sds-color-text-muted
--sds-color-text-disabled
--sds-color-action-text

--sds-color-surface-default
--sds-color-surface-subtle
--sds-color-surface-raised

--sds-color-border-default
--sds-color-border-control
--sds-color-border-strong
--sds-color-focus-ring
--sds-color-brand

--sds-color-action-primary
--sds-color-action-primary-hover
--sds-color-action-primary-active
--sds-color-interactive-subtle-hover
--sds-color-interactive-subtle-active

--sds-color-form-border
--sds-color-form-disabled-background
--sds-color-form-disabled-text
--sds-color-form-readonly-background
--sds-color-form-readonly-text
--sds-color-form-invalid
--sds-color-form-valid
--sds-color-form-chevron
--sds-color-choice-checked
```

Every semantic tone provides the same six roles:

```text
--sds-color-{tone}-surface
--sds-color-{tone}-border
--sds-color-{tone}-text
--sds-color-{tone}-strong
--sds-color-{tone}-strong-hover
--sds-color-{tone}-on-strong
```

Replace `{tone}` with `neutral`, `brand`, `info`, `success`, `warning`, or
`danger`.

### Public primitive colors

Prefer semantic properties for application customization. Primitive colors
are available when defining a new semantic assignment:

```text
--sds-white
--sds-black

--sds-gray-{25,50,100,200,300,400,500,600,700,750,800,850,900,950}
--sds-blue-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-red-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-green-{25,50,100,200,300,400,500,600,700,800,900,950}
--sds-orange-{25,50,100,200,300,400,500,600,700,800,900,950}
```

The contextual `--sds-tone-*`, `--sds-button-*`, `--sds-prose-*`,
`--sds-tab-*`, `--sds-timeline-*`, and `--sds-datapoint-*` properties are
implementation details. Set `data-tone` or override the semantic properties
instead.

## SSR contract

SDS Lite markup is its server-rendering format. Render the same complete HTML
from React, Vue, Svelte, Angular, server templates, static generators, or plain
HTML.

The server must provide:

- final semantic element structure;
- visible text and accessible names;
- IDs and ARIA relationships;
- native and ARIA state;
- selected tabs and matching `hidden` panels;
- dialog, popover, and toast initial visibility;
- required roles and tab order.

Behavior modules may update state and temporary positioning. They do not move,
wrap, clone, replace, or generate essential nodes. This prevents a flash of
incorrect content and keeps the same interface usable with or without a
framework.

Declarative Shadow DOM is not required. Native light DOM provides the canonical
SSR representation, form behavior, theming, and application customization.
