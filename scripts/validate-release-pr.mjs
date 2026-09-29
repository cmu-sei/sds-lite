import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export const requiredReleaseChecks = [
  'keyboard',
  'zoom-200',
  'zoom-400',
  'reduced-motion',
  'forced-colors',
  'screen-readers',
  'browser-smoke-tests',
  'release-notes',
]

export function validateReleasePullRequest({
  body,
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
  if (body.includes('<!-- release-evidence:replace -->')) {
    throw new Error('Release PR accessibility evidence has not been recorded')
  }

  for (const check of requiredReleaseChecks) {
    const checked = new RegExp(
      `^- \\[[xX]\\].*<!-- release-check:${check} -->\\s*$`,
      'm',
    )
    if (!checked.test(body)) {
      throw new Error(`Release PR check ${check} must be completed`)
    }
  }
}

async function main() {
  if (!process.env.RELEASE_BRANCH) {
    throw new Error('RELEASE_BRANCH is required')
  }
  if (!process.env.RELEASE_PR_BODY) {
    throw new Error('RELEASE_PR_BODY is required')
  }

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const releaseState = JSON.parse(
    await readFile('.github/release-state.json', 'utf8'),
  )
  validateReleasePullRequest({
    body: process.env.RELEASE_PR_BODY,
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