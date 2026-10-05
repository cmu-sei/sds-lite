import { spawnSync } from 'node:child_process'
import { appendFile, readdir } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const usage =
  'Usage: release-artifact.mjs locate <directory> | publish <tarball> <beta|latest> [--dry-run]'

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

function publishReleaseArtifact(tarball, distTag, dryRun) {
  const args = releasePublishArguments(tarball, distTag, dryRun)
  const result = spawnSync(npm, args, { stdio: 'inherit' })
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