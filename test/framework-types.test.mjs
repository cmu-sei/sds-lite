import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('React documentation uses JSX className attributes', async () => {
  const source = (await Promise.all([
    'docs/guides/frameworks.md',
    'docs/guides/combobox.md',
  ].map((file) => readFile(file, 'utf8')))).join('\n')
  const examples = Array.from(source.matchAll(/```tsx\s*\n([\s\S]*?)```/g))
  assert.ok(examples.length > 0)
  for (const [index, example] of examples.entries()) {
    assert.doesNotMatch(example[1], /\bclass\s*=/, `JSX example ${index + 1}`)
  }
})

test('generated React and Vue integrations type-check', () => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '-p', 'test/types/tsconfig.json'],
    { encoding: 'utf8' },
  )

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
