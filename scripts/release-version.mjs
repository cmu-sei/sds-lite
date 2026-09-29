const numericIdentifier = String.raw`(?:0|[1-9][0-9]*)`
const releaseVersionPattern = new RegExp(
  String.raw`^(${numericIdentifier})\.(${numericIdentifier})\.(${numericIdentifier})(?:-beta\.(${numericIdentifier}))?$`,
)

export function parseReleaseVersion(version) {
  const match = releaseVersionPattern.exec(version)
  if (!match) {
    throw new Error(
      `${version} must be a stable version such as 1.2.3 or a beta such as 1.2.3-beta.1`,
    )
  }

  return {
    version,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] !== undefined,
    beta: match[4] === undefined ? undefined : Number(match[4]),
  }
}

export function compareReleaseVersions(leftVersion, rightVersion) {
  const left =
    typeof leftVersion === 'string'
      ? parseReleaseVersion(leftVersion)
      : leftVersion
  const right =
    typeof rightVersion === 'string'
      ? parseReleaseVersion(rightVersion)
      : rightVersion

  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1
  }
  if (left.prerelease !== right.prerelease) {
    return left.prerelease ? -1 : 1
  }
  if (!left.prerelease) return 0
  return Math.sign(left.beta - right.beta)
}

export function assertVersionAdvances(currentVersion, nextVersion) {
  if (compareReleaseVersions(nextVersion, currentVersion) <= 0) {
    throw new Error(
      `Version ${nextVersion} must be greater than current version ${currentVersion}`,
    )
  }
}

export function validatePreparedVersion(currentVersion, nextVersion, tags) {
  const previousVersions = tags.flatMap((tag) => {
    if (!tag.startsWith('v')) return []
    try {
      return [parseReleaseVersion(tag.slice(1)).version]
    } catch {
      return []
    }
  })

  if (nextVersion === currentVersion && previousVersions.length === 0) {
    return
  }
  assertVersionAdvances(currentVersion, nextVersion)

  const latestVersion = previousVersions.sort(compareReleaseVersions).at(-1)
  if (latestVersion) assertVersionAdvances(latestVersion, nextVersion)
}

export function validateRelease({
  packageName,
  version,
  releaseTag,
  isPrerelease,
}) {
  const parsed = parseReleaseVersion(version)
  const expectedTag = `v${version}`

  if (releaseTag !== expectedTag) {
    throw new Error(
      `GitHub release tag ${releaseTag} must match package version ${expectedTag}`,
    )
  }
  if (isPrerelease !== parsed.prerelease) {
    throw new Error(
      parsed.prerelease
        ? `Version ${version} must be published as a GitHub prerelease`
        : `Version ${version} must be published as a stable GitHub release`,
    )
  }

  return {
    packageName,
    version,
    distTag: parsed.prerelease ? 'beta' : 'latest',
  }
}
