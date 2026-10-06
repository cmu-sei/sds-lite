import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export function validateReleasePreparation({ branch, baseBranch, openPullRequests, previousPullRequests }) {
  const version = branch?.replace(/^release\/v/, '')
  validateReleasePullRequest({ branch, baseBranch, packageVersion: version, stateVersion: version })
  if (openPullRequests.some((pr) => pr.headRefName !== branch || pr.baseRefName !== baseBranch)) {
    throw new Error('A release PR is open with a different version or target. Finish or discard it first')
  }
  if (previousPullRequests.some((pr) => pr.state === 'MERGED')) {
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
      openPullRequests: list(['--state', 'open', '--label', 'release', '--json', 'headRefName,baseRefName']),
      previousPullRequests: list(['--state', 'all', '--head', process.env.RELEASE_BRANCH, '--json', 'state']),
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