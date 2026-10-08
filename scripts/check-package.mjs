import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const maximumFileCount = 100
const maximumUnpackedSize = 750_000
const maximumCompressedSizes = {
  'dist/sds.css': 22_000,
  'dist/brand.css': 3_000,
  'dist/auto.js': 13_000,
  'dist/sds.js': 13_000,
}
const requiredFiles = [
  'LICENSE',
  'dist/package/sds.js',
  'dist/sds.css',
  'scripts/migrate.mjs',
]
const forbiddenPrefixes = [
  '.github/',
  'dist/assets/',
  'dist/docs/',
  'e2e/',
  'src/',
  'test/',
  'test-results/',
]
const forbiddenFiles = new Set([
  'dist/custom-elements.json',
  'dist/html-data.json',
  'dist/index.html',
  'dist/interface-manifest.json',
  'dist/interface-manifest.schema.json',
])

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
const assetSizes = []
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
for (const [filename, limit] of Object.entries(maximumCompressedSizes)) {
  const contents = readFileSync(filename)
  const compressedSize = gzipSync(contents).length
  assetSizes.push({ filename, rawSize: contents.length, compressedSize, limit })
  if (compressedSize > limit) {
    errors.push(`${filename} is ${compressedSize} bytes gzipped; limit is ${limit}`)
  }
}
for (const filename of requiredFiles) {
  if (!files.has(filename)) errors.push(`package is missing ${filename}`)
}
for (const filename of files) {
  if (
    forbiddenFiles.has(filename) ||
    forbiddenPrefixes.some((prefix) => filename.startsWith(prefix))
  ) {
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
console.log(`NPM archive: ${report.size} bytes compressed`)
for (const { filename, rawSize, compressedSize, limit } of assetSizes) {
  console.log(
    `${filename}: ${rawSize} bytes raw, ${compressedSize} bytes gzip; ${limit - compressedSize} bytes below budget`,
  )
}
const defaultPayload = assetSizes
  .filter(({ filename }) => ['dist/sds.css', 'dist/auto.js'].includes(filename))
  .reduce((total, { compressedSize }) => total + compressedSize, 0)
console.log(`Default CDN payload: ${defaultPayload} bytes gzip (CSS + automatic setup)`)
