import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const manifest = JSON.parse(
  await readFile('interface-manifest.json', 'utf8'),
)

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

  for (const recipe of manifest.recipes) {
    if (!Object.hasOwn(recipe.options, 'data-sds-tone')) continue
    assert.ok(
      tones.has(recipe.defaults['data-sds-tone']),
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
    ['field:data-sds-tone', 'neutral'],
    ['badge:data-sds-variant', 'solid'],
    ['callout:data-sds-variant', 'subtle'],
    ['avatar:data-sds-density', 'comfortable'],
    ['table:data-sds-sticky', 'none'],
    ['grid:data-sds-columns', 'automatic'],
    ['flex:data-sds-stack-at', 'none'],
    ['dialog:data-sds-return-value', 'empty string'],
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
