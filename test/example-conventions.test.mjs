import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { Window } from 'happy-dom'

test('authored copy snippets use public classes and self-contained native relationships', async () => {
  const window = new Window()
  try {
    const document = window.document
    document.write(await readFile('index.html', 'utf8'))
    const manifest = JSON.parse(await readFile('interface-manifest.json', 'utf8'))
    const classes = new Set(manifest.recipes.flatMap(recipe => recipe.classes))
    let snippets = 0
    for (const button of document.querySelectorAll('[data-copy-target]')) {
      const target = document.getElementById(button.dataset.copyTarget)
      assert.ok(target, `${button.dataset.copyTarget} is missing`)
      if (!target.textContent.trim().startsWith('<')) continue
      snippets += 1
      const template = document.createElement('template')
      template.innerHTML = target.textContent
      const fragment = template.content
      for (const element of fragment.querySelectorAll('[class]')) {
        for (const className of element.classList) {
          if (className.startsWith('sds-')) assert.ok(classes.has(className), `${target.id} uses unknown ${className}`)
        }
      }
      for (const element of fragment.querySelectorAll('*')) {
        for (const attribute of ['for', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'popovertarget']) {
          for (const id of element.getAttribute(attribute)?.split(/\s+/) ?? []) {
            assert.ok(fragment.getElementById(id), `${target.id} has unresolved ${attribute}=${id}`)
          }
        }
      }
      for (const input of fragment.querySelectorAll('input:not([type="hidden"]), textarea, select')) {
        assert.ok([...input.classList].some(className => ['sds-input', 'sds-checkbox', 'sds-radio', 'sds-range', 'sds-file-input', 'sds-select'].includes(className)), `${target.id} has an unstyled ${input.tagName}`)
      }
      if (button.dataset.copySource) {
        const source = document.getElementById(button.dataset.copySource)
        assert.ok(source, `${target.id} has no rendered source`)
        const normalize = element => ({
          tag: element.tagName,
          attributes: [...element.attributes].map(attribute => [attribute.name, attribute.value]).sort(),
          children: [...element.childNodes].filter(node => node.nodeType === 1 || node.textContent.trim()).map(node => node.nodeType === 1 ? normalize(node) : node.textContent.trim()),
        })
        assert.deepEqual(normalize(fragment.firstElementChild), normalize(source), `${target.id} differs from its displayed source`)
      }
    }
    assert.equal(snippets, 12)
  } finally {
    await window.happyDOM.close()
  }
})

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

test('every example Cancel button uses the text variant', async () => {
  let exampleCount = 0
  for (const file of ['index.html', ...(await markdownFiles('docs'))]) {
    const source = await readFile(file, 'utf8')
    const cancelButtons = source.match(
      /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?\bCancel\b(?:(?!<\/button>)[\s\S])*?<\/button>/g,
    )

    for (const button of cancelButtons ?? []) {
      exampleCount += 1
      assert.match(
        button,
        /data-sds-variant="text"/,
        `${file} contains a non-text Cancel button`,
      )
    }
  }
  assert.ok(exampleCount > 0, 'documentation must contain a Cancel example')
})
