import { spawnSync } from 'node:child_process'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { compareReleaseVersions, parseReleaseVersion } from './release-version.mjs'

const packageName = '@cmu-sei/sds-lite'

export function validatePagesHandoff(handoff, { repository, runId, runAttempt } = {}) {
  if (handoff.schemaVersion !== 1 || handoff.packageName !== packageName || handoff.distTag !== 'latest') {
    throw new Error('Invalid stable Pages release handoff')
  }
  if (!/^[\w][\w.-]*\/[\w][\w.-]*$/.test(handoff.repository ?? '') ||
      !/^[a-f0-9]{40}$/.test(handoff.sha ?? '') ||
      !/^[1-9]\d*$/.test(String(handoff.runId)) ||
      !/^[1-9]\d*$/.test(String(handoff.runAttempt))) {
    throw new Error('Invalid Pages release identity')
  }
  const version = parseReleaseVersion(handoff.version)
  if (version.prerelease || handoff.tag !== `v${version.version}`) {
    throw new Error('Pages requires a stable release tag')
  }
  if ((repository && handoff.repository !== repository) ||
      (runId && String(handoff.runId) !== String(runId)) ||
      (runAttempt && String(handoff.runAttempt) !== String(runAttempt))) {
    throw new Error('Pages handoff does not match the triggering repository/run')
  }
  return handoff
}

export function pagesReleaseEligible(handoff, { release, tagCommit, latestVersion, manifest }) {
  validatePagesHandoff(handoff)
  if (release.draft !== false || release.prerelease !== false || release.tag_name !== handoff.tag) {
    throw new Error('Pages requires a published stable GitHub release')
  }
  if (tagCommit !== handoff.sha) throw new Error('Release tag does not match the reviewed commit')
  if (manifest.name !== handoff.packageName || manifest.version !== handoff.version) {
    throw new Error('Release commit package metadata does not match the handoff')
  }
  const latest = parseReleaseVersion(latestVersion)
  if (latest.prerelease) throw new Error('Package latest must be a stable version')
  const order = compareReleaseVersions(latestVersion, handoff.version)
  if (order < 0) throw new Error('Package publication has not completed for this release')
  return order === 0
}

function execute(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, GH_PAGER: 'cat' },
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || `${command} lookup failed`)
  return JSON.parse(result.stdout)
}

function tagCommit(repository, tag, run = execute) {
  let object = run('gh', ['api', `repos/${repository}/git/ref/tags/${tag}`]).object
  for (let depth = 0; object.type === 'tag' && depth < 5; depth++) {
    object = run('gh', ['api', `repos/${repository}/git/tags/${object.sha}`]).object
  }
  if (object.type !== 'commit') throw new Error('Release tag must resolve to a commit')
  return object.sha
}

export function validatePagesTrigger(handoff, event, { repository, eventName, runId } = {}) {
  if (eventName === 'workflow_dispatch') {
    return validatePagesHandoff(handoff, { repository, runId })
  }
  const run = event.workflow_run
  if (eventName !== 'workflow_run' || run?.conclusion !== 'success' || run.event !== 'pull_request' ||
      run.head_repository?.full_name !== repository || run.path !== '.github/workflows/release-package.yml') {
    throw new Error('Pages requires a successful repository release workflow')
  }
  return validatePagesHandoff(handoff, { repository, runId: run.id, runAttempt: run.run_attempt })
}

export async function verifyPagesRelease(handoff, run = execute) {
  validatePagesHandoff(handoff, { repository: process.env.GITHUB_REPOSITORY })
  const release = run('gh', ['api', `repos/${handoff.repository}/releases/tags/${handoff.tag}`])
  const commit = tagCommit(handoff.repository, handoff.tag, run)
  const contents = run('gh', ['api', `repos/${handoff.repository}/contents/package.json?ref=${commit}`])
  if (contents.encoding !== 'base64') throw new Error('Could not read release package metadata')
  const manifest = JSON.parse(Buffer.from(contents.content, 'base64').toString('utf8'))
  const latestVersion = run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'view', `${packageName}@latest`, 'version', '--json', '--registry=https://npm.pkg.github.com',
  ])
  return pagesReleaseEligible(handoff, { release, tagCommit: commit, latestVersion, manifest })
}

async function main() {
  const [command, filename] = process.argv.slice(2)
  if (!filename || !['handoff', 'verify'].includes(command)) {
    throw new Error('Usage: pages-release.mjs handoff|verify <handoff.json>')
  }
  const repository = process.env.GITHUB_REPOSITORY
  let handoff
  if (command === 'handoff' || process.env.PAGES_TAG) {
    const version = process.env.PAGES_TAG?.slice(1) ?? process.env.VERSION
    if (process.env.PAGES_TAG && !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(process.env.PAGES_TAG)) {
      throw new Error('Pages requires a stable release tag')
    }
    handoff = validatePagesHandoff({
      schemaVersion: 1,
      repository,
      packageName,
      distTag: 'latest',
      version,
      tag: process.env.PAGES_TAG ?? `v${version}`,
      sha: command === 'handoff' ? process.env.RELEASE_SHA : tagCommit(repository, process.env.PAGES_TAG),
      runId: process.env.GITHUB_RUN_ID,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT,
    })
    await writeFile(filename, `${JSON.stringify(handoff, null, 2)}\n`)
  } else {
    handoff = JSON.parse(await readFile(filename, 'utf8'))
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'))
    validatePagesTrigger(handoff, event, {
      repository, eventName: process.env.GITHUB_EVENT_NAME, runId: process.env.GITHUB_RUN_ID,
    })
  }
  if (command === 'handoff') return
  const deploy = await verifyPagesRelease(handoff)
  const output = `deploy=${deploy}\ntag=${handoff.tag}\nsha=${handoff.sha}\nversion=${handoff.version}\n`
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, output)
  else console.log(output)
  if (!deploy) console.log(`Skipping ${handoff.tag}: a newer stable package owns latest`)
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
  await main()
}