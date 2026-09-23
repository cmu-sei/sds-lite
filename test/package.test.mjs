import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const customElementsManifest = JSON.parse(
  await readFile('custom-elements.json', 'utf8'),
)

test('the package keeps one small primary interface', () => {
  assert.deepEqual(Object.keys(packageJson.exports), [
    '.',
    './auto',
    './react',
    './vue',
    './html-data.json',
    './interface-manifest.json',
    './sds.css',
    './brand.css',
    './package.json',
  ])
})

test('every public package target exists', async () => {
  for (const target of Object.values(packageJson.exports)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target)
    await Promise.all(paths.map((path) => access(path)))
  }
})

test('custom-element metadata points to published modules', async () => {
  await Promise.all(
    customElementsManifest.modules.map((module) => access(module.path)),
  )
})

test('all JavaScript entries are safe to import during SSR', async () => {
  const entries = [
    '@cmu-sei/sds-lite',
    '@cmu-sei/sds-lite/auto',
    '@cmu-sei/sds-lite/react',
    '@cmu-sei/sds-lite/vue',
  ]

  const modules = await Promise.all(entries.map((entry) => import(entry)))
  assert.equal(typeof modules[0].notify, 'function')
  assert.equal(typeof modules[0].setupSds, 'function')
  assert.equal(typeof modules[1].notify, 'function')
})

test('browser-only helpers fail clearly when called during SSR', async () => {
  const { notify } = await import('@cmu-sei/sds-lite')
  assert.throws(() => notify('Saved'), /only be called in a browser/)
})

test('declarations use publishable JavaScript specifiers', async () => {
  const declarations = await readFile('dist/package/sds.d.ts', 'utf8')
  assert.doesNotMatch(declarations, /from ['"].+\.ts['"]/)
  assert.equal(
    await readFile('dist/package/auto.d.ts', 'utf8'),
    "export { notify } from './sds.js';\n",
  )
})

test('the application build retains automatic registration', async () => {
  const assets = await readdir('dist/assets')
  const script = assets.find((asset) => asset.endsWith('.js'))
  assert.ok(script)
  const source = await readFile(`dist/assets/${script}`, 'utf8')
  assert.match(source, /sds-dropdown/)
  assert.match(source, /sds-combobox/)
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

test('the application build includes stable CDN entries', async () => {
  for (const filename of [
    'auto.js',
    'brand.css',
    'interface-manifest.schema.json',
    'sds.css',
    'sds.js',
  ]) {
    await access(`dist/${filename}`)
  }
  await access('dist/package/auto.js')
  await access('dist/package/assets/sei-wordmark.svg')

  for (const filename of [
    'core.css',
    'dialog.js',
    'dropdown.js',
    'layouts.css',
    'popover.js',
    'prose.css',
    'tabs.js',
    'toast.js',
    'tooltip.js',
  ]) {
    await assert.rejects(access(`dist/${filename}`))
  }
})

test('the automatic entry and root entry share behavior modules', async () => {
  const auto = await readFile('dist/package/auto.js', 'utf8')
  const root = await readFile('dist/package/sds.js', 'utf8')

  assert.match(auto, /from "\.\/sds\.js"/)
  assert.match(root, /from "\.\/dropdown\.js"/)
  assert.match(root, /from "\.\/toast\.js"/)
})

test('the CDN entries use stable top-level paths', async () => {
  const auto = await readFile('dist/auto.js', 'utf8')
  assert.match(auto, /sds-dropdown/)
  assert.match(auto, /sds-combobox/)
  assert.match(auto, /sds-tabs/)
  const cdn = await readFile('dist/sds.js', 'utf8')
  const standalone = await import(
    `data:text/javascript;base64,${Buffer.from(cdn).toString('base64')}`
  )
  assert.equal(typeof standalone.notify, 'function')
  assert.equal(typeof standalone.setupSds, 'function')
  const stylesheet = await readFile('dist/sds.css', 'utf8')
  assert.match(stylesheet, /@layer sds\.tokens/)
})

test('the default stylesheet omits specialized brand shells', async () => {
  const stylesheet = await readFile('dist/sds.css', 'utf8')
  const brand = await readFile('dist/brand.css', 'utf8')

  assert.doesNotMatch(stylesheet, /\.sds-app-header/)
  assert.doesNotMatch(stylesheet, /\.sds-brochure/)
  assert.match(brand, /\.sds-app-header/)
  assert.match(brand, /\.sds-brochure/)
})

test('brand styles share one external wordmark asset', async () => {
  const brand = await readFile('dist/brand.css', 'utf8')

  assert.doesNotMatch(brand, /data-id='sds-sei-wordmark'/)
  assert.match(brand, /url\("\.\/package\/assets\/sei-wordmark\.svg"\)/)
  await access('dist/package/assets/sei-wordmark.svg')
})

test('internal TypeScript declarations are not published', async () => {
  await assert.rejects(access('dist/package/elements/floating.d.ts'))
  await assert.rejects(access('dist/package/elements/internals.d.ts'))
})

test('the package remains dependency-free', () => {
  assert.equal(packageJson.dependencies, undefined)
  assert.equal(packageJson.peerDependencies, undefined)
  assert.equal(packageJson.optionalDependencies, undefined)
})

test('the package identifies its public release locations', () => {
  assert.equal(
    packageJson.repository.url,
    'git+https://github.com/cmu-sei/sds-lite.git',
  )
  assert.equal(
    packageJson.publishConfig.registry,
    'https://npm.pkg.github.com/',
  )
})

test('structured documentation is published', () => {
  assert.ok(packageJson.files.includes('LICENSE'))
  assert.ok(packageJson.files.includes('docs'))
  assert.equal(customElementsManifest.readme, 'docs/README.md')
  assert.ok(packageJson.files.includes('html-data.json'))
  assert.ok(packageJson.files.includes('interface-manifest.json'))
})

test('custom-element metadata describes every registered element', () => {
  const declarations = customElementsManifest.modules.flatMap(
    (module) => module.declarations ?? [],
  )
  assert.deepEqual(
    declarations.map((declaration) => declaration.tagName).sort(),
    ['sds-combobox', 'sds-dropdown', 'sds-popover', 'sds-tabs', 'sds-toast', 'sds-tooltip'],
  )

  const attributes = declarations.flatMap(
    (declaration) =>
      declaration.attributes?.map((attribute) => attribute.name) ?? [],
  )
  assert.equal(attributes.includes('data-mode'), false)
  assert.equal(attributes.includes('data-valid'), false)
  assert.equal(attributes.includes('data-field-required'), false)
  assert.equal(attributes.some((attribute) => attribute.startsWith('data-')), false)

  const toast = declarations.find(
    (declaration) => declaration.tagName === 'sds-toast',
  )
  assert.deepEqual(
    toast.members?.map((member) => member.name),
    ['open', 'tone', 'duration', 'persistent', 'show', 'close'],
  )

  const dropdown = declarations.find(
    (declaration) => declaration.tagName === 'sds-dropdown',
  )
  assert.deepEqual(
    dropdown.members?.map((member) => member.name),
    ['open', 'placement', 'offset', 'width', 'hideCaret', 'show', 'hide'],
  )
})
