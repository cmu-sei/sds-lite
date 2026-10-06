# Releasing SDS Lite

You can run a release entirely in GitHub. Automation builds, tests, and publishes
the package; you choose what to release, review the changes, and approve
publication. No local setup or terminal commands are needed.

## Before you start

- Ask a maintainer to confirm that [repository setup](#one-time-repository-setup)
  is complete and that the updated release workflows are on `main`.
- You need permission to run workflows and merge pull requests. A pull request
  (PR) is GitHub's review page for proposed changes.
- Arrange for an eligible PR reviewer and a deployment approver. If you cannot
  approve a deployment yourself, ask the team's authorized reviewer to do it.
- Finish or discard any open release PR before starting another. If a release
  is already merged, finish its publication or cancellation first.

**Do not create release tags, publish draft releases, run `npm publish`, or edit
generated version files yourself.** Use the workflows below.

## Choose your release

| What you want to do | Release type | Where to start |
| --- | --- | --- |
| Publish the changes on `main` for general use | Stable; updates `latest` | [Start a stable or beta release](#start-a-stable-or-beta-release) |
| Publish the changes on `main` for testing before a stable release | Beta; updates `beta` | [Start a stable or beta release](#start-a-stable-or-beta-release) |
| Fix the current stable release without including newer work on `main` | Hotfix; updates `latest`, leaves `beta` unchanged | [Start a hotfix](#start-a-hotfix) |

`latest` and `beta` are package labels that point to the most recent release in
each channel. A stable release includes the current code on `main`; a hotfix
includes only the selected fix applied to the current stable release.

## Start a stable or beta release

1. Ask a maintainer to confirm that all intended changes are merged into `main`
   and choose the version using [the version guide](#choose-the-version).
2. Open [Release - Create Release PR](https://github.com/cmu-sei/sds-lite/actions/workflows/prepare-release.yml)
   in the repository's **Actions** tab, then click **Run workflow**.
3. Leave **Use workflow from** set to `main`.
4. Choose `stable` or `beta` in **channel**.
5. Enter the intended stable version in **version**, such as `1.3.0`. Do not
   include `v` or `-beta.N`. Leave **fix_pr** blank.
6. Click **Run workflow**. Open the new run and wait for it to finish.
7. Open the release PR linked in the run's summary, then follow
   [Finish the release](#finish-the-release).

For `stable`, entering `1.3.0` prepares version `1.3.0`. For `beta`, the same
input prepares `1.3.0-beta.1`, or the next beta number if previous betas exist.
You do not need to calculate the beta number.

## Start a hotfix

Use a hotfix when the stable package needs a fix but `main` contains changes
that should not reach stable users yet. For example, with `latest` at `1.2.3`
and `beta` at `1.3.0-beta.2`, a hotfix normally publishes `1.2.4` to `latest`
without changing `beta`.

1. Ask a maintainer for the link to a focused, backward-compatible fix PR
   already merged into `main`. This keeps the fix in future releases too.
2. Open [Release - Hotfix Latest](https://github.com/cmu-sei/sds-lite/actions/workflows/hotfix-release.yml)
   in **Actions**, then click **Run workflow**.
3. Leave **Use workflow from** set to `main`. Paste the fix PR link into
   **fix_pr**; a PR number also works. This is the only input.
4. Click **Run workflow**. Open the new run and wait for it to finish.
5. Open the release PR linked in the summary, then follow
   [Finish the release](#finish-the-release). Keep its target branch as
   `hotfix/v<version>`; do not change it to `main`.

Automation reads the registry's current `latest` version and selects the next
available patch, skipping released or cancelled versions. You do not enter a
version or choose a channel.

Prefer squash-merged fixes. If the fix does not apply cleanly, or a multi-commit
rebase cannot be safely backported, preparation stops. Ask a maintainer for a
compatible fix PR rather than trying to force the release through.

## Finish the release

Follow these steps for stable, beta, and hotfix releases.

1. **Review the release PR.** Open **Files changed** and ask a maintainer to
   confirm that the changes are expected. Normal releases update version
   files, version-pinned documentation, generated `dist/` files, and the release
   state marker. Hotfixes also include the selected fix. Unexpected code or
   legal-file changes need investigation before merging.
2. **Review the draft release notes.** Follow the draft link in the PR's
   **Finish this release** section. Check that the notes accurately describe
   the release. Use [the editing guidance](#edit-release-notes) if changes are
   needed. Save edits as a draft; do not click **Publish release**.
3. **Wait for checks and review.** The **Build and test** check must pass, and
   an eligible reviewer must approve the PR. If checks fail, use
   [the recovery guide](#recover-from-a-failed-release).
4. **Merge the PR once.** Use GitHub's normal merge controls. This confirms
   that the generated changes and draft notes have been reviewed and starts
   **Release - Publish Merged Release** automatically.
5. **Approve publication.** Open that workflow run in **Actions**. It rebuilds
   and tests the merged code before waiting for deployment approval. When
   **Review deployments** appears, an authorized reviewer should approve
   `github-packages-production` for stable/hotfix releases, or
   `github-packages-beta` for beta releases if approval is configured.
6. **Confirm success.** Wait for the publication run to finish successfully.
   Its summary links to the GitHub release, GitHub Package, and versioned CDN
   files. Check that the version is correct. For a hotfix, also confirm that
   `latest` advanced and `beta` stayed unchanged; ask a maintainer to verify
   the package labels if needed.

The temporary `release/v<version>` branch is deleted after publication. Hotfix
base branches remain for audit; do not use them for feature work.

## Choose the version

For stable and beta releases, use three numbers: `major.minor.patch`.

| Change | Example | Which number changes |
| --- | --- | --- |
| Backward-compatible fix | `1.2.3` to `1.2.4` | Patch, the last number |
| Backward-compatible feature | `1.2.3` to `1.3.0` | Minor, the middle number |
| Breaking change or required migration | `1.2.3` to `2.0.0` | Major, the first number |

For a beta, enter the version you eventually intend to release as stable. For
example, enter `1.3.0` throughout its beta series, then choose `stable` with
`1.3.0` when that series is ready for general use.

Only stable and `-beta.N` versions are supported. Do not enter alpha, release
candidate, commit-hash, or build-metadata versions. Published versions cannot
be reused. If unsure which version comes next, ask a maintainer.

Automation checks release order: the version must advance past the version in
its source branch. Stable releases must advance past previous stable tags;
betas must advance past all previous release tags. Newer beta tags do not block
a stable hotfix. The first release may use the already committed version or
its generated `-beta.1` version when no valid release tags exist.

## Edit release notes

Most releases need no edits. The draft includes a **Release Note Editor Guide**
visible in the editor.

You may simplify the summary, clarify change descriptions, and add upgrade
steps. Keep the release title, tag, prerelease setting, section headings, PR
links and numbers, contributor names, and Full Changelog link unchanged.
Do not remove hidden hotfix source markers; they bind the draft to its fix PR.
Save changes as a draft; automation publishes it after review and approval.

For contributors: keep fix and feature PRs focused, prefer squash merges, and
describe breaking changes and migrations. Apply one release-note label:
`breaking`, `enhancement`, `bug`, `documentation`, or `internal`. Use `internal`
for changes users do not need to see. Automation uses `release` for release
preparation. The grouping rules are in [release.yml](release.yml).

## Recover from a failed release

Start with the failed workflow run in **Actions**. Open the failed job and step
to see the error. If the cause is unclear, send the run link to a maintainer.
Do not keep rerunning a failing test until it happens to pass.

| Situation | What to do |
| --- | --- |
| Preparation failed | Correct the reported problem, then rerun the preparation workflow with the same inputs. |
| Preparation created a draft or branch but no PR | Rerun with the same inputs, or discard the generated version using the workflow below. |
| An open release PR needs refreshing | Rerun preparation. For a hotfix, use the same fix PR. Review changed files again and obtain fresh approval where required. |
| You want to select a different hotfix PR | Discard the existing preparation first, even if only a draft was created, then start the hotfix workflow with the new fix. |
| A known temporary network, runner, or service failure occurred | Retry the failed jobs once. Investigate if it happens again. |
| Publication is waiting for approval | Ask an authorized environment reviewer to approve the deployment. |
| Publication failed after approval | Ask a maintainer to investigate, then retry the publication run. Existing tags and packages are verified before reuse. |
| More than seven days have passed since the release build | Rerun build and browser jobs as well as publication; the stored package artifact expires after seven days. |
| The wrong version or code is already public | Publish a corrected new version. Never delete, move, or overwrite a published tag or package. |

Refreshing a stable or beta release uses current `main`. Existing draft-note
edits are retained, so check the notes again against the refreshed changes.

### Discard an unmerged release

Use this before merge, including when preparation failed before creating a PR.

1. Copy the exact version from the generated PR title or the preparation run's
   summary, such as `1.3.0-beta.2`.
2. Open **Actions > Release - Discard Unmerged Release PR > Run workflow**.
3. Select `main` and enter that version, without `v`, in both input fields.
4. Run the workflow and confirm success. It closes the PR if one exists and
   removes the draft release and temporary release branch.

The workflow refuses merged PRs, published releases, existing release tags, and
published package versions. Lookup or authentication errors also stop cleanup.
Closing the PR yourself does not perform this cleanup.

### Cancel a merged but unpublished release

Use this after merge, but only if neither the GitHub release/tag nor the
package has been published. If either is public, do not cancel; investigate
and resume publication or release a corrected version.

1. Open **Actions > Release - Cancel Merged Unpublished Release > Run workflow**.
2. Select `main` and enter the exact version, without `v`, in both fields.
3. Run the workflow. It blocks publication, stops active publication jobs,
   removes the draft after checking publication state, and opens a revert PR.
4. Open the revert PR linked in the summary. It reverses only the release
   commit and preserves later work. For hotfixes, it targets the hotfix branch,
   not `main`. Wait for **Build and test**, obtain review, and merge normally.
5. Start a new release with a newer version after the revert merges. Cancelled
   versions remain reserved. For example, after cancelling `1.3.0-beta.1`, use
   a newer base such as `1.3.1`. Hotfix version selection skips them automatically.

Keep the `release-cancelled` label permanently. Removing it removes the
publication block. Deleting the draft alone does not cancel a release.

If cancellation fails, rerun it; the block remains in place and the existing
recovery PR is reused. Ask a maintainer to resolve revert conflicts. If
publication finishes before cancellation can stop it, cancellation refuses to
delete public state.

## One-time repository setup

**For repository administrators, not routine release operators.** Confirm
these settings before someone runs their first release. Workflow files must
be merged into `main` before they can be launched from the Actions tab.

### Actions and package access

1. Keep `cmu-sei/sds-lite` public for its documented jsDelivr URLs.
2. Open **Settings > Actions > General > Workflow permissions**. Select
   **Read and write permissions**, enable **Allow GitHub Actions to create
   and approve pull requests**, and save.
3. Confirm the GitHub Package has the intended visibility and that this
   repository has access to publish it. No long-lived npm token is needed;
   workflows use the short-lived `GITHUB_TOKEN`.
4. Create the release-note labels `breaking`, `enhancement`, `bug`,
   `documentation`, and `internal`. Automation creates the `release` label.

### Branch and tag rules

1. In **Settings > Rules > Rulesets**, protect `main` with required PRs, at
   least one approving review, and **Build and test** from **GitHub Actions**.
   Require branches to be up to date and dismiss stale approvals on new pushes.
2. Create a separate active branch ruleset targeting `hotfix/v*` with the same
   review and check requirements. Enable **Do not require status checks on
   creation** for this ruleset so automation can create the hotfix base.
3. Leave **Restrict creations** and **Restrict updates** disabled for hotfix
   branches. Keep the bypass list empty, **Restrict deletions** enabled, and
   **Block force pushes** enabled.
4. Do not apply those hotfix rules to `release/v*`. Automation must be able to
   refresh and delete temporary release branches. Do not loosen `main` rules.
5. Protect tags matching `v*` against updates and deletions. Published versions
   and their CDN files must remain immutable.

### Deployment environments

1. In **Settings > Environments**, configure `github-packages-production` with
   required reviewers and enable **Prevent self-review** so the person who
   initiates deployment cannot approve it. Keep the team's other production
   deployment protections.
2. Configure `github-packages-beta` with the protections appropriate for testing.
3. If production uses **Selected branches and tags**, include a **Branch**
   rule for `hotfix/v*`. Keep the existing `main` and PR merge-ref rules needed
   by the publication workflow.
4. Confirm the assigned reviewers can approve deployments. PR approval and
   deployment approval are separate gates.

### Verify the first hotfix

Run a reviewed hotfix through the real production environment. Confirm its
immutable tag, package checksum, correct `latest` value, and unchanged `beta`
value. Local tests alone cannot verify GitHub permissions, deployment policies,
registry access, or the complete approval and publication transaction.

## Technical reference for maintainers

| Workflow | Purpose |
| --- | --- |
| **CI - Build and Browser Tests** | Runs contributor, release, and recovery PR checks. The required aggregate check is **Build and test**. |
| **Release - Create Release PR** | Prepares a stable/beta release; also implements the shared hotfix preparation logic. |
| **Release - Hotfix Latest** | Starts hotfix preparation with one merged fix PR input. |
| **Release - Publish Merged Release** | Tests and publishes the merged release after environment approval. |
| **Release - Discard Unmerged Release PR** | Closes an unmerged release PR and removes its draft and temporary branch. |
| **Release - Cancel Merged Unpublished Release** | Blocks publication and opens a reviewed revert PR after merge. |

Preparation updates `package.json`, `package-lock.json`, version-pinned
documentation, `dist/`, and `.github/release-state.json`. Contributor PRs do not
need to commit generated `dist/` changes; preparation replaces them with a clean
build. Every release PR creation and refresh explicitly dispatches CI because
events created with `GITHUB_TOKEN` do not trigger another workflow automatically.

Hotfix bases start from the published stable tag with current release tooling
and the stable dependencies. The selected fix and release updates form one
release commit on `release/v<version>`, targeting `hotfix/v<version>`.

Publication rebuilds the merged commit, verifies the committed distribution,
checks package contents and size, and packs one tested artifact. Browser tests
run in Chromium, Firefox, and WebKit. The protected job downloads that artifact
without rebuilding, dry-runs publication, publishes the reviewed GitHub release,
and publishes the package to GitHub Packages. Versioned browser files are served
through immutable release tags on jsDelivr.

Publication stops on invalid versions, tag/commit/channel mismatches, stale
distribution files, package-limit failures, a cancelled PR, or an existing
package that does not match the tested artifact. A package that exists while
its GitHub release is still a draft also blocks publication.

Publication and cancellation share a global lock. Order is rechecked after
approval. Registry labels are checked before GitHub/npm publication and verified
afterward. Retries can repair
a missing or older label but cannot move it backward. GitHub keeps only one
pending job per concurrency group; additional queued jobs may be cancelled and
need rerunning. Finish one release before starting the next.

Release tags and CDN files become public when the draft is published. GitHub
and package publication are not atomic: a public GitHub release with a failed
package publish is already published and cannot be cancelled.

Publication checks for the cancellation label at build, after approval, and
before publishing. Recovery supports generated single-commit release PRs with squash, rebase,
or normal merge commits. It never force-pushes a base branch or merges the revert
automatically. Authentication or lookup errors stop recovery rather than being
treated as proof that publication has not happened.

Do not rerun historical publication workflows that predate cancellation guards:
GitHub reruns a workflow at its original revision. Later changes to `main` do
not change that release's tested commit.

Both CI and publication use official Playwright containers. Keep their image
versions aligned with `package-lock.json`; tests enforce this contract. Browser
jobs have a 15-minute budget including setup and tests.

To rehearse preparation against the supported stable tag for version `0.2.0` without
pushing or publishing, run:

```sh
SDS_RELEASE_REHEARSAL=1 npx --yes npm@11.6.4 exec -- node --test --test-name-pattern='supported stable tag' test/release.test.mjs
```

This opt-in test uses a temporary clone, installs dependencies, prepares a real
patch, validates its release state, and dry-runs package creation. It needs
network access for dependency installation and the local stable tag for `0.2.0`. It does
not replace the first reviewed publication in the real GitHub environment.
