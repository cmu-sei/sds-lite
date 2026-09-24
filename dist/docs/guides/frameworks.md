# Framework integration

[Documentation](../README.md) / Guides / Frameworks

SDS Lite uses ordinary HTML attributes, light DOM, native events, and custom
elements. Framework adapters are not required.

`<sds-combobox>` contains a native input, so frameworks can listen for its
ordinary `input` and `change` events and keep the input's `name` for
submitting text. For rich options, add `data-label` to control the selected
input text and an application-owned `data-*` ID to locate the original
record from `sds-select`'s `event.detail.option`. If submitting an ID, use
a separate named input and clear it on a new search or form reset. Invalidate
it explicitly for unrelated programmatic query changes. In the
default close-on-select mode and with `keep-open`, the chosen text replaces
the input value and `input` and `change` fire before `sds-select`. `keep-open`
keeps the last search's other matches available until the user edits the
input. Do not assume the combobox submits IDs or stores records.
See the [forms recipe](../components/forms.md#rich-suggestions-and-record-ids).
If the server response must include the fully enhanced accessibility state,
author the complete closed markup described in the
[server-rendering guide](./server-rendering.md#fully-authored-combobox).
In either server-rendering path, register behavior after hydration.

## React

Import SDS Lite once from the client entry:

```tsx
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
import '@cmu-sei/sds-lite/react'
```

Use native JSX attributes and `className`:

```tsx
export function ProjectCard() {
  return (
    <article className="sds-card">
      <h2>Project Atlas</h2>
      <p>Ready for review.</p>
      <button type="button">Open project</button>
    </article>
  )
}
```

React 19 attaches custom-element event props directly. SDS Lite's generated
JSX types include its attributes and events:

```tsx
function ProjectTabs() {
  return (
    <sds-tabs
      value="overview"
      onsds-change={(event) => console.log(event.detail.value)}
    >
      <div aria-label="Project sections">
        <button type="button" value="overview">Overview</button>
        <button type="button" value="activity">Activity</button>
      </div>
      <section>Overview content</section>
      <section>Activity content</section>
    </sds-tabs>
  )
}
```

For a record picker in React 19, `onsds-select` receives the selected
`<li>`; the hidden input remains application-owned:

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
        <input ref={queryRef} id="record-query" name="projectQuery" type="search"
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
            <strong>Atlas</strong> — Research
          </li>
        </ul>
      </sds-combobox>
      <input type="hidden" name="projectId" value={projectId} readOnly />
      <p role="status">{projectId ? `Selected project: ${projectName}` : ''}</p>
      <button type="submit">Submit project</button>
    </form>
  )
}
```

Server validation must still check `projectId`. Without JavaScript, the
search input submits text but the hidden ID stays empty; use a native
`<select>` fallback if selecting a valid ID must work without JavaScript.
Avoid controlling the visible input with stale framework state: the
combobox updates its native value when an option is chosen. Clearing that
value after saving the ID is application logic; it does not emit another
`input` event or erase the ID.

For React 18 and earlier, attach custom events with a ref:

```tsx
import { useEffect, useRef } from 'react'

export function ProjectTabs() {
  const tabsRef = useRef<HTMLElementTagNameMap['sds-tabs']>(null)

  useEffect(() => {
    const tabs = tabsRef.current
    const handleChange = (event: Event) => {
      const { value } = (event as CustomEvent<{ value: string }>).detail
      console.log(value)
    }

    tabs?.addEventListener('sds-change', handleChange)
    return () => tabs?.removeEventListener('sds-change', handleChange)
  }, [])

  return (
    <sds-tabs ref={tabsRef}>
      <div aria-label="Project sections">
        <button type="button" value="overview">Overview</button>
        <button type="button" value="activity">Activity</button>
      </div>
      <section>Overview content</section>
      <section>Activity content</section>
    </sds-tabs>
  )
}
```

The `/react` entry is type-only at runtime and does not install a wrapper.
Use that same ref pattern for `sds-select` on React 18 and earlier; a ref
to the native input can clear its value after saving the selected ID.

## Vue

```js
// main.js
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
import '@cmu-sei/sds-lite/vue'
```

```vue
<template>
  <sds-tabs @sds-change="onChange">
    <div aria-label="Project sections">
      <button type="button" value="overview">Overview</button>
      <button type="button" value="activity">Activity</button>
    </div>
    <section>Overview content</section>
    <section>Activity content</section>
  </sds-tabs>
</template>

<script setup>
function onChange(event) {
  console.log(event.detail.value)
}
</script>
```

For a Vue record picker, use `@sds-select="onSelect"` on the combobox and
`@input="projectId = ''"` on its native input. Read
`event.detail.option.dataset.projectId` in `onSelect`, then bind
`:value="projectId"` to an application-owned hidden input. Validate the
ID before using it. To leave the search field empty after selection, clear
its native `.value` in `onSelect` after storing the ID, and show the
selection separately. Do not use a Vue model for the visible input unless it
also synchronizes the value SDS Lite writes on selection.

Configure the Vue compiler to treat tags beginning with `sds-` as custom
elements. The `/vue` entry contributes generated global component types and
has no runtime behavior:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('sds-'),
        },
      },
    }),
  ],
})
```

## Angular

Import styles through the workspace's global stylesheet:

```css
/* src/styles.css */
@import '@cmu-sei/sds-lite/sds.css';
```

For a client-rendered application, import `/auto` from the browser bootstrap:

```ts
import '@cmu-sei/sds-lite/auto'
```

Allow custom elements with `CUSTOM_ELEMENTS_SCHEMA` in the standalone
component or NgModule that uses them. Listen to custom events with normal
event binding:

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import type { SdsTabsChangeDetail } from '@cmu-sei/sds-lite'

@Component({
  selector: 'app-project-tabs',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <sds-tabs (sds-change)="onTabChange($event)">
      ...
    </sds-tabs>
  `,
})
export class ProjectTabsComponent {
  onTabChange(event: Event): void {
    const { value } =
      (event as CustomEvent<SdsTabsChangeDetail>).detail
    console.log(value)
  }
}
```

For a combobox, bind `(sds-select)="onProjectSelect($event)"`, cast the
`Event` to `CustomEvent<{ option: HTMLLIElement }>`, and read
`detail.option.dataset.projectId`. Clear the ID on the input's `(input)`
event and bind it to a separate hidden field. To clear the search on
selection, set the input's native `.value` to `''` after saving the ID.

For an NgModule application, add `CUSTOM_ELEMENTS_SCHEMA` to the `schemas`
array of the module that declares the consuming component. With current
Angular versions, that component must also declare `standalone: false`.

## Svelte

```js
// browser entry
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

```svelte
<sds-tabs onsds-change={(event) => console.log(event.detail.value)}>
  <div aria-label="Project sections">
    <button type="button" value="overview">Overview</button>
    <button type="button" value="activity">Activity</button>
  </div>
  <section>Overview content</section>
  <section>Activity content</section>
</sds-tabs>
```

The example uses Svelte 5 event-property syntax. Svelte 4 and Svelte 5 legacy
mode use `on:sds-change={handler}` instead.
For a combobox, use `onsds-select={onSelect}` in Svelte 5 (or
`on:sds-select={onSelect}` in legacy mode), read the option's application
ID, and clear the ID on native input edits. To reset the search on selection,
set its native `.value` to `''` after saving the ID.

## Server templates and static generators

Include the CDN tags or bundled assets in the shared document layout. Render
SDS recipes directly from templates:

```html
<article class="sds-card">
  <h2>{{ project.name }}</h2>
  <p>{{ project.summary }}</p>
  <a class="sds-button" href="/projects/{{ project.id }}">Open</a>
</article>
```

Escape untrusted content exactly as you would for any HTML template. SDS Lite
does not interpret template values.

## Copy-ready SSR setups

Each setup includes CSS in the server response and prevents custom-element
registration during server rendering. Next.js, Nuxt, SvelteKit, Astro islands,
and Remix can call `setupSds()` after their normal client mount or hydration
lifecycle. Angular's different hydration guarantee is explained in its
section. The root import itself is safe during server rendering.

### Next.js App Router

Import the stylesheet in `app/layout.tsx`, then render one client setup module:

```tsx
// app/layout.tsx
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/react'
import type { ReactNode } from 'react'
import { SdsSetup } from './sds-setup'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-sds-root>
        {children}
        <SdsSetup />
      </body>
    </html>
  )
}
```

```tsx
// app/sds-setup.tsx
'use client'

import { useEffect } from 'react'
import { setupSds } from '@cmu-sei/sds-lite'

export function SdsSetup() {
  useEffect(() => setupSds(), [])
  return null
}
```

### Nuxt

Add the stylesheet globally and set up behavior after the application mounts:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['@cmu-sei/sds-lite/sds.css'],
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('sds-'),
    },
  },
})
```

```ts
// app/plugins/sds.client.ts (Nuxt 4)
import '@cmu-sei/sds-lite/vue'
import { setupSds } from '@cmu-sei/sds-lite'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', setupSds)
})
```

Nuxt 3 projects using the default source layout place the same plugin at
`plugins/sds.client.ts`.

### SvelteKit

Use the root layout so setup happens once:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@cmu-sei/sds-lite/sds.css'
  import { setupSds } from '@cmu-sei/sds-lite'
  import { onMount } from 'svelte'

  let { children } = $props()

  onMount(setupSds)
</script>

<div data-sds-root>
  {@render children()}
</div>
```

SvelteKit projects using Svelte's legacy mode can render `<slot />` instead.

### Astro

Static Astro pages do not hydrate their ordinary HTML, so the standard
automatic entry can load from the shared layout:

```astro
---
import '@cmu-sei/sds-lite/sds.css'
---

<html lang="en">
  <body data-sds-root>
    <slot />
    <script>
      import '@cmu-sei/sds-lite/auto'
    </script>
  </body>
</html>
```

If an Astro island renders SDS custom elements through React, Vue, or Svelte,
call `setupSds()` from that island's mounted hook instead.

### Remix

With Remix Vite, import global CSS and the React type augmentation in the root
route, then set up SDS Lite once:

```tsx
// app/root.tsx
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/react'
import { useEffect, type ReactNode } from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import { setupSds } from '@cmu-sei/sds-lite'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useEffect(() => setupSds(), [])

  return (
    <main data-sds-root>
      <Outlet />
    </main>
  )
}
```

Classic Remix builds may require a stylesheet URL import and `links` export
instead of the CSS side-effect import.

### Angular SSR

Add `@cmu-sei/sds-lite/sds.css` to the workspace's global styles. For standard
hydration, wait for the first browser render and application stability before
setting up SDS Lite:

```ts
import {
  ApplicationRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  afterNextRender,
  inject,
} from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { setupSds } from '@cmu-sei/sds-lite'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<main data-sds-root><router-outlet /></main>',
})
export class AppComponent {
  private readonly appRef = inject(ApplicationRef)

  constructor() {
    afterNextRender(() => {
      void this.appRef.whenStable().then(() => {
        queueMicrotask(setupSds)
      })
    })
  }
}
```

`afterNextRender()` prevents setup during server rendering, but Angular does
not guarantee that every component has hydrated before that callback.
`ApplicationRef.whenStable()` makes this safe for standard hydration. For
incremental hydration, coordinate setup with the affected subtree's hydration
or place that subtree behind Angular's `ngSkipHydration`.

## Framework rules that prevent surprises

1. Import global CSS and set up behavior once, not per component instance.
2. Use native properties for state: `disabled`, `checked`, `hidden`, `open`,
   and ARIA attributes.
3. Keep custom-element children in the documented order.
4. Use refs or framework-native event bindings for `sds-*` custom events.
5. For hydration, delay `setupSds()` until the framework's applicable
   hydration or stability signal. Render complete authored markup only when
   the initial response must include the enhanced accessibility state.

[Configure server rendering →](./server-rendering.md)
