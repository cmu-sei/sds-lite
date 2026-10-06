import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import {
  assertVersionAdvances,
  compareReleaseVersions,
  parseReleaseVersion,
  validateRelease,
} from './release-version.mjs'

export async function validateReleaseEnvironment(env = process.env) {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  )
  if (!['true', 'false'].includes(env.IS_PRERELEASE)) {
    throw new Error('IS_PRERELEASE must be either true or false')
  }
  if (!env.RELEASE_TAG) {
    throw new Error('RELEASE_TAG is required')
  }

  return validateRelease({
    packageName: packageJson.name,
    version: packageJson.version,
    releaseTag: env.RELEASE_TAG,
    isPrerelease: env.IS_PRERELEASE === 'true',
  })
}

export function validateReleaseOrder(version, releaseTag, tags) {
  const next = parseReleaseVersion(version)
  const previousVersions = tags
    .filter((tag) => tag !== releaseTag && tag.startsWith('v'))
    .flatMap((tag) => {
      try {
        return [parseReleaseVersion(tag.slice(1)).version]
      } catch {
        return []
      }
    })
    .filter((previous) => next.prerelease || !parseReleaseVersion(previous).prerelease)
    .sort(compareReleaseVersions)
  const latestVersion = previousVersions.at(-1)
  if (latestVersion) assertVersionAdvances(latestVersion, version)
}

function releaseTags() {
  const result = spawnSync('git', ['tag', '--list', 'v*'], {
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`Could not read release tags: ${result.stderr.trim()}`)
  }
  return result.stdout.split('\n').filter(Boolean)
}

async function main() {
  const release = await validateReleaseEnvironment()
  validateReleaseOrder(
    release.version,
    process.env.RELEASE_TAG,
    releaseTags(),
  )
  if (!process.env.GITHUB_OUTPUT) {
    throw new Error('GITHUB_OUTPUT is required')
  }

  await appendFile(
    process.env.GITHUB_OUTPUT,
    [
      `package-name=${release.packageName}`,
      `version=${release.version}`,
      `dist-tag=${release.distTag}`,
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
