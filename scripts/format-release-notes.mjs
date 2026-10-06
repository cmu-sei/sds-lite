import { pathToFileURL } from 'node:url'

const editorGuideMarker = '<!-- RELEASE NOTE EDITOR GUIDE'

export function formatHotfixReleaseNotes(pullRequest, version, baseTag, repository) {
  return formatReleaseNotes(`<!-- Hotfix source: ${baseTag}; fix PR: #${pullRequest.number} -->

## Changes

### Fixes
* ${pullRequest.title} by @${pullRequest.user.login} in https://github.com/${repository}/pull/${pullRequest.number}

This hotfix updates ${baseTag} without including newer beta changes.

**Full Changelog**: https://github.com/${repository}/compare/${baseTag}...v${version}`, version)
}

export function formatReleaseNotes(generatedNotes, version) {
  if (!version) throw new Error('Release version is required')

  const source = generatedNotes.trim()
  if (source.includes(editorGuideMarker)) return `${source}\n`

  const changes = source
    .replace(
      /^<!-- Release notes generated using configuration in .* -->\s*/,
      '',
    )
    .replace(/^## What's Changed$/m, '## Changes')
  const upgradeNotes = /^### Breaking changes$/im.test(changes)
    ? 'This release contains breaking changes. Review that section before upgrading.'
    : 'No upgrade steps are listed for this release.'

  return `<!-- RELEASE NOTE EDITOR GUIDE
Most releases need no edits. Read the notes and leave them unchanged when they are clear and accurate.

YOU MAY EDIT:
- The Summary paragraph, using plain language for nontechnical readers.
- Generated bullet wording when a pull request title is unclear.
- Upgrade notes when users must take action.

DO NOT EDIT:
- The release title, tag, or prerelease setting.
- Pull request links or numbers, contributor names, or the Full Changelog link.
- Section headings.
- Hidden hotfix source markers.

Save this as a draft. Do not publish it manually.
-->

## Summary

SDS Lite ${version} includes the user-facing changes listed below.

## Upgrade notes

${upgradeNotes}

${changes}
`
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const generatedNotes = Buffer.concat(chunks).toString('utf8')
  if (process.argv[2] === '--hotfix') {
    process.stdout.write(formatHotfixReleaseNotes(JSON.parse(generatedNotes),
      process.env.VERSION, process.env.NOTES_START_TAG, process.env.GITHUB_REPOSITORY))
  } else {
    process.stdout.write(formatReleaseNotes(generatedNotes, process.env.VERSION))
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(`::error::${error.message}`)
    process.exitCode = 1
  })
}