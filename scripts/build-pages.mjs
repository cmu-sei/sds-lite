import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function documentationUrl(href, repository, tag) {
  if (!/^[\w][\w.-]*\/[\w][\w.-]*$/.test(repository)) {
    throw new Error('Pages requires an owner/repository name')
  }
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('Pages requires a stable release tag')
  }
  const source = new URL(href, 'https://playground.invalid/')
  if (source.origin !== 'https://playground.invalid' || !source.pathname.startsWith('/docs/')) {
    throw new Error('Expected a local documentation link')
  }
  return `https://github.com/${repository}/blob/${tag}${source.pathname}${source.search}${source.hash}`
}

export async function buildPages() {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const repository = process.env.GITHUB_REPOSITORY ?? 'cmu-sei/sds-lite'
  const tag = process.env.PAGES_TAG ?? `v${packageJson.version}`
  documentationUrl('./docs/README.md', repository, tag)
  if (tag !== `v${packageJson.version}`) {
    throw new Error('Pages tag must match the checked-out package version')
  }
  const { build } = await import('vite')
  await build({
    configFile: 'vite.config.ts',
    base: './',
    build: { outDir: 'pages-dist', emptyOutDir: true },
  })
  const { Window } = await import('happy-dom')
  const window = new Window()
  try {
    const html = await readFile('pages-dist/index.html', 'utf8')
    const document = new window.DOMParser().parseFromString(html, 'text/html')
    for (const anchor of document.querySelectorAll('a[href^="./docs/"]')) {
      anchor.setAttribute('href', documentationUrl(anchor.getAttribute('href'), repository, tag))
    }
    await writeFile('pages-dist/index.html', `<!DOCTYPE html>\n${document.documentElement.outerHTML}\n`)
    await writeFile('pages-dist/release.json', `${JSON.stringify({ tag, version: packageJson.version }, null, 2)}\n`)
  } finally {
    await window.happyDOM.close()
  }
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  await buildPages()
}