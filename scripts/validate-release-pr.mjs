import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { compareReleaseVersions, parseReleaseVersion } from './release-version.mjs'
import { isReleaseCancelled, verifyRecoveryPullRequest } from './cancel-release.mjs'
import { verifyReleaseCommitMetadata } from './abandon-release.mjs'

export function resolveBrowserImage(lock) {
  const version = lock.packages?.['node_modules/playwright']?.version
  const parsed = parseReleaseVersion(version)
  if (parsed.prerelease || lock.packages?.['node_modules/@playwright/test']?.version !== version ||
      lock.packages?.['node_modules/playwright-core']?.version !== version) {
    throw new Error('Browser tests require matching stable Playwright package versions')
  }
  return `mcr.microsoft.com/playwright:v${version}-noble`
}

export function assertCompletedReleases(repository, execute = spawnSync) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) {
    throw new Error('Repository is required to verify pending releases')
  }
  const command = (program, args, paginated = false) => {
    const result = execute(program, args, { encoding: 'utf8' })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Could not verify release completion')
    if (paginated) {
      if (!result.stdout.trim()) throw new Error('Could not verify release history')
      return result.stdout.trim().split('\n').flatMap((page) => {
        const pullRequests = JSON.parse(page)
        if (!Array.isArray(pullRequests)) throw new Error('Could not verify release history')
        return pullRequests
      })
    }
    return JSON.parse(result.stdout)
  }
  const pullRequests = command('gh', ['api', '--paginate', '--jq',
    'map({number, merged_at, merge_commit_sha, head: {ref: .head.ref, repo: {full_name: .head.repo.full_name}}, base: {ref: .base.ref}, labels: (.labels | map({name}))}) | tojson',
    `repos/${repository}/pulls?state=closed&per_page=100`], true)
  const releases = new Map()
  for (const pullRequest of pullRequests) {
    if (!pullRequest.merged_at || pullRequest.head?.repo?.full_name !== repository ||
      !pullRequest.head.ref.startsWith('release/v')) continue
    const previous = releases.get(pullRequest.head.ref)
    if (!previous || pullRequest.merged_at > previous.merged_at ||
        pullRequest.merged_at === previous.merged_at && pullRequest.number > previous.number) {
      releases.set(pullRequest.head.ref, pullRequest)
    }
  }
  for (const pullRequest of releases.values()) {
    const version = pullRequest.head.ref.slice('release/v'.length)
    const parsed = parseReleaseVersion(version)
    const tag = `v${version}`
    validateReleasePullRequest({ branch: pullRequest.head.ref, baseBranch: pullRequest.base?.ref,
      packageVersion: version, stateVersion: version })
    const run = (program, args) => execute(program, args, { encoding: 'utf8' })
    verifyReleaseCommitMetadata(repository, pullRequest.merge_commit_sha, version, run)
    if (isReleaseCancelled(repository, pullRequest.merge_commit_sha, run) ||
        pullRequest.labels?.some((label) => label.name === 'release-cancelled')) {
      const recovered = pullRequests.filter((candidate) => candidate.merged_at &&
        candidate.head?.repo?.full_name === repository &&
        candidate.head.ref === `recovery/cancel-${tag}` && candidate.base?.ref === pullRequest.base?.ref)
      if (recovered.length !== 1) throw new Error(`${tag} cancellation is incomplete. Merge its recovery PR first`)
      const recovery = command('gh', ['api', `repos/${repository}/pulls/${recovered[0].number}`])
      verifyRecoveryPullRequest(recovery, { repository, releaseCommit: pullRequest.merge_commit_sha,
        branch: `recovery/cancel-${tag}`, baseBranch: pullRequest.base.ref,
        mergedAfter: pullRequest.merged_at, requireMerged: true },
      (program, args) => execute(program, args, { encoding: 'utf8' }))
      continue
    }
    const release = command('gh', ['api', `repos/${repository}/releases/tags/${tag}`])
    if (release.draft !== false || release.prerelease !== parsed.prerelease) {
      throw new Error(`${tag} publication is incomplete. Finish publication or cancellation first`)
    }
    let target = command('gh', ['api', `repos/${repository}/git/ref/tags/${tag}`]).object
    for (let depth = 0; target?.type === 'tag' && depth < 10; depth += 1) {
      target = command('gh', ['api', `repos/${repository}/git/tags/${target.sha}`]).object
    }
    if (target?.type !== 'commit' || target.sha !== pullRequest.merge_commit_sha) {
      throw new Error(`${tag} does not point to its reviewed release commit`)
    }
    const metadata = command(process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['view', `@cmu-sei/sds-lite@${version}`, '--json', '--registry=https://npm.pkg.github.com'])
    const distTag = parsed.prerelease ? 'beta' : 'latest'
    const current = metadata['dist-tags']?.[distTag]
    if (metadata.name !== '@cmu-sei/sds-lite' || metadata.version !== version ||
        !/^[a-f0-9]{40}$/i.test(metadata.dist?.shasum ?? '') || !current ||
        parseReleaseVersion(current).prerelease !== parsed.prerelease ||
        compareReleaseVersions(current, version) < 0) {
      throw new Error(`${tag} package publication is incomplete. Finish publication first`)
    }
  }
}

export function validateReleasePreparation({ branch, baseBranch, openPullRequests, previousPullRequests }) {
  const version = branch?.replace(/^release\/v/, '')
  validateReleasePullRequest({ branch, baseBranch, packageVersion: version, stateVersion: version })
  if (openPullRequests.some((pr) => !pr.isCrossRepository && (pr.headRefName !== branch || pr.baseRefName !== baseBranch))) {
    throw new Error('A release PR is open with a different version or target. Finish or discard it first')
  }
  if (previousPullRequests.some((pr) => !pr.isCrossRepository && pr.state === 'MERGED')) {
    throw new Error('This version already has a merged release PR. Finish publication or choose a newer version')
  }
}

export function validateReleasePullRequest({
  branch,
  packageVersion,
  stateVersion,
  baseBranch = 'main',
}) {
  const version = parseReleaseVersion(packageVersion)
  if (baseBranch !== 'main' && (baseBranch !== `hotfix/v${packageVersion}` || version.prerelease)) {
    throw new Error('Release base must be main or the matching stable hotfix branch')
  }
  if (branch !== `release/v${packageVersion}`) {
    throw new Error(
      `Release branch ${branch} must be release/v${packageVersion}`,
    )
  }
  if (stateVersion !== packageVersion) {
    throw new Error(
      `Release state ${stateVersion} must match package version ${packageVersion}`,
    )
  }
}

async function main() {
  if (process.argv[2] === 'browser-image' && process.argv.length === 3) {
    const image = resolveBrowserImage(JSON.parse(await readFile('package-lock.json', 'utf8')))
    if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required')
    await appendFile(process.env.GITHUB_OUTPUT, `browser-image=${image}\n`)
    return
  }
  if (process.argv[2] === 'assert-complete' && process.argv.length === 3) {
    assertCompletedReleases(process.env.GITHUB_REPOSITORY)
    return
  }
  if (!process.env.RELEASE_BRANCH) {
    throw new Error('RELEASE_BRANCH is required')
  }
  if (process.argv[2] === 'prepare') {
    const list = (args) => {
      const result = spawnSync('gh', ['pr', 'list', '--limit', '1000', ...args], { encoding: 'utf8' })
      if (result.error) throw result.error
      if (result.status !== 0) throw new Error(result.stderr || 'Could not verify release PR state')
      return JSON.parse(result.stdout)
    }
    validateReleasePreparation({
      branch: process.env.RELEASE_BRANCH,
      baseBranch: process.env.RELEASE_BASE,
      openPullRequests: list(['--state', 'open', '--json', 'headRefName,baseRefName,isCrossRepository'])
        .filter((pr) => !pr.isCrossRepository && pr.headRefName.startsWith('release/v')),
      previousPullRequests: list(['--state', 'all', '--head', process.env.RELEASE_BRANCH, '--json', 'state,isCrossRepository']),
    })
    return
  }
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseState = JSON.parse(
    await readFile('.github/release-state.json', 'utf8'),
  )
  validateReleasePullRequest({
    branch: process.env.RELEASE_BRANCH,
    packageVersion: packageJson.version,
    stateVersion: releaseState.version,
    baseBranch: process.env.RELEASE_BASE,
  })
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