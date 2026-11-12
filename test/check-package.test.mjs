import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import test from 'node:test'

const checker = fileURLToPath(new URL('../scripts/check-package.mjs', import.meta.url))

function assetBytes(length) {
  const contents = Buffer.alloc(length)
  for (let offset = 0; offset < length; offset += 32) {
    createHash('sha256').update(String(offset)).digest().copy(contents, offset)
  }
  return contents
}

test('package checks enforce combined and individual delivery budgets', async context => {
  const directory = await mkdtemp(join(tmpdir(), 'sds-package-budget-'))
  const write = async (filename, contents) => {
    const path = join(directory, filename)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, contents)
  }
  try {
    await write('package.json', JSON.stringify({
      name: 'sds-package-budget-fixture',
      version: '1.0.0',
      files: ['LICENSE', 'dist/package', 'dist/sds.css', 'dist/brand.css', 'docs', 'scripts/migrate.mjs'],
    }))
    for (const filename of ['LICENSE', 'dist/package/sds.js', 'scripts/migrate.mjs']) {
      await write(filename, '')
    }
    for (const name of ['selection', 'table-selection', 'multiple-selection', 'input-actions', 'date-range', 'file-upload']) {
      for (const extension of ['html', 'js']) {
        await write(`docs/examples/${name}.${extension}`, '')
      }
    }
    await write('dist/brand.css', '')
    await write('dist/sds.js', '')

    for (const scenario of [
      { name: 'within all budgets', css: 22_000, auto: 12_000, status: 0 },
      { name: 'combined overage only', css: 22_700, auto: 12_500, status: 1, error: 'Default CDN payload is' },
      { name: 'individual CSS overage only', css: 23_500, auto: 10_000, status: 1, error: 'dist/sds.css is' },
    ]) {
      await context.test(scenario.name, async () => {
        const css = assetBytes(scenario.css)
        const auto = assetBytes(scenario.auto)
        const combined = gzipSync(css).length + gzipSync(auto).length
        assert.equal(combined > 35_000, scenario.name === 'combined overage only')
        assert.equal(gzipSync(css).length > 23_000, scenario.name === 'individual CSS overage only')
        assert.ok(gzipSync(auto).length <= 13_000)
        await write('dist/sds.css', css)
        await write('dist/auto.js', auto)
        const result = spawnSync(process.execPath, [checker], {
          cwd: directory,
          encoding: 'utf8',
          timeout: 30_000,
        })
        assert.ifError(result.error)
        assert.equal(result.status, scenario.status, result.stderr)
        if (scenario.error) {
          assert.ok(result.stderr.startsWith(scenario.error), result.stderr)
          assert.equal(result.stderr.trim().split('\n').length, 1, result.stderr)
        } else {
          assert.match(result.stdout, new RegExp(`Default CDN payload: ${combined} bytes gzip`))
        }
      })
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})