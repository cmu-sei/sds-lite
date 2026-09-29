import assert from 'node:assert/strict'
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
import { parsePrepareReleaseArguments } from '../scripts/prepare-release.mjs'
import {
  requiredReleaseChecks,
  validateReleasePullRequest,
} from '../scripts/validate-release-pr.mjs'

const completedReleaseBody = `${requiredReleaseChecks
  .map((check) => `- [x] Complete <!-- release-check:${check} -->`)
  .join('\n')}\n\nAccessibility evidence was recorded.`

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

test('release PR validation requires matching state and completed checks', () => {
  assert.doesNotThrow(() =>
    validateReleasePullRequest({
      body: completedReleaseBody,
      branch: 'release/v1.2.3',
      packageVersion: '1.2.3',
      stateVersion: '1.2.3',
    }),
  )
  assert.throws(
    () =>
      validateReleasePullRequest({
        body: completedReleaseBody,
        branch: 'release/v1.2.4',
        packageVersion: '1.2.3',
        stateVersion: '1.2.3',
      }),
    /branch/,
  )
  assert.throws(
    () =>
      validateReleasePullRequest({
        body: completedReleaseBody.replace('- [x]', '- [ ]'),
        branch: 'release/v1.2.3',
        packageVersion: '1.2.3',
        stateVersion: '1.2.3',
      }),
    /must be completed/,
  )
  assert.throws(
    () =>
      validateReleasePullRequest({
        body: `${completedReleaseBody}\n<!-- release-evidence:replace -->`,
        branch: 'release/v1.2.3',
        packageVersion: '1.2.3',
        stateVersion: '1.2.3',
      }),
    /evidence/,
  )
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
  const prepare = await readFile(
    '.github/workflows/prepare-release.yml',
    'utf8',
  )
  const finalize = await readFile(
    '.github/workflows/release-package.yml',
    'utf8',
  )

  assert.match(prepare, /workflow_dispatch:/)
  assert.match(prepare, /type: choice/)
  assert.match(prepare, /- beta/)
  assert.match(prepare, /actions: write/)
  assert.match(prepare, /node scripts\/resolve-release-version\.mjs/)
  assert.match(prepare, /release:prepare -- --version "\$VERSION" --yes/)
  assert.match(prepare, /gh release create "\$TAG"/)
  assert.match(prepare, /OPTIONS=\(--draft --generate-notes/)
  assert.match(prepare, /gh workflow run ci\.yml --ref "\$branch"/)

  assert.match(finalize, /pull_request:/)
  assert.match(finalize, /types: \[closed\]/)
  assert.match(finalize, /github\.event\.pull_request\.merged == true/)
  assert.match(finalize, /node scripts\/validate-release-pr\.mjs/)
  assert.match(finalize, /environment: \$\{\{/)
  assert.match(finalize, /actions\/upload-artifact@/)
  assert.match(finalize, /actions\/download-artifact@/)
  assert.match(finalize, /gh release edit "\$TAG"/)
  assert.match(finalize, /npm publish "\$TARBALL"/)
  assert.doesNotMatch(finalize, /^  release:/m)
})
