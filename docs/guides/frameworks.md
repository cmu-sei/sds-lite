# Framework integration

[Documentation](../README.md) / Guides / Frameworks

SDS Lite uses ordinary HTML attributes, light DOM, native events, and custom
elements. Framework adapters are not required.

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

For React 18 and earlier, attach custom events with a ref:

```tsx
import { useEffect, useRef } from 'react'

export function ProjectTabs() {
  const tabsRef = useRef<HTMLElement>(null)

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
      <button type="button">Overview</button>
      <button type="button">Activity</button>
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

Configure the Vue compiler to treat tags beginning with `sds-` as custom
elements. The `/vue` entry contributes generated global component types and
has no runtime behavior:

```ts
// vite.config.ts
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('sds-'),
    },
  },
})
```

## Angular

Import styles through the workspace's global styles entry and import `/auto`
from the browser bootstrap:

```ts
import '@cmu-sei/sds-lite/auto'
```

Allow custom elements with `CUSTOM_ELEMENTS_SCHEMA` in the module or
standalone component that uses them. Listen to custom events with the normal
event binding:

```html
<sds-tabs (sds-change)="onTabChange($event)">
  ...
</sds-tabs>
```

## Svelte

```js
// browser entry
import '@cmu-sei/sds-lite/sds.css'
import '@cmu-sei/sds-lite/auto'
```

```svelte
<sds-tabs onsds-change={(event) => console.log(event.detail.value)}>
  <div aria-label="Project sections">
    <button type="button">Overview</button>
    <button type="button">Activity</button>
  </div>
  <section>Overview content</section>
  <section>Activity content</section>
</sds-tabs>
```

Use the event-listener syntax supported by your installed Svelte version.

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

Each setup follows one rule: include CSS in the server response, let the
framework hydrate, and then call `setupSds()`. The root import is safe during
server rendering.

### Next.js App Router

Import the stylesheet in `app/layout.tsx`, then render one client setup module:

```tsx
// app/layout.tsx
import '@cmu-sei/sds-lite/sds.css'
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
})
```

```ts
// plugins/sds.client.ts
import { setupSds } from '@cmu-sei/sds-lite'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', setupSds)
})
```

### SvelteKit

Use the root layout so setup happens once:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@cmu-sei/sds-lite/sds.css'
  import { setupSds } from '@cmu-sei/sds-lite'
  import { onMount } from 'svelte'

  onMount(setupSds)
</script>

<div data-sds-root>
  <slot />
</div>
```

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

Import global CSS through the application's configured stylesheet path, then
set up SDS Lite once in the root:

```tsx
import { useEffect } from 'react'
import { Outlet } from '@remix-run/react'
import { setupSds } from '@cmu-sei/sds-lite'

export default function App() {
  useEffect(() => setupSds(), [])
  return (
    <main data-sds-root>
      <Outlet />
    </main>
  )
}
```

### Angular SSR

Add `@cmu-sei/sds-lite/sds.css` to the workspace's global styles. Set up
behavior after the first browser render:

```ts
import { Component, afterNextRender } from '@angular/core'
import { setupSds } from '@cmu-sei/sds-lite'

@Component({
  selector: 'app-root',
  template: '<main data-sds-root><router-outlet /></main>',
})
export class AppComponent {
  constructor() {
    afterNextRender(setupSds)
  }
}
```

Angular applications using SDS custom elements must also include
`CUSTOM_ELEMENTS_SCHEMA`, as described above.

## Framework rules that prevent surprises

1. Import global CSS and set up behavior once, not per component instance.
2. Use native properties for state: `disabled`, `checked`, `hidden`, `open`,
   and ARIA attributes.
3. Keep custom-element children in the documented order.
4. Use refs or framework-native event bindings for `sds-*` custom events.
5. For hydration, call `setupSds()` only after the framework hydrates. Render
   complete authored markup only when the initial response must include the
   enhanced accessibility state.

[Configure server rendering →](./server-rendering.md)
