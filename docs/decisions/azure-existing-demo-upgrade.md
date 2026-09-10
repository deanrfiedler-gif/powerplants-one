# Existing Azure demo release repair

10 September 2026. Dean asked to fix both deployment blockers so the merged app can be seen on Azure. Baseline main is `f97148b96429686f94777f9112be777923f8eadd`; this authorises the bounded existing-demo upgrade, not a database reset or wider access assignment.

The update workflow failed before job creation because its job-level environment used `runner.temp`, a context unavailable at that location. A first runner step now writes `DOCKER_CONFIG` through `GITHUB_ENV`. A checksum-pinned actionlint 1.7.7 check validates both Azure workflow files. Local actionlint reproduced the original expression error and accepts the repaired workflow; the earlier shell-only tests could not detect it.

The selected release includes Leads migration/seed 18 and Projects migration/seed 19. The recorded original image source `5ce4d20f6d897ed2e9e9da9496130c2bb706a0cd` used migrations through 17. This source evidence does not establish the live database ledger.

The manual workflow now offers `check`, `deploy` and `upgrade-and-deploy`. Check retains its read-only prerequisite behavior. Both release modes build one immutable image and run the existing manual operator using that image before advancing the web app or worker. Deploy runs a database compatibility check; upgrade-and-deploy explicitly applies this release's additive upgrade. The operator's existing secrets, database/storage epoch, tenant, credentials and invitations are retained. A mismatched web/operator epoch or tenant, unfinished operator execution, failed job or mismatched image stops rollout. No setup, reset, provisioning or tester reconciliation is invoked.

The upgrade requires an existing runtime role, matching hosted identity checksum, all baseline migration checksums and seed receipts through 17, and no unknown migration/seed versions. In one database transaction under the existing advisory lock it applies missing 18/19 migrations and their additive fixture-grant seeds, refreshes the restricted runtime table privileges, and adds at most four Leads and three Projects capabilities for eligible existing Company A invited actors. Those actors must remain active/enabled, unexpired and hold current Company A opportunity-edit and internal-read grants. New expiry dates are capped by all three existing limits. Existing grants, including expired/revoked entries, are never replaced; tester identities, invitations, sessions, mailbox data and saved records are not reconciled or reseeded. Future migration registries require a fresh review of this bounded upgrade.

An original Gantt-under-18 checksum or other unknown history fails before any changes. A later failure rolls back migrations, grants and receipts together. A successful database upgrade followed by a failed web rollout retains the upgraded database: inspect actual images and the run receipt; image rollback does not reverse the database. Existing workers can finish with their earlier image; this release's SQL is additive.

Verification covers executable deployment-helper failure paths, native PostgreSQL retention/retry/rollback checks in Azure preparation CI, and the existing compiled image build. Local native PostgreSQL installation is unavailable in this executor; native database and image results must come from CI. Live release and invited-user acceptance are separate from code checks and are recorded in the PR/run receipt.

References: [GitHub expression context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability), [Azure Container Apps job CLI](https://learn.microsoft.com/en-us/cli/azure/containerapp/job?view=azure-cli-latest), [combined migration decision](leads-projects-integration.md).


## 10 September — operator CLI import-cycle repair

Deployment run [34481576319](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34481576319) built and pushed the release but stopped before web/worker rollout. The Azure operator console reported an unsettled top-level await while the CLI dynamically imported `demo-upgrade`. That module imported shared constants and grants back from the awaiting CLI, preventing module evaluation from completing. The upgrade function was never invoked.

Shared workspace/company constants and the unchanged runtime-grant function now live in `scripts/demo-runtime.ts`, which does not import the CLI. Existing CLI exports remain compatible with callers. Migration SQL, transaction boundaries, grant restrictions, invitation limits and runtime security configuration are unchanged.

Two subprocess regression cases launch the operator entry point with both `upgrade` and `verify`. A test-only preload intercepts PostgreSQL connection acquisition before any network access, proving startup reaches the database and the CLI retains sanitized error handling. Both cases reproduced the original exit code 13 and unsettled-await warning before the repair, and pass after it. This startup proof complements the native PostgreSQL upgrade/retention/rollback tests; it does not claim a live database upgrade.

Publication, pinned-runtime CI and a new Azure rollout remain separate evidence recorded in the repair PR.

## 10 September — safe operator diagnostics

PR #106 removed the confirmed startup import cycle and passed the native Azure preparation suite. Retry [34484176805](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34484176805) reached the operator error handler but stopped before web/worker rollout. Its blanket exception message did not identify the second blocker.

The operator now emits fixed stage labels and an allowlist of diagnostic labels/SQLSTATE codes. Unknown exception messages, query text, details, parameters and credentials remain suppressed. This is diagnostic instrumentation only: no migration, privilege, transaction or configuration rule changes. Unit cases verify both useful classification and suppression of synthetic sensitive error fields. The retry and its result will be recorded in the PR.
