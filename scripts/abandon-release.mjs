import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export function assertPackageUnpublished(packageName, version, run = spawnSync) {
  parseReleaseVersion(version)
  if (!/^@[a-z0-9-]+\/[a-z0-9._-]+$/.test(packageName)) throw new Error('A scoped package name is required')
  const result = run('npm', ['view', `${packageName}@${version}`, 'version', '--json',
    '--registry=https://npm.pkg.github.com'], { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status === 0) throw new Error('Package version is already published; cleanup is not allowed')
  let error
  try { error = JSON.parse(result.stdout).error } catch {}
  if (error?.code !== 'E404') throw new Error('Could not verify package publication state')
}

export function resolveAbandonedRelease(version, confirmation) {
  const parsed = parseReleaseVersion(version?.trim() ?? '')
  const tag = `v${parsed.version}`
  const expectedConfirmation = parsed.version
  if (confirmation?.trim() !== expectedConfirmation) {
    throw new Error(
      `Confirmation must exactly match version "${expectedConfirmation}"`,
    )
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
  { allowMissing = false } = {},
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
    if (allowMissing && closedPullRequests.length === 0) {
      return { number: null, url: null, wasOpen: false }
    }
    throw new Error('No open or closed-unmerged release pull request was found')
  }
  return { ...pullRequest, wasOpen: false }
}

async function main() {
  if (process.argv[2] === 'assert-unpublished' && process.argv.length === 3) {
    assertPackageUnpublished('@cmu-sei/sds-lite', process.env.RELEASE_VERSION)
    return
  }
  if (process.argv[2] === 'select-pull-request') {
    const [openFilename, closedFilename, option] = process.argv.slice(3)
    if (!openFilename || !closedFilename || process.argv.length > 6 || (option && option !== '--allow-missing')) {
      throw new Error(
        'Usage: abandon-release.mjs select-pull-request <open.json> <closed.json> [--allow-missing]',
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
          { allowMissing: option === '--allow-missing' },
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