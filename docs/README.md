# SDS Lite documentation

Styles and accessible behavior for semantic HTML. No framework or runtime
dependencies required.

Unless noted otherwise, pixel equivalents assume a 16px root font size.
Dimensions expressed in `rem` scale with the root font size.

## Start here

| I want to... | Start here |
|---|---|
| Build my first page | [Quick start](./getting-started.md) |
| Install SDS Lite | [NPM](./installation/npm.md) or [account-free CDN](./installation/cdn.md) |
| Find a specific feature | [Feature index](./components/README.md#feature-index) |
| Keep Tailwind, Bootstrap, or Material | [Combine design systems](./guides/theming.md#combine-design-systems) |
| Choose SDS or host page typography | [Styling boundaries](./guides/theming.md#choose-a-styling-boundary) |
| Change colors, fonts, or themes | [Theming](./guides/theming.md) |
| Fix something that is not working | [Troubleshooting by symptom](./troubleshooting.md) |

## Integrate

| Application | Guide |
|---|---|
| React, Vue, Angular, or Svelte | [Framework integration](./guides/frameworks.md) |
| SSR or hydration | [Server rendering](./guides/server-rendering.md) |
| Existing component library | [Migration guides](./migration/index.md) |
| SEI Design System | [Incremental SEI adoption](./guides/theming.md#sei-adoption) |

## Build

- [Interactive playground](../index.html): search components, application recipes,
  and page starters from Overview. Preview examples and copy component HTML,
  complete workflows with JavaScript, or full starter pages with setup.
  The playground uses the same shipped classes and utilities as NPM and CDN
  applications.
- [Component recipes](./components/README.md): copy a minimal example and look up its options.
- [Choose by purpose](./components/README.md#choose-by-purpose): distinguish similar-looking recipes before choosing one.
- [Composition patterns](./guides/composition-patterns.md): complete copyable selection forms, table bulk actions, input actions, date ranges, uploads, and native composition guidance.
- [Coverage and ownership](./components/README.md#coverage-and-ownership): distinguish built-in behavior, application recipes, and features intentionally not provided.
- [Accessibility](./guides/accessibility.md): names, keyboard behavior, validation, contrast, and testing responsibilities.
- [Browser support](./guides/browser-support.md): platform requirements and fallback policy.

## Look up an API

| Need | Reference |
|---|---|
| Imports and entry points | [Package imports](./reference/imports.md) |
| Functions, properties, and events | [JavaScript API](./reference/javascript.md) |
| Theme tokens and cascade layers | [CSS API](./reference/css.md) |
| Classes, attributes, and defaults | [Recipe interface](./reference/recipes.md) |
| Machine-readable contracts | [Public interface](./reference/public-interface.md) |
