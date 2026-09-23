# Hosted Design & Development workspace — delivery record

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 23 September 2026 · **State:** Implementation and verification in progress.

## Scope and source

Dean authorised implementation and deployment of the protected workspace. Branch `feat/hosted-design-workspace` starts at main `6c7df0c` after #286/#288. Existing local worktrees and previews are preserved. [Access and release decision](../decisions/hosted-design-workspace.md).

The existing shell entry, page register, component catalogue, guides, design references, theme proposals and journey maps become available to the configured owner in the private hosted app. No business permissions, tester invitation expiry, schema, infrastructure service or operational integration changes.

## Deployment configuration

Use the existing `ppo-demo` GitHub environment and `Update Azure private demo` workflow. Set `PPO_DEVELOPMENT_WORKSPACE=on` and `PPO_DEVELOPMENT_OWNER_OBJECT_ID` to the owner's verified object ID in the configured tenant. Keep identity values out of the public repository. The workflow validates configuration, supplies the exact build commit, runs the existing database gate, deploys the image and verifies the selected revision and anonymous refusals. It preserves all unrelated runtime settings.

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

## Executed evidence

Local TypeScript passed. The focused workspace/history/catalogue/login/Azure suite passed 26 tests before the new cases; the subsequent owner-access, snapshot and HTTP gateway suite passed 10 tests. Register integrity passed with 268 entries, 24 components, 19 runnable examples, 30 journey references and no integrity errors. Broader checks and release remain in progress. The existing catalogue's visual reviews remain pending; functional access checks do not approve its design.
