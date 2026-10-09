import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

import { documentationUrl } from '../scripts/build-pages.mjs'
import { pagesReleaseEligible, validatePagesHandoff, validatePagesTrigger, verifyPagesRelease } from '../scripts/pages-release.mjs'

const handoff = {
  schemaVersion: 1,
  repository: 'cmu-sei/sds-lite',
  packageName: '@cmu-sei/sds-lite',
  distTag: 'latest',
  version: '1.2.3',
  tag: 'v1.2.3',
  sha: 'a'.repeat(40),
  runId: '123',
  runAttempt: '2',
}

const publication = {
  release: { draft: false, prerelease: false, tag_name: 'v1.2.3' },
  tagCommit: handoff.sha,
  latestVersion: '1.2.3',
  manifest: { name: handoff.packageName, version: handoff.version },
}

test('Pages documentation links point to the exact stable release', () => {
  assert.equal(
    documentationUrl('./docs/guides/theming.md#tokens', 'cmu-sei/sds-lite', 'v1.2.3'),
    'https://github.com/cmu-sei/sds-lite/blob/v1.2.3/docs/guides/theming.md#tokens',
  )
  assert.throws(() => documentationUrl('./docs/README.md', 'cmu-sei/sds-lite', 'v1.2.3-beta.1'), /stable/)
  assert.throws(() => documentationUrl('./docs/README.md', '../other', 'v1.2.3'), /repository/)
  assert.throws(() => documentationUrl('./docs/../../package.json', 'cmu-sei/sds-lite', 'v1.2.3'), /documentation/)
  assert.throws(() => documentationUrl('https://example.com/docs/README.md', 'cmu-sei/sds-lite', 'v1.2.3'), /documentation/)
})

test('Pages handoffs bind stable releases to the exact repository, run, and attempt', () => {
  assert.equal(validatePagesHandoff(handoff, { repository: handoff.repository, runId: 123, runAttempt: 2 }), handoff)
  for (const expected of [{ repository: 'other/repo' }, { runId: 124 }, { runAttempt: 1 }]) {
    assert.throws(() => validatePagesHandoff(handoff, expected), /triggering/)
  }
  for (const change of [
    { distTag: 'beta' }, { packageName: '@other/package' }, { sha: '../main' },
    { runId: '1\ndeploy=true' }, { runAttempt: 0 }, { repository: '../repo' },
    { version: '1.2.3-beta.1', tag: 'v1.2.3-beta.1' }, { tag: 'v1.2.4' },
  ]) {
    assert.throws(() => validatePagesHandoff({ ...handoff, ...change }))
  }
})

test('Pages deploys only a fully published latest stable release', () => {
  assert.equal(pagesReleaseEligible(handoff, publication), true)
  assert.equal(pagesReleaseEligible(handoff, { ...publication, latestVersion: '1.2.4' }), false)
  assert.equal(pagesReleaseEligible(handoff, { ...publication, latestVersion: '1.10.0' }), false)
  assert.throws(() => pagesReleaseEligible(handoff, { ...publication, latestVersion: '1.2.2' }), /not completed/)
  assert.throws(() => pagesReleaseEligible(handoff, { ...publication, latestVersion: '1.3.0-beta.1' }), /stable/)
  assert.throws(() => pagesReleaseEligible(handoff, { ...publication, tagCommit: 'b'.repeat(40) }), /reviewed commit/)
  for (const change of [{ draft: true }, { prerelease: true }, { tag_name: 'v1.2.4' }]) {
    assert.throws(() => pagesReleaseEligible(handoff, {
      ...publication, release: { ...publication.release, ...change },
    }), /published stable/)
  }
  assert.throws(() => pagesReleaseEligible(handoff, {
    ...publication, manifest: { ...publication.manifest, version: '1.2.4' },
  }), /package metadata/)
})

test('Pages trusts only successful repository release events and allows same-run manual deployment retries', () => {
  const run = {
    id: 123, run_attempt: 2, conclusion: 'success', event: 'pull_request',
    head_repository: { full_name: handoff.repository }, path: '.github/workflows/release-package.yml',
  }
  const options = { repository: handoff.repository, eventName: 'workflow_run' }
  assert.equal(validatePagesTrigger(handoff, { workflow_run: run }, options), handoff)
  for (const changes of [
    { id: 124 }, { run_attempt: 1 }, { conclusion: 'failure' }, { event: 'push' },
    { head_repository: { full_name: 'outsider/fork' } }, { path: '.github/workflows/ci.yml' },
  ]) {
    assert.throws(() => validatePagesTrigger(handoff, { workflow_run: { ...run, ...changes } }, options))
  }
  assert.throws(() => validatePagesTrigger(handoff, {}, { ...options, eventName: 'push' }))
  const manual = { repository: handoff.repository, eventName: 'workflow_dispatch', runId: 123 }
  assert.equal(validatePagesTrigger(handoff, {}, manual), handoff)
  assert.equal(validatePagesTrigger({ ...handoff, runAttempt: 1 }, {}, manual).runAttempt, 1)
  assert.throws(() => validatePagesTrigger(handoff, {}, { ...manual, runId: 124 }), /triggering/)
})

test('Pages verification follows annotated tags and uses only read-only release and registry requests', async () => {
  const commands = []
  const execute = (command, args) => {
    commands.push([command, ...args])
    const endpoint = args[1]
    if (endpoint.endsWith('/releases/tags/v1.2.3')) return publication.release
    if (endpoint.endsWith('/git/ref/tags/v1.2.3')) return { object: { type: 'tag', sha: 'b'.repeat(40) } }
    if (endpoint.endsWith(`/git/tags/${'b'.repeat(40)}`)) return { object: { type: 'commit', sha: handoff.sha } }
    if (endpoint.endsWith(`/contents/package.json?ref=${handoff.sha}`)) {
      return { encoding: 'base64', content: Buffer.from(JSON.stringify(publication.manifest)).toString('base64') }
    }
    assert.deepEqual(args, ['view', '@cmu-sei/sds-lite@latest', 'version', '--json', '--registry=https://npm.pkg.github.com'])
    return '1.2.3'
  }
  assert.equal(await verifyPagesRelease(handoff, execute), true)
  assert.equal(commands.length, 5)
  assert.ok(commands.every((command) => command[1] === 'api' || command[1] === 'view'))
  await assert.rejects(verifyPagesRelease(handoff, () => { throw new Error('Registry unavailable') }), /unavailable/)
})

async function distributionHashes(directory = 'dist') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) return distributionHashes(path)
    return [[path, createHash('sha256').update(await readFile(path)).digest('hex')]]
  }))
  return files.flat().sort(([left], [right]) => left.localeCompare(right))
}

function commandOutput(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result.stdout
}

test('ordinary release validation ignores Pages-only build failures', async () => {
  const args = ['--test', '--test-reporter=spec', '--test-name-pattern=isolated Pages build', 'test/pages.test.mjs']
  const env = { ...process.env, PAGES_TAG: 'invalid', SDS_PAGES_INTEGRATION: '' }
  delete env.NODE_TEST_CONTEXT
  const ordinary = spawnSync(process.execPath, args, { encoding: 'utf8', env })
  assert.equal(ordinary.status, 0, ordinary.stderr || ordinary.stdout)
  assert.match(ordinary.stdout, /SKIP/)
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  if (!packageJson.version.includes('-')) {
    const pages = spawnSync(process.execPath, args, {
      encoding: 'utf8', env: { ...env, SDS_PAGES_INTEGRATION: '1' },
    })
    assert.equal(pages.status, 1)
    assert.match(pages.stdout + pages.stderr, /stable release tag/)
  }
})

test('the isolated Pages build leaves distribution bytes and npm package contents unchanged', {
  skip: process.env.SDS_PAGES_INTEGRATION !== '1',
}, async (context) => {
  const packageBefore = await readFile('package.json', 'utf8')
  if (JSON.parse(packageBefore).version.includes('-')) {
    context.skip('Pages builds only stable versions; beta rejection is tested separately')
    return
  }
  const before = await distributionHashes()
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const pack = () => JSON.parse(commandOutput(npm, ['pack', '--dry-run', '--ignore-scripts', '--json']))[0].files
  const filesBefore = pack()
  commandOutput(process.execPath, ['scripts/build-pages.mjs'])
  assert.deepEqual(await distributionHashes(), before)
  assert.equal(await readFile('package.json', 'utf8'), packageBefore)
  assert.deepEqual(pack(), filesBefore)
  assert.ok(filesBefore.every((file) => !file.path.startsWith('pages-dist/')))
  const html = await readFile('pages-dist/index.html', 'utf8')
  assert.match(html, /src="\.\/assets\//)
  assert.doesNotMatch(html, /href="\.\/docs\//)
  const identity = JSON.parse(await readFile('pages-dist/release.json', 'utf8'))
  assert.equal(identity.version, JSON.parse(packageBefore).version)
  assert.equal(identity.tag, `v${identity.version}`)
})

test('Pages workflows remain downstream and separate from package publication', async () => {
  const publicationWorkflow = await readFile('.github/workflows/release-package.yml', 'utf8')
  const [publisher, handoffJob] = publicationWorkflow.split('\n  pages-handoff:\n')
  assert.doesNotMatch(publisher, /pages-dist|pages: write|id-token: write|deploy-pages/)
  assert.match(handoffJob, /needs: \[build, publish\]/)
  assert.match(handoffJob, /if: needs.build.outputs.dist-tag == 'latest'/)
  assert.match(handoffJob, /continue-on-error: true/)
  const workflow = await readFile('.github/workflows/pages.yml', 'utf8')
  assert.match(workflow, /workflow_run:/)
  assert.match(workflow, /run-id: \$\{\{ github.event.workflow_run.id \}\}/)
  assert.match(workflow, /ref: \$\{\{ steps.release.outputs.sha \}\}/)
  assert.match(workflow, /path: pages-dist/)
  assert.match(workflow, /queue: max/)
  assert.match(workflow, /SDS_PAGES_INTEGRATION: '1'/)
  assert.match(workflow, /node --test --test-name-pattern='isolated Pages build' test\/pages.test.mjs/)
  assert.doesNotMatch(publisher, /SDS_PAGES_INTEGRATION/)
  assert.match(workflow, /git diff --exit-code -- dist package.json package-lock.json/)
  assert.doesNotMatch(workflow, /npm publish|npm run build|packages: write|contents: write/)
  const deployJob = workflow.split('\n  deploy:\n')[1]
  assert.ok(deployJob.indexOf('Recheck latest') < deployJob.indexOf('actions/deploy-pages@'))
})

test('Pages artifact selection binds deployment retries to the producing build attempt', async () => {
  const workflow = await readFile('.github/workflows/pages.yml', 'utf8')
  const [buildJob, deployJob] = workflow.split('\n  deploy:\n')
  assert.match(buildJob, /artifact-name: \$\{\{ steps\.pages-artifact\.outputs\.name \}\}/)
  assert.match(buildJob, /name: github-pages-\$\{\{ github\.run_attempt \}\}/)
  assert.match(deployJob, /artifact_name: \$\{\{ needs\.build\.outputs\.artifact-name \}\}/)
  assert.doesNotMatch(deployJob, /artifact_name:.*github\.run_attempt/)
})