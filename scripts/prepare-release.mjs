import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'

import {
  assertVersionAdvances,
  parseReleaseVersion,
} from './release-version.mjs'

const versionedDocumentation = [
  'README.md',
  '.github/RELEASING.md',
  'docs/getting-started.md',
  'docs/installation/cdn.md',
  'docs/reference/imports.md',
  'index.html',
  'interface-manifest.schema.json',
]
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
  if (result.status !== 0) {
    if (capture) process.stderr.write(result.stderr)
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}`,
    )
  }
  return capture ? result.stdout : undefined
}

function confirmed(answer) {
  return answer.trim().toLowerCase() === 'y'
}

async function prepareDocumentation(currentVersion, nextVersion) {
  const updates = []
  let replacements = 0

  for (const filename of versionedDocumentation) {
    const source = await readFile(filename, 'utf8')
    const currentTag = `v${currentVersion}`
    const matches = source.split(currentTag).length - 1
    replacements += matches
    updates.push({
      filename,
      source: source.replaceAll(currentTag, `v${nextVersion}`),
    })
  }
  if (replacements === 0) {
    throw new Error(
      `No documentation references to v${currentVersion} were found`,
    )
  }

  return async () => {
    await Promise.all(
      updates.map(({ filename, source }) => writeFile(filename, source)),
    )
  }
}

export async function prepareRelease() {
  const status = run(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    { capture: true },
  )
  if (status.trim()) {
    throw new Error(
      'Release preparation must start from a clean working tree and index',
    )
  }

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const prompt = createInterface({ input, output })
  try {
    const ready = await prompt.question(
      'Have all intended changes been merged and is this branch based on the latest main? [y/N] ',
    )
    if (!confirmed(ready)) throw new Error('Release preparation cancelled')

    const version = (
      await prompt.question(
        `Enter the exact version to prepare (current ${packageJson.version}): `,
      )
    ).trim()
    const parsed = parseReleaseVersion(version)
    assertVersionAdvances(packageJson.version, version)

    const releaseType = parsed.prerelease ? 'beta' : 'stable'
    const proceed = await prompt.question(
      `Prepare ${releaseType} release v${version}, update documentation, build, test, and dry-run the package? [y/N] `,
    )
    if (!confirmed(proceed)) throw new Error('Release preparation cancelled')

    const writeDocumentation = await prepareDocumentation(
      packageJson.version,
      version,
    )
    run(npm, [
      'version',
      version,
      '--no-git-tag-version',
      '--ignore-scripts',
    ])
    await writeDocumentation()
    run(npm, ['test'])
    run(npm, ['run', 'check:package'])
    run('git', ['diff', '--check'])

    console.log(`
Release v${version} is prepared locally.

Next steps:
1. Review every change with git diff and git status.
2. Create a focused release PR titled "Release v${version}" and apply the "release" label.
3. After the PR is approved and merged, draft a GitHub release for tag v${version} targeting main.
4. Generate and edit the release notes.
5. ${parsed.prerelease ? 'Mark it as a prerelease.' : 'Leave "Set as a pre-release" unchecked.'}
6. Publish the GitHub release to trigger the protected package workflow.

This script did not stage, commit, tag, push, or publish anything.`)
  } finally {
    prompt.close()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  prepareRelease().catch((error) => {
    console.error(`Release preparation stopped: ${error.message}`)
    console.error(
      'No changes were rolled back; inspect git status and git diff.',
    )
    process.exitCode = 1
  })
}
