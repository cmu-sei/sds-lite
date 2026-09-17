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
    }
  }

  for (const element of manifest.customElements) {
    for (const attribute of element.attributes) {
      assert.doesNotMatch(attribute.name, /^data-/)
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
    /(?:<|&lt;)sds-(?:tabs|dropdown|popover|tooltip|toast)\b[^>]*\bdata-sds-(?:activation|duration|hide-caret|offset|orientation|persistent|placement|size|tone|value|variant|width)\b/,
  )
})
