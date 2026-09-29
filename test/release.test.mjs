import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertVersionAdvances,
  compareReleaseVersions,
  parseReleaseVersion,
  validatePreparedVersion,
  validateRelease,
} from '../scripts/release-version.mjs'
import {
  validateReleaseEnvironment,
  validateReleaseOrder,
} from '../scripts/validate-release.mjs'

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
