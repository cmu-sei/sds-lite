import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export function validateReleasePullRequest({
  branch,
  packageVersion,
  stateVersion,
}) {
  parseReleaseVersion(packageVersion)
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
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseState = JSON.parse(
    await readFile('.github/release-state.json', 'utf8'),
  )
  validateReleasePullRequest({
    branch: process.env.RELEASE_BRANCH,
    packageVersion: packageJson.version,
    stateVersion: releaseState.version,
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