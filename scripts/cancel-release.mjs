import { spawnSync } from 'node:child_process'
import { appendFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

import { assertPackageUnpublished, resolveAbandonedRelease, verifyReleaseCommitMetadata } from './abandon-release.mjs'

export const cancellationLabel = 'release-cancelled'
export const cancellationContext = 'sds-release/cancelled'

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

export function isReleaseCancelled(repository, commit, run = execute) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
      !/^[a-f0-9]{40}$/.test(commit ?? '')) {
    throw new Error('Repository and merged release commit are required')
  }
  const pages = JSON.parse(requireSuccess(run('gh', ['api', '--paginate', '--slurp',
    `repos/${repository}/commits/${commit}/statuses?per_page=100`])))
  if (!Array.isArray(pages) || pages.some((page) => !Array.isArray(page))) {
    throw new Error('Could not verify durable release cancellation state')
  }
  return pages.flat().some((status) => status.context === cancellationContext &&
    ['error', 'failure'].includes(status.state))
}

export function assertReleaseActive(pullRequest, repository, run = execute) {
  if (!Array.isArray(pullRequest.labels)) {
    throw new Error('Could not verify release cancellation state')
  }
  if (pullRequest.labels.some((label) => label.name === cancellationLabel) ||
      repository && isReleaseCancelled(repository, pullRequest.merge_commit_sha, run)) {
    throw new Error('This release was cancelled and must not be published')
  }
}

export function validateMergedRelease(pullRequest, release, repository, defaultBranch) {
  if (
    !pullRequest.merged_at ||
    pullRequest.state !== 'closed' ||
    pullRequest.head?.ref !== release.branch ||
    pullRequest.head?.repo?.full_name !== repository ||
    (pullRequest.base?.ref !== defaultBranch &&
      (release.version.includes('-') || pullRequest.base?.ref !== `hotfix/v${release.version}`)) ||
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

export function verifyReleaseRevert(releaseCommit, recoveryCommit, run = execute) {
  if (![releaseCommit, recoveryCommit].every((commit) => /^[a-f0-9]{40}$/.test(commit ?? '')) ||
      releaseCommit === recoveryCommit) {
    throw new Error('Distinct release and recovery commits are required')
  }
  const git = (args) => requireSuccess(run('git', args)).trim()
  const releaseParents = git(['rev-list', '--parents', '-n', '1', releaseCommit]).split(/\s+/)
  const recoveryParents = git(['rev-list', '--parents', '-n', '1', recoveryCommit]).split(/\s+/)
  if (![2, 3].includes(releaseParents.length) || ![2, 3].includes(recoveryParents.length)) {
    throw new Error('Unsupported recovery history; review the release revert manually')
  }
  git(['merge-base', '--is-ancestor', releaseCommit, recoveryParents[1]])
  const expectedTree = git(['merge-tree', '--write-tree', `--merge-base=${releaseCommit}`,
    recoveryParents[1], releaseParents[1]])
  const actualTree = git(['rev-parse', `${recoveryCommit}^{tree}`])
  if (expectedTree !== actualTree || expectedTree === git(['rev-parse', `${recoveryParents[1]}^{tree}`])) {
    throw new Error('Recovery commit must reverse only the release commit and preserve later work')
  }
}

export function verifyRecoveryPullRequest(pullRequest, {
  repository, releaseCommit, branch, baseBranch, mergedAfter, requireMerged = false,
}, run = execute) {
  const merged = Boolean(pullRequest.merged_at)
  if (!Number.isSafeInteger(pullRequest.number) || pullRequest.number < 1 ||
      pullRequest.head?.repo?.full_name !== repository || pullRequest.head?.ref !== branch ||
      pullRequest.base?.repo?.full_name !== repository || pullRequest.base?.ref !== baseBranch ||
      pullRequest.commits !== 1 || !['open', 'closed'].includes(pullRequest.state) ||
      requireMerged && !merged || merged && (pullRequest.state !== 'closed' ||
        !(Date.parse(pullRequest.merged_at) > Date.parse(mergedAfter)))) {
    throw new Error('Expected a single-commit recovery PR from this repository on the original base, merged after the release when required')
  }
  const recoveryCommit = merged ? pullRequest.merge_commit_sha : pullRequest.head.sha
  if (![releaseCommit, recoveryCommit].every((commit) => /^[a-f0-9]{40}$/.test(commit ?? '')) ||
      releaseCommit === recoveryCommit) {
    throw new Error('Distinct release and recovery commits are required')
  }
  requireSuccess(run('git', ['fetch', 'origin', releaseCommit, recoveryCommit]))
  verifyReleaseRevert(releaseCommit, recoveryCommit, run)
  requireSuccess(run('git', ['fetch', 'origin', `refs/heads/${baseBranch}`]))
  if (merged) {
    requireSuccess(run('git', ['merge-base', '--is-ancestor', recoveryCommit, 'FETCH_HEAD']))
  } else {
    requireSuccess(run('git', ['merge-base', '--is-ancestor', `${recoveryCommit}^1`, 'FETCH_HEAD']))
    const count = requireSuccess(run('git', ['rev-list', '--count', `FETCH_HEAD..${recoveryCommit}`])).trim()
    if (count !== '1') throw new Error('Recovery branch must contain only its release revert')
  }
}

export function findRecoveryPullRequest(options, run = execute) {
  const { repository, branch, baseBranch } = options
  const endpoint = `repos/${repository}/pulls?state=all&per_page=100&head=${encodeURIComponent(`${repository.split('/')[0]}:${branch}`)}&base=${encodeURIComponent(baseBranch)}`
  const pages = JSON.parse(requireSuccess(run('gh', ['api', '--paginate', '--slurp', endpoint])))
  const candidates = pages.flat().filter((candidate) =>
    candidate.head?.repo?.full_name === repository && candidate.head?.ref === branch &&
    candidate.base?.repo?.full_name === repository && candidate.base?.ref === baseBranch)
  if (candidates.length > 1) throw new Error('Multiple recovery PRs match this release; review them manually')
  if (!candidates.length) return null
  const pullRequest = JSON.parse(requireSuccess(run('gh', [
    'api', `repos/${repository}/pulls/${candidates[0].number}`,
  ])))
  verifyRecoveryPullRequest(pullRequest, options, run)
  return pullRequest
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
    '--limit', '1000', '--json', 'number,isCrossRepository',
  ]))).filter((pr) => !pr.isCrossRepository)
  if (candidates.length !== 1) throw new Error('Expected exactly one merged release PR')
  const pullRequest = api(`repos/${repository}/pulls/${candidates[0].number}`)
  validateMergedRelease(pullRequest, release, repository, defaultBranch)
  verifyReleaseCommitMetadata(repository, pullRequest.merge_commit_sha, release.version, run)
  const verifyUnpublished = () => {
    const githubRelease = optionalApi(`repos/${repository}/releases/tags/${release.tag}`)
    if (githubRelease && githubRelease.draft !== true) {
      throw new Error('GitHub release is already published; cancellation is not allowed')
    }
    if (optionalApi(`repos/${repository}/git/ref/tags/${release.tag}`)) {
      throw new Error('Release tag already exists; cancellation is not allowed')
    }
    assertPackageUnpublished('@cmu-sei/sds-lite', release.version, run)
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
    throw new Error('Finalization is still active; cancellation is not complete. Rerun cancellation')
  }
  if (phase !== 'cleanup') throw new Error('Expected request or cleanup phase')
  if (listRuns().length !== 0) {
    throw new Error('Finalization is still active; rerun cancellation before cleanup')
  }
  const githubRelease = verifyUnpublished()
  if (!isReleaseCancelled(repository, pullRequest.merge_commit_sha, run)) {
    requireSuccess(run('gh', ['api', '--method', 'POST',
      `repos/${repository}/statuses/${pullRequest.merge_commit_sha}`,
      '-f', 'state=error', '-f', `context=${cancellationContext}`,
      '-f', `description=Cancelled ${release.tag} (release PR #${pullRequest.number})`]))
  }
  if (!isReleaseCancelled(repository, pullRequest.merge_commit_sha, run)) {
    throw new Error('Could not confirm durable cancellation; rerun cancellation')
  }
  requireSuccess(run('gh', [
    'label', 'create', cancellationLabel, '--repo', repository,
    '--color', 'b60205', '--description', 'Permanently blocks publication of this release PR', '--force',
  ]))
  requireSuccess(run('gh', [
    'pr', 'edit', String(pullRequest.number), '--repo', repository,
    '--add-label', cancellationLabel,
  ]))
  if (githubRelease) {
    requireSuccess(run('gh', ['release', 'delete', release.tag, '--repo', repository, '--yes']))
  }
  return { ...release, pullRequest }
}

async function main() {
  const [phase, ...args] = process.argv.slice(2)
  if (args.length || !['request', 'cleanup', 'assert-active', 'revert', 'verify-revert', 'recovery-pr'].includes(phase)) {
    throw new Error('Usage: cancel-release.mjs request|cleanup|assert-active|revert|verify-revert|recovery-pr')
  }
  if (phase === 'verify-revert') {
    const commit = requireSuccess(execute('git', ['rev-parse', 'HEAD'])).trim()
    verifyReleaseRevert(process.env.MERGE_COMMIT, commit)
    requireSuccess(execute('git', ['fetch', 'origin', `refs/heads/${process.env.DEFAULT_BRANCH}`]))
    requireSuccess(execute('git', ['merge-base', '--is-ancestor', `${commit}^1`, 'FETCH_HEAD']))
    const count = requireSuccess(execute('git', ['rev-list', '--count', `FETCH_HEAD..${commit}`])).trim()
    if (count !== '1') throw new Error('Recovery branch must contain only its release revert')
    return
  }
  if (phase === 'recovery-pr') {
    const repository = process.env.GITHUB_REPOSITORY
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') ||
        !/^\d+$/.test(process.env.RELEASE_PR_NUMBER ?? '') || !process.env.TAG?.startsWith('v')) {
      throw new Error('Repository, release PR number, and tag are required')
    }
    const version = process.env.TAG.slice(1)
    const release = resolveAbandonedRelease(version, version)
    const pullRequest = JSON.parse(requireSuccess(execute('gh', [
      'api', `repos/${repository}/pulls/${process.env.RELEASE_PR_NUMBER}`,
    ])))
    validateMergedRelease(pullRequest, release, repository, process.env.DEFAULT_BRANCH)
    if (pullRequest.merge_commit_sha !== process.env.MERGE_COMMIT ||
        process.env.REVERT_BRANCH !== `recovery/cancel-${release.tag}`) {
      throw new Error('Recovery inputs do not match the cancelled release')
    }
    const recovery = findRecoveryPullRequest({ repository, releaseCommit: pullRequest.merge_commit_sha,
      branch: process.env.REVERT_BRANCH, baseBranch: pullRequest.base.ref, mergedAfter: pullRequest.merged_at })
    console.log(JSON.stringify(recovery ? { url: recovery.html_url,
      state: recovery.merged_at ? 'MERGED' : recovery.state.toUpperCase() } : { url: '', state: '' }))
    return
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
    assertReleaseActive(pullRequest, process.env.GITHUB_REPOSITORY)
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
      `base-branch=${release.pullRequest.base.ref}`,
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