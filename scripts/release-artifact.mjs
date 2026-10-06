import { spawnSync } from 'node:child_process'
import { appendFile, readdir } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { compareReleaseVersions, parseReleaseVersion } from './release-version.mjs'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const usage =
  'Usage: release-artifact.mjs locate <directory> | publish <tarball> <beta|latest> [--dry-run] | check-tag|verify-tag <package> <version> <beta|latest>'

export function resolveReleaseDistTag(version, distTag, tags) {
  const parsed = parseReleaseVersion(version)
  if (distTag !== (parsed.prerelease ? 'beta' : 'latest')) {
    throw new Error('Release version does not match its distribution tag')
  }
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) {
    throw new Error('Could not verify package distribution tags')
  }
  const current = tags[distTag]
  if (current !== undefined && compareReleaseVersions(current, version) > 0) {
    throw new Error(`Refusing to move ${distTag} backward from ${current} to ${version}`)
  }
  return current !== version
}

function registryCommand(args) {
  const result = spawnSync(npm, [...args, '--registry=https://npm.pkg.github.com'], { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    let error
    try { error = JSON.parse(result.stdout).error } catch {}
    if (args[0] === 'view' && args[2] === 'dist-tags' && error?.code === 'E404') return '{}'
    throw new Error(result.stderr || result.stdout || 'Registry lookup failed')
  }
  return result.stdout
}

export function checkReleaseDistTag(packageName, version, distTag, execute = registryCommand) {
  if (!/^@[a-z0-9-]+\/[a-z0-9._-]+$/.test(packageName)) throw new Error('A scoped package name is required')
  return resolveReleaseDistTag(version, distTag, JSON.parse(execute(['view', packageName, 'dist-tags', '--json'])))
}

export function ensureReleaseDistTag(packageName, version, distTag, execute = registryCommand) {
  if (!/^@[a-z0-9-]+\/[a-z0-9._-]+$/.test(packageName)) throw new Error('A scoped package name is required')
  const readTags = () => JSON.parse(execute(['view', packageName, 'dist-tags', '--json']))
  if (resolveReleaseDistTag(version, distTag, readTags())) {
    execute(['dist-tag', 'add', `${packageName}@${version}`, distTag])
  }
  if (resolveReleaseDistTag(version, distTag, readTags())) {
    throw new Error(`Could not confirm ${packageName}@${distTag} points to ${version}`)
  }
}

export async function locateReleaseArtifact(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const tarballs = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith('.tgz'),
  )

  if (tarballs.length !== 1) {
    throw new Error(
      `Expected exactly one package tarball in ${directory}; found ${tarballs.length}`,
    )
  }

  return resolve(directory, tarballs[0].name)
}

export function releasePublishArguments(tarball, distTag, dryRun = false) {
  if (!isAbsolute(tarball)) {
    throw new Error('Release tarball path must be absolute')
  }
  if (!['beta', 'latest'].includes(distTag)) {
    throw new Error('Release distribution tag must be beta or latest')
  }

  return [
    'publish',
    tarball,
    '--tag',
    distTag,
    '--ignore-scripts',
    ...(dryRun ? ['--dry-run'] : []),
  ]
}

export function publishReleaseArtifact(tarball, distTag, dryRun, {
  packageName = process.env.PACKAGE_NAME,
  version = process.env.VERSION,
  execute = registryCommand,
  publish = spawnSync,
} = {}) {
  const args = releasePublishArguments(tarball, distTag, dryRun)
  checkReleaseDistTag(packageName, version, distTag, execute)
  const result = publish(npm, args, { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed with exit code ${result.status}`)
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'locate') {
    if (args.length !== 1) throw new Error(usage)
    const tarball = await locateReleaseArtifact(args[0])
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(process.env.GITHUB_OUTPUT, `tarball=${tarball}\n`)
    } else {
      console.log(tarball)
    }
    return
  }
  if (command === 'publish') {
    const [tarball, distTag, option] = args
    if (
      args.length < 2 ||
      args.length > 3 ||
      (option && option !== '--dry-run')
    ) {
      throw new Error(usage)
    }
    publishReleaseArtifact(tarball, distTag, option === '--dry-run')
    return
  }
  if (command === 'check-tag' || command === 'verify-tag') {
    if (args.length !== 3) throw new Error(usage)
    if (command === 'check-tag') checkReleaseDistTag(...args)
    else ensureReleaseDistTag(...args)
    return
  }
  throw new Error(usage)
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