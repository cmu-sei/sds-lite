import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import { resolveRequestedVersion } from './release-version.mjs'

if (!process.env.BASE_VERSION) throw new Error('BASE_VERSION is required')
if (!process.env.RELEASE_CHANNEL) {
  throw new Error('RELEASE_CHANNEL is required')
}

const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const tagResult = spawnSync('git', ['tag', '--list', 'v*'], {
  encoding: 'utf8',
})
if (tagResult.status !== 0) {
  throw new Error(`Could not read release tags: ${tagResult.stderr.trim()}`)
}

const version = resolveRequestedVersion({
  baseVersion: process.env.BASE_VERSION,
  channel: process.env.RELEASE_CHANNEL,
  currentVersion: packageJson.version,
  tags: tagResult.stdout.split('\n').filter(Boolean),
})
console.log(version)