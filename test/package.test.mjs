import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))

test('every public package target exists', async () => {
  for (const target of Object.values(packageJson.exports)) {
    const paths = typeof target === 'string' ? [target] : Object.values(target)
    await Promise.all(paths.map((path) => access(path)))
  }
})

test('all JavaScript entries are safe to import during SSR', async () => {
  const entries = [
    '@cmu-sei/sds-lite',
    '@cmu-sei/sds-lite/dialog',
    '@cmu-sei/sds-lite/dropdown',
    '@cmu-sei/sds-lite/popover',
    '@cmu-sei/sds-lite/tabs',
    '@cmu-sei/sds-lite/tooltip',
    '@cmu-sei/sds-lite/toast',
  ]

  const modules = await Promise.all(entries.map((entry) => import(entry)))
  assert.equal(typeof modules[0].notify, 'function')
  assert.equal(typeof modules[0].registerSdsPopover, 'function')
  assert.equal(typeof modules[0].registerSdsTabs, 'function')
  assert.equal(typeof modules[0].registerSdsTooltip, 'function')
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

test('the package remains dependency-free', () => {
  assert.equal(packageJson.dependencies, undefined)
  assert.equal(packageJson.peerDependencies, undefined)
})

test('linked reference documentation is published', () => {
  assert.ok(packageJson.files.includes('REFERENCE.md'))
})
