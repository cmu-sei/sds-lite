import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'

export async function generateExamples(directory = 'docs/examples', check = false) {
  const window = new Window({
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true,
      disableJavaScriptEvaluation: true,
    },
  })
  try {
    window.document.body.innerHTML = await readFile('index.html', 'utf8')
    const distribution = directory.startsWith('dist/')
    const stylesheet = distribution ? '../../sds.css' : '../../dist/sds.css'
    const behavior = distribution ? '../../auto.js' : '../../dist/package/auto.js'
    const examples = window.document.querySelectorAll('article[data-recipe-script]')
    if (examples.length !== 6) throw new Error('Expected all six application recipes.')
    for (const example of examples) {
      const name = example.dataset.recipeScript
      await readFile(`docs/examples/${name}.js`, 'utf8')
      const heading = example.querySelector('h3')
      const title = heading.textContent
      const pageHeading = window.document.createElement('h1')
      for (const attribute of heading.attributes) {
        pageHeading.setAttribute(attribute.name, attribute.value)
      }
      pageHeading.append(...heading.childNodes)
      heading.replaceWith(pageHeading)
      for (const element of [example, ...example.querySelectorAll('*')]) {
        element.removeAttribute('data-recipe-script')
        element.removeAttribute('data-search-terms')
      }
      const markup = example.outerHTML.replace(/\s(checked|disabled|hidden|multiple|readonly|required|selected)=""/g, ' $1')
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${stylesheet}">
  <script type="module" src="${behavior}"></script>
</head>
<body class="sds-document" data-sds-root>
  <main class="sds-page">${markup}</main>
  <script type="module" src="./${name}.js"></script>
</body>
</html>
`
      const filename = `${directory}/${name}.html`
      if (check) {
        if (await readFile(filename, 'utf8') !== html) throw new Error(`Stale recipe: ${filename}`)
      } else {
        await writeFile(filename, html)
      }
    }
  } finally {
    await window.happyDOM.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateExamples('docs/examples', process.argv.includes('--check'))
}
