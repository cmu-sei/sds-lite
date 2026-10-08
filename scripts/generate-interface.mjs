#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { parseSync } from 'rolldown/utils'
import { validateInterfaceManifest } from './interface-contract.mjs'

const check = process.argv.includes('--check')
const manifest = JSON.parse(await readFile('interface-manifest.json', 'utf8'))
const schema = JSON.parse(await readFile('interface-manifest.schema.json', 'utf8'))
validateInterfaceManifest(manifest, schema)

function familyFor(attribute) {
  return attribute.family
    ? manifest.optionFamilies[attribute.family]
    : undefined
}

function attributeDescription(attribute) {
  return attribute.description ?? familyFor(attribute)?.description ?? ''
}

function attributeValues(attribute) {
  return attribute.values ?? familyFor(attribute)?.values ?? []
}

function withDefault(description, defaultValue) {
  return defaultValue === undefined
    ? description
    : `${description}${description ? ' ' : ''}Default: ${defaultValue}.`
}

function recipeDefault(recipe, name, values) {
  if (!Object.hasOwn(recipe.defaults ?? {}, name)) return ''

  if (Object.hasOwn(recipe.omissionDefaults ?? {}, name)) {
    return ` (when omitted: ${recipe.omissionDefaults[name]}; reset by removing the attribute)`
  }
  const defaultValue = recipe.defaults[name]
  if (typeof defaultValue === 'boolean') {
    return defaultValue ? ' (present by default)' : ' (omitted by default)'
  }

  const displayValue = defaultValue === '' ? 'empty string' : String(defaultValue)
  return values.includes(defaultValue)
    ? ` (default: \`${displayValue}\`)`
    : ` (when omitted: ${displayValue})`
}

function customElementsManifest() {
  return {
    schemaVersion: '1.0.0',
    readme: 'docs/README.md',
    modules: manifest.customElements.map((element) => ({
      kind: 'javascript-module',
      path: element.module,
      declarations: [
        {
          kind: 'class',
          name: element.className,
          tagName: element.tagName,
          description: `${element.description} Content model: ${element.content.join(' ')}`,
          attributes: element.attributes.map((attribute) => ({
            name: attribute.name,
            ...(attribute.type || attributeValues(attribute).length
              ? {
                  type: {
                    text:
                      attribute.type ??
                      union(attributeValues(attribute)),
                  },
                }
              : {}),
            description: attributeDescription(attribute),
            ...(attribute.default !== undefined
              ? { default: attribute.default }
              : {}),
          })),
          members: element.members.map((member) => ({
            kind: member.kind,
            name: member.name,
            ...(member.type ? { type: { text: member.type } } : {}),
            description: member.description,
            ...(member.parameters
              ? {
                  parameters: member.parameters.map((parameter) => ({
                    name: parameter.name,
                    type: { text: parameter.type },
                    ...(parameter.default
                      ? { default: parameter.default }
                      : {}),
                  })),
                }
              : {}),
          })),
          ...(element.events
            ? {
                events: element.events.map((event) => ({
                  name: event.name,
                  type: { text: event.type },
                  description: event.description,
                })),
              }
            : {}),
        },
      ],
    })),
  }
}

function htmlData() {
  return {
    version: 1.1,
    globalAttributes: manifest.globalAttributes.map((attribute) => ({
      name: attribute.name,
      description: withDefault(
        attributeDescription(attribute),
        attribute.default,
      ),
      ...(attributeValues(attribute).length
        ? {
            values: attributeValues(attribute).map((value) => ({ name: value })),
          }
        : {}),
    })),
    tags: manifest.customElements.map((element) => ({
      name: element.tagName,
      description: `${element.description} ${element.content.join(' ')}`,
      attributes: element.attributes.map((attribute) => ({
        name: attribute.name,
        description: withDefault(
          attributeDescription(attribute),
          attribute.default,
        ),
        ...(attributeValues(attribute).length
          ? {
              values: attributeValues(attribute).map((value) => ({
                name: value,
              })),
            }
          : {}),
      })),
    })),
  }
}

function union(values) {
  return values.map((value) => JSON.stringify(value)).join(' | ')
}

function generatedTypes() {
  const types = new Map(Object.entries(manifest.optionFamilies)
    .map(([name, family]) => {
      const typeName = `Sds${name[0].toUpperCase()}${name.slice(1)}`
      return [typeName, union(family.values)]
    }))
  for (const element of manifest.customElements) {
    for (const member of element.members) {
      if (member.kind !== 'field' || !member.type?.startsWith('Sds')) continue
      const attribute = element.attributes.find(attribute => attribute.name === member.name)
      const values = attribute ? attributeValues(attribute) : []
      if (values.length === 0) continue
      const definition = union(values)
      if (types.has(member.type) && types.get(member.type) !== definition) {
        throw new Error(`Conflicting values for ${member.type}`)
      }
      types.set(member.type, definition)
    }
  }
  const definitions = [...types]
    .map(([name, definition]) => `export type ${name} = ${definition}`)
    .join('\n')

  return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\n${definitions}\n\nexport interface SdsToggleDetail {\n  open: boolean\n}\n`
}

function generatedReference() {
  const lines = [
    '# Recipe interface',
    '',
    '[Documentation](../README.md) / [Reference](./README.md) / Recipes',
    '',
    '> Generated from [`interface-manifest.json`](../../interface-manifest.json). Do not edit this file directly.',
    '',
    'An option with an `on` target belongs on that element, not necessarily on the recipe container. Options without one belong on the recipe element.',
    '',
    '`omissionDefaults` describes behavior when an attribute is absent, not an accepted literal value. Remove the attribute to restore that behavior. The legacy `defaults` strings remain available for existing metadata consumers.',
    '',
    '## Global attributes',
    '',
    '| Attribute | Values | Default | Purpose |',
    '|---|---|---|---|',
    ...manifest.globalAttributes.map(
      (attribute) => {
        const values = attributeValues(attribute)
        return `| \`${attribute.name}\` | ${
          values.length
            ? values.map((value) => `\`${value}\``).join(', ')
            : 'Presence'
        } | ${attribute.default ?? ''} | ${attributeDescription(attribute)} |`
      },
    ),
    '',
  ]

  const categories = Array.from(
    new Set(manifest.recipes.map((recipe) => recipe.category)),
  )
  for (const category of categories) {
    lines.push(`## ${category}`, '', '| Recipe | Classes | Elements | Options | Purpose |', '|---|---|---|---|---|')
    for (const recipe of manifest.recipes.filter(
      (candidate) => candidate.category === category,
    )) {
      const options = Object.entries(recipe.options)
        .map(([name, values]) => {
          const type = recipe.optionTypes?.[name]
          const target = recipe.optionTargets?.[name]
          return `${values.length
            ? `\`${name}\`: ${values.map((value) => `\`${value}\``).join(', ')}`
            : `\`${name}\`${type ? `: ${type}` : ''}`}${
            target ? ` (on \`${target}\`)` : ''
          }${recipeDefault(recipe, name, values)}`
        })
        .join('<br>')
      const requirements = recipe.requirements?.length
        ? `<br>Requires: ${recipe.requirements.join(' ')}`
        : ''
      lines.push(
        `| ${recipe.name} | ${recipe.classes.map((name) => `\`.${name}\``).join('<br>')} | ${recipe.elements?.map((name) => `\`<${name}>\``).join('<br>') ?? ''} | ${options} | ${recipe.description}${requirements} |`,
      )
    }
    lines.push('')
  }

  lines.push('## Compositions', '',
    'These contracts describe the shipped patterns and layout starters, not restrictions on application-authored compositions. Required parts may match the composition root or its descendants.', '')
  for (const composition of manifest.compositions ?? []) {
    lines.push(`### ${composition.name}`, '',
      `Kind: ${composition.kind}. Stylesheets: ${composition.stylesheets.map(name => `\`${name}\``).join(', ')}. JavaScript setup: ${composition.requiresSetup ? 'required' : 'not required'}.`, '',
      `Recipes: ${composition.recipes.map(name => `\`${name}\``).join(', ')}.`, '',
      `Custom elements: ${composition.customElements.length ? composition.customElements.map(name => `\`<${name}>\``).join(', ') : 'none'}.`, '',
      `Assets: ${composition.assets.length ? composition.assets.map(name => `\`${name}\``).join(', ') : 'none'}.`, '',
      '| Required part | Minimum count |', '|---|---|',
      ...composition.parts.map(part => `| \`${part.selector}\` | ${part.minimum} |`), '',
      'Application responsibilities:', '',
      ...composition.applicationResponsibilities.map(description => `- ${description}`), '')
  }
  lines.push('## Custom elements', '')
  for (const element of manifest.customElements) {
    lines.push(
      `### \`<${element.tagName}>\``,
      '',
      element.description,
      '',
      '**Content model:**',
      '',
      ...element.content.map((item) => `- ${item}`),
      '',
      '| Attribute | Values or type | Default | Purpose |',
      '|---|---|---|---|',
      ...element.attributes.map((attribute) => {
        const values = attributeValues(attribute)
        return `| \`${attribute.name}\` | ${
          values.length
            ? values.map((value) => `\`${value}\``).join(', ')
            : `\`${attribute.type ?? 'string'}\``
        } | ${attribute.default ?? ''} | ${attributeDescription(attribute)} |`
      }),
      '',
      '| Property or method | Type | Purpose |',
      '|---|---|---|',
      ...element.members.map(
        (member) => {
          const parameters = member.parameters
            ?.map((parameter) =>
              parameter.default
                ? `${parameter.name} = ${parameter.default}`
                : parameter.name,
            )
            .join(', ')
          return `| \`${member.name}${
            member.kind === 'method' ? `(${parameters ?? ''})` : ''
          }\` | \`${member.type ?? 'method'}\` | ${member.description} |`
        },
      ),
      '',
    )
    if (element.events?.length) {
      lines.push(
        '| Event | Detail | Purpose |',
        '|---|---|---|',
        ...element.events.map(
          (event) =>
            `| \`${event.name}\` | \`${event.type}\` | ${event.description} |`,
        ),
        '',
      )
    }
  }

  return `${lines.join('\n')}\n`
}

function propertyType(attribute) {
  const values = attributeValues(attribute)
  if (values.length) return union(values)
  if (attribute.type === 'boolean') return 'boolean'
  if (attribute.type === 'number') return 'number'
  return 'string'
}

function pascalCase(value) {
  return value
    .split('-')
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('')
}

function replaceInventory(source, pattern, replacement, name) {
  if (!pattern.test(source)) throw new Error(`Missing generated section: ${name}`)
  return source.replace(pattern, replacement)
}

async function generatedPublicIndex() {
  let source = await readFile('docs/reference/public-interface.md', 'utf8')
  const categories = {
    'Actions and forms': 'Foundations, actions, and forms',
    'Feedback and loading': 'Feedback and loading',
    'Content and data': 'Content and data',
    Layout: 'Layout',
    'Navigation and overlays': 'Navigation and overlays',
    Prose: 'Prose and utilities',
    'Layout and composition': 'Prose and utilities',
    'Content and data display': 'Prose and utilities',
    'Application shells': 'Application shell',
  }
  const groups = new Map(Object.values(categories).map(name => [name, []]))
  groups.set('Brochure shell', [])
  for (const recipe of manifest.recipes) {
    for (const name of recipe.classes) {
      const category = /^sds-(brochure-|cmu-wordmark)/.test(name)
        ? 'Brochure shell'
        : categories[recipe.category]
      if (!groups.has(category)) throw new Error(`Unknown recipe category: ${recipe.category}`)
      groups.get(category).push(`| \`.${name}\` | ${recipe.description} |`)
    }
  }
  const classes = ['## CSS classes', '', '> Class and element inventories are generated from the interface manifest.', '']
  for (const [name, entries] of groups) {
    classes.push(`### ${name}`, '', '| Class | Purpose |', '|---|---|', ...entries, '')
  }
  source = replaceInventory(source, /## CSS classes\n[\s\S]*?(?=## Custom elements\n)/, classes.join('\n'), 'public classes')
  const elements = [
    '## Custom elements', '', '| Element | Purpose |', '|---|---|',
    ...manifest.customElements.map(element => `| \`<${element.tagName}>\` | ${element.description} |`), '',
    'There are intentionally no custom elements for buttons, links, inputs, tags,',
    'dialogs, panels, or disclosures. Native HTML supplies their semantics.', '',
  ]
  return replaceInventory(source, /## Custom elements\n[\s\S]*?(?=## JavaScript and CSS\n)/, elements.join('\n'), 'custom elements')
}

function memberRows(element) {
  return element.members.map(member => {
    const parameters = member.parameters?.map(parameter => parameter.default
      ? `${parameter.name} = ${parameter.default}` : parameter.name).join(', ')
    const name = member.kind === 'method' ? `${member.name}(${parameters ?? ''})` : member.name
    return `| \`${name}\` | \`${member.type ?? 'void'}\` | ${member.description} |`
  })
}

async function generatedJavascriptReference() {
  let source = await readFile('docs/reference/javascript.md', 'utf8')
  const root = parseSync('src/sds.ts', await readFile('src/sds.ts', 'utf8'))
  if (root.errors.length) throw new Error('Cannot parse root exports')
  const types = root.program.body.flatMap(statement =>
    statement.type === 'ExportNamedDeclaration'
      ? statement.specifiers.filter(element => statement.exportKind === 'type' || element.exportKind === 'type').map(element => element.exported.name)
      : [])
  source = replaceInventory(source, /The root also exports these types(?: \(generated from the root entry\))?:\n[\s\S]*?(?=### `setupSds\(\)`)/,
    `The root also exports these types (generated from the root entry):\n\n${types.map(name => `- \`${name}\``).join('\n')}\n\n`, 'root types')
  const toast = manifest.customElements.find(element => element.tagName === 'sds-toast')
  source = replaceInventory(source, /(## Toast element\n[\s\S]*?)\| Member \|(?: Type \|)? Meaning \|\n[\s\S]*?(?=\nChanging `open`)/,
    (_match, prefix) => prefix + ['| Member | Type | Meaning |', '|---|---|---|', ...memberRows(toast), ''].join('\n'), 'toast members')
  const popover = manifest.customElements.find(element => element.tagName === 'sds-popover')
  source = replaceInventory(source, /(## Dropdown and popover elements\n[\s\S]*?)\| Member \|(?: Type \|)? Meaning \|\n[\s\S]*?(?=\nDropdowns additionally)/,
    (_match, prefix) => prefix + ['| Member | Type | Meaning |', '|---|---|---|', ...memberRows(popover), ''].join('\n'), 'floating members')
  const tooltip = manifest.customElements.find(element => element.tagName === 'sds-tooltip')
  const tooltipProperties = tooltip.members.filter(member => member.kind === 'field').map(member => `\`${member.name}\``).join(', ')
  source = replaceInventory(source, /`<sds-tooltip>` exposes reflected[\s\S]*?(?=\n## Events)/,
    `\`<sds-tooltip>\` exposes reflected ${tooltipProperties} properties but no\nprogrammatic open state because its visibility follows hover and focus.\n`, 'tooltip members')
  const events = new Map()
  for (const element of manifest.customElements) {
    for (const event of element.events ?? []) {
      const entry = events.get(event.name) ?? { ...event, targets: [] }
      entry.targets.push(`\`<${element.tagName}>\``)
      events.set(event.name, entry)
    }
  }
  const rows = [...events.values()].map(event => {
    const fields = Object.entries(event.detail).map(([name, type]) => `${name}: ${type}`)
    const detail = fields.length ? `\`{ ${fields.join('; ')} }\`` : 'None'
    return `| \`${event.name}\` | ${event.targets.join(', ')} | ${detail} | ${event.description} |`
  })
  return replaceInventory(source, /\| Event \| Target \| Detail \| When \|\n[\s\S]*?(?=\n```ts)/,
    ['| Event | Target | Detail | When |', '|---|---|---|---|', ...rows, ''].join('\n'), 'events')
}

function generatedReactTypes() {
  const props = manifest.customElements
    .map((element) => {
      const name = `${pascalCase(element.tagName)}Props`
      const attributes = element.attributes.map(
        (attribute) =>
          `  ${JSON.stringify(attribute.name)}?: ${propertyType(attribute)}`,
      )
      const events = (element.events ?? []).map(
        (event) =>
          `  ${JSON.stringify(`on${event.name}`)}?: (event: ${event.type}) => void`,
      )
      return `export type ${name} = SdsElementProps<HTMLElementTagNameMap[${JSON.stringify(element.tagName)}]> & {\n${[...attributes, ...events].join('\n')}\n}`
    })
    .join('\n\n')
  const intrinsic = manifest.customElements
    .map(
      (element) =>
        `      ${JSON.stringify(element.tagName)}: ${pascalCase(element.tagName)}Props`,
    )
    .join('\n')

   return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\nimport type { DetailedHTMLProps, HTMLAttributes } from 'react'\nimport type { SdsComboboxSelectDetail, SdsTabsChangeDetail, SdsToastCloseReason, SdsToggleDetail } from '@cmu-sei/sds-lite'\n\nexport type SdsElementProps<Element extends HTMLElement> =\n  DetailedHTMLProps<HTMLAttributes<Element>, Element>\n\n${props}\n\ndeclare module 'react' {\n  namespace JSX {\n    interface IntrinsicElements {\n${intrinsic}\n    }\n  }\n}\n\ndeclare global {\n  namespace JSX {\n    interface IntrinsicElements {\n${intrinsic}\n    }\n  }\n}\n`
}

function generatedVueTypes() {
  const props = manifest.customElements
    .map((element) => {
      const name = `${pascalCase(element.tagName)}Props`
      const attributes = element.attributes.map(
        (attribute) =>
          `  ${JSON.stringify(attribute.name)}?: ${propertyType(attribute)}`,
      )
      const events = (element.events ?? []).map((event) => {
        const eventName = `on${pascalCase(event.name)}`
        return `  ${eventName}?: (event: ${event.type}) => void`
      })
      return `export interface ${name} {\n${[...attributes, ...events].join('\n')}\n}`
    })
    .join('\n\n')
  const components = manifest.customElements
    .map(
      (element) =>
        `    ${JSON.stringify(element.tagName)}: DefineComponent<${pascalCase(element.tagName)}Props>`,
    )
    .join('\n')

   return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\nimport type { DefineComponent } from 'vue'\nimport type { SdsComboboxSelectDetail, SdsTabsChangeDetail, SdsToastCloseReason, SdsToggleDetail } from '@cmu-sei/sds-lite'\n\n${props}\n\ndeclare module 'vue' {\n  export interface GlobalComponents {\n${components}\n  }\n}\n\nexport {}\n`
}

const outputs = new Map([
  ['custom-elements.json', `${JSON.stringify(customElementsManifest(), null, 2)}\n`],
  ['html-data.json', `${JSON.stringify(htmlData(), null, 2)}\n`],
  ['src/generated/interface.ts', generatedTypes()],
  ['docs/reference/recipes.md', generatedReference()],
  ['docs/reference/public-interface.md', await generatedPublicIndex()],
  ['docs/reference/javascript.md', await generatedJavascriptReference()],
  ['framework-types/react.d.ts', generatedReactTypes()],
  ['framework-types/vue.d.ts', generatedVueTypes()],
])

let stale = false
for (const [path, contents] of outputs) {
  if (check) {
    const current = await readFile(path, 'utf8').catch(() => '')
    if (current !== contents) {
      console.error(`${path} is stale. Run npm run generate:interface.`)
      stale = true
    }
  } else {
    await writeFile(path, contents)
  }
}

if (stale) process.exitCode = 1
