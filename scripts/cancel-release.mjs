import { spawnSync } from 'node:child_process'
import { appendFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

import { resolveAbandonedRelease } from './abandon-release.mjs'

export const cancellationLabel = 'release-cancelled'

function execute(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.error) throw result.error
  return result
}

function requireSuccess(result) {
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Command failed')
  }
  return result.stdout
}

export function assertReleaseActive(pullRequest) {
  if (!Array.isArray(pullRequest.labels)) {
    throw new Error('Could not verify release cancellation state')
  }
  if (pullRequest.labels.some((label) => label.name === cancellationLabel)) {
    throw new Error('This release was cancelled and must not be published')
  }
}

export function validateMergedRelease(pullRequest, release, repository, defaultBranch) {
  if (
    !pullRequest.merged_at ||
    pullRequest.state !== 'closed' ||
    pullRequest.head?.ref !== release.branch ||
    pullRequest.head?.repo?.full_name !== repository ||
    pullRequest.base?.ref !== defaultBranch ||
    !pullRequest.labels?.some((label) => label.name === 'release') ||
    !/^[a-f0-9]{40}$/.test(pullRequest.merge_commit_sha ?? '')
  ) {
    throw new Error('Expected a merged release pull request from this repository')
  }
  if (pullRequest.commits !== 1) {
    throw new Error('Automatic recovery requires a single-commit release PR; recover manually')
  }
}

export function activeReleaseRuns(pages, pullRequest) {
  return pages.flatMap((page) => page.workflow_runs).filter((run) =>
    run.status !== 'completed' && (
      run.head_sha === pullRequest.merge_commit_sha ||
      run.head_sha === pullRequest.head.sha ||
      run.head_branch === pullRequest.head.ref ||
      run.pull_requests?.some((candidate) => candidate.number === pullRequest.number)
    ),
  )
}

export function revertReleaseCommit(commit, run = execute) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A release merge commit is required')
  const parents = requireSuccess(run('git', ['rev-list', '--parents', '-n', '1', commit])).trim().split(/\s+/)
  if (![2, 3].includes(parents.length)) {
    throw new Error('Unsupported release merge. Publication remains blocked; revert manually')
  }
  requireSuccess(run('git', [
    'revert', '--no-commit', ...(parents.length === 3 ? ['-m', '1'] : []), commit,
  ]))
}

export async function cancelRelease({
  phase,
  version,
  confirmation,
  repository,
  defaultBranch,
  run = execute,
  wait = setTimeout,
}) {
  const release = resolveAbandonedRelease(version, confirmation)
  if (!repository || !defaultBranch) throw new Error('Repository and default branch are required')
  const api = (endpoint) => JSON.parse(requireSuccess(run('gh', ['api', endpoint])))
  const optionalApi = (endpoint) => {
    const result = run('gh', ['api', endpoint])
    if (result.status === 0) return JSON.parse(result.stdout)
    if (/HTTP 404/.test(result.stderr)) return null
    requireSuccess(result)
  }
  const candidates = JSON.parse(requireSuccess(run('gh', [
    'pr', 'list', '--repo', repository, '--state', 'merged', '--head', release.branch,
    '--label', 'release', '--limit', '2', '--json', 'number',
  ])))
  if (candidates.length !== 1) throw new Error('Expected exactly one merged release PR')
  const pullRequest = api(`repos/${repository}/pulls/${candidates[0].number}`)
  validateMergedRelease(pullRequest, release, repository, defaultBranch)
  const contents = api(`repos/${repository}/contents/package.json?ref=${pullRequest.merge_commit_sha}`)
  const packageJson = JSON.parse(Buffer.from(contents.content, 'base64').toString('utf8'))
  if (packageJson.version !== release.version || packageJson.name !== '@cmu-sei/sds-lite') {
    throw new Error('Merged package metadata does not match the requested release')
  }
  const verifyUnpublished = () => {
    const githubRelease = optionalApi(`repos/${repository}/releases/tags/${release.tag}`)
    if (githubRelease && githubRelease.draft !== true) {
      throw new Error('GitHub release is already published; cancellation is not allowed')
    }
    if (optionalApi(`repos/${repository}/git/ref/tags/${release.tag}`)) {
      throw new Error('Release tag already exists; cancellation is not allowed')
    }
    const result = run('npm', [
      'view', `${packageJson.name}@${release.version}`, 'version', '--json',
      '--registry=https://npm.pkg.github.com',
    ])
    if (result.status === 0) {
      throw new Error('Package version is already published; cancellation is not allowed')
    }
    let error
    try {
      error = JSON.parse(result.stdout).error
    } catch {
      throw new Error('Could not verify package publication state')
    }
    if (error?.code !== 'E404') {
      throw new Error('Could not verify package publication state')
    }
    return githubRelease
  }
  const listRuns = () => {
    const pages = JSON.parse(requireSuccess(run('gh', [
      'api', '--paginate', '--slurp',
      `repos/${repository}/actions/workflows/release-package.yml/runs?per_page=100`,
    ])))
    return activeReleaseRuns(pages, pullRequest)
  }
  if (phase === 'request') {
    verifyUnpublished()
    requireSuccess(run('gh', [
      'label', 'create', cancellationLabel, '--repo', repository,
      '--color', 'b60205', '--description', 'Permanently blocks publication of this release PR', '--force',
    ]))
    requireSuccess(run('gh', [
      'pr', 'edit', String(pullRequest.number), '--repo', repository,
      '--add-label', cancellationLabel,
    ]))
    const runs = listRuns()
    for (const active of runs) {
      const result = run('gh', [
        'api', '--method', 'POST', `repos/${repository}/actions/runs/${active.id}/cancel`,
      ])
      if (result.status !== 0 && api(`repos/${repository}/actions/runs/${active.id}`).status !== 'completed') {
        requireSuccess(result)
      }
    }
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (listRuns().length === 0) return { ...release, pullRequest }
      await wait(2000)
    }
    throw new Error('Finalization is still active; cancellation marker remains set. Rerun cancellation')
  }
  if (phase !== 'cleanup') throw new Error('Expected request or cleanup phase')
  if (!pullRequest.labels.some((label) => label.name === cancellationLabel)) {
    throw new Error('Request cancellation before cleaning up a merged release')
  }
  if (listRuns().length !== 0) {
    throw new Error('Finalization is still active; rerun cancellation before cleanup')
  }
  const githubRelease = verifyUnpublished()
  if (githubRelease) {
    requireSuccess(run('gh', ['release', 'delete', release.tag, '--repo', repository, '--yes']))
  }
  return { ...release, pullRequest }
}

async function main() {
  const [phase, ...args] = process.argv.slice(2)
  if (args.length || !['request', 'cleanup', 'assert-active', 'revert'].includes(phase)) {
    throw new Error('Usage: cancel-release.mjs request|cleanup|assert-active|revert')
  }
  if (phase === 'revert') {
    revertReleaseCommit(process.env.MERGE_COMMIT)
    return
  }
  if (phase === 'assert-active') {
    if (!/^\d+$/.test(process.env.RELEASE_PR_NUMBER ?? '') || !process.env.GITHUB_REPOSITORY) {
      throw new Error('RELEASE_PR_NUMBER and GITHUB_REPOSITORY are required')
    }
    const pullRequest = JSON.parse(requireSuccess(execute('gh', [
      'api', `repos/${process.env.GITHUB_REPOSITORY}/pulls/${process.env.RELEASE_PR_NUMBER}`,
    ])))
    assertReleaseActive(pullRequest)
    return
  }
  const release = await cancelRelease({
    phase,
    version: process.env.RELEASE_VERSION,
    confirmation: process.env.RELEASE_CONFIRMATION,
    repository: process.env.GITHUB_REPOSITORY,
    defaultBranch: process.env.DEFAULT_BRANCH,
  })
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, [
      `version=${release.version}`,
      `tag=${release.tag}`,
      `pull-request=${release.pullRequest.number}`,
      `merge-commit=${release.pullRequest.merge_commit_sha}`,
      `revert-branch=recovery/cancel-${release.tag}`,
      '',
    ].join('\n'))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`::error::${error.message}`)
    process.exitCode = 1
  })
}