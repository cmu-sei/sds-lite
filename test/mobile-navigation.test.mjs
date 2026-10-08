import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const applicationCss = await readFile(
  'src/css/components/application.css',
  'utf8',
)
const buttonCss = await readFile('src/css/components/button.css', 'utf8')
const catalogHtml = await readFile('index.html', 'utf8')
const sidebarCss = await readFile('src/css/components/sidebar.css', 'utf8')

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return markdownFiles(entryPath)
      return entry.name.endsWith('.md') ? [entryPath] : []
    }),
  )
  return files.flat()
}

const documentation = (
  await Promise.all(
    (await markdownFiles('docs')).map((file) => readFile(file, 'utf8')),
  )
).join('\n')

test('mobile menu triggers appear before the application brand', () => {
  assert.match(
    applicationCss,
    /\.sds-app-mobile-header\s*>\s*\[popovertarget\][^}]*\{[^}]*order:\s*-1/s,
  )
  assert.match(
    applicationCss,
    /:where\(\.sds-app-mobile-header\)[^}]*\{[^}]*justify-content:\s*flex-start/s,
  )
})

test('mobile menu controls rely on icon-button defaults', () => {
  for (const source of [catalogHtml, documentation]) {
    const controls = source.match(
      /<button\b(?=[^>]*\bdata-sds-shape="icon")(?=[^>]*\baria-label="(?:Open|Close) navigation")[^>]*>/gs,
    )

    assert.equal(controls?.length, 2)
    for (const control of controls) {
      assert.doesNotMatch(control, /data-sds-(?:tone|variant)=/)
    }
  }
})

test('mobile menu icons use centered, font-independent geometry', () => {
  const documentedMarkup = `${catalogHtml}\n${documentation}`
  const menuIcons = documentedMarkup.match(
    /<button\b(?=[^>]*\bpopovertarget=)[^>]*>\s*<svg\b(?=[^>]*\baria-hidden="true")(?=[^>]*\bviewBox="0 0 24 24")/gs,
  )

  assert.doesNotMatch(documentedMarkup, /&#9776;|☰/)
  assert.equal(menuIcons?.length, 5)
  assert.match(
    buttonCss,
    /\[data-sds-shape="icon"\]\s*>\s*svg[^}]*\{[^}]*inline-size:\s*1em[^}]*block-size:\s*1em/s,
  )
})

test('mobile sidebars animate on user entry and exit', () => {
  assert.match(sidebarCss, /--sds-sidebar-drawer-offset:\s*-100%/)
  assert.match(
    sidebarCss,
    /\.sds-sidebar\[popover\][^}]*\{[^}]*transform:\s*translateX\(var\(--sds-sidebar-drawer-offset\)\)[^}]*transition:/s,
  )
  assert.match(
    sidebarCss,
    /\.sds-sidebar\[popover\]:popover-open[^}]*\{[^}]*transform:\s*translateX\(0\)/s,
  )
  assert.match(sidebarCss, /display\s+var\(--sds-duration-normal\)\s+allow-discrete/)
  assert.match(sidebarCss, /overlay\s+var\(--sds-duration-normal\)\s+allow-discrete/)
  assert.match(
    sidebarCss,
    /\.sds-sidebar\[popover\]:not\(:popover-open\)[^}]*\{[^}]*transition:\s*none/s,
  )
  assert.match(
    sidebarCss,
    /\.sds-sidebar\[popover\]\[sds-closing\]:not\(:popover-open\)[^}]*\{[^}]*transition:/s,
  )
  assert.match(
    sidebarCss,
    /@starting-style[^}]*\.sds-sidebar\[popover\]:popover-open[^}]*\{[^}]*transform:\s*translateX\(var\(--sds-sidebar-drawer-offset\)\)/s,
  )
})
