import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export function resolveAbandonedRelease(version, confirmation) {
  const parsed = parseReleaseVersion(version?.trim() ?? '')
  const tag = `v${parsed.version}`
  const expectedConfirmation = `abandon ${tag}`
  if (confirmation?.trim() !== expectedConfirmation) {
    throw new Error(`Confirmation must be exactly: ${expectedConfirmation}`)
  }

  return {
    version: parsed.version,
    tag,
    branch: `release/${tag}`,
  }
}

export function selectReleasePullRequestForAbandonment(
  openPullRequests,
  closedPullRequests,
) {
  if (openPullRequests.length > 1) {
    throw new Error(
      `Expected at most one open release pull request; found ${openPullRequests.length}`,
    )
  }
  if (openPullRequests.length === 1) {
    const pullRequest = openPullRequests[0]
    if (pullRequest.state !== 'OPEN' || pullRequest.mergedAt) {
      throw new Error('The open release pull request has inconsistent state')
    }
    return { ...pullRequest, wasOpen: true }
  }

  const pullRequest = closedPullRequests
    .filter(
      (candidate) =>
        candidate.state === 'CLOSED' && candidate.mergedAt === null,
    )
    .sort((left, right) => right.number - left.number)[0]
  if (!pullRequest) {
    throw new Error('No open or closed-unmerged release pull request was found')
  }
  return { ...pullRequest, wasOpen: false }
}

async function main() {
  if (process.argv[2] === 'select-pull-request') {
    const [openFilename, closedFilename] = process.argv.slice(3)
    if (!openFilename || !closedFilename || process.argv.length !== 5) {
      throw new Error(
        'Usage: abandon-release.mjs select-pull-request <open.json> <closed.json>',
      )
    }
    const [openPullRequests, closedPullRequests] = await Promise.all(
      [openFilename, closedFilename].map(async (filename) =>
        JSON.parse(await readFile(filename, 'utf8')),
      ),
    )
    console.log(
      JSON.stringify(
        selectReleasePullRequestForAbandonment(
          openPullRequests,
          closedPullRequests,
        ),
      ),
    )
    return
  }
  if (process.argv.length !== 2) {
    throw new Error('Usage: abandon-release.mjs')
  }
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required')
  const release = resolveAbandonedRelease(
    process.env.RELEASE_VERSION,
    process.env.RELEASE_CONFIRMATION,
  )
  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `version=${release.version}`,
      `tag=${release.tag}`,
      `branch=${release.branch}`,
      '',
    ].join('\n'),
  )
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