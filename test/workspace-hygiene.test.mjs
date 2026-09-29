import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const generatedRootArtifacts = [
  'auto.js',
  'brand.css',
  'core.css',
  'dialog.js',
  'dropdown.js',
  'layouts.css',
  'package',
  'popover.js',
  'prose.css',
  'sds.css',
  'sds.js',
  'tabs.js',
  'test-results',
  'toast.js',
  'tooltip.js',
]

test('generated artifacts stay out of the repository root', async () => {
  for (const path of generatedRootArtifacts) {
    await assert.rejects(access(path), undefined, path)
  }
})

test('npm installs dependencies from the public registry', async () => {
  assert.equal(
    await readFile('.npmrc', 'utf8'),
    'registry=https://registry.npmjs.org/\n',
  )
})
