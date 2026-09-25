import assert from 'node:assert/strict'
import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test, { after, before } from 'node:test'
import { fileURLToPath } from 'node:url'

import { transform } from '../scripts/migrate.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(root, 'scripts/migrate.mjs')
const fixtures = path.join(root, 'test', `.migrate-cli-${process.pid}`)

before(async () => {
  await mkdir(fixtures, { recursive: true })
})

after(async () => {
  await rm(fixtures, { force: true, recursive: true })
})

function migrate(from, source, filePath = 'example.html') {
  return transform(source, { filePath, from })
}

function runCli(arguments_) {
  return spawnSync(process.execPath, [script, ...arguments_], {
    cwd: root,
    encoding: 'utf8',
  })
}

test('migrates legacy SDS buttons and safe form components', () => {
  const source = `<SdsButton kind="ghost" variant="red" size="sm" block>
  Delete
</SdsButton>
<SdsInput v-model="email" type="email" size="sm" required />
<SdsTextarea v-model="notes" rows="4" />`
  const result = migrate('legacy-sds', source, 'form.vue')

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /<button class="sds-button" data-sds-variant="text" data-sds-tone="danger" data-sds-size="sm" data-sds-block type="button">/,
  )
  assert.match(
    result.code,
    /<input v-model="email" type="email" required data-sds-size="sm" class="sds-input" \/>/,
  )
  assert.match(
    result.code,
    /<textarea v-model="notes" rows="4" class="sds-input"><\/textarea>/,
  )
})

test('migrates Bootstrap buttons, links, inputs, textareas, and selects', () => {
  const source = `<button class="tracking btn btn-danger btn-sm" type="submit">Delete</button>
<a class="btn btn-outline-primary" href="/projects">Projects</a>
<input class="form-control form-control-lg" type="email">
<textarea class="form-control"></textarea>
<select class="form-select form-select-sm"></select>`
  const result = migrate('bootstrap', source)

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /<button class="tracking sds-button" type="submit" data-sds-variant="filled" data-sds-tone="danger" data-sds-size="sm">/,
  )
  assert.match(
    result.code,
    /<a class="sds-button" href="\/projects" data-sds-variant="outlined" data-sds-tone="info">/,
  )
  assert.match(
    result.code,
    /<input class="sds-input" type="email" data-sds-size="lg">/,
  )
  assert.match(result.code, /<textarea class="sds-input">/)
  assert.match(
    result.code,
    /<select class="sds-select" data-sds-size="sm">/,
  )
})

test('migrates USWDS buttons and native form controls', () => {
  const source = `<button class="usa-button usa-button--accent-warm usa-button--big">Continue</button>
<a class="usa-button usa-button--outline" href="/help">Help</a>
<input class="usa-input" name="query">
<textarea class="usa-textarea"></textarea>
<select class="usa-select"></select>`
  const result = migrate('uswds', source)

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /data-sds-variant="filled" data-sds-tone="warning" data-sds-size="lg"/,
  )
  assert.match(
    result.code,
    /<a class="sds-button" href="\/help" data-sds-variant="outlined" data-sds-tone="info">/,
  )
  assert.match(result.code, /<input class="sds-input" name="query">/)
  assert.match(result.code, /<textarea class="sds-input">/)
  assert.match(result.code, /<select class="sds-select">/)
})

test('migrates Material Web buttons and only structurally safe text fields', () => {
  const source = `<md-filled-button type="submit">Save</md-filled-button>
<md-outlined-button href="/back">Back</md-outlined-button>
<label for="email">Email</label>
<md-outlined-text-field id="email" type="email"></md-outlined-text-field>`
  const result = migrate('material', source)

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /<button type="submit" class="sds-button" data-sds-variant="filled" data-sds-tone="info">Save<\/button>/,
  )
  assert.match(
    result.code,
    /<a href="\/back" class="sds-button" data-sds-variant="outlined" data-sds-tone="info">Back<\/a>/,
  )
  assert.match(
    result.code,
    /<label for="email">Email<\/label>\s*<input id="email" type="email" class="sds-input">/,
  )
})

test('migrates Web Awesome semantic buttons and safe inputs', () => {
  const source = `<wa-button variant="success" appearance="outlined" href="/done">Done</wa-button>
<wa-input aria-label="Search" size="small"></wa-input>
<wa-textarea aria-label="Notes" rows="3" />`
  const result = migrate('web-awesome', source)

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /<a href="\/done" class="sds-button" data-sds-variant="outlined" data-sds-tone="success">Done<\/a>/,
  )
  assert.match(
    result.code,
    /<input aria-label="Search" data-sds-size="sm" class="sds-input">/,
  )
  assert.match(
    result.code,
    /<textarea aria-label="Notes" rows="3" class="sds-input"><\/textarea>/,
  )
})

test('migrates Spectrum buttons, link semantics, pending state, and safe text fields', () => {
  const source = `<sp-button variant="negative" treatment="outline">Delete</sp-button>
<sp-button href="/reports" variant="accent">Reports</sp-button>
<sp-button variant="primary" pending>Save</sp-button>
<sp-textfield aria-label="Name" size="s"></sp-textfield>`
  const result = migrate('spectrum', source)

  assert.equal(result.warnings.length, 0)
  assert.match(
    result.code,
    /data-sds-variant="outlined" data-sds-tone="danger"/,
  )
  assert.match(
    result.code,
    /<a href="\/reports" class="sds-button" data-sds-variant="filled" data-sds-tone="accent">Reports<\/a>/,
  )
  assert.match(
    result.code,
    /<button aria-busy="true" disabled class="sds-button" data-sds-variant="filled" data-sds-tone="neutral" type="button">Save<\/button>/,
  )
  assert.match(
    result.code,
    /<input aria-label="Name" data-sds-size="sm" class="sds-input">/,
  )
})

test('leaves unsupported dynamic markup unchanged and reports a line warning', () => {
  const bootstrap = `<button class="btn" :class="variantClass">Save</button>`
  const bootstrapResult = migrate('bootstrap', bootstrap, 'button.vue')
  assert.equal(bootstrapResult.code, bootstrap)
  assert.deepEqual(bootstrapResult.warnings, [
    {
      line: 1,
      message:
        'left a native element with a dynamic class unchanged; migrate Bootstrap classes manually',
    },
  ])

  const material = `<md-filled-button className={styles.action}>Save</md-filled-button>`
  const materialResult = migrate('material', material, 'button.jsx')
  assert.equal(materialResult.code, material)
  assert.match(materialResult.warnings[0].message, /prop is dynamic/)
})

test('supports static JSX attributes without rewriting event expressions', () => {
  const source =
    '<button className="btn btn-primary" onClick={save}>Save</button>'
  const result = migrate('bootstrap', source, 'SaveButton.jsx')

  assert.equal(result.warnings.length, 0)
  assert.equal(
    result.code,
    '<button className="sds-button" onClick={save} data-sds-variant="filled" data-sds-tone="info">Save</button>',
  )
})

test('leaves form components with authored labels or slotted content unchanged', () => {
  const source = `<wa-input label="Email"></wa-input>
<wa-input aria-label="Search"><wa-icon slot="start"></wa-icon></wa-input>`
  const result = migrate('web-awesome', source)

  assert.equal(result.code, source)
  assert.equal(result.warnings.length, 2)
  assert.match(result.warnings[0].message, /label/)
  assert.match(result.warnings[1].message, /self-closing/)
})

test('supported transformations are idempotent', () => {
  const examples = {
    bootstrap: '<button class="btn btn-primary">Save</button>',
    'legacy-sds': '<SdsButton kind="secondary">Save</SdsButton>',
    material: '<md-text-button>Cancel</md-text-button>',
    spectrum: '<sp-button variant="accent">Save</sp-button>',
    uswds: '<button class="usa-button usa-button--base">Save</button>',
    'web-awesome':
      '<wa-button variant="brand" appearance="filled">Save</wa-button>',
  }

  for (const [from, source] of Object.entries(examples)) {
    const once = migrate(from, source).code
    const twice = migrate(from, once).code
    assert.equal(twice, once, `${from} output should be idempotent`)
  }
})

test('dry-run previews changes without modifying files and accepts multiple paths', async () => {
  const first = path.join(fixtures, 'dry-one.html')
  const second = path.join(fixtures, 'dry-two.html')
  const firstSource = '<button class="btn btn-primary">Save</button>\n'
  const secondSource = '<input class="form-control" name="email">\n'
  await Promise.all([
    writeFile(first, firstSource),
    writeFile(second, secondSource),
  ])

  const result = runCli(['--from', 'bootstrap', first, second])

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /SDS Lite migration preview from bootstrap/)
  assert.match(result.stdout, /data-sds-variant="filled"/)
  assert.match(result.stdout, /class="sds-input"/)
  assert.match(result.stdout, /Would update 2 of 2 file\(s\)/)
  assert.equal(await readFile(first, 'utf8'), firstSource)
  assert.equal(await readFile(second, 'utf8'), secondSource)
})

test('--write updates files in place', async () => {
  const file = path.join(fixtures, 'write.html')
  await writeFile(
    file,
    '<a class="usa-button usa-button--unstyled" href="/home">Home</a>\n',
  )

  const result = runCli(['--from=uswds', '--write', file])

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /updated/)
  assert.match(result.stdout, /Updated 1 of 1 file\(s\)/)
  assert.equal(
    await readFile(file, 'utf8'),
    '<a class="sds-button" href="/home" data-sds-variant="text" data-sds-tone="info">Home</a>\n',
  )
})

test('CLI reports dynamic warnings without changing the unsupported file', async () => {
  const file = path.join(fixtures, 'dynamic.vue')
  const source = '<button class="btn" :class="variantClass">Save</button>\n'
  await writeFile(file, source)

  const result = runCli(['--from', 'bootstrap', '--write', file])

  assert.equal(result.status, 0)
  assert.match(result.stderr, /dynamic class unchanged/)
  assert.match(result.stdout, /no supported static changes/)
  assert.equal(await readFile(file, 'utf8'), source)
})

test('CLI rejects unknown sources, flags, missing paths, and absent file arguments', () => {
  const unknownSource = runCli(['--from', 'foundation', 'page.html'])
  assert.equal(unknownSource.status, 1)
  assert.match(unknownSource.stderr, /unknown source "foundation"/)

  const unknownFlag = runCli(['--from', 'bootstrap', '--force', 'page.html'])
  assert.equal(unknownFlag.status, 1)
  assert.match(unknownFlag.stderr, /unknown flag: --force/)

  const noFiles = runCli(['--from', 'bootstrap'])
  assert.equal(noFiles.status, 1)
  assert.match(noFiles.stderr, /provide at least one file path/)

  const noSource = runCli(['page.html'])
  assert.equal(noSource.status, 1)
  assert.match(noSource.stderr, /missing required --from/)

  const missing = runCli([
    '--from',
    'bootstrap',
    path.join(fixtures, 'missing.html'),
  ])
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /file not found:/)
})

test('--help documents all sources and exits successfully', () => {
  const result = runCli(['--help'])
  assert.equal(result.status, 0)
  for (const source of [
    'legacy-sds',
    'bootstrap',
    'uswds',
    'material',
    'web-awesome',
    'spectrum',
  ]) {
    assert.match(result.stdout, new RegExp(source))
  }
})
