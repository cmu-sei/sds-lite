import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
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
  validateReleaseEnvironment,
  validateReleaseOrder,
} from '../scripts/validate-release.mjs'
import { formatReleaseNotes } from '../scripts/format-release-notes.mjs'
import { parsePrepareReleaseArguments } from '../scripts/prepare-release.mjs'
import { draftReleaseEditorUrl } from '../scripts/release-url.mjs'
import {
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

test('draft release links open the GitHub release editor', () => {
  assert.equal(
    draftReleaseEditorUrl(
      'https://github.com/cmu-sei/sds-lite/releases/tag/untagged-8cfa5d9210364dea899a',
    ),
    'https://github.com/cmu-sei/sds-lite/releases/edit/untagged-8cfa5d9210364dea899a',
  )
  assert.throws(
    () => draftReleaseEditorUrl('https://example.com/releases/tag/untagged-1'),
    /GitHub draft release URL/,
  )
  assert.throws(
    () => draftReleaseEditorUrl('https://github.com/cmu-sei/sds-lite/issues/1'),
    /GitHub draft release URL/,
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
        'v1.2.0-beta.1',
        'v1.1.0',
      ]),
    /must be greater/,
  )
})

test('release workflows preserve the prepare-review-publish boundary', async () => {
  const ci = await readFile('.github/workflows/ci.yml', 'utf8')
  const releaseNotes = await readFile('.github/release.yml', 'utf8')
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
  assert.doesNotMatch(ci, /playwright install --with-deps chromium firefox webkit/)
  assert.doesNotMatch(ci, /run: npm test$/m)

  assert.match(prepare, /workflow_dispatch:/)
  assert.match(prepare, /type: choice/)
  assert.match(prepare, /- beta/)
  assert.match(prepare, /actions: write/)
  assert.match(prepare, /node scripts\/resolve-release-version\.mjs/)
  assert.match(prepare, /release:prepare -- --version "\$VERSION" --yes/)
  assert.match(prepare, /gh release create "\$TAG"/)
  assert.match(prepare, /OPTIONS=\(--draft --generate-notes/)
  assert.match(prepare, /node scripts\/release-url\.mjs draft-editor/)
  assert.match(prepare, /node scripts\/format-release-notes\.mjs/)
  assert.match(prepare, /gh release edit "\$TAG" --notes-file/)
  assert.match(prepare, /gh workflow run ci\.yml --ref "\$branch"/)
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
  assert.match(
    finalize,
    /run: npm run test:browser -- --project=\$\{\{ matrix\.project \}\}/,
  )
  assert.match(finalize, /needs: \[build, browser\]/)
  assert.match(finalize, /actions\/upload-artifact@/)
  assert.match(finalize, /actions\/download-artifact@/)
  assert.match(
    finalize,
    /echo "tarball=\$PWD\/\$\{TARBALLS\[0\]\}" >> "\$GITHUB_OUTPUT"/,
  )
  assert.match(finalize, /gh release edit "\$TAG"/)
  assert.match(finalize, /npm publish "\$TARBALL"/)
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
})
