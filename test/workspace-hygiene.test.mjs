import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
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
