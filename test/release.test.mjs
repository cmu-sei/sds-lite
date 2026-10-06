import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import test from 'node:test'

import {
  assertVersionAdvances,
  compareReleaseVersions,
  parseReleaseVersion,
  resolveRequestedVersion,
  validatePreparedVersion,
  validateRelease,
} from '../scripts/release-version.mjs'
import {
  assertPackageUnpublished,
  resolveAbandonedRelease,
  selectReleasePullRequestForAbandonment,
} from '../scripts/abandon-release.mjs'
import {
  activeReleaseRuns,
  assertReleaseActive,
  cancellationLabel,
  cancelRelease,
  revertReleaseCommit,
  validateMergedRelease,
} from '../scripts/cancel-release.mjs'
import {
  validateReleaseEnvironment,
  validateReleaseOrder,
} from '../scripts/validate-release.mjs'
import { formatHotfixReleaseNotes, formatReleaseNotes } from '../scripts/format-release-notes.mjs'
import {
  checkReleaseDistTag,
  ensureReleaseDistTag,
  locateReleaseArtifact,
  releasePublishArguments,
  publishReleaseArtifact,
  resolveReleaseDistTag,
} from '../scripts/release-artifact.mjs'
import { parsePrepareReleaseArguments } from '../scripts/prepare-release.mjs'
import { applyHotfix, prepareHotfix, resolveHotfix, validateHotfixDraft } from '../scripts/prepare-hotfix.mjs'
import {
  validateReleasePreparation,
  validateReleasePullRequest,
} from '../scripts/validate-release-pr.mjs'

test('release versions use strict Semantic Versioning', () => {
  assert.deepEqual(parseReleaseVersion('1.2.3'), {
    version: '1.2.3',
    major: 1,
    minor: 2,
    patch: 3,
    prerelease: false,
    beta: undefined,
  })
  assert.deepEqual(parseReleaseVersion('1.2.3-beta.1'), {
    version: '1.2.3-beta.1',
    major: 1,
    minor: 2,
    patch: 3,
    prerelease: true,
    beta: 1,
  })

  for (const version of [
    '01.2.3',
    '1.02.3',
    '1.2.03',
    '1.2.3-beta..1',
    '1.2.3-beta.01',
    '1.2.3-alpha.1',
    '1.2.3-rc.1',
    '1.2.3-dev.abc123',
    '1.2.3+build.7',
    '1.2',
  ]) {
    assert.throws(() => parseReleaseVersion(version), /stable version/)
  }
})

test('release versions advance monotonically', () => {
  assert.equal(compareReleaseVersions('1.2.3', '1.2.2'), 1)
  assert.equal(compareReleaseVersions('1.2.3-beta.2', '1.2.3-beta.1'), 1)
  assert.equal(compareReleaseVersions('1.2.3', '1.2.3-beta.2'), 1)
  assert.equal(compareReleaseVersions('1.2.3-beta.1', '1.2.3'), -1)
  assert.doesNotThrow(() =>
    assertVersionAdvances('1.2.3-beta.2', '1.2.3'),
  )
  assert.throws(
    () => assertVersionAdvances('1.2.3', '1.2.2'),
    /must be greater/,
  )
})

test('the inaugural release may use the already committed version', () => {
  assert.doesNotThrow(() => validatePreparedVersion('0.1.0', '0.1.0', []))
  assert.doesNotThrow(() =>
    validatePreparedVersion('0.1.0', '0.1.0-beta.1', []),
  )
  assert.doesNotThrow(() =>
    validatePreparedVersion('0.1.0', '0.1.0', ['not-a-release']),
  )
  assert.throws(
    () => validatePreparedVersion('0.1.0', '0.1.0', ['v0.0.1']),
    /must be greater/,
  )
  assert.throws(
    () => validatePreparedVersion('1.0.0', '1.1.0', ['v2.0.0']),
    /must be greater/,
  )
  assert.doesNotThrow(() =>
    validatePreparedVersion('0.1.0', '0.2.0', ['v0.1.0']),
  )
})

test('stable hotfixes advance latest without being blocked by newer betas', () => {
  const tags = ['v1.2.3', 'v1.3.0-beta.2']
  assert.doesNotThrow(() => validatePreparedVersion('1.2.3', '1.2.4', tags))
  assert.doesNotThrow(() => validateReleaseOrder('1.2.4', 'v1.2.4', tags))
  assert.throws(() => validatePreparedVersion('1.3.0-beta.2', '1.2.4', tags), /must be greater/)
  assert.throws(() => validateReleaseOrder('1.2.3', 'v1.2.3', [...tags, 'v1.2.4']), /must be greater/)
  assert.throws(() => validateReleaseOrder('1.3.0-beta.1', 'v1.3.0-beta.1', tags), /must be greater/)
})

test('hotfix planning needs only a merged fix PR and selects the next available patch', () => {
  const options = { latestVersion: '1.2.3', fix: 'https://github.com/cmu-sei/sds-lite/pull/42',
    repository: 'cmu-sei/sds-lite', pullRequest: { number: 42, merged_at: '2026-10-06',
      base: { ref: 'main', repo: { full_name: 'cmu-sei/sds-lite' } }, labels: [], merge_commit_sha: 'a'.repeat(40) },
    reservedVersions: ['1.3.0-beta.2'] }
  assert.deepEqual(resolveHotfix(options), { version: '1.2.4', tag: 'v1.2.4', baseTag: 'v1.2.3',
    baseBranch: 'hotfix/v1.2.4', branch: 'release/v1.2.4', fixNumber: 42, fixCommit: 'a'.repeat(40) })
  assert.equal(resolveHotfix({ ...options, fix: '42', reservedVersions: ['1.2.4', '1.2.5-beta.1'] }).version, '1.2.6')
  assert.throws(() => resolveHotfix({ ...options, latestVersion: '1.3.0-beta.2' }), /stable release/)
  assert.throws(() => resolveHotfix({ ...options, fix: 'https://github.com/other/repo/pull/42' }), /this repository/)
  assert.throws(() => resolveHotfix({ ...options, pullRequest: { ...options.pullRequest, merged_at: null } }), /already merged/)
  assert.throws(() => resolveHotfix({ ...options, pullRequest: { ...options.pullRequest, labels: [{ name: 'release' }] } }), /not a release PR/)
})

test('orphan hotfix drafts stay bound to the reviewed source and fix', () => {
  const hotfix = { tag: 'v1.2.4', baseTag: 'v1.2.3', fixNumber: 42 }
  const draft = { isDraft: true, isPrerelease: false,
    body: '<!-- Hotfix source: v1.2.3; fix PR: #42 -->' }
  assert.doesNotThrow(() => validateHotfixDraft(null, hotfix))
  assert.doesNotThrow(() => validateHotfixDraft(draft, hotfix))
  assert.throws(() => validateHotfixDraft(draft, { ...hotfix, fixNumber: 43 }), /different or unverified/)
  assert.throws(() => validateHotfixDraft({ ...draft, isDraft: false }, hotfix), /unpublished stable draft/)
  assert.throws(() => validateHotfixDraft({ ...draft, isPrerelease: true }, hotfix), /unpublished stable draft/)
  assert.throws(() => validateHotfixDraft({ ...draft, body: '' }, hotfix), /different or unverified/)
})

test('hotfix application supports squash and merge PRs and explains conflicts', () => {
  for (const merge of [false, true]) {
    const commands = []
    applyHotfix('a'.repeat(40), (command, args) => {
      commands.push([command, ...args])
      return ['a'.repeat(40), 'b'.repeat(40), ...(merge ? ['c'.repeat(40)] : [])].join(' ')
    })
    assert.deepEqual(commands[1], ['git', 'cherry-pick', ...(merge ? ['-m', '1'] : []), 'a'.repeat(40)])
  }
  assert.throws(() => applyHotfix('a'.repeat(40), (command, args) => {
    if (args[0] === 'cherry-pick') throw new Error('conflict')
    return 'commit parent'
  }), /compatible fix PR/)
})

test('hotfix publication and recovery require the matching stable base branch', () => {
  const options = { branch: 'release/v1.2.4', packageVersion: '1.2.4', stateVersion: '1.2.4', baseBranch: 'hotfix/v1.2.4' }
  assert.doesNotThrow(() => validateReleasePullRequest(options))
  assert.throws(() => validateReleasePullRequest({ ...options, baseBranch: 'hotfix/v1.2.3' }), /Release base/)
  assert.throws(() => validateReleasePullRequest({ ...options, packageVersion: '1.2.4-beta.1', baseBranch: 'hotfix/v1.2.4-beta.1' }), /Release base/)
  const pr = { state: 'closed', merged_at: '2026-10-06', commits: 1,
    head: { ref: options.branch, repo: { full_name: 'cmu-sei/sds-lite' } },
    base: { ref: options.baseBranch }, labels: [{ name: 'release' }], merge_commit_sha: 'a'.repeat(40) }
  assert.doesNotThrow(() => validateMergedRelease(pr, { branch: options.branch, version: options.packageVersion }, 'cmu-sei/sds-lite', 'main'))
  assert.throws(() => validateMergedRelease({ ...pr, base: { ref: 'hotfix/v1.2.3' } }, { branch: options.branch, version: options.packageVersion }, 'cmu-sei/sds-lite', 'main'), /merged release/)
})

test('release channels resolve stable versions and beta sequence numbers', () => {
  assert.equal(
    resolveRequestedVersion({
      baseVersion: '1.3.0',
      channel: 'stable',
      currentVersion: '1.2.0',
      tags: ['v1.2.0'],
    }),
    '1.3.0',
  )
  assert.equal(
    resolveRequestedVersion({
      baseVersion: '1.3.0',
      channel: 'beta',
      currentVersion: '1.2.0',
      tags: ['v1.2.0'],
    }),
    '1.3.0-beta.1',
  )
  assert.equal(
    resolveRequestedVersion({
      baseVersion: '1.3.0',
      channel: 'beta',
      currentVersion: '1.3.0-beta.2',
      tags: ['not-a-release', 'v1.3.0-beta.1', 'v1.3.0-beta.2'],
    }),
    '1.3.0-beta.3',
  )
  assert.throws(
    () =>
      resolveRequestedVersion({
        baseVersion: '1.3.0-beta.1',
        channel: 'beta',
        currentVersion: '1.2.0',
        tags: [],
      }),
    /must not include/,
  )
})

test('release preparation accepts only the explicit automation arguments', () => {
  assert.deepEqual(parsePrepareReleaseArguments([]), {})
  assert.deepEqual(
    parsePrepareReleaseArguments(['--version', '1.2.3', '--yes']),
    { version: '1.2.3', yes: true },
  )
  assert.throws(
    () => parsePrepareReleaseArguments(['--yes']),
    /Usage:/,
  )
  assert.throws(
    () => parsePrepareReleaseArguments(['--version', '1.2.3']),
    /Usage:/,
  )
})

test('release abandonment requires the exact version confirmation', () => {
  assert.deepEqual(
    resolveAbandonedRelease('1.2.3-beta.2', '1.2.3-beta.2'),
    {
      version: '1.2.3-beta.2',
      tag: 'v1.2.3-beta.2',
      branch: 'release/v1.2.3-beta.2',
    },
  )
  assert.throws(
    () => resolveAbandonedRelease('1.2.3', '1.2.4'),
    /Confirmation must exactly match version "1\.2\.3"/,
  )
  assert.throws(
    () => resolveAbandonedRelease('v1.2.3', '1.2.3'),
    /stable version/,
  )
})

test('partial release cleanup permits no PR but refuses published or uncertain packages', () => {
  assert.deepEqual(selectReleasePullRequestForAbandonment([], [], { allowMissing: true }),
    { number: null, url: null, wasOpen: false })
  assert.throws(() => selectReleasePullRequestForAbandonment([], [{ state: 'MERGED' }], { allowMissing: true }), /No open or closed-unmerged/)
  assert.doesNotThrow(() => assertPackageUnpublished('@cmu-sei/sds-lite', '1.2.4', () =>
    ({ status: 1, stdout: JSON.stringify({ error: { code: 'E404' } }) })))
  assert.throws(() => assertPackageUnpublished('@cmu-sei/sds-lite', '1.2.4', () => ({ status: 0 })), /already published/)
  for (const stdout of ['not JSON', JSON.stringify({ error: { code: 'E401' } })]) {
    assert.throws(() => assertPackageUnpublished('@cmu-sei/sds-lite', '1.2.4', () => ({ status: 1, stdout })), /Could not verify/)
  }
})

test('release abandonment selects the active or latest unmerged pull request', () => {
  const open = {
    number: 12,
    url: 'https://example.test/pull/12',
    state: 'OPEN',
    mergedAt: null,
  }
  const olderClosed = {
    number: 10,
    url: 'https://example.test/pull/10',
    state: 'CLOSED',
    mergedAt: null,
  }
  const latestClosed = {
    number: 11,
    url: 'https://example.test/pull/11',
    state: 'CLOSED',
    mergedAt: null,
  }
  const merged = {
    number: 9,
    url: 'https://example.test/pull/9',
    state: 'MERGED',
    mergedAt: '2026-10-05T17:15:18Z',
  }

  assert.deepEqual(
    selectReleasePullRequestForAbandonment(
      [open],
      [latestClosed, olderClosed, merged],
    ),
    { ...open, wasOpen: true },
  )
  assert.deepEqual(
    selectReleasePullRequestForAbandonment(
      [],
      [olderClosed, merged, latestClosed],
    ),
    { ...latestClosed, wasOpen: false },
  )
  assert.throws(
    () => selectReleasePullRequestForAbandonment([open, open], []),
    /at most one open/,
  )
  assert.throws(
    () => selectReleasePullRequestForAbandonment([], [merged]),
    /No open or closed-unmerged/,
  )
})

function cancellationHarness(options = {}) {
  const commands = []
  const pullRequest = {
    number: 42,
    state: 'closed',
    merged_at: '2026-10-06T12:00:00Z',
    merge_commit_sha: 'a'.repeat(40),
    commits: 1,
    labels: [{ name: 'release' }],
    head: { ref: 'release/v1.2.3', sha: 'b'.repeat(40), repo: { full_name: 'cmu-sei/sds-lite' } },
    base: { ref: 'main' },
    ...options.pullRequest,
  }
  let active = options.active ?? true
  let draftExists = options.draftExists ?? true
  const run = (command, args) => {
    commands.push([command, ...args])
    const success = (value = {}) => ({ status: 0, stdout: JSON.stringify(value), stderr: '' })
    const missing = () => ({ status: 1, stdout: '', stderr: 'HTTP 404' })
    if (command === 'npm') {
      return options.packageResult ?? { status: 1, stdout: JSON.stringify({ error: { code: 'E404' } }), stderr: '' }
    }
    if (args[0] === 'pr' && args[1] === 'list') return success([{ number: 42 }])
    if (args[0] === 'pr' && args[1] === 'edit') {
      pullRequest.labels.push({ name: cancellationLabel })
      return success()
    }
    if (args[0] === 'label') return success()
    if (args[0] === 'release') {
      draftExists = false
      return success()
    }
    if (args.includes('--slurp')) {
      return success([{ workflow_runs: active ? [{ id: 100, status: 'waiting', head_sha: pullRequest.merge_commit_sha }] : [] }])
    }
    const endpoint = args.at(-1)
    if (endpoint.endsWith('/cancel')) {
      if (!options.stuck) active = false
      return success()
    }
    if (endpoint.endsWith('/pulls/42')) return success(pullRequest)
    if (endpoint.includes('/contents/package.json')) {
      return success({ content: Buffer.from(JSON.stringify({ name: '@cmu-sei/sds-lite', version: options.packageVersion ?? '1.2.3' })).toString('base64') })
    }
    if (endpoint.includes('/releases/tags/')) return draftExists ? success({ draft: options.draft ?? true }) : missing()
    if (endpoint.includes('/git/ref/tags/')) return options.tagExists ? success({ ref: 'refs/tags/v1.2.3' }) : missing()
    throw new Error(`Unexpected command: ${command} ${args.join(' ')}`)
  }
  return {
    commands,
    pullRequest,
    request: (phase) => cancelRelease({
      phase,
      version: '1.2.3',
      confirmation: '1.2.3',
      repository: 'cmu-sei/sds-lite',
      defaultBranch: 'main',
      run,
      wait: async () => {},
    }),
  }
}

test('merged release cancellation marks the PR before stopping finalization', async () => {
  const harness = cancellationHarness()
  const result = await harness.request('request')
  assert.equal(result.pullRequest.number, 42)
  assert.throws(() => assertReleaseActive(harness.pullRequest), /cancelled/)
  const marked = harness.commands.findIndex((command) => command.includes('--add-label'))
  const stopped = harness.commands.findIndex((command) => command.at(-1).endsWith('/cancel'))
  assert.ok(marked >= 0 && stopped > marked)
  assert.equal(harness.commands.some((command) => command[1] === 'release'), false)
  await harness.request('cleanup')
  assert.equal(harness.commands.filter((command) => command[1] === 'release').length, 1)
  await harness.request('cleanup')
  assert.equal(harness.commands.filter((command) => command[1] === 'release').length, 1)
})

test('merged cancellation refuses public releases, tags, packages, and uncertain registry state', async () => {
  for (const options of [
    { draft: false },
    { tagExists: true },
    { packageResult: { status: 0, stdout: '"1.2.3"', stderr: '' } },
    { packageResult: { status: 1, stdout: '{"error":{"code":"E401"}}', stderr: '' } },
    { packageResult: { status: 1, stdout: '', stderr: 'network timeout' } },
    { packageVersion: '1.2.4' },
  ]) {
    const harness = cancellationHarness(options)
    await assert.rejects(harness.request('request'), /published|already exists|Could not verify|does not match/)
    assert.equal(harness.commands.some((command) => command.includes('--add-label')), false)
    assert.equal(harness.commands.some((command) => command[1] === 'release'), false)
  }
})

test('merged cancellation keeps its publication block when finalization cannot stop', async () => {
  const harness = cancellationHarness({ stuck: true })
  await assert.rejects(harness.request('request'), /still active/)
  assert.throws(() => assertReleaseActive(harness.pullRequest), /cancelled/)
  await assert.rejects(harness.request('cleanup'), /still active/)
  assert.equal(harness.commands.some((command) => command[1] === 'release'), false)
})

test('cancellation cleanup rechecks publication and requires the persistent marker', async () => {
  const unmarked = cancellationHarness({ active: false })
  await assert.rejects(unmarked.request('cleanup'), /Request cancellation/)
  const published = cancellationHarness({
    active: false,
    draft: false,
    pullRequest: { labels: [{ name: 'release' }, { name: cancellationLabel }] },
  })
  await assert.rejects(published.request('cleanup'), /already published/)
  assert.equal(published.commands.some((command) => command[1] === 'release'), false)
})

test('merged cancellation validates provenance and only cancels matching active runs', () => {
  const { pullRequest } = cancellationHarness()
  const release = resolveAbandonedRelease('1.2.3', '1.2.3')
  for (const changes of [
    { merged_at: null },
    { commits: 2 },
    { head: { ref: release.branch, repo: { full_name: 'attacker/fork' } } },
    { base: { ref: 'other' } },
    { labels: [] },
  ]) {
    assert.throws(() => validateMergedRelease({ ...pullRequest, ...changes }, release, 'cmu-sei/sds-lite', 'main'))
  }
  assertReleaseActive(pullRequest)
  assert.throws(() => assertReleaseActive({}), /Could not verify/)
  const runs = [
    { id: 1, status: 'queued', head_sha: pullRequest.merge_commit_sha },
    { id: 2, status: 'completed', head_sha: pullRequest.merge_commit_sha },
    { id: 3, status: 'waiting', pull_requests: [{ number: 42 }] },
    { id: 4, status: 'in_progress', head_branch: 'release/v9.0.0' },
    { id: 5, status: 'in_progress', head_branch: pullRequest.head.ref },
  ]
  assert.deepEqual(activeReleaseRuns([{ workflow_runs: runs }], pullRequest).map((run) => run.id), [1, 3, 5])
})

test('release-only recovery reverts squash and merge commits while preserving later work', async (context) => {
  for (const merge of ['squash', 'merge']) {
    const directory = await mkdtemp(join(tmpdir(), 'sds-release-revert-'))
    context.after(() => rm(directory, { recursive: true, force: true }))
    const run = (command, args) => spawnSync(command, args, { cwd: directory, encoding: 'utf8' })
    const git = (...args) => {
      const result = run('git', args)
      assert.equal(result.status, 0, result.stderr)
      return result.stdout.trim()
    }
    git('init', '--initial-branch=main')
    git('config', 'user.name', 'Release Test')
    git('config', 'user.email', 'release@example.test')
    await writeFile(join(directory, 'version.txt'), '1.2.2\n')
    await writeFile(join(directory, 'feature.txt'), 'before\n')
    git('add', '--all')
    git('commit', '-m', 'Initial version')
    git('switch', '-c', 'release/v1.2.3')
    await writeFile(join(directory, 'version.txt'), '1.2.3\n')
    git('add', '--all')
    git('commit', '-m', 'Prepare release')
    git('switch', 'main')
    if (merge === 'squash') {
      git('merge', '--squash', 'release/v1.2.3')
      git('commit', '-m', 'Squash release')
    } else {
      git('merge', '--no-ff', 'release/v1.2.3', '-m', 'Merge release')
    }
    const commit = git('rev-parse', 'HEAD')
    await writeFile(join(directory, 'feature.txt'), 'later work\n')
    git('add', '--all')
    git('commit', '-m', 'Later work')
    revertReleaseCommit(commit, run)
    assert.equal(await readFile(join(directory, 'version.txt'), 'utf8'), '1.2.2\n')
    assert.equal(await readFile(join(directory, 'feature.txt'), 'utf8'), 'later work\n')
    assert.equal(git('diff', '--cached', '--name-only'), 'version.txt')
  }
  assert.throws(() => revertReleaseCommit('--all'), /merge commit is required/)
})

test('hotfix preparation isolates stable code, preserves beta history, and refreshes safely', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'sds-hotfix-'))
  const remote = await mkdtemp(join(tmpdir(), 'sds-hotfix-remote-'))
  context.after(() => Promise.all([directory, remote].map((path) => rm(path, { recursive: true, force: true }))))
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
  }
  git('init', '--bare', remote)
  git('init', '--initial-branch=main')
  git('config', 'user.name', 'Release Test')
  git('config', 'user.email', 'release@example.test')
  git('remote', 'add', 'origin', remote)
  await writeFile(join(directory, 'package.json'), JSON.stringify({ name: '@cmu-sei/sds-lite', version: '1.2.3' }))
  await writeFile(join(directory, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/playwright': { version: '1.60.0' } } }))
  await writeFile(join(directory, 'product.txt'), 'stable\n')
  git('add', '--all')
  git('commit', '-m', 'Stable release')
  git('tag', 'v1.2.3')
  await cp(new URL('../scripts/', import.meta.url), join(directory, 'scripts'), { recursive: true })
  await cp(new URL('../.github/', import.meta.url), join(directory, '.github'), { recursive: true })
  await mkdir(join(directory, 'test'))
  await cp(new URL('./release.test.mjs', import.meta.url), join(directory, 'test/release.test.mjs'))
  await writeFile(join(directory, 'beta-only.txt'), 'unfinished feature\n')
  await writeFile(join(directory, 'package.json'), JSON.stringify({ name: '@cmu-sei/sds-lite', version: '1.3.0-beta.2' }))
  git('add', '--all')
  git('commit', '-m', 'Beta development and release tooling')
  git('tag', 'v1.3.0-beta.2')
  const beta = git('rev-parse', 'HEAD')
  git('switch', '-c', 'fix')
  await writeFile(join(directory, 'product.txt'), 'fixed stable\n')
  git('add', '--all')
  git('commit', '-m', 'Fix stable bug')
  await writeFile(join(directory, 'second-fix.txt'), 'complete fix\n')
  git('add', '--all')
  git('commit', '-m', 'Complete fix in a second commit')
  const fixHead = git('rev-parse', 'HEAD')
  git('push', 'origin', 'HEAD:refs/pull/42/head')
  git('switch', 'main')
  git('merge', '--squash', 'fix')
  git('commit', '-m', 'Squash merged fix PR #42')
  const main = git('rev-parse', 'HEAD')
  let merged = false
  let blocked = false
  let wrongBase = false
  let fixNumber = 42
  let prepared = false
  const execute = (command, args, input) => {
    if (command === 'git') {
      const result = spawnSync('git', args, { cwd: directory, encoding: 'utf8', input })
      assert.equal(result.status, 0, result.stderr)
      return args[0] === 'diff' ? result.stdout : result.stdout.trim()
    }
    if (command === 'npm') return JSON.stringify('1.2.3')
    if (args.includes('Accept: application/vnd.github.diff')) return `${git('diff', '--binary', beta, fixHead)}\n`
    if (args[0] === 'api') return JSON.stringify({ number: fixNumber, merged_at: '2026-10-06',
      base: { ref: 'main', sha: main, repo: { full_name: 'cmu-sei/sds-lite' } }, head: { sha: fixHead },
      labels: [], commits: 2, merge_commit_sha: main })
    if (args[0] === 'release') {
      if (args[2] === 'v1.2.4') throw new Error('release not found')
      return JSON.stringify({ isDraft: false, isPrerelease: false })
    }
    if (args.includes('open')) return JSON.stringify(blocked ? [{ headRefName: 'release/v1.4.0-beta.1' }] : [])
    if (args.includes('--head')) return JSON.stringify(merged ? [{ number: 43, state: 'MERGED' }]
      : wrongBase ? [{ number: 43, state: 'OPEN', baseRefName: 'main' }]
      : prepared ? [{ number: 43, state: 'OPEN', baseRefName: 'hotfix/v1.2.4',
        body: 'Applies fix #42 to v1.2.3 and publishes to latest.' }] : [])
    return '[]'
  }
  const options = { cwd: directory, execute, env: { GITHUB_REPOSITORY: 'cmu-sei/sds-lite', HOTFIX_PR: '42',
    GITHUB_ENV: join(remote, 'environment'), GITHUB_STEP_SUMMARY: join(remote, 'summary') } }
  blocked = true
  await assert.rejects(prepareHotfix(options), /Another release PR/)
  assert.equal(git('branch', '--list', 'hotfix/*'), '')
  blocked = false
  wrongBase = true
  await assert.rejects(prepareHotfix(options), /different base/)
  assert.equal(git('branch', '--list', 'hotfix/*'), '')
  wrongBase = false
  merged = true
  await assert.rejects(prepareHotfix(options), /already merged/)
  assert.equal(git('branch', '--list', 'hotfix/*'), '')
  merged = false
  await prepareHotfix(options)
  prepared = true
  assert.equal(git('rev-parse', 'main'), main)
  assert.equal(git('show', 'HEAD:product.txt'), 'fixed stable')
  assert.equal(git('show', 'HEAD:second-fix.txt'), 'complete fix')
  assert.equal(git('ls-tree', '--name-only', 'HEAD', 'beta-only.txt'), '')
  assert.equal(JSON.parse(git('show', 'HEAD:package.json')).version, '1.2.3')
  assert.equal(git('rev-list', '--count', 'hotfix/v1.2.4..HEAD'), '1')
  assert.match(await readFile(join(remote, 'environment'), 'utf8'), /VERSION=1.2.4/)
  assert.match(git('show', 'HEAD:.github/workflows/ci.yml'), /playwright:v1.60.0-noble/)
  git('switch', 'main')
  await prepareHotfix(options)
  assert.equal(git('rev-list', '--count', 'hotfix/v1.2.4..HEAD'), '1')
  git('switch', 'main')
  fixNumber = 44
  git('push', 'origin', 'fix:refs/pull/44/head')
  await assert.rejects(prepareHotfix({ ...options, env: { ...options.env, HOTFIX_PR: '44' } }), /different fix/)
  prepared = false
  await prepareHotfix({ ...options, env: { ...options.env, HOTFIX_PR: '44' } })
  git('switch', 'main')
  fixNumber = 42
  merged = true
  await assert.rejects(prepareHotfix(options), /already merged/)
})

test('supported stable tag completes real release preparation and package validation', {
  skip: process.env.SDS_RELEASE_REHEARSAL !== '1',
}, async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'sds-stable-rehearsal-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  const execute = (command, args, extraEnv = {}) => {
    const result = spawnSync(command, args, { cwd: directory, encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, SDS_RELEASE_REHEARSAL: '0', ...extraEnv } })
    assert.equal(result.status, 0, `${result.stdout?.slice(-12000)}\n${result.stderr}`)
    return result.stdout.trim()
  }
  execute('git', ['clone', '--no-hardlinks', '--no-checkout', process.cwd(), '.'])
  execute('git', ['switch', '--detach', 'v0.2.0'])
  for (const filename of ['prepare-hotfix', 'prepare-release', 'release-version', 'resolve-release-version',
    'validate-release', 'validate-release-pr', 'cancel-release', 'abandon-release', 'release-artifact', 'format-release-notes']) {
    await cp(new URL(`../scripts/${filename}.mjs`, import.meta.url), join(directory, `scripts/${filename}.mjs`))
  }
  await cp(new URL('../.github/workflows/', import.meta.url), join(directory, '.github/workflows'), { recursive: true })
  await cp(new URL('../.github/RELEASING.md', import.meta.url), join(directory, '.github/RELEASING.md'))
  await cp(new URL('./release.test.mjs', import.meta.url), join(directory, 'test/release.test.mjs'))
  const lock = JSON.parse(await readFile(join(directory, 'package-lock.json'), 'utf8'))
  for (const filename of ['ci.yml', 'release-package.yml']) {
    const path = join(directory, '.github/workflows', filename)
    const source = await readFile(path, 'utf8')
    await writeFile(path, source.replace(/mcr\.microsoft\.com\/playwright:v[\d.]+-noble/g,
      `mcr.microsoft.com/playwright:v${lock.packages['node_modules/playwright'].version}-noble`))
  }
  execute('git', ['switch', '-c', 'release/v0.2.1'])
  execute('git', ['config', 'user.name', 'Release Rehearsal'])
  execute('git', ['config', 'user.email', 'release@example.test'])
  execute('git', ['add', '--all'])
  execute('git', ['commit', '-m', 'Install current release controller on stable source'])
  execute('npm', ['ci', '--ignore-scripts'])
  execute('npm', ['run', 'release:prepare', '--', '--version', '0.2.1', '--yes'])
  execute('node', ['scripts/validate-release-pr.mjs'], { RELEASE_BRANCH: 'release/v0.2.1', RELEASE_BASE: 'hotfix/v0.2.1' })
  execute('npm', ['pack', '--ignore-scripts', '--dry-run'])
  assert.equal(JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')).version, '0.2.1')
  assert.equal(JSON.parse(await readFile(join(directory, '.github/release-state.json'), 'utf8')).version, '0.2.1')
})

test('hotfix backports landed merge resolutions and rejects ambiguous multi-commit rebases', () => {
  let applied
  const execute = (command, args, input) => {
    if (args[0] === 'rev-list') return 'commit parent second-parent'
    if (args[0] === 'diff') return 'landed resolution\n'
    if (args[0] === 'apply') applied = input
    return ''
  }
  applyHotfix('commit', execute, { diff: 'original PR changes', commits: 2 })
  assert.equal(applied, 'landed resolution\n\n')
  assert.throws(() => applyHotfix('commit', (command, args, input) => {
    if (args[0] === 'rev-list') return 'commit parent'
    if (args[0] === 'diff') return 'only final rebase commit'
    if (args[0] === 'patch-id') return input.startsWith('only') ? 'partial' : 'complete'
    return ''
  }, { diff: 'complete PR changes', commits: 2 }), /Cannot safely backport/)
})

test('release preparation rejects all conflicting targets and already-merged versions', () => {
  const options = { branch: 'release/v1.2.4', baseBranch: 'main', openPullRequests: [], previousPullRequests: [] }
  assert.doesNotThrow(() => validateReleasePreparation(options))
  const same = { headRefName: options.branch, baseRefName: 'main' }
  assert.doesNotThrow(() => validateReleasePreparation({ ...options, openPullRequests: [same] }))
  assert.throws(() => validateReleasePreparation({ ...options, openPullRequests: [same,
    { headRefName: 'release/v1.3.0-beta.1', baseRefName: 'main' }] }), /different version or target/)
  assert.throws(() => validateReleasePreparation({ ...options, openPullRequests: [{ ...same, baseRefName: 'hotfix/v1.2.4' }] }), /different version or target/)
  assert.throws(() => validateReleasePreparation({ ...options, previousPullRequests: [{ state: 'MERGED' }] }), /already has a merged/)
  assert.doesNotThrow(() => validateReleasePreparation({ ...options, previousPullRequests: [{ state: 'CLOSED' }] }))
})

test('release PR validation requires matching branch and state', () => {
  assert.doesNotThrow(() =>
    validateReleasePullRequest({
      branch: 'release/v1.2.3',
      packageVersion: '1.2.3',
      stateVersion: '1.2.3',
    }),
  )
  assert.throws(
    () =>
      validateReleasePullRequest({
        branch: 'release/v1.2.4',
        packageVersion: '1.2.3',
        stateVersion: '1.2.3',
      }),
    /branch/,
  )
  assert.throws(
    () =>
      validateReleasePullRequest({
        branch: 'release/v1.2.3',
        packageVersion: '1.2.3',
        stateVersion: '1.2.4',
      }),
    /state/,
  )
})

test('hotfix release notes identify only the selected fix and stable comparison', () => {
  const notes = formatHotfixReleaseNotes({ number: 42, title: 'Fix keyboard focus', user: { login: 'octocat' } },
    '1.2.4', 'v1.2.3', 'cmu-sei/sds-lite')
  assert.match(notes, /Fix keyboard focus by @octocat/)
  assert.match(notes, /pull\/42/)
  assert.match(notes, /compare\/v1.2.3\.\.\.v1.2.4/)
  assert.match(notes, /without including newer beta changes/)
  assert.match(notes, /RELEASE NOTE EDITOR GUIDE/)
  assert.match(notes, /<!-- Hotfix source: v1.2.3; fix PR: #42 -->/)
})

test('hotfix workflows retain explicit CI, stable ancestry, and channel guards', async () => {
  const prepare = await readFile('.github/workflows/prepare-release.yml', 'utf8')
  const publish = await readFile('.github/workflows/release-package.yml', 'utf8')
  const ci = await readFile('.github/workflows/ci.yml', 'utf8')
  const cancel = await readFile('.github/workflows/cancel-merged-release.yml', 'utf8')
  assert.match(prepare, /- hotfix/)
  assert.match(prepare, /node scripts\/prepare-hotfix.mjs/)
  assert.match(prepare, /git commit --amend --reset-author/)
  assert.match(prepare, /gh pr create --base "\$RELEASE_BASE"/)
  assert.match(prepare, /node scripts\/format-release-notes.mjs --hotfix/)
  assert.match(prepare, /name: Run CI for the release pull request\n        env:/)
  const hotfix = await readFile('.github/workflows/hotfix-release.yml', 'utf8')
  assert.match(hotfix, /uses: \.\/\.github\/workflows\/prepare-release.yml/)
  assert.match(hotfix, /channel: hotfix/)
  assert.match(hotfix, /fix_pr: \$\{\{ inputs.fix_pr \}\}/)
  assert.doesNotMatch(hotfix, /version:|type: choice/)
  assert.match(prepare, /workflow_call:/)
  for (const workflow of [ci, publish]) assert.match(workflow, /branches: \[main, 'hotfix\/v\*'\]/)
  assert.match(publish, /refs\/remotes\/origin\/\$RELEASE_BASE/)
  assert.match(publish, /Recheck release order after approval/)
  assert.match(cancel, /DEFAULT_BRANCH: \$\{\{ steps.recovery.outputs.base-branch \}\}/)
})

test('generated release notes are safe and clear for nontechnical editors', () => {
  const generated = `<!-- Release notes generated using configuration in .github/release.yml at main -->

## What's Changed
### Fixes
* Improve validation by @octocat in https://github.com/cmu-sei/sds-lite/pull/12

**Full Changelog**: https://github.com/cmu-sei/sds-lite/commits/v1.2.3`
  const formatted = formatReleaseNotes(generated, '1.2.3')

  assert.match(formatted, /Most releases need no edits/)
  assert.match(formatted, /## Summary/)
  assert.match(formatted, /## Upgrade notes/)
  assert.match(formatted, /No upgrade steps are listed/)
  assert.doesNotMatch(formatted, /migration steps are required/)
  assert.match(formatted, /## Changes/)
  assert.match(formatted, /pull\/12/)
  assert.match(formatted, /Full Changelog/)
  assert.equal(formatReleaseNotes(formatted, '1.2.3'), formatted)
})

test('generated release notes call out breaking changes automatically', () => {
  const formatted = formatReleaseNotes(
    "## What's Changed\n### Breaking changes\n* Remove deprecated entry",
    '2.0.0',
  )

  assert.match(formatted, /contains breaking changes/)
})

test('release note formatter accepts generated notes through standard input', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/format-release-notes.mjs'],
    {
      encoding: 'utf8',
      env: { ...process.env, VERSION: '1.2.3' },
      input: "## What's Changed\n### Fixes\n* Improve validation",
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /SDS Lite 1\.2\.3/)
  assert.match(result.stdout, /Improve validation/)
})

test('release artifacts resolve to one absolute tarball path', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'sds-release-artifact-'))
  context.after(() => rm(directory, { recursive: true, force: true }))

  await assert.rejects(
    locateReleaseArtifact(directory),
    /found 0/,
  )
  await writeFile(join(directory, 'cmu-sei-sds-lite-1.2.3.tgz'), '')

  const tarball = await locateReleaseArtifact(directory)
  assert.equal(isAbsolute(tarball), true)
  assert.equal(tarball, join(directory, 'cmu-sei-sds-lite-1.2.3.tgz'))

  await writeFile(join(directory, 'unexpected.tgz'), '')
  await assert.rejects(
    locateReleaseArtifact(directory),
    /found 2/,
  )
})

test('release publication accepts only absolute tested artifacts', () => {
  assert.deepEqual(
    releasePublishArguments('/tmp/package.tgz', 'beta', true),
    [
      'publish',
      '/tmp/package.tgz',
      '--tag',
      'beta',
      '--ignore-scripts',
      '--dry-run',
    ],
  )
  assert.deepEqual(
    releasePublishArguments('/tmp/package.tgz', 'latest'),
    [
      'publish',
      '/tmp/package.tgz',
      '--tag',
      'latest',
      '--ignore-scripts',
    ],
  )
  assert.throws(
    () => releasePublishArguments('release-artifact/package.tgz', 'latest'),
    /must be absolute/,
  )
  assert.throws(
    () => releasePublishArguments('/tmp/package.tgz', 'next'),
    /must be beta or latest/,
  )
})

test('publication retries repair distribution tags without rolling them backward', () => {
  assert.equal(resolveReleaseDistTag('1.2.4', 'latest', { latest: '1.2.4', beta: '1.3.0-beta.2' }), false)
  assert.equal(resolveReleaseDistTag('1.2.4', 'latest', { latest: '1.2.3' }), true)
  assert.throws(() => resolveReleaseDistTag('1.2.4', 'latest', { latest: '1.3.0' }), /backward/)
  assert.throws(() => resolveReleaseDistTag('1.2.4-beta.1', 'latest', {}), /does not match/)
  assert.throws(() => resolveReleaseDistTag('1.2.4', 'latest', null), /Could not verify/)
  let tags = { latest: '1.2.3', beta: '1.3.0-beta.2' }
  const commands = []
  ensureReleaseDistTag('@cmu-sei/sds-lite', '1.2.4', 'latest', (args) => {
    commands.push(args)
    if (args[0] === 'dist-tag') tags = { ...tags, latest: '1.2.4' }
    return JSON.stringify(tags)
  })
  assert.deepEqual(commands[1], ['dist-tag', 'add', '@cmu-sei/sds-lite@1.2.4', 'latest'])
  assert.equal(tags.beta, '1.3.0-beta.2')
  assert.throws(() => ensureReleaseDistTag('@cmu-sei/sds-lite', '1.2.4', 'latest', () => JSON.stringify({ latest: '1.2.3' })), /Could not confirm/)
})

test('publication checks registry ordering before invoking npm publish', () => {
  let published = false
  const options = { packageName: '@cmu-sei/sds-lite', version: '1.2.4',
    execute: () => JSON.stringify({ latest: '1.3.0' }),
    publish: () => { published = true; return { status: 0 } } }
  assert.throws(() => publishReleaseArtifact('/tmp/release.tgz', 'latest', false, options), /backward/)
  assert.equal(published, false)
  assert.throws(() => checkReleaseDistTag(options.packageName, options.version, 'latest', () => { throw new Error('E401') }), /E401/)
  publishReleaseArtifact('/tmp/release.tgz', 'latest', true, { ...options, execute: () => '{}' })
  assert.equal(published, true)
})

test('the release artifact CLI rejects unknown publish options', () => {
  const result = spawnSync(
    process.execPath,
    [
      'scripts/release-artifact.mjs',
      'publish',
      '/tmp/package.tgz',
      'latest',
      '--unexpected',
    ],
    { encoding: 'utf8' },
  )

  assert.equal(result.status, 1)
  assert.match(result.stderr, /Usage:/)
})

test('GitHub release metadata selects the expected npm tag', () => {
  assert.deepEqual(
    validateRelease({
      packageName: '@cmu-sei/sds-lite',
      version: '1.2.3',
      releaseTag: 'v1.2.3',
      isPrerelease: false,
    }),
    {
      packageName: '@cmu-sei/sds-lite',
      version: '1.2.3',
      distTag: 'latest',
    },
  )
  assert.equal(
    validateRelease({
      packageName: '@cmu-sei/sds-lite',
      version: '1.2.3-beta.1',
      releaseTag: 'v1.2.3-beta.1',
      isPrerelease: true,
    }).distTag,
    'beta',
  )
})

test('GitHub release metadata rejects mismatched tags and channels', () => {
  assert.throws(
    () =>
      validateRelease({
        packageName: '@cmu-sei/sds-lite',
        version: '1.2.3',
        releaseTag: 'v1.2.4',
        isPrerelease: false,
      }),
    /must match/,
  )
  assert.throws(
    () =>
      validateRelease({
        packageName: '@cmu-sei/sds-lite',
        version: '1.2.3-beta.1',
        releaseTag: 'v1.2.3-beta.1',
        isPrerelease: false,
      }),
    /prerelease/,
  )
})

test('workflow release validation requires explicit event metadata', async () => {
  await assert.rejects(
    validateReleaseEnvironment({
      RELEASE_TAG: 'v0.1.0',
      IS_PRERELEASE: 'yes',
    }),
    /either true or false/,
  )
  await assert.rejects(
    validateReleaseEnvironment({ IS_PRERELEASE: 'false' }),
    /RELEASE_TAG is required/,
  )
})

test('workflow release validation rejects versions older than prior tags', () => {
  assert.doesNotThrow(() =>
    validateReleaseOrder('1.3.0-beta.1', 'v1.3.0-beta.1', [
      'not-a-release',
      'v1.2.0',
      'v1.3.0-beta.1',
    ]),
  )
  assert.throws(
    () =>
      validateReleaseOrder('1.1.0', 'v1.1.0', [
        'v1.0.0',
        'v1.2.0',
        'v1.2.0-beta.1',
        'v1.1.0',
      ]),
    /must be greater/,
  )
})

test('browser workflows use containers matching the locked Playwright version', async () => {
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
  const version = lock.packages['node_modules/playwright'].version
  for (const filename of ['ci.yml', 'release-package.yml']) {
    const workflow = await readFile(`.github/workflows/${filename}`, 'utf8')
    assert.ok(workflow.includes(`image: mcr.microsoft.com/playwright:v${version}-noble`))
    assert.match(workflow, /options: --ipc=host/)
    assert.ok(
      /- name: Test browser\n        env:\n          HOME: \/root\n        run: npm run test:browser/.test(workflow),
      `${filename} must run browser tests with a root-owned HOME`,
    )
    assert.doesNotMatch(workflow, /playwright install/)
    assert.match(workflow, /project: \[chromium, firefox, webkit\]/)
  }
})

test('release workflow names state their stage and recovery locks publication', async () => {
  const names = {
    'ci.yml': 'CI - Build and Browser Tests',
    'prepare-release.yml': 'Release - Create Release PR',
    'release-package.yml': 'Release - Publish Merged Release',
    'abandon-release.yml': 'Release - Discard Unmerged Release PR',
    'cancel-merged-release.yml': 'Release - Cancel Merged Unpublished Release',
  }
  for (const [filename, name] of Object.entries(names)) {
    const workflow = await readFile(`.github/workflows/${filename}`, 'utf8')
    assert.equal(workflow.split('\n')[0], `name: ${name}`)
  }
  const publish = await readFile('.github/workflows/release-package.yml', 'utf8')
  const cancel = await readFile('.github/workflows/cancel-merged-release.yml', 'utf8')
  const prepare = await readFile('.github/workflows/prepare-release.yml', 'utf8')
  assert.match(publish, /group: release-publication\n/)
  assert.match(cancel, /group: release-publication\n/)
  assert.match(publish, /release-artifact.mjs verify-tag "\$PACKAGE_NAME" "\$VERSION" "\$DIST_TAG"/)
  assert.match(cancel, /needs: stop/)
  assert.match(cancel, /node scripts\/cancel-release\.mjs request/)
  assert.match(cancel, /node scripts\/cancel-release\.mjs cleanup/)
  assert.match(cancel, /actions: write/)
  assert.match(cancel, /packages: read/)
  assert.match(cancel, /node scripts\/cancel-release\.mjs revert/)
  assert.match(cancel, /gh pr create --base "\$DEFAULT_BRANCH"/)
  assert.match(cancel, /gh workflow run ci\.yml --ref "\$REVERT_BRANCH"/)
  assert.doesNotMatch(cancel, /git push --force|gh pr merge|gh release delete.*--cleanup-tag/)
  assert.match(prepare, /--state merged --head "\$branch" --label release-cancelled/)
  assert.match(prepare, /Choose a newer base version/)
  for (const step of ['Publish the reviewed GitHub release', 'Publish to GitHub Packages']) {
    const block = publish.split(`- name: ${step}\n`)[1].split('\n      - name:')[0]
    assert.match(block, /RELEASE_PR_NUMBER: \$\{\{ github\.event\.pull_request\.number \}\}/)
    assert.match(block, /node scripts\/cancel-release\.mjs assert-active/)
    assert.ok(block.indexOf('assert-active') < block.indexOf(
      step === 'Publish to GitHub Packages' ? 'node scripts/release-artifact.mjs publish' : 'gh release edit',
    ))
  }
})

test('release workflows preserve the prepare-review-publish boundary', async () => {
  const ci = await readFile('.github/workflows/ci.yml', 'utf8')
  const pullRequestTemplate = await readFile(
    '.github/PULL_REQUEST_TEMPLATE.md',
    'utf8',
  )
  const releaseNotes = await readFile('.github/release.yml', 'utf8')
  const abandon = await readFile(
    '.github/workflows/abandon-release.yml',
    'utf8',
  )
  const prepare = await readFile(
    '.github/workflows/prepare-release.yml',
    'utf8',
  )
  const finalize = await readFile(
    '.github/workflows/release-package.yml',
    'utf8',
  )

  assert.match(ci, /project: \[chromium, firefox, webkit\]/)
  assert.match(ci, /run: npm run test:validation/)
  assert.match(
    ci,
    /run: npm run test:browser -- --project=\$\{\{ matrix\.project \}\}/,
  )
  assert.match(ci, /name: Build and test/)
  assert.match(ci, /needs: \[validation, browser\]/)
  assert.doesNotMatch(ci, /^  push:/m)
  assert.doesNotMatch(ci, /committed distribution/)
  assert.doesNotMatch(ci, /committed-dist/)
  assert.doesNotMatch(ci, /playwright install --with-deps chromium firefox webkit/)
  assert.doesNotMatch(ci, /run: npm test$/m)

  assert.doesNotMatch(pullRequestTemplate, /## Release note/)
  assert.doesNotMatch(pullRequestTemplate, /Generated `dist\/` changes/)
  assert.doesNotMatch(pullRequestTemplate, /`internal`, or `release`/)

  assert.match(prepare, /workflow_dispatch:/)
  assert.match(prepare, /type: choice/)
  assert.match(prepare, /- beta/)
  assert.match(prepare, /node scripts\/resolve-release-version\.mjs/)
  assert.match(prepare, /release:prepare -- --version "\$VERSION" --yes/)
  assert.match(prepare, /gh release create "\$TAG"/)
  assert.match(prepare, /OPTIONS=\(--draft --generate-notes/)
  assert.match(prepare, /node scripts\/format-release-notes\.mjs/)
  assert.match(prepare, /gh release edit "\$TAG" --notes-file/)
  assert.match(
    prepare,
    /RELEASE_URL="\$\(gh release view "\$TAG" --json url --jq \.url/,
  )
  assert.ok(
    prepare.indexOf('RELEASE_URL="$(gh release view "$TAG"') >
      prepare.indexOf('gh release edit "$TAG" --notes-file'),
  )
  assert.match(
    prepare,
    /RELEASES_URL="\$GITHUB_SERVER_URL\/\$GITHUB_REPOSITORY\/releases"/,
  )
  assert.match(prepare, /RELEASE_URL="\$RELEASES_URL"/)
  assert.doesNotMatch(prepare, /releases\/edit\/untagged-/)
  assert.doesNotMatch(prepare, /scripts\/release-url\.mjs/)
  assert.match(prepare, /actions: write/)
  assert.match(
    prepare,
    /gh pr edit "\$PR_URL" --title "Release v\$VERSION" --body-file "\$BODY"/,
  )
  assert.match(prepare, /name: Run CI for the release pull request\n        env:/)
  assert.match(prepare, /gh workflow run ci\.yml --ref "\$branch"/)
  assert.doesNotMatch(prepare, /Obtain approval/)
  assert.match(prepare, /reviewed and merged/)
  assert.doesNotMatch(prepare, /playwright install/)
  assert.doesNotMatch(prepare, /run: npm test$/m)
  assert.match(releaseNotes, /authors:\s+\- github-actions\[bot\]/)

  assert.match(finalize, /pull_request:/)
  assert.match(finalize, /types: \[closed\]/)
  assert.match(finalize, /github\.event\.pull_request\.merged == true/)
  assert.match(finalize, /node scripts\/validate-release-pr\.mjs/)
  assert.match(finalize, /environment: \$\{\{/)
  assert.match(finalize, /project: \[chromium, firefox, webkit\]/)
  assert.match(finalize, /run: npm run test:validation/)
  assert.match(finalize, /Preserve the committed distribution/)
  assert.match(finalize, /Verify the committed distribution is current/)
  assert.match(
    finalize,
    /run: npm run test:browser -- --project=\$\{\{ matrix\.project \}\}/,
  )
  assert.match(finalize, /needs: \[build, browser\]/)
  assert.match(finalize, /actions\/upload-artifact@/)
  assert.match(finalize, /actions\/download-artifact@/)
  assert.match(
    finalize,
    /node scripts\/release-artifact\.mjs locate release-artifact/,
  )
  assert.match(finalize, /gh release edit "\$TAG"/)
  assert.match(finalize, /was published outside this workflow/)
  assert.match(finalize, /prerelease setting changed before publication/)
  assert.match(
    finalize,
    /release-artifact\.mjs publish "\$TARBALL" "\$DIST_TAG" --dry-run/,
  )
  assert.match(
    finalize,
    /release-artifact\.mjs publish "\$TARBALL" "\$DIST_TAG"/,
  )
  assert.match(finalize, /### Published v\$VERSION/)
  assert.match(finalize, /packages\/npm\/package\/\$PACKAGE_SLUG/)
  assert.match(
    finalize,
    /cdn\.jsdelivr\.net\/gh\/\$GITHUB_REPOSITORY@v\$VERSION/,
  )
  assert.match(finalize, /GITHUB_STEP_SUMMARY/)
  assert.match(
    finalize,
    /git\/refs\/heads\/\$RELEASE_BRANCH/,
  )
  assert.doesNotMatch(
    finalize,
    /playwright install --with-deps chromium firefox webkit/,
  )
  assert.doesNotMatch(finalize, /run: npm test$/m)
  assert.doesNotMatch(finalize, /^  release:/m)

  assert.match(abandon, /workflow_dispatch:/)
  assert.match(abandon, /group: prepare-release/)
  assert.match(abandon, /node scripts\/abandon-release\.mjs/)
  assert.match(abandon, /gh pr list --state open/)
  assert.match(abandon, /gh pr list --state closed/)
  assert.match(abandon, /select-pull-request/)
  assert.match(abandon, /merged and cannot be abandoned/)
  assert.match(abandon, /is already published and cannot be abandoned/)
  assert.match(abandon, /gh pr close "\$PR_NUMBER"/)
  assert.match(abandon, /gh pr view "\$PR_NUMBER" --json mergedAt/)
  assert.match(abandon, /was published while abandonment was in progress/)
  assert.match(abandon, /gh release delete "\$TAG" --yes/)
  assert.match(abandon, /git\/refs\/heads\/\$BRANCH/)
})
