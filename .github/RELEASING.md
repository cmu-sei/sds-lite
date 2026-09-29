# Releasing SDS Lite

Publishing a GitHub release is the only deployment trigger. Pushes, pull
requests, tags without a published release, and draft releases never publish a
package. The workflow uses the version already committed to `package.json`; it
does not generate versions, create tags, or modify the repository.

Stable and beta releases use the same build, test, package, and publication
steps:

| GitHub release | Package version | npm tag |
| --- | --- | --- |
| Stable | `1.2.0` | `latest` |
| Prerelease | `1.2.0-beta.1` | `beta` |

Versioned browser files are served from the immutable release tag through
jsDelivr. The npm package is published to GitHub Packages.

## One-time repository setup

1. Create the repository as `cmu-sei/sds-lite`.
2. In **Settings > Actions > General**, allow GitHub Actions to write packages.
3. Create a `github-packages-production` environment. Add required reviewers
   and any production deployment protections.
4. Create a `github-packages-beta` environment. Add protections appropriate
   for prereleases.
5. After the first publication, configure the package's visibility and
   repository access in the organization package settings.
6. Add a repository ruleset for tags matching `v*`. Prevent released tags from
   being updated or deleted because npm versions are immutable and jsDelivr
   caches versioned files permanently.
7. Create the labels used by `.github/release.yml`: `breaking`, `enhancement`,
   `bug`, `documentation`, `internal`, and `release`.
8. Require CI and review before merging to `main`.

No long-lived npm token is required. Publication uses the workflow's
short-lived `GITHUB_TOKEN`.

## Maintain useful history and release notes

- Keep each pull request focused and squash-merge it with a concise,
  user-facing title.
- Apply exactly one release-note label. Use `internal` when users should not
  see the change and `release` for version-only release preparation.
- Describe breaking changes and required migrations in the pull request.
- Do not mix feature work into a release preparation pull request.

GitHub uses `.github/release.yml` to group merged pull requests when
**Generate release notes** is selected. Always edit the generated notes for
clarity before publishing.

## Choose the version

Use Semantic Versioning:

- Increment **major** for an incompatible public API or required migration.
- Increment **minor** for backward-compatible functionality.
- Increment **patch** for backward-compatible fixes.
- Use only explicit beta prerelease versions: `1.3.0-beta.1`, then
  `1.3.0-beta.2`. Alpha, release-candidate, commit-hash, build-metadata, and
  workflow-generated versions are not accepted.
- Release `1.3.0` after its beta series; never reuse a published beta version.
- Every version after the inaugural release must be greater than the version
   currently in `package.json` and every previous valid `v*` release tag. The
   inaugural release may use the already committed package version when no
   valid release tags exist.

## Prepare the release pull request

Choose the version first. Start from a clean branch based on the latest
`main`, replacing the example version in the branch name:

```sh
git switch main
git pull --ff-only
git switch -c release/v1.2.0
npm run release:prepare
```

The script asks these exact questions:

1. `Have all intended changes been merged and is this branch based on the latest main? [y/N]`
2. `Enter the exact version to prepare (current <version>):`
3. `Prepare <stable|beta> release v<version>, update documentation, build, test, and dry-run the package? [y/N]`

After confirmation, it:

1. Validates the version using strict Semantic Versioning.
2. Runs standard npm versioning when the version changes:
   `npm version <version> --no-git-tag-version --ignore-scripts`. The inaugural
   release keeps the already committed version.
3. Updates version-pinned jsDelivr documentation.
4. Builds and runs all tests.
5. dry-runs the package and enforces the limit of 100 files and 750,000
   unpacked bytes.
6. Runs `git diff --check`.

It never stages, commits, tags, pushes, or publishes. If a command fails, it
leaves the changes visible for inspection rather than silently rolling them
back.

Review `git status` and `git diff`. The release PR should contain only:

- The version updates in `package.json` and `package-lock.json`.
- Version-pinned documentation updates.
- The complete regenerated `dist/` directory, including `dist/package/`.
- An exact, approved copy of every required legal file.

The release PR must also record manual accessibility results for keyboard,
200% and 400% zoom, reduced motion, forced colors where supported, and at
least one screen-reader/browser combination on each supported desktop
platform. Include the browser, operating system, assistive technology,
versions, tester, date, and outcome. Do not claim WCAG conformance without a
reviewed conformance assessment for the release.

Title the pull request `Release v<version>`, apply the `release` label, obtain
approval, and merge it normally.

## Publish the GitHub release

After the release PR is merged:

1. Open **Releases > Draft a new release**.
2. Choose **Create new tag** and enter exactly `v<package.json version>`.
3. Set the tag target to `main`.
4. Select **Generate release notes** and edit the result into a concise
   user-facing summary. Include migrations for breaking changes.
5. For a beta version, select **Set as a pre-release**. For a stable version,
   leave it unchecked.
6. Keep the release as a draft until the tag, target, notes, and prerelease
   setting have been reviewed.
7. Select **Publish release**.
8. Approve the matching protected environment when prompted.

Publishing the release starts the workflow. npm publication stops if it finds:

- A tag that does not exactly match `v<package version>`.
- Invalid Semantic Versions.
- A beta version not marked as a GitHub prerelease.
- A stable version marked as a GitHub prerelease.
- A tag whose commit is not contained in `main`.
- A committed `dist/` directory that differs from a clean build.
- A package that exceeds its content or size budget.
- A package version that already exists.

The tag and its CDN files become public as soon as the GitHub release is
published. The workflow gates npm publication but cannot retract an immutable
tag, so publish only after the release PR has passed CI and the draft release
has been reviewed. A bad tag requires a new version.

The unprivileged build job tests and packs the artifact once. The protected
publication job receives only that tarball, checks the registry, performs an
`npm publish --dry-run`, and then publishes it under `beta` or `latest`.

For example, release `v0.1.0` serves:

```text
https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v0.1.0/dist/sds.css
```

## Recover from a failed release

- If environment approval or a temporary service failure prevents
  publication, rerun the failed job after correcting the external problem.
- If the tagged source, version, package, or documentation is wrong, do not
  move or delete the tag. Prepare and publish a new version.
- If the registry reports that the version already exists, verify the existing
  package and prepare a new version. Never overwrite a published version.
