# Releasing SDS Lite

Start a workflow, review its PR and draft notes, then merge. Automation builds,
tests, and publishes the package. No terminal, personal token, or GitHub App is
needed. Publication approval is optional repository policy, separate from CI.

## Find the right workflow

In **Actions**, pin **Release - Create Release PR** and **Release - Hotfix Latest**
using the pin icon beside each name. These are the only routine starting points.

- **Release**: start a stable/beta release or a latest-only hotfix.
- **Recovery**: discard an unmerged release or cancel a merged, unpublished one.
- **Automatic**: CI, PR labels, and publication. Do not start these for a release.

GitHub lists automatic workflows too; repository files cannot hide them from
the sidebar. **Automatic - CI** keeps a **Run workflow** button for troubleshooting
and reviewed external contributions, not routine release preparation.

## Before you start

- Ask a maintainer to confirm that [repository setup](#one-time-repository-setup)
  is complete and that the updated release workflows are on `main`.
- You need permission to run workflows and merge pull requests (PRs).
- Arrange a reviewer. If the repository requires publication approval, arrange
   an authorized deployment approver too.
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

1. Confirm the intended changes are on `main` and
   [choose the version](#choose-the-version).
2. Open [Release - Create Release PR](https://github.com/cmu-sei/sds-lite/actions/workflows/prepare-release.yml)
   in **Actions**, then click **Run workflow**. Select `main`.
3. Choose `stable` or `beta`. Enter the intended stable version, such as `1.3.0`,
   without `v` or `-beta.N`, and run the workflow.
4. When it finishes, open the PR linked in its summary and
   [finish the release](#finish-the-release).

For `stable`, entering `1.3.0` prepares version `1.3.0`. For `beta`, the same
input prepares `1.3.0-beta.1`, or the next beta number if previous betas exist.
You do not need to calculate the beta number.

## Start a hotfix

Use a hotfix when the stable package needs a fix but `main` contains changes
that should not reach stable users yet. For example, with `latest` at `1.2.3`
and `beta` at `1.3.0-beta.2`, a hotfix normally publishes `1.2.4` to `latest`
without changing `beta`.

1. Choose a focused, backward-compatible fix PR already merged into `main`.
2. Open [Release - Hotfix Latest](https://github.com/cmu-sei/sds-lite/actions/workflows/hotfix-release.yml)
   in **Actions**, then click **Run workflow**.
3. Select `main`, enter the fix PR link or number in **fix_pr**, and run the
   workflow. This is the only input.
4. When it finishes, open the PR linked in the summary and follow
   [Finish the release](#finish-the-release). Keep its target branch as
   `hotfix/v<version>`; do not change it to `main`.

Automation reads the registry's current `latest` version and selects the next
available patch, skipping released or cancelled versions. You do not enter a
version or choose a channel.

Prefer squash-merged fixes. If the fix does not apply cleanly, or a multi-commit
rebase cannot be safely backported, preparation stops. Ask a maintainer for a
compatible fix PR rather than trying to force the release through.

## Finish the release

1. **Review changes and notes.** Open **Files changed** and the linked draft
   release. Expect version files, documentation, generated `dist/`, and the
   release state marker; hotfixes also include the selected fix. Investigate
   unexpected changes. [Edit notes](#edit-release-notes) only if needed and
   save them as a draft, not a published release.
2. **Wait for CI, obtain review, and merge.** **Build and test** starts
   automatically, including when preparation refreshes the PR. Do not approve
   a workflow to start these checks. Merging starts **Automatic - Publish Release**.
3. **Confirm publication.** Open the publication run in **Actions**. If it
   displays **Review deployments**, an authorized reviewer must approve the
   environment; otherwise publication continues automatically. A successful
   run links to the release, package, and CDN files. Hotfixes advance `latest`
   without changing `beta`.

To remove a separate publication approval, an administrator must change
[environment settings](#deployment-environments). It is not a CI approval or
a token requirement.

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
Save changes as a draft; automation publishes it after merge and any configured
deployment approval.

For contributors, title prefixes add release-note labels automatically:

| PR title starts with | Label |
| --- | --- |
| `fix:` | `bug` |
| `feat:` | `enhancement` |
| `docs:` | `documentation` |
| `internal:` | `internal` (omitted from notes) |
| `breaking:` or a prefix with `!`, such as `feat!:` | `breaking` |

Scopes work too, such as `fix(tabs): correct focus`. Existing category labels
are preserved; change them manually to override the category. Ordinary titles
are allowed and appear under **Other changes** when unlabelled. Describe
migrations for breaking changes. Release PRs receive `release` automatically.
Grouping rules are in [release.yml](release.yml).

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
| A generated PR asks you to approve CI workflows | Confirm dispatch-only CI is on `main` and refresh preparation. Old runs retain their original workflow and cannot verify the fix. |
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
2. Open **Actions > Recovery - Discard Unmerged Release > Run workflow**.
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

1. Open **Actions > Recovery - Cancel Unpublished Release > Run workflow**.
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

<details>
<summary>Administrator setup and maintainer reference</summary>

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
4. PR automation creates missing category labels and preserves existing ones.
   Preparation creates `release`. No personal access token or App is needed.

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

1. In **Settings > Environments**, configure `github-packages-production` and
   `github-packages-beta`. For a single human gate, require PR review and leave
   environment **Required reviewers** disabled. Remove existing reviewers to
   stop the extra publication approval prompt.
2. If policy requires a second approval, enable **Required reviewers** and
   **Prevent self-review** instead. This intentionally adds a publication step.
3. If production uses **Selected branches and tags**, include a **Branch**
   rule for `hotfix/v*`. Keep the existing `main` and PR merge-ref rules needed
   by the publication workflow.
4. Keep environment branch restrictions. These are independent of the optional
   reviewer gate. Committing workflows does not change these live settings.

### Verify the first hotfix

Run a reviewed hotfix through the real production environment. Confirm its
immutable tag, package checksum, correct `latest` value, and unchanged `beta`
value. Local tests alone cannot verify GitHub permissions, deployment policies,
registry access, or the complete approval and publication transaction.

## Technical reference for maintainers

| Workflow | Purpose |
| --- | --- |
| **Automatic - CI** | Runs contributor, release, and recovery PR checks. The required check is **Build and test**. |
| **Automatic - PR Labels and CI** | Labels contributor PRs and dispatches CI without running PR code. |
| **Release - Create Release PR** | Prepares a stable/beta release; also implements the shared hotfix preparation logic. |
| **Release - Hotfix Latest** | Starts hotfix preparation with one merged fix PR input. |
| **Automatic - Publish Release** | Tests and publishes after merge, subject to environment protections. |
| **Recovery - Discard Unmerged Release** | Closes an unmerged release PR and removes its draft and temporary branch. |
| **Recovery - Cancel Unpublished Release** | Blocks publication and opens a reviewed revert PR after merge. |

Preparation updates `package.json`, `package-lock.json`, version-pinned
documentation, `dist/`, and `.github/release-state.json`. Contributor PRs do not
need to commit generated `dist/` changes; preparation replaces them with a clean
build. Preparation and recovery dispatch CI directly using `GITHUB_TOKEN`.
CI uses only `workflow_dispatch`, so bot-created PRs do not create a duplicate
approval-required CI run. GitHub's native `pull_request` runs for bot-created PRs
would require approval; dispatches do not.

Contributor PRs use a metadata-only `pull_request_target` workflow on the trusted
default branch to dispatch CI and assign labels. It never executes PR code.
CI pins both test jobs to one commit, uses read-only test permissions, persists
no checkout credentials, and writes no shared npm cache. Only the isolated
reporting job can write **Build and test** results to the tested PR commit.

External fork PRs without an owner, member, or collaborator author need a
maintainer to start **Automatic - CI** from `main` with the PR number. This
preserves a human decision before running untrusted contributions. Team PRs and
generated release/recovery PRs need no CI approval.

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

</details>
