import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pathToFileURL } from 'node:url'

import {
  parseReleaseVersion,
  validatePreparedVersion,
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

export function parsePrepareReleaseArguments(args) {
  if (args.length === 0) return {}
  if (args.length !== 3 || args[0] !== '--version' || args[2] !== '--yes') {
    throw new Error('Usage: npm run release:prepare -- --version <version> --yes')
  }
  return { version: args[1], yes: true }
}

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

export async function prepareRelease({ version: requestedVersion, yes = false } = {}) {
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
  const prompt = yes ? undefined : createInterface({ input, output })
  try {
    if (!yes) {
      const ready = await prompt.question(
        'Have all intended changes been merged and is this branch based on the latest main? [y/N] ',
      )
      if (!confirmed(ready)) throw new Error('Release preparation cancelled')
    }

    const version = requestedVersion
      ? requestedVersion.trim()
      : (
          await prompt.question(
            `Enter the exact version to prepare (current ${packageJson.version}): `,
          )
        ).trim()
    const parsed = parseReleaseVersion(version)
    const tags = run('git', ['tag', '--list', 'v*'], { capture: true })
      .split('\n')
      .filter(Boolean)
    validatePreparedVersion(packageJson.version, version, tags)

    const releaseType = parsed.prerelease ? 'beta' : 'stable'
    if (!yes) {
      const proceed = await prompt.question(
        `Prepare ${releaseType} release v${version}, update documentation, build, test, and dry-run the package? [y/N] `,
      )
      if (!confirmed(proceed)) throw new Error('Release preparation cancelled')
    }

    const writeDocumentation = await prepareDocumentation(
      packageJson.version,
      version,
    )
    if (version !== packageJson.version) {
      run(npm, [
        'version',
        version,
        '--no-git-tag-version',
        '--ignore-scripts',
      ])
    }
    await writeDocumentation()
    await writeFile(
      '.github/release-state.json',
      `${JSON.stringify({ version }, undefined, 2)}\n`,
    )
    run(npm, ['test'])
    run(npm, ['run', 'check:package'])
    run('git', ['diff', '--check'])

    if (yes) {
      console.log(`Release v${version} is prepared for the workflow.`)
    } else {
      console.log(`
Release v${version} is prepared locally.

Review the changes with git diff and git status. The supported publication
path is the Prepare Release workflow, which creates the branch, draft release,
pull request, and CI run needed for protected publication.

This script did not stage, commit, tag, push, or publish anything.`)
    }
  } finally {
    prompt?.close()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let options
  try {
    options = parsePrepareReleaseArguments(process.argv.slice(2))
  } catch (error) {
    console.error(`Release preparation stopped: ${error.message}`)
    process.exitCode = 1
  }
  if (options) prepareRelease(options).catch((error) => {
    console.error(`Release preparation stopped: ${error.message}`)
    console.error(
      'No changes were rolled back; inspect git status and git diff.',
    )
    process.exitCode = 1
  })
}
