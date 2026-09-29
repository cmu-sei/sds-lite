import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const manifest = JSON.parse(
  await readFile('interface-manifest.json', 'utf8'),
)
const htmlData = JSON.parse(await readFile('html-data.json', 'utf8'))

async function filesUnder(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return filesUnder(entryPath, extension)
      return entryPath.endsWith(extension) ? [entryPath] : []
    }),
  )
  return files.flat()
}

function captures(source, pattern) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]))
}

test('the manifest lists every public recipe class', async () => {
  const files = await filesUnder('src/css', '.css')
  const css = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')
  const actual = captures(css, /\.((?:sds-[a-z0-9-]+)|(?:sds-not-prose))\b/g)
  const documented = new Set(
    manifest.recipes.flatMap((recipe) => recipe.classes),
  )

  assert.deepEqual([...actual].sort(), [...documented].sort())
})

test('recipe options are namespaced and custom-element attributes are not', () => {
  for (const recipe of manifest.recipes) {
    for (const option of Object.keys(recipe.options)) {
      assert.match(option, /^data-sds-/)
      assert.ok(
        Object.hasOwn(recipe.defaults ?? {}, option),
        `${recipe.name} does not declare the default for ${option}`,
      )
      if (recipe.options[option].length === 0) {
        assert.ok(
          recipe.optionTypes?.[option] ||
            typeof recipe.defaults[option] === 'boolean',
          `${recipe.name}:${option} must declare whether it takes a value`,
        )
      }
    }
    for (const option of [
      ...Object.keys(recipe.optionTypes ?? {}),
      ...Object.keys(recipe.optionTargets ?? {}),
    ]) {
      assert.ok(
        Object.hasOwn(recipe.options, option),
        `${recipe.name}:${option} has metadata without an option`,
      )
    }
  }

  for (const element of manifest.customElements) {
    for (const attribute of element.attributes) {
      assert.doesNotMatch(attribute.name, /^data-/)
    }
  }
})

test('custom-element attributes declare their omission defaults', () => {
  for (const element of manifest.customElements) {
    for (const attribute of element.attributes) {
      assert.notEqual(
        attribute.default,
        undefined,
        `${element.tagName} does not declare the default for ${attribute.name}`,
      )
    }
  }
})

test('tone-aware interfaces default to a semantic tone', () => {
  const tones = new Set(manifest.optionFamilies.tone.values)
  const unaccentedDefaults = new Map([
    ['field', 'muted help; inherited label color'],
    ['timeline', 'unaccented'],
  ])

  for (const recipe of manifest.recipes) {
    if (!Object.hasOwn(recipe.options, 'data-sds-tone')) continue
    assert.ok(
      tones.has(recipe.defaults['data-sds-tone']) ||
        recipe.defaults['data-sds-tone'] === unaccentedDefaults.get(recipe.name),
      `${recipe.name} does not default to a semantic tone`,
    )
  }

  for (const element of manifest.customElements) {
    const tone = element.attributes.find(
      (attribute) => attribute.family === 'tone',
    )
    if (!tone) continue
    assert.ok(
      tones.has(tone.default),
      `${element.tagName} does not default to a semantic tone`,
    )
  }
})

test('recipe omission defaults use audited implementation values', () => {
  const expected = new Map([
    ['button:data-sds-density', 'comfortable'],
    ['button:data-sds-shape', 'text'],
    ['link:data-sds-variant', 'primary'],
    ['link:data-sds-size', 'inherited'],
    ['field:data-sds-tone', 'muted help; inherited label color'],
    ['tag:data-sds-tone', 'neutral'],
    ['tag-action:data-sds-tone', 'info'],
    ['badge:data-sds-variant', 'solid'],
    ['callout:data-sds-variant', 'subtle'],
    ['toast-region:data-sds-toast-open', 'no target'],
    ['avatar:data-sds-density', 'comfortable'],
    ['timeline:data-sds-tone', 'unaccented'],
    ['table:data-sds-sticky', 'none'],
    ['grid:data-sds-columns', 'automatic'],
    ['cluster:data-sds-stack-at', 'none'],
    ['dialog:data-sds-return-value', ''],
    ['panel:data-sds-return-value', ''],
    ['dropdown-parts:data-sds-tone', 'neutral'],
  ])

  for (const [key, defaultValue] of expected) {
    const [recipeName, optionName] = key.split(':')
    const recipe = manifest.recipes.find(
      (candidate) => candidate.name === recipeName,
    )

    assert.equal(recipe?.defaults[optionName], defaultValue, key)
    assert.ok(!recipe?.options[optionName].includes(defaultValue), key)
  }

  for (const recipe of manifest.recipes) {
    for (const [optionName, values] of Object.entries(recipe.options)) {
      const defaultValue = recipe.defaults[optionName]
      if (
        typeof defaultValue !== 'string' ||
        values.includes(defaultValue)
      ) {
        continue
      }

      assert.ok(
        expected.has(`${recipe.name}:${optionName}`),
        `${recipe.name}:${optionName} has an unaudited omission default`,
      )
    }
  }
})

test('manifest names and generated targets are unique', () => {
  const classes = manifest.recipes.flatMap((recipe) => recipe.classes)
  const tags = manifest.customElements.map((element) => element.tagName)
  assert.equal(new Set(classes).size, classes.length)
  assert.equal(new Set(tags).size, tags.length)
})

test('HTML editor metadata only exposes truly global attributes globally', () => {
  assert.deepEqual(
    htmlData.globalAttributes.map((attribute) => attribute.name),
    manifest.globalAttributes.map((attribute) => attribute.name),
  )
})

test('CSS recipe attributes are namespaced and declared', async () => {
  const files = await filesUnder('src/css', '.css')
  const css = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')
  const attributes = captures(css, /\[(data-[a-z][a-z0-9-]*)/g)
  const declared = new Set([
    ...manifest.globalAttributes.map((attribute) => attribute.name),
    ...manifest.recipes.flatMap((recipe) => Object.keys(recipe.options)),
  ])

  for (const attribute of attributes) {
    assert.match(attribute, /^data-sds-/, attribute)
    assert.ok(declared.has(attribute), attribute)
  }
})

test('every declared recipe option has an implementation reference', async () => {
  const files = [
    ...(await filesUnder('src', '.css')),
    ...(await filesUnder('src/elements', '.ts')),
  ]
  const source = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')

  for (const recipe of manifest.recipes) {
    for (const option of Object.keys(recipe.options)) {
      assert.ok(source.includes(option), `${recipe.name}:${option}`)
    }
  }
})

test('manifest values and targets reflect implemented recipe behavior', async () => {
  const css = (
    await Promise.all(
      (await filesUnder('src/css', '.css')).map((file) => readFile(file, 'utf8')),
    )
  ).join('\n')
  const globalAttributes = new Map(
    manifest.globalAttributes.map((attribute) => [attribute.name, attribute]),
  )
  const declaredValues = new Map(
    [...globalAttributes].map(([name, attribute]) => [
      name,
      new Set(attribute.values ?? manifest.optionFamilies[attribute.family]?.values ?? []),
    ]),
  )

  for (const recipe of manifest.recipes) {
    for (const [name, values] of Object.entries(recipe.options)) {
      const declared = declaredValues.get(name) ?? new Set()
      values.forEach((value) => declared.add(value))
      declaredValues.set(name, declared)
      for (const value of values) {
        if (value === recipe.defaults[name]) continue
        assert.ok(
          css.includes(`[${name}="${value}"]`),
          `${recipe.name}:${name}="${value}" has no CSS selector`,
        )
      }
    }
  }
  for (const [, name, value] of css.matchAll(/\[(data-sds-[\w-]+)="([\w-]+)"\]/g)) {
    if (name === 'data-sds-side' && value === 'top') continue
    assert.ok(declaredValues.get(name)?.has(value), `${name}="${value}" is not declared`)
  }
  assert.equal(
    manifest.recipes.find((recipe) => recipe.name === 'tag').options['data-sds-tone'].join(),
    'danger',
  )
  assert.equal(
    manifest.recipes.find((recipe) => recipe.name === 'timeline').optionTargets['data-sds-tone'],
    '.sds-timeline-item',
  )
  assert.match(
    manifest.recipes.find((recipe) => recipe.name === 'timeline').requirements.join(' '),
    /tabindex="0"/,
  )
  assert.ok(globalAttributes.has('data-sds-column-span'))
})

test('value-bearing controls and reflected element interfaces are explicit', async () => {
  const byName = new Map(
    manifest.recipes.map((recipe) => [recipe.name, recipe]),
  )
  assert.equal(byName.get('toast-region').optionTypes['data-sds-toast-open'], 'id')
  for (const recipe of ['dialog', 'panel']) {
    assert.equal(byName.get(recipe).optionTypes['data-sds-return-value'], 'string')
  }

  for (const element of manifest.customElements) {
    const source = await readFile(
      `src/elements/${element.tagName.slice(4)}.ts`,
      'utf8',
    )
    assert.match(source, new RegExp(`export class ${element.className} extends`))
    assert.match(source, new RegExp(`defineCustomElement\\('${element.tagName}', ${element.className}\\)`))
    for (const member of element.members) {
      assert.match(
        source,
        new RegExp(
          member.kind === 'method'
            ? `\\b${member.name}\\([^)]*\\):`
            : `get ${member.name}\\(\\):`,
        ),
        `${element.tagName}.${member.name}`,
      )
    }
    for (const attribute of element.attributes) {
      assert.match(
        source,
        new RegExp(`(?:getAttribute|hasAttribute|readNumberAttribute)\\(this, '${attribute.name}'|this\\.(?:getAttribute|hasAttribute)\\('${attribute.name}'\\)`),
        `${element.tagName}[${attribute.name}]`,
      )
    }
    for (const event of element.events ?? []) {
      assert.match(
        source,
        new RegExp(`'${event.name}': ${event.type.replace(/[{}]/g, '\\$&')}`),
        `${element.tagName} event ${event.name} must have a DOM event type`,
      )
    }
  }
})

test('custom-element host attributes and reflected properties are all declared', async () => {
  for (const element of manifest.customElements) {
    const source = await readFile(
      `src/elements/${element.tagName.slice(4)}.ts`,
      'utf8',
    )
    const declaredAttributes = new Set(
      element.attributes.map((attribute) => attribute.name),
    )
    const implementedAttributes = new Set([
      ...Array.from(
        source.matchAll(/this\.(?:getAttribute|hasAttribute)\('([a-z][a-z0-9-]+)'\)/g),
        (match) => match[1],
      ),
      ...Array.from(
        source.matchAll(/readNumberAttribute\(this, '([a-z][a-z0-9-]+)'/g),
        (match) => match[1],
      ),
    ].filter((name) => name !== 'role' && !name.startsWith('aria-')))
    assert.deepEqual(
      [...implementedAttributes].sort(),
      [...declaredAttributes].sort(),
      element.tagName,
    )

    const declaredProperties = new Set(
      element.members
        .filter((member) => member.kind === 'field')
        .map((member) => member.name),
    )
    const implementedProperties = captures(
      source,
      /^  get ([A-Za-z][A-Za-z0-9]*)\(\):/gm,
    )
    assert.deepEqual(
      [...implementedProperties].sort(),
      [...declaredProperties].sort(),
      element.tagName,
    )
  }
})

test('generated interface artifacts are current', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/generate-interface.mjs', '--check'],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})

test('current examples use only the final attribute vocabulary', async () => {
  const documentationFiles = (await filesUnder('docs', '.md')).filter(
    (file) => !file.startsWith(`docs${path.sep}migration${path.sep}`),
  )
  const source = (
    await Promise.all(
      ['README.md', 'index.html', ...documentationFiles].map((file) =>
        readFile(file, 'utf8'),
      ),
    )
  ).join('\n')
  const formerAttributes = [
    'activation',
    'align',
    'avatar',
    'block',
    'callout-close',
    'columns',
    'density',
    'divided',
    'duration',
    'gap',
    'grow',
    'hide-caret',
    'inset',
    'justify',
    'no-shrink',
    'offset',
    'orientation',
    'persistent',
    'placement',
    'return-value',
    'row-highlight',
    'shape',
    'side',
    'size',
    'standalone',
    'sticky',
    'toast-close',
    'toast-open',
    'tone',
    'value',
    'variant',
    'width',
    'wrap',
  ]
  const formerPattern = new RegExp(
    `\\bdata-(?:${formerAttributes.join('|')})\\b`,
  )

  assert.doesNotMatch(source, formerPattern)
  assert.doesNotMatch(
    source,
    /(?:<|&lt;)sds-(?:combobox|tabs|dropdown|popover|tooltip|toast)\b[^>]*\bdata-sds-(?:activation|duration|filter|hide-caret|offset|orientation|persistent|placement|size|tone|value|variant|width)\b/,
  )
})
