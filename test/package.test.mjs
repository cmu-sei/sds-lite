import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const customElementsManifest = JSON.parse(
  await readFile('custom-elements.json', 'utf8'),
)

test('every public package target exists', async () => {
  for (const target of Object.values(packageJson.exports)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target)
    await Promise.all(paths.map((path) => access(path)))
  }
})

test('all JavaScript entries are safe to import during SSR', async () => {
  const entries = [
    '@cmu-sei/sds-lite',
    '@cmu-sei/sds-lite/auto',
    '@cmu-sei/sds-lite/dialog',
    '@cmu-sei/sds-lite/dropdown',
    '@cmu-sei/sds-lite/popover',
    '@cmu-sei/sds-lite/tabs',
    '@cmu-sei/sds-lite/tooltip',
    '@cmu-sei/sds-lite/toast',
  ]

  const modules = await Promise.all(entries.map((entry) => import(entry)))
  assert.equal(typeof modules[0].notify, 'function')
  assert.equal(typeof modules[0].defineSds, 'function')
})

test('browser-only helpers fail clearly when called during SSR', async () => {
  const { notify } = await import('@cmu-sei/sds-lite')
  assert.throws(() => notify('Saved'), /only be called in a browser/)
})

test('declarations use publishable JavaScript specifiers', async () => {
  const declarations = await readFile('package/sds.d.ts', 'utf8')
  assert.doesNotMatch(declarations, /from ['"].+\.ts['"]/)
})

test('the application build retains automatic registration', async () => {
  const assets = await readdir('dist/assets')
  const script = assets.find((asset) => asset.endsWith('.js'))
  assert.ok(script)
  const source = await readFile(`dist/assets/${script}`, 'utf8')
  assert.match(source, /sds-dropdown/)
  assert.match(source, /sds-popover/)
  assert.match(source, /sds-tabs/)
  assert.match(source, /sds-tooltip/)
  assert.match(source, /sds-toast/)
})

test('the application build includes linked documentation', async () => {
  await access('dist/docs/README.md')
  await access('dist/docs/getting-started.md')
  await access('dist/docs/components/README.md')
  await access('dist/docs/reference/README.md')
})

test('the automatic entry and root entry share behavior modules', async () => {
  const auto = await readFile('package/auto.js', 'utf8')
  const root = await readFile('package/sds.js', 'utf8')

  assert.match(auto, /from "\.\/sds\.js"/)
  assert.match(root, /from "\.\/dropdown\.js"/)
  assert.match(root, /from "\.\/toast\.js"/)
})

test('the CDN entries use stable top-level paths', async () => {
  assert.equal(await readFile('auto.js', 'utf8'), "import './package/auto.js'\n")
  const stylesheet = await readFile('sds.css', 'utf8')
  assert.match(stylesheet, /@layer sds\.tokens/)
})

test('the default stylesheet omits specialized brand shells', async () => {
  const stylesheet = await readFile('sds.css', 'utf8')
  const brand = await readFile('brand.css', 'utf8')

  assert.doesNotMatch(stylesheet, /\.sds-app-header/)
  assert.doesNotMatch(stylesheet, /\.sds-brochure/)
  assert.match(brand, /\.sds-app-header/)
  assert.match(brand, /\.sds-brochure/)
})

test('brand styles share one external wordmark asset', async () => {
  const brand = await readFile('brand.css', 'utf8')

  assert.doesNotMatch(brand, /data-id='sds-sei-wordmark'/)
  assert.match(brand, /url\("\.\/package\/assets\/sei-wordmark\.svg"\)/)
  await access('package/assets/sei-wordmark.svg')
})

test('internal TypeScript declarations are not published', async () => {
  await assert.rejects(access('package/elements/floating.d.ts'))
  await assert.rejects(access('package/elements/internals.d.ts'))
})

test('the package remains dependency-free', () => {
  assert.equal(packageJson.dependencies, undefined)
  assert.equal(packageJson.peerDependencies, undefined)
})

test('structured documentation is published', () => {
  assert.ok(packageJson.files.includes('docs'))
  assert.equal(customElementsManifest.readme, 'docs/README.md')
})

test('custom-element metadata describes every registered element', () => {
  const declarations = customElementsManifest.modules.flatMap(
    (module) => module.declarations ?? [],
  )
  assert.deepEqual(
    declarations.map((declaration) => declaration.tagName).sort(),
    ['sds-dropdown', 'sds-popover', 'sds-tabs', 'sds-toast', 'sds-tooltip'],
  )

  const attributes = declarations.flatMap(
    (declaration) =>
      declaration.attributes?.map((attribute) => attribute.name) ?? [],
  )
  assert.equal(attributes.includes('data-mode'), false)
  assert.equal(attributes.includes('data-valid'), false)
  assert.equal(attributes.includes('data-field-required'), false)

  const toast = declarations.find(
    (declaration) => declaration.tagName === 'sds-toast',
  )
  assert.deepEqual(
    toast.members?.map((member) => member.name),
    ['open', 'show', 'close'],
  )
})
