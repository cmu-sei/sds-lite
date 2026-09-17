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

## Framework rules that prevent surprises

1. Import global CSS and register behavior once, not per component instance.
2. Use native properties for state: `disabled`, `checked`, `hidden`, `open`,
   and ARIA attributes.
3. Keep custom-element children in the documented order.
4. Use refs or framework-native event bindings for `sds-*` custom events.
5. For hydration, render complete markup and call `defineSds()` only after the
   framework hydrates.

[Configure server rendering →](./server-rendering.md)
