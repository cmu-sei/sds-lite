import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const exampleFiles = ['index.html', 'REFERENCE.md']

test('every example Cancel button uses the ghost variant', async () => {
  for (const file of exampleFiles) {
    const source = await readFile(file, 'utf8')
    const cancelButtons = source.match(
      /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?\bCancel\b(?:(?!<\/button>)[\s\S])*?<\/button>/g,
    )

    assert.ok(cancelButtons?.length, `${file} must contain a Cancel example`)

    for (const button of cancelButtons) {
      assert.match(
        button,
        /data-variant="ghost"/,
        `${file} contains a non-ghost Cancel button`,
      )
    }
  }
})
