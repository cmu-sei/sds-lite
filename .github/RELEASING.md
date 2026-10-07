# Releasing SDS Lite

Start a workflow, review its PR and draft notes, then merge. Automation builds,
tests, and publishes the package. No terminal, personal token, or GitHub App is
needed. Approve PR workflows when GitHub asks. Publication approval is optional
repository policy, separate from approval to run CI. Workflow-changing release
targets may require an authorized operator to publish the GitHub draft after
validation; package publication remains automated.

## Find the right workflow

In **Actions**, pin **Release - Create Release PR** and **Release - Hotfix Latest**
using the pin icon beside each name. These are the only routine starting points.

- **Release**: start a stable/beta release or a latest-only hotfix.
- **Recovery**: discard an unmerged release or cancel a merged, unpublished one.
- **Automatic**: CI, PR labels, and publication. Do not start these for a release.

GitHub lists automatic workflows too; repository files cannot hide them from
the sidebar. **Automatic - CI** keeps a **Run workflow** button for troubleshooting
a selected branch, not for satisfying a PR's required check. PR checks run from
the PR itself; approve them there when GitHub asks.

## Before you start

- Ask a maintainer to confirm that [repository setup](#one-time-repository-setup)
  is complete and that the updated release workflows are on `main`.
- You need permission to run workflows and merge pull requests (PRs).
- Arrange a reviewer. If the repository requires publication approval, arrange
   an authorized deployment approver too.
- Finish or discard any open release PR before starting another. If a release
  is already merged, finish its publication or cancellation first.

**Do not create release tags, publish drafts, run `npm publish`, or edit generated
version files yourself.** The sole exception is the explicit
[workflow-changing publication procedure](#complete-a-workflow-changing-publication)
requested by a stopped publication job after merge and successful validation.

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
2. **Approve CI when prompted, obtain review, and merge.** Opening or refreshing
   the PR triggers **Automatic - CI**. If GitHub requests approval, review the
   generated changes and use **Approve and run**. A refresh may require approval
   again. Wait for **Build and test** to pass, obtain review, and merge normally.
   Merging starts **Automatic - Publish Release**.
3. **Confirm publication.** Open the publication run in **Actions**. If it
   displays **Review deployments**, an authorized reviewer must approve the
   environment; otherwise publication continues automatically. A successful
   run links to the release, package, and CDN files. Hotfixes advance `latest`
   without changing `beta`.

If the publication job explicitly reports that `GITHUB_TOKEN` cannot publish a
workflow-changing target, use the procedure below instead of adding credentials
or repeatedly retrying. A draft's initial target is only a default-branch
placeholder, not authorization to publish that branch.

To remove a separate publication approval, an administrator must change
[environment settings](#deployment-environments). It is not a CI approval or
a token requirement.

The temporary `release/v<version>` branch is deleted after publication. Hotfix
base branches remain for audit; do not use them for feature work.

## Complete a workflow-changing publication

GitHub requires workflow-write authorization for release targets whose workflow
files differ from the default branch. `GITHUB_TOKEN` cannot receive that
permission. This can occur for hotfixes using older stable dependencies or when
workflow definitions change after a release is prepared. CI approval and
deployment approval do not grant it.

1. Use this procedure only after **Automatic - Publish Release** explicitly
   requests it. Confirm its build and all three browser jobs succeeded and that
   the release PR is merged. Do not use it to bypass a failing validation.
2. Record the exact tag and reviewed commit SHA in the failed job's summary.
   Open the existing draft in **Releases** using an authorized operator account.
3. Keep the tag, title, notes, and prerelease setting unchanged. Select the exact
   reviewed commit as the tag target, not the current tip of `main` or a hotfix
   branch. If the interface cannot select that commit, ask a maintainer; do not
   guess. Never move or delete an existing tag. If it points elsewhere, stop and
   prepare a corrected new version.
4. Publish the GitHub draft. This is a real public release and exposes its tag
   and CDN files. Do not run `npm publish` or modify package distribution tags.
5. Rerun the failed **Publish release** job. Automation verifies the public tag
   points to the reviewed commit, verifies package state and checksums, then
   publishes the tested npm artifact and verifies its channel. If the artifact
   expired, rerun build and browser jobs as well as publication.
6. Confirm the run succeeds and its release, package, and CDN links are correct.

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
deployment approval, except for the explicit operator-assisted procedure above.

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
| A generated PR asks you to approve CI workflows | Review the generated changes and use **Approve and run**, then wait for **Build and test**. A refreshed PR may need approval again. |
| Publication is waiting for approval | Ask an authorized environment reviewer to approve the deployment. |
| Publication reports a workflow-changing target | Follow [the authorized GitHub-publication procedure](#complete-a-workflow-changing-publication), then rerun the failed publication job. CI approval or changing Actions permissions cannot resolve this token limitation. |
| A release tag already exists at the wrong commit | Stop. Never move or delete the tag; prepare a corrected new version. |
| GitHub publication failed after its verified tag was created | The tag and CDN are already public. Investigate and resume publication; do not use cancellation or discard workflows. |
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
3. Run the workflow. It stops active publication jobs, acquires the publication
   lock, and verifies that nothing is public. Only then does it record a permanent
   cancellation on the exact merged commit, block retries, remove the draft, and
   open a revert PR. No additional operator step is needed.
4. Open the revert PR linked in the summary. It reverses only the release
   commit and preserves later work. For hotfixes, it targets the hotfix branch,
   not `main`. Use **Approve and run** if GitHub requests workflow approval,
   then wait for **Build and test**, obtain review, and merge normally.
5. Start a new release with a newer version after the revert merges. Cancelled
   versions remain reserved. For example, after cancelling `1.3.0-beta.1`, use
   a newer base such as `1.3.1`. Hotfix version selection skips them automatically.

The `release` and `release-cancelled` labels are visual indicators; new releases
are identified by their repository, branch, base, and committed version metadata.
Removing or renaming labels does not undo a recorded cancellation. Deleting the
draft alone does not cancel a release.

Cancellation is not complete until the locked cleanup step succeeds. If stopping
publication fails, no new permanent block is set; investigate the active run
before retrying. If cleanup fails after recording cancellation, that block remains
in place and rerunning reuses the verified recovery PR. If the record cannot be
written and verified, cleanup stops before removing the draft. Reuse requires a single-commit
PR from this repository to the original base whose changes exactly reverse the
release while preserving later work. An already-merged recovery is verified and
reported as complete, not reopened. Ambiguous PRs, altered recovery branches,
revert conflicts, and lookup failures require maintainer investigation; they do
not count as completed recovery. If publication creates a tag before cancellation can stop it, cleanup
refuses to record a new cancellation or delete public state; resume publication
instead. Do not rerun publication while cancellation is in progress.

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

During workflow testing, an administrator may deliberately keep the ordinary
required review count at zero. This is validation mode, not production review
policy, and releases still publish real artifacts. Before production use, set
the count to at least one on both `main` and `hotfix/v*`. Conditional approval
for unattributed changes and approval to run CI do not replace that requirement.
The workflows do not change live repository settings.

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
| **Automatic - PR Labels** | Labels contributor PRs without running PR code. |
| **Release - Create Release PR** | Prepares a stable/beta release; also implements the shared hotfix preparation logic. |
| **Release - Hotfix Latest** | Starts hotfix preparation with one merged fix PR input. |
| **Automatic - Publish Release** | Tests and publishes after merge, subject to environment protections. |
| **Recovery - Discard Unmerged Release** | Closes an unmerged release PR and removes its draft and temporary branch. |
| **Recovery - Cancel Unpublished Release** | Blocks publication and opens a reviewed revert PR after merge. |

Preparation updates `package.json`, `package-lock.json`, version-pinned
documentation, `dist/`, and `.github/release-state.json`. Contributor PRs do not
need to commit generated `dist/` changes; preparation replaces them with a clean
build. Before selecting a version or creating a hotfix base, preparation checks
all merged release versions regardless of labels. Their package metadata and
release-state marker must agree at the exact merged commit. Each must have a public GitHub release with the
correct channel, a tag at its reviewed commit, and a published package whose
channel has reached that version or a newer one. Cancelled releases require a
verified recovery PR merged after the release on the original base instead.
Preparation checks its actual merged tree against Git's computed reverse of the
release, verifies that it preserves later work, and confirms that the recovery
commit remains on the original base. Branch names and commit messages alone are
not proof of recovery. Missing state, authentication
errors, and uncertain lookups block preparation; finish publication or recovery
first. Historical PRs for one version are represented by the latest merged PR.

Opening, reopening, or updating a PR targeting `main` or `hotfix/v*`
triggers CI directly through `pull_request`. Preparation and recovery do not
dispatch another workflow. PR events created with `GITHUB_TOKEN` may require
GitHub workflow approval; use **Approve and run** before waiting for checks.

Contributor PRs use a separate metadata-only `pull_request_target` workflow on
the trusted base branch to assign labels. It never executes PR code or starts CI.
CI pins both test jobs to the PR head commit, uses read-only permissions,
persists no checkout credentials, and writes no shared npm cache. The native
**Build and test** job succeeds only when build validation and all three browser
projects succeed. There is no commit lookup job, custom status reporter, or
write token in CI. Manual branch runs are diagnostic only; they do not satisfy
PR-required checks.

External fork PRs may also require workflow approval under GitHub's repository
policy. Review untrusted code before approving execution. CI approval and any
configured publication-environment approval are separate decisions.

Hotfix bases start from the published stable tag. Every preparation attempt
copies current controllers and workflows onto the temporary release branch,
including attempts that reuse an existing base. Copied workflow files remain
identical to `main`; preparation does not rewrite their browser images. CI and
publication select the official container from the checked-out lockfile at
runtime, retaining the stable dependencies without requiring workflow-write
permission for new YAML contents. Existing protected bases are not updated directly.
The refreshed tooling, selected fix, and release updates form one reviewed
release commit on `release/v<version>`, targeting `hotfix/v<version>`.

Publication rebuilds the merged commit, verifies the committed distribution,
checks package contents and size, and packs one tested artifact. Browser tests
run in Chromium, Firefox, and WebKit. The protected job downloads that artifact
without rebuilding, dry-runs publication, verifies any existing tag, and checks
whether GitHub publication needs an authorized operator. The automatic path
creates the tag at exactly the reviewed commit and verifies it before publishing
the draft. Workflow-changing targets stop before creating a new tag or publishing
the draft and provide the explicit operator procedure. Package publication stays
automatic on both paths. Versioned browser files use immutable tags on jsDelivr.

Publication stops on invalid versions, tag/commit/channel mismatches, stale
distribution files, package-limit failures, a cancelled PR, or an existing
package that does not match the tested artifact. A package that exists while
its GitHub release is still a draft also blocks publication.

Publication and cancellation cleanup share a global lock. Cancellation first
stops active publication runs, then rechecks all public state under that lock
before recording the permanent cancellation. The recovery job writes an
`sds-release/cancelled` commit status on the merged release SHA and verifies it
before deleting the draft. Publication and preparation read the complete,
paginated status history, not just the latest status, so removing labels or
posting a newer status cannot erase the block. This status is not a required
PR check and does not replace the native **Build and test** gate. Existing
label-only cancellations are also recognized for backward compatibility.
A tag created before the lock is acquired
prevents cancellation without blocking publication retries. Order is rechecked after
approval. Registry labels are checked before GitHub/npm publication and verified
afterward. Retries can repair
a missing or older label but cannot move it backward. GitHub keeps only one
pending job per concurrency group; additional queued jobs may be cancelled and
need rerunning. Finish one release before starting the next.

On the automatic path, the verified tag and CDN files become public just before
the GitHub draft is published. Operator-assisted publication also makes its tag
public. Tag creation, GitHub publication, and package publication are not atomic:
once any tag, release, or package is public, cancellation and discard are refused.
Investigate and resume the incomplete publication rather than deleting public
state. Recorded cancellations cannot be undone by editing labels.

Publication checks for durable cancellation at build, after approval, and
before publishing. Recovery supports generated single-commit release PRs with squash, rebase,
or normal merge commits. It never force-pushes a base branch or merges the revert
automatically. Authentication or lookup errors stop recovery rather than being
treated as proof that publication has not happened.

Do not rerun historical publication workflows that predate cancellation guards:
GitHub reruns a workflow at its original revision. Later changes to `main` do
not change that release's tested commit.

Both CI and publication use official Playwright containers selected from
`package-lock.json`. The Playwright test runner, browser package, and core package
must have the same stable version. Build validation supplies the validated image
to the browser jobs; no workflow edits are needed when the locked version changes.
Browser jobs have a 15-minute budget including setup and tests.

To rehearse preparation against the supported stable tag for version `0.2.0` without
pushing or publishing, run:

```sh
SDS_RELEASE_REHEARSAL=1 npx --yes npm@11.6.4 exec -- node --test --test-name-pattern='supported stable tag' test/release.test.mjs
```

This opt-in test uses a temporary clone with only the supported stable tag in its
local tag history, installs dependencies, prepares a real patch, validates its
release state, and dry-runs package creation. Other published tags remain
untouched in the working repository and cannot invalidate the rehearsal. It needs
network access for dependency installation and the local stable tag for `0.2.0`. It does
not replace the first reviewed publication in the real GitHub environment.

</details>
