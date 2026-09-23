# SDS Lite documentation

SDS Lite gives semantic HTML production-ready styling and accessible behavior
without a framework or runtime dependency.

## Choose your path

| I want to... | Start here |
|---|---|
| Try SDS Lite in an existing project | [5-minute quick start](./getting-started.md) |
| Install it from NPM | [NPM installation](./installation/npm.md) |
| Use it from a CDN | [CDN installation](./installation/cdn.md) |
| Find a component recipe | [Component guides](./components/README.md) |
| Integrate with a framework | [Framework integration](./guides/frameworks.md) |
| Migrate from another design system | [Migration guides](./migration/index.md) |
| Use server rendering or hydration | [Server rendering](./guides/server-rendering.md) |
| Change the theme or design tokens | [Theming and customization](./guides/theming.md) |
| Review accessibility requirements | [Accessibility](./guides/accessibility.md) |
| Look up an export, event, class, or token | [API reference](./reference/README.md) |
| Fix an integration problem | [Troubleshooting](./troubleshooting.md) |

## What SDS Lite provides

- Polished foundations for headings, text, links, buttons, form controls,
  checkboxes, and radio buttons.
- Copy-ready recipes for application content, feedback, navigation, data
  display, loading states, and long-form prose.
- Small custom elements for comboboxes, tabs, dropdowns, tooltips, popovers,
  and toasts.
- Native-dialog behavior for dialogs and panels.
- Forge and Plaid themes with light, dark, and system color schemes.
- Side-effect-free JavaScript entries for hydration-safe applications.
- No runtime dependencies and no required framework, utility CSS, build
  plugin, or client-side renderer.

## The four rules

1. Load SDS Lite CSS.
2. Load automatic behavior if the page uses interactive SDS elements.
3. Put `data-sds-root` around the content SDS Lite should style.
4. Start with semantic HTML, then add an SDS class or `data-sds-*` option only
   when the recipe calls for it.

```html
<main data-sds-root>
  <h1>Project Atlas</h1>
  <p>Your project is ready.</p>
  <button type="button">Open project</button>
</main>
```

Native semantics remain the API: use links for navigation, buttons for
actions, `disabled` for unavailable controls, `checked` for choices, and
`hidden` for content that is not displayed.

Everything else in this documentation is progressive detail. You do not need
JavaScript setup functions, framework types, or the machine-readable
interface to build an ordinary page.

## Documentation map

### Start

- [5-minute quick start](./getting-started.md)
- [NPM installation](./installation/npm.md)
- [CDN installation](./installation/cdn.md)

### Components

- [Actions](./components/actions.md)
- [Forms](./components/forms.md)
- [Feedback](./components/feedback.md)
- [Data display](./components/data-display.md)
- [Layout](./components/layout.md)
- [Navigation](./components/navigation.md)
- [Overlays](./components/overlays.md)
- [Loading and empty states](./components/loading.md)
- [Prose](./components/prose.md)

### Build and operate

- [Framework integration](./guides/frameworks.md)
- [Server rendering](./guides/server-rendering.md)
- [Accessibility](./guides/accessibility.md)
- [Theming and customization](./guides/theming.md)
- [Browser support](./guides/browser-support.md)
- [Troubleshooting](./troubleshooting.md)
- [Migration guides and codemod](./migration/index.md)

### Reference

- [Package imports](./reference/imports.md)
- [JavaScript API and events](./reference/javascript.md)
- [CSS API](./reference/css.md)
- [Public interface index](./reference/public-interface.md)
- [Generated recipe interface](./reference/recipes.md)

## Production checklist

- Pin an exact version in CDN URLs.
- Import CSS early enough to include it in the first rendered page.
- Give icon-only controls an accessible name.
- Render complete IDs, relationships, and state before hydrating.
- Use `role="alert"` only for urgent notifications.
- Test keyboard navigation, zoom, light and dark schemes, and the browsers
  supported by your application.

[Get started in five minutes →](./getting-started.md)
