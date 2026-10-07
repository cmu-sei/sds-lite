import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const categories = new Map([
  ['fix', 'bug'],
  ['feat', 'enhancement'],
  ['docs', 'documentation'],
  ['internal', 'internal'],
  ['breaking', 'breaking'],
])

export function resolvePullRequestLabel(title, labels = []) {
  if (labels.some((label) => [...categories.values(), 'release'].includes(label.name))) return null
  const match = /^([a-z][a-z0-9-]*)(?:\([^)]+\))?(!)?:\s+\S/i.exec(title)
  if (!match) return null
  return match[2] ? 'breaking' : categories.get(match[1].toLowerCase()) ?? null
}

export function automatePullRequest(event, repository, execute = spawnSync) {
  const pullRequest = event.pull_request
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      !Number.isSafeInteger(pullRequest?.number) || pullRequest.number < 1 ||
      pullRequest.base?.repo?.full_name !== repository) {
    throw new Error('Invalid pull request metadata')
  }
  if (pullRequest.state !== 'open') return
  const run = (args) => {
    const result = execute('gh', args, { encoding: 'utf8' })
    if (result.status !== 0) throw new Error(result.stderr || 'Pull request automation failed')
    return result.stdout
  }
  const label = resolvePullRequestLabel(pullRequest.title, pullRequest.labels)
  if (label) {
    const existing = JSON.parse(run(['label', 'list', '--repo', repository,
      '--limit', '1000', '--json', 'name']))
    if (!existing.some((entry) => entry.name === label)) {
      run(['label', 'create', label, '--repo', repository, '--color', '0366d6',
        '--description', 'Release-note category'])
    }
    run(['pr', 'edit', String(pullRequest.number), '--repo', repository, '--add-label', label])
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    automatePullRequest(JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8')),
      process.env.GITHUB_REPOSITORY)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}