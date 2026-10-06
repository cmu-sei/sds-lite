import { pathToFileURL } from 'node:url'

const usage = 'Usage: release-url.mjs draft-editor <release-url>'

export function draftReleaseEditorUrl(releaseUrl) {
  const url = new URL(releaseUrl)
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    !/^\/[^/]+\/[^/]+\/releases\/tag\/untagged-[^/]+$/.test(url.pathname)
  ) {
    throw new Error('Expected a GitHub draft release URL')
  }

  url.pathname = url.pathname.replace('/releases/tag/', '/releases/edit/')
  return url.href
}

function main() {
  const [command, releaseUrl] = process.argv.slice(2)
  if (command !== 'draft-editor' || !releaseUrl || process.argv.length !== 4) {
    throw new Error(usage)
  }
  console.log(draftReleaseEditorUrl(releaseUrl))
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main()
  } catch (error) {
    console.error(`::error::${error.message}`)
    process.exitCode = 1
  }
}