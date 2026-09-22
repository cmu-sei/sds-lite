#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const check = process.argv.includes('--check')
const manifest = JSON.parse(await readFile('interface-manifest.json', 'utf8'))

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
  const globalAttributes = [
    ...manifest.globalAttributes,
    ...Object.values(manifest.optionFamilies)
      .filter((family) => family.nativeName)
      .map((family) => ({
        name: family.nativeName,
        description: family.description,
        values: family.values,
      })),
    ...Array.from(new Set(
      manifest.recipes.flatMap((recipe) => Object.keys(recipe.options)),
    ))
      .filter(
        (name) =>
          !manifest.globalAttributes.some(
            (attribute) => attribute.name === name,
          ) &&
          !Object.values(manifest.optionFamilies).some(
            (family) => family.nativeName === name,
          ),
      )
      .sort()
      .map((name) => {
        const values = Array.from(new Set(
          manifest.recipes.flatMap((recipe) => recipe.options[name] ?? []),
        )).sort()
        return {
          name,
          description:
            'SDS Lite recipe option. Supported recipes and values are defined in interface-manifest.json.',
          ...(values.length ? { values } : {}),
        }
      }),
  ]

  return {
    version: 1.1,
    globalAttributes: globalAttributes.map((attribute) => ({
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
  const classes = manifest.recipes.flatMap((recipe) => recipe.classes).sort()
  const recipeAttributes = Array.from(
    new Set(manifest.recipes.flatMap((recipe) => Object.keys(recipe.options))),
  ).sort()
  const familyTypes = Object.entries(manifest.optionFamilies)
    .map(([name, family]) => {
      const typeName = `Sds${name[0].toUpperCase()}${name.slice(1)}`
      return `export type ${typeName} = ${union(family.values)}`
    })
    .join('\n')

  return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\n${familyTypes}\n\nexport type SdsRecipeClass =\n  | ${classes.map(JSON.stringify).join('\n  | ')}\n\nexport type SdsRecipeAttribute =\n  | ${recipeAttributes.map(JSON.stringify).join('\n  | ')}\n\nexport type SdsTabsActivation = 'automatic' | 'manual'\nexport type SdsTabsSize = 'md' | 'lg'\nexport type SdsTabsVariant = 'folder' | 'block' | 'underline'\n\nexport interface SdsToggleDetail {\n  open: boolean\n}\n`
}

function generatedReference() {
  const lines = [
    '# Recipe interface',
    '',
    '[Documentation](../README.md) / [Reference](./README.md) / Recipes',
    '',
    '> Generated from [`interface-manifest.json`](../../interface-manifest.json). Do not edit this file directly.',
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
        .map(([name, values]) =>
          `${values.length
            ? `\`${name}\`: ${values.map((value) => `\`${value}\``).join(', ')}`
            : `\`${name}\``}${
            Object.hasOwn(recipe.defaults ?? {}, name)
              ? ` (default: \`${String(recipe.defaults[name])}\`)`
              : ''
          }`,
        )
        .join('<br>')
      lines.push(
        `| ${recipe.name} | ${recipe.classes.map((name) => `\`.${name}\``).join('<br>')} | ${recipe.elements?.map((name) => `\`<${name}>\``).join('<br>') ?? ''} | ${options} | ${recipe.description} |`,
      )
    }
    lines.push('')
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

function generatedReactTypes() {
  const imports = manifest.customElements
    .map(
      (element) =>
        `import type { ${element.className} } from '@cmu-sei/sds-lite/${element.tagName.slice(4)}'`,
    )
    .join('\n')
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
      return `export type ${name} = SdsElementProps<${element.className}> & {\n${[...attributes, ...events].join('\n')}\n}`
    })
    .join('\n\n')
  const intrinsic = manifest.customElements
    .map(
      (element) =>
        `      ${JSON.stringify(element.tagName)}: ${pascalCase(element.tagName)}Props`,
    )
    .join('\n')

  return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\nimport type { DetailedHTMLProps, HTMLAttributes } from 'react'\nimport type { SdsTabsChangeDetail, SdsToastCloseReason, SdsToggleDetail } from '@cmu-sei/sds-lite'\n${imports}\n\nexport type SdsElementProps<Element extends HTMLElement> =\n  DetailedHTMLProps<HTMLAttributes<Element>, Element>\n\n${props}\n\ndeclare module 'react' {\n  namespace JSX {\n    interface IntrinsicElements {\n${intrinsic}\n    }\n  }\n}\n\ndeclare global {\n  namespace JSX {\n    interface IntrinsicElements {\n${intrinsic}\n    }\n  }\n}\n`
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

  return `// Generated by scripts/generate-interface.mjs. Do not edit.\n\nimport type { DefineComponent } from 'vue'\nimport type { SdsTabsChangeDetail, SdsToastCloseReason, SdsToggleDetail } from '@cmu-sei/sds-lite'\n\n${props}\n\ndeclare module 'vue' {\n  export interface GlobalComponents {\n${components}\n  }\n}\n\nexport {}\n`
}

const outputs = new Map([
  ['custom-elements.json', `${JSON.stringify(customElementsManifest(), null, 2)}\n`],
  ['html-data.json', `${JSON.stringify(htmlData(), null, 2)}\n`],
  ['src/generated/interface.ts', generatedTypes()],
  ['docs/reference/recipes.md', generatedReference()],
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
