import { spawnSync } from 'node:child_process'

const maximumFileCount = 100
const maximumUnpackedSize = 750_000
const requiredFiles = ['LICENSE', 'package/sds.js', 'scripts/migrate.mjs']
const forbiddenPrefixes = [
  '.github/',
  'dist/',
  'e2e/',
  'src/',
  'test/',
  'test-results/',
]

function fail(message) {
  console.error(message)
  process.exit(1)
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(
  npm,
  ['pack', '--dry-run', '--ignore-scripts', '--json'],
  { encoding: 'utf8' },
)
if (result.status !== 0) {
  process.stderr.write(result.stderr)
  fail(`npm pack --dry-run failed with exit code ${result.status}`)
}

let report
try {
  const reports = JSON.parse(result.stdout)
  report = reports[0]
} catch {
  fail('npm pack --dry-run did not return valid JSON')
}

const files = new Set(report.files.map((file) => file.path))
const errors = []
if (report.entryCount > maximumFileCount) {
  errors.push(
    `package contains ${report.entryCount} files; limit is ${maximumFileCount}`,
  )
}
if (report.unpackedSize > maximumUnpackedSize) {
  errors.push(
    `package is ${report.unpackedSize} bytes unpacked; limit is ${maximumUnpackedSize}`,
  )
}
for (const filename of requiredFiles) {
  if (!files.has(filename)) errors.push(`package is missing ${filename}`)
}
for (const filename of files) {
  if (forbiddenPrefixes.some((prefix) => filename.startsWith(prefix))) {
    errors.push(`package unexpectedly contains ${filename}`)
  }
  if (
    filename.startsWith('scripts/') &&
    filename !== 'scripts/migrate.mjs'
  ) {
    errors.push(`package unexpectedly contains development script ${filename}`)
  }
}
if (errors.length > 0) fail(errors.join('\n'))

console.log(
  `${report.name}@${report.version}: ${report.entryCount} files, ${report.unpackedSize} bytes unpacked`,
)
