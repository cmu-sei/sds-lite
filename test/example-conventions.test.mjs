import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

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

test('every example Cancel button uses the ghost variant', async () => {
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
        /data-sds-variant="ghost"/,
        `${file} contains a non-ghost Cancel button`,
      )
    }
  }
  assert.ok(exampleCount > 0, 'documentation must contain a Cancel example')
})
