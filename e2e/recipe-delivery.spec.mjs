import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'

let temporary
let packed
const recipes = ['selection', 'table-selection', 'multiple-selection', 'input-actions', 'date-range', 'file-upload']

test.beforeAll(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'sds-consumer-'))
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const [archive] = JSON.parse(execFileSync(npm, [
    'pack', '--ignore-scripts', '--json', '--pack-destination', temporary,
  ], { encoding: 'utf8' }))
  execFileSync('tar', ['-xzf', join(temporary, archive.filename), '-C', temporary])
  packed = join(temporary, 'package')
})

test.afterAll(async () => {
  if (temporary) await rm(temporary, { recursive: true, force: true })
})

test('the production playground initializes all six recipes through its bundled entry', async ({ page }) => {
  test.setTimeout(30_000)
  const prefix = '/production-playground/'
  const base = resolve('dist')
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route(`**${prefix}**`, async route => {
    const pathname = new URL(route.request().url()).pathname.slice(prefix.length)
    const filename = resolve(base, pathname)
    if (!filename.startsWith(`${base}${sep}`)) throw new Error(`Invalid fixture path: ${pathname}`)
    const extension = filename.split('.').at(-1)
    const contentType = { html: 'text/html', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml' }[extension]
    if (!contentType) throw new Error(`Unsupported fixture asset: ${pathname}`)
    await route.fulfill({ contentType, body: await readFile(filename, 'utf8') })
  })
  await page.goto(`${prefix}index.html`)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const selection = page.locator('#selection-example')
  const toggle = selection.getByRole('button', { name: 'Show archived', exact: true })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  const table = page.locator('#table-selection-example')
  await expect(table.locator('tbody tr')).toHaveCount(10)
  await table.getByRole('button', { name: 'Task', exact: true }).click()
  await expect(table.locator('tbody th').first()).toHaveText('SDS-125')

  const multiple = page.locator('#multiple-selection-example')
  await expect(multiple.getByRole('button', { name: 'Remove Research', exact: true })).toHaveCount(1)
  const query = multiple.getByRole('combobox')
  await query.scrollIntoViewIfNeeded()
  await query.fill('Eng')
  await multiple.getByRole('option', { name: 'Engineering', exact: true }).click()
  expect(await multiple.evaluate(form => new FormData(form).getAll('topic')))
    .toEqual(['research', 'engineering'])
  await query.press('Escape')

  const actions = page.locator('#input-actions-example')
  await actions.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(actions.getByLabel('Example password', { exact: true })).toHaveAttribute('type', 'text')

  const dates = page.locator('#date-range-example')
  await dates.getByRole('button', { name: 'Last 7 days', exact: true }).click()
  await expect(dates.locator('[name="start"]')).toHaveValue(/\d{4}-\d{2}-\d{2}/)

  const upload = page.locator('#file-upload-example')
  await upload.getByLabel('PDF attachments').setInputFiles({
    name: 'example.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7'),
  })
  await expect(upload.getByText('Ready to upload', { exact: true })).toBeVisible()
  await upload.getByRole('button', { name: 'Clear file queue', exact: true }).click()
  await expect(upload.getByRole('status')).toHaveText('File queue cleared.')
  expect(errors).toEqual([])
})

for (const delivery of ['npm', 'cdn']) {
  for (const order of ['application-first', 'sds-first', 'before-render']) {
    test(`${delivery} recipes work with ${order} initialization using shipped assets`, async ({ page }) => {
      test.setTimeout(30_000)
      const prefix = `/consumer/${delivery}/`
      const base = delivery === 'npm' ? packed : resolve('dist')
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route(`**${prefix}**`, async route => {
        const pathname = new URL(route.request().url()).pathname.slice(prefix.length)
        const filename = resolve(base, pathname)
        if (!filename.startsWith(`${base}${sep}`)) throw new Error(`Invalid fixture path: ${pathname}`)
        const extension = filename.split('.').at(-1)
        const contentType = { html: 'text/html', css: 'text/css', js: 'text/javascript' }[extension]
        if (!contentType) throw new Error(`Unsupported fixture asset: ${pathname}`)
        const source = await readFile(filename, 'utf8')
        const body = extension === 'html'
          ? source.replace(/<script type="module" src="[^"]+"><\/script>/g, '')
          : source
        await route.fulfill({ contentType, body })
      })
      for (const name of recipes) {
        await page.goto(`${prefix}docs/examples/${name}.html`)
        await page.emulateMedia({ reducedMotion: 'reduce' })
        const application = `${prefix}docs/examples/${name}.js`
        const behavior = `${prefix}${delivery === 'npm' ? 'dist/package/auto.js' : 'auto.js'}`
        if (order === 'before-render') {
          const missingFormError = await page.evaluate(async application => {
            const form = document.querySelector('form')
            const parent = form.parentElement
            form.remove()
            const [setup] = Object.values(await import(application))
            let missingFormError
            try {
              setup()
            } catch (error) {
              missingFormError = error.message
            }
            parent.append(form)
            setup()
            return missingFormError
          }, application)
          expect(missingFormError, `${delivery} ${name} explicit setup requires markup`)
            .toMatch(/^Missing .+ example form\.$/)
          await page.addScriptTag({ type: 'module', url: behavior })
        } else {
          for (const url of order === 'application-first' ? [application, behavior] : [behavior, application]) {
            await page.addScriptTag({ type: 'module', url })
          }
        }
        await expect(page.locator('body')).toHaveCSS('margin-top', '0px')
        const form = page.locator('form').first()
        if (name === 'selection') {
          const toggle = form.getByRole('button', { name: 'Show archived', exact: true })
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-pressed', 'true')
          await page.keyboard.press('Tab')
          await toggle.focus()
          await expect(toggle).toBeFocused()
          await expect(toggle).toHaveCSS('box-shadow', /0px 0px 0px 2px/)
        } else if (name === 'table-selection') {
          await form.getByRole('button', { name: 'Task', exact: true }).click()
          await expect(form.locator('tbody th').first()).toHaveText('SDS-125')
        } else if (name === 'multiple-selection') {
          const query = form.getByRole('combobox')
          await query.scrollIntoViewIfNeeded()
          await query.fill('Eng')
          await form.getByRole('option', { name: 'Engineering', exact: true }).click()
          await query.press('ArrowDown')
          await query.press('Enter')
          await expect(form.getByRole('button', { name: 'Remove Accessibility' })).toBeVisible()
        } else if (name === 'input-actions') {
          await form.getByRole('button', { name: 'Show password' }).click()
          await expect(form.getByLabel('Example password', { exact: true })).toHaveAttribute('type', 'text')
        } else if (name === 'date-range') {
          await form.getByRole('button', { name: 'Last 7 days' }).click()
          await expect(form.locator('[name="start"]')).toHaveValue(/\d{4}-\d{2}-\d{2}/)
        } else {
          await form.locator('input[type="file"]').setInputFiles({
            name: 'example.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7'),
          })
          await expect(form.getByText('Ready to upload', { exact: true })).toBeVisible()
          await form.getByRole('button', { name: 'Clear file queue' }).click()
          await expect(form.getByRole('status')).toHaveText('File queue cleared.')
        }
        const repeatedSetup = await page.evaluate(async application => {
          const setup = Object.values(await import(application))
          if (setup.length !== 1 || typeof setup[0] !== 'function') {
            throw new Error('Expected one exported recipe setup function.')
          }
          const form = document.querySelector('form')
          const markup = form.innerHTML
          const nodes = [...form.querySelectorAll('*')]
          const controls = [...form.elements].map(control => [control, control.value, control.checked])
          setup[0]()
          setup[0]()
          return {
            markup: form.innerHTML === markup,
            nodes: [...form.querySelectorAll('*')].every((node, index) => node === nodes[index]),
            values: controls.every(([control, value, checked]) => control.value === value && control.checked === checked),
          }
        }, application)
        expect(repeatedSetup, `${delivery} ${order} ${name} repeated setup`)
          .toEqual({ markup: true, nodes: true, values: true })
        expect(errors, `${delivery} ${order} ${name}`).toEqual([])
      }
    })
  }
}
