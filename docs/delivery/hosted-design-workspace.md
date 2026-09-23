# Hosted Design & Development workspace — delivery record

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 23 September 2026 · **State:** Implementation complete; integrated release checks and hosted rollout tracked in PR #290.

## Scope and source

Dean authorised implementation and deployment of the protected workspace. Branch `feat/hosted-design-workspace` starts at main `6c7df0c` after #286/#288. Existing local worktrees and previews are preserved. [Access and release decision](../decisions/hosted-design-workspace.md).

The existing shell entry, page register, component catalogue, guides, design references, theme proposals and journey maps become available to the configured owner in the private hosted app. No business permissions, tester invitation expiry, schema, infrastructure service or operational integration changes.

## Deployment configuration

Use the existing `ppo-demo` GitHub environment and `Update Azure private demo` workflow. Set the environment variable `PPO_DEVELOPMENT_WORKSPACE=on` and the environment secret `PPO_DEVELOPMENT_OWNER_OBJECT_ID` to the owner's verified object ID in the configured tenant. The secret is automatically masked in workflow logs. Keep identity values out of the public repository. The workflow validates configuration, supplies the exact build commit, runs the existing database gate, deploys the image and verifies the selected revision and anonymous refusals. It preserves all unrelated runtime settings.

Every image build packages `.ppo-development/snapshot.json` outside public assets. Docker deliberately excludes Git and any pre-existing generated snapshot. Local/manual builds must supply `--build-arg PPO_BUILD_COMMIT=<full source commit>`. Reference serving verifies the packaged catalogue's hashes against the immutable image bytes. A deployed SHA mismatch or absent snapshot prevents workspace reads.

Before this change, observed hosted revision `ca-ppo-demo-90deea5d--0000037` used image `ppodemo90deea5d.azurecr.io/ppo-demo@sha256:5b59cb0928cfdb12e13b831171890fe4140185f2c91aadb5a5a7bcc5f5aedf5f`. This is rollback evidence, not a claim that the new workspace has deployed.

## Verification requirements

- Run register integrity, TypeScript, lint, applicable unit tests and build.
- Prove real database membership: owner succeeds, another tester and wrong tenant fail; owner role switching retains access only while role, invitation and session remain active.
- Prove direct HTTP protection for page, catalogue, guide, preview and reference/download URLs, including anonymous, ordinary tester and revoked access; keep no-store and bounded framing.
- Prove missing/mismatched release snapshots fail rather than reading working files; container build validates catalogue/reference integrity without Git.
- Inspect the deployed owner view, release label, catalogue preview, reference reader, draft guide and phone-width layout. Confirm anonymous URLs remain protected. Record actual results below without implying visual or business acceptance.

## Rollback and disable

If the workspace leaks access, references fail or release identity is wrong, disable it immediately by setting the web app's `PPO_DEVELOPMENT_WORKSPACE=off` and the matching GitHub environment variable. Keep normal app access intact. Verify workspace requests are unavailable and business pages still load. This feature has no database migration to reverse. For an image rollback, first check compatibility with any independently deployed migrations, then restore the recorded previous web/worker image using the existing deployment runbook and verify both digests, readiness and sign-in. Do not reset the database or invitations.

## Completed pre-integration checks and current release record

All 18 PR checks passed on `753def00a93fee2c79b383941453307256be07fd`, including 356 unit tests, 11 hosted identity database cases, six hosted-demo desktop/mobile scenarios, 34 operator tests and the Docker image build without Git. Local TypeScript, lint, application build, register integrity and foundation/naming/prototype checks passed. The Windows-only operator file-mode assertion also fails on the unchanged previous worktree; all operator tests passed on the Linux release runner.

A read-only check of the existing hosted database confirmed one enabled, active owner membership with a current invitation. Its expiry and business grants were preserved. Browser-tab creation repeatedly failed in the available desktop browser connection, so no interactive signed-in hosted visual acceptance is claimed.

While these checks ran, CS PR #287 merged as `5499df4`. Integration preserves its new pages, guides, component bindings and evidence. The only conflict was the leading STATUS entry; both records were retained. The merged revision is rechecked before release. The [PR #290 release record](https://github.com/deanrfiedler-gif/powerplants-one/pull/290) records the final merge/deployment SHA, checks, actual running image and any remaining acceptance limits. This source-time record is not itself evidence of a completed rollout.
