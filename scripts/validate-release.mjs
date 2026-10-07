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

function checkedCommand(command, args, execute) {
  const result = execute(command, args, { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`)
  return result.stdout.trim()
}

export function verifyGitHubReleaseTarget({ repository, tag, commit, isDraft }, execute = spawnSync) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
      !/^[a-f0-9]{40}$/.test(commit ?? '') || typeof isDraft !== 'boolean' || !tag?.startsWith('v')) {
    throw new Error('Repository, release tag, reviewed commit, and draft state are required')
  }
  parseReleaseVersion(tag.slice(1))
  const result = execute('gh', ['api', `repos/${repository}/git/ref/tags/${tag}`], { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    if (!/HTTP 404/.test(result.stderr ?? '')) throw new Error(result.stderr || result.stdout || 'Could not verify release tag')
    if (!isDraft) throw new Error('Published GitHub release has no release tag')
    return false
  }
  checkedCommand('git', ['fetch', 'origin', `refs/tags/${tag}`], execute)
  const actual = checkedCommand('git', ['rev-parse', 'FETCH_HEAD^{commit}'], execute)
  if (actual !== commit) throw new Error(`${tag} does not point to the reviewed release commit ${commit}`)
  return true
}

export function prepareGitHubReleasePublication(options, execute = spawnSync) {
  const exists = verifyGitHubReleaseTarget(options, execute)
  if (!options.isDraft) throw new Error('Expected an unpublished GitHub draft')
  if (!/^[A-Za-z0-9][A-Za-z0-9/._-]*$/.test(options.defaultBranch ?? '')) {
    throw new Error('Default branch is required')
  }
  checkedCommand('git', ['fetch', 'origin', `refs/heads/${options.defaultBranch}`], execute)
  const diff = execute('git', ['diff', '--quiet', 'FETCH_HEAD', options.commit, '--', '.github/workflows'], { encoding: 'utf8' })
  if (diff.error) throw diff.error
  if (diff.status === 1) {
    throw new Error(`GITHUB_TOKEN cannot publish a workflow-changing target. An authorized operator must publish the existing draft ${options.tag} with its tag targeting exactly ${options.commit}, preserving its prerelease setting and reviewed notes, then rerun the failed publication job. Do not run npm publish. No tag was created by this attempt.`)
  }
  if (diff.status !== 0) throw new Error(diff.stderr || diff.stdout || 'Could not compare release workflows')
  if (!exists) {
    checkedCommand('gh', ['api', '--method', 'POST', `repos/${options.repository}/git/refs`,
      '-f', `ref=refs/tags/${options.tag}`, '-f', `sha=${options.commit}`], execute)
  }
  verifyGitHubReleaseTarget(options, execute)
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
  const [command, ...args] = process.argv.slice(2)
  if (args.length || (command && !['github-target', 'prepare-github-publication'].includes(command))) {
    throw new Error('Usage: validate-release.mjs [github-target|prepare-github-publication]')
  }
  if (command) {
    if (!['true', 'false'].includes(process.env.RELEASE_IS_DRAFT)) throw new Error('Release draft state is required')
    const options = {
      repository: process.env.GITHUB_REPOSITORY,
      tag: process.env.TAG,
      commit: process.env.EXPECTED_COMMIT,
      isDraft: process.env.RELEASE_IS_DRAFT === 'true',
      defaultBranch: process.env.DEFAULT_BRANCH,
    }
    if (command === 'github-target') verifyGitHubReleaseTarget(options)
    else {
      try {
        prepareGitHubReleasePublication(options)
      } catch (error) {
        if (process.env.GITHUB_STEP_SUMMARY) {
          await appendFile(process.env.GITHUB_STEP_SUMMARY,
            `### GitHub publication stopped\n\n${error.message}\n\nDraft: https://github.com/${options.repository}/releases\n\nReviewed commit: ${options.commit}\n`)
        }
        throw error
      }
    }
    return
  }
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
