import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('generated React and Vue integrations type-check', () => {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '-p', 'test/types/tsconfig.json'],
    { encoding: 'utf8' },
  )

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
