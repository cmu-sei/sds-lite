import { spawnSync } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { parseReleaseVersion } from './release-version.mjs'

export function resolveHotfix({ latestVersion, fix, repository, pullRequest, reservedVersions = [] }) {
  const latest = parseReleaseVersion(latestVersion)
  if (latest.prerelease) throw new Error('The latest package must be a stable release')
  const number = /^\d+$/.test(fix) ? Number(fix) : (() => {
    let url
    try { url = new URL(fix) } catch { throw new Error('Paste a merged fix PR link or number') }
    const match = /^\/([^/]+\/[^/]+)\/pull\/([1-9][0-9]*)\/?$/.exec(url.pathname)
    if (url.origin !== 'https://github.com' || match?.[1] !== repository) {
      throw new Error('The fix PR must belong to this repository')
    }
    return Number(match[2])
  })()
  if (!Number.isSafeInteger(number) || number < 1 || pullRequest.number !== number ||
      !pullRequest.merged_at || pullRequest.base?.ref !== 'main' ||
      pullRequest.base?.repo?.full_name !== repository ||
      pullRequest.head?.ref?.startsWith('release/v') ||
      !/^[a-f0-9]{40}$/.test(pullRequest.merge_commit_sha ?? '')) {
    throw new Error('Choose a fix PR already merged into main, not a release PR')
  }
  let patch = latest.patch + 1
  while (reservedVersions.some((version) => version === `${latest.major}.${latest.minor}.${patch}` ||
    version.startsWith(`${latest.major}.${latest.minor}.${patch}-`))) patch += 1
  const version = `${latest.major}.${latest.minor}.${patch}`
  return { version, tag: `v${version}`, baseTag: `v${latestVersion}`,
    baseBranch: `hotfix/v${version}`, branch: `release/v${version}`,
    fixNumber: number, fixCommit: pullRequest.merge_commit_sha }
}

function run(command, args, input) {
  const result = spawnSync(command, args, { encoding: 'utf8', input })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`)
  return args.includes('Accept: application/vnd.github.diff') || (command === 'git' && args[0] === 'diff')
    ? result.stdout : result.stdout.trim()
}

export function validateHotfixDraft(draft, hotfix) {
  if (!draft) return
  if (draft.isDraft !== true || draft.isPrerelease !== false) {
    throw new Error(`${hotfix.tag} must be an unpublished stable draft`)
  }
  const marker = `<!-- Hotfix source: ${hotfix.baseTag}; fix PR: #${hotfix.fixNumber} -->`
  if (!draft.body?.includes(marker)) {
    throw new Error(`${hotfix.tag} has notes for a different or unverified fix. Discard that release before selecting this fix`)
  }
}

export function applyHotfix(commit, execute = run, pullRequest) {
  if (pullRequest) {
    const parents = execute('git', ['rev-list', '--parents', '-n', '1', commit]).split(/\s+/)
    if (![2, 3].includes(parents.length)) throw new Error('Unsupported fix merge')
    const patch = execute('git', ['diff', '--binary', parents[1], commit])
    if (!patch.trim()) throw new Error('The selected fix PR has no changes')
    if (parents.length === 2 && pullRequest.commits > 1) {
      const patchId = (source) => execute('git', ['patch-id', '--stable'], source).split(/\s+/)[0]
      if (patchId(`${patch}\n`) !== patchId(pullRequest.diff)) {
        throw new Error('Cannot safely backport this multi-commit fix. Ask a maintainer for a single-commit or squash-merged fix PR')
      }
    }
    try {
      execute('git', ['apply', '--3way', '--index', '-'], `${patch}\n`)
      execute('git', ['commit', '-C', commit])
    } catch (error) {
      throw new Error(`The fix cannot be applied cleanly to latest. Ask a maintainer for a compatible fix PR. ${error.message}`)
    }
    return
  }
  const parents = execute('git', ['rev-list', '--parents', '-n', '1', commit]).split(/\s+/)
  if (![2, 3].includes(parents.length)) throw new Error('Unsupported fix merge; ask a maintainer to prepare a focused fix PR')
  try {
    execute('git', ['cherry-pick', ...(parents.length === 3 ? ['-m', '1'] : []), commit])
  } catch (error) {
    throw new Error(`The fix cannot be applied cleanly to latest. Ask a maintainer for a compatible fix PR. ${error.message}`)
  }
}

export async function prepareHotfix({ env = process.env, execute = run, cwd = process.cwd() } = {}) {
  const run = execute
  const repository = env.GITHUB_REPOSITORY
  const fix = (env.HOTFIX_PR ?? '').trim()
  if (!repository || !fix) throw new Error('Hotfix requires a merged fix PR link or number')
  const number = /^\d+$/.test(fix) ? fix : (() => {
    const url = new URL(fix)
    if (url.origin !== 'https://github.com' || !url.pathname.startsWith(`/${repository}/pull/`)) {
      throw new Error('The fix PR must belong to this repository')
    }
    return url.pathname.split('/')[4]
  })()
  if (!/^[1-9][0-9]*$/.test(number)) throw new Error('Paste a merged fix PR link or number')
  const packageJson = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
  const latestVersion = JSON.parse(run('npm', ['view', packageJson.name, 'dist-tags.latest', '--json', '--registry=https://npm.pkg.github.com']))
  const pullRequest = JSON.parse(run('gh', ['api', `repos/${repository}/pulls/${number}`]))
  const diff = run('gh', ['api', '-H', 'Accept: application/vnd.github.diff', `repos/${repository}/pulls/${number}`])
  const merged = JSON.parse(run('gh', ['pr', 'list', '--state', 'merged',
    '--limit', '1000', '--json', 'headRefName,isCrossRepository']))
  const reservedVersions = [...run('git', ['tag', '--list', 'v*']).split('\n').map((tag) => tag.slice(1)),
    ...merged.filter((pr) => !pr.isCrossRepository && pr.headRefName.startsWith('release/v'))
      .map((pr) => pr.headRefName.slice('release/v'.length))]
  const hotfix = resolveHotfix({ latestVersion, fix, repository, pullRequest, reservedVersions })
  let draft
  try {
    draft = JSON.parse(run('gh', ['release', 'view', hotfix.tag, '--json', 'isDraft,isPrerelease,body']))
  } catch (error) {
    if (!/release not found/i.test(error.message)) throw error
  }
  validateHotfixDraft(draft, hotfix)
  const open = JSON.parse(run('gh', ['pr', 'list', '--state', 'open', '--limit', '1000', '--json', 'headRefName,isCrossRepository']))
  if (open.some((pr) => !pr.isCrossRepository && pr.headRefName.startsWith('release/v') && pr.headRefName !== hotfix.branch)) {
    throw new Error('Another release PR is open. Finish or discard it before preparing this hotfix')
  }
  const candidates = JSON.parse(run('gh', ['pr', 'list', '--state', 'all', '--head', hotfix.branch,
    '--limit', '1000', '--json', 'number,state,baseRefName,body,isCrossRepository']))
    .filter((pr) => !pr.isCrossRepository)
  if (candidates.some((pr) => pr.state === 'MERGED')) {
    throw new Error('This version is already merged. Publish or cancel it before preparing another')
  }
  if (candidates.some((pr) => pr.state === 'OPEN' && pr.baseRefName !== hotfix.baseBranch)) {
    throw new Error('An existing release PR targets a different base. Discard it before preparing this hotfix')
  }
  if (candidates.some((pr) => pr.state === 'OPEN' &&
    !pr.body?.includes(`Applies fix #${hotfix.fixNumber} to ${hotfix.baseTag} and publishes to latest.`))) {
    throw new Error('This hotfix was prepared with a different fix. Discard its release PR before choosing another fix')
  }
  const release = JSON.parse(run('gh', ['release', 'view', hotfix.baseTag, '--json', 'isDraft,isPrerelease']))
  if (release.isDraft || release.isPrerelease) throw new Error('The latest package must have a published stable GitHub release')
  const source = run('git', ['rev-parse', 'HEAD'])
  run('git', ['merge-base', '--is-ancestor', hotfix.fixCommit, source])
  run('git', ['fetch', 'origin', `refs/pull/${hotfix.fixNumber}/head`])
  if (run('git', ['rev-parse', 'FETCH_HEAD']) !== pullRequest.head?.sha) {
    throw new Error('The fix PR source has changed; review it before retrying')
  }
  const stablePackage = JSON.parse(run('git', ['show', `${hotfix.baseTag}:package.json`]))
  if (stablePackage.version !== latestVersion || stablePackage.name !== packageJson.name) {
    throw new Error('The latest package and stable release tag do not match')
  }
  run('git', ['config', 'user.name', 'github-actions[bot]'])
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
  const existing = run('git', ['ls-remote', '--heads', 'origin', `refs/heads/${hotfix.baseBranch}`])
  if (existing) {
    run('git', ['fetch', 'origin', `refs/heads/${hotfix.baseBranch}`])
    run('git', ['switch', '-C', hotfix.baseBranch, 'FETCH_HEAD'])
    run('git', ['merge-base', '--is-ancestor', hotfix.baseTag, 'HEAD'])
    const basePackage = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
    if (basePackage.version !== latestVersion) throw new Error('Hotfix base has changed; ask a maintainer to review it')
  } else {
    run('git', ['switch', '--create', hotfix.baseBranch, hotfix.baseTag])
    run('git', ['commit', '--allow-empty', '-m', `release: enable hotfix automation for ${hotfix.tag}`])
    run('git', ['push', 'origin', hotfix.baseBranch])
  }
  run('git', ['switch', '-C', hotfix.branch])
  run('git', ['restore', '--source', source, '--staged', '--worktree', '--',
    'scripts/prepare-hotfix.mjs', 'scripts/prepare-release.mjs', 'scripts/release-version.mjs',
    'scripts/resolve-release-version.mjs', 'scripts/validate-release.mjs', 'scripts/validate-release-pr.mjs',
    'scripts/cancel-release.mjs', 'scripts/abandon-release.mjs', 'scripts/release-artifact.mjs',
    'scripts/format-release-notes.mjs', 'scripts/pull-request.mjs', 'scripts/pages-release.mjs',
    'test/release.test.mjs', '.github/workflows', '.github/RELEASING.md'])
  applyHotfix(hotfix.fixCommit, run, { diff, commits: pullRequest.commits })
  await appendFile(env.GITHUB_ENV, [
    `VERSION=${hotfix.version}`, `TAG=${hotfix.tag}`, `branch=${hotfix.branch}`,
    `RELEASE_BASE=${hotfix.baseBranch}`, `NOTES_START_TAG=${hotfix.baseTag}`,
    `HOTFIX_NUMBER=${hotfix.fixNumber}`, '',
  ].join('\n'))
  await appendFile(env.GITHUB_STEP_SUMMARY,
    `Hotfix ${hotfix.tag}: apply fix PR #${hotfix.fixNumber} to ${hotfix.baseTag}. Beta code stays on main.\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepareHotfix().catch((error) => {
    console.error(`::error::${error.message}`)
    process.exitCode = 1
  })
}