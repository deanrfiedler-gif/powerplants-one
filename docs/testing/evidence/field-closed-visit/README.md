# Closed-visit arrival and separate-visit entry evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation and technical verification; independent visual, physical-device, screen-reader and owner acceptance remain open. [Decision](../../../decisions/field-closed-visit-guidance.md) and [acceptance matrix](../../field-closed-visit-acceptance.md).

## Starting point and observed gap

Refreshed `origin/main` was `8eeb0ffe0f8f760611caf64e501649f564940a5e`, FI-07 #336's merge. The PR's exact head `b3119b2721352d3ea7cca99e0d087b9696fa544c` passed all 22 applicable checks. Preflight found no overlapping open PR. The original checkout contained only its unrelated untracked `.worktrees/`; existing worktrees, services and databases were retained. This work uses `codex/field-closed-visit` in a new isolated managed worktree.

An unchanged-main compiled desktop continuous Service/Finance/completed-return journey passed 1/1. On its completed original, a second assigned technician without their own attendance saw an enabled generic arrival control. A real new Start was refused with 422 `StartBlocked`. This is a guidance gap; the server safeguard already exists. The baseline database, screenshot, response record, exact outputs and dump remain private and separate from candidate proof.

Task-owned UTF-8 PostgreSQL 16.15 clusters use only `ppo_synthetic_test`: baseline journey on 55718, destructive test fixtures on 55719 and candidate journey on 55720. Each owns its document store and 256-lock setting. They do not replace earlier sessions' clusters. Credentials, profiles, raw payloads and traces remain outside Git. The guarded CI lock configuration and separate compiled HTTP/restart lane are unchanged.

## Execution ledger

The first four new persisted cases pass 4/4: actor-specific closure and immutable accepted start recovery; concurrent/repeated proposals and explicit cancellation/separate preparation; scoped/read-only navigation; delayed old-visit replay and original receipt recovery. The new pure state test passes. Build/type correction and broader/final executions are recorded below when complete, rather than inferred from source presence.

The new projection reuses existing current read permissions and Scheduling summaries. Work-order proposal entry reuses `ProposeVisit`, the canonical appointment URL helper and existing booking journal. No schema, migration, seed, capability, grant, user, output template, route or offline protocol changes. Downloads remove online receiving context; original P08 commands and FI-07 exact bindings remain unchanged.

## Original failures and corrections

- Initial type/build check exposed a missing client declaration for the appointment's existing `actual_start_at`; the optional client type now matches the server read.
- The first new database assertion compared the transport `replayed` flag with a first-send result. The correction asserts `replayed=true` and exact immutable receipt equality separately; 4/4 then passed.
- A private fresh-cluster launcher supplied a newline with its password; it failed authentication before migration. Trimming the private value allowed database creation; no repository credential or data changed.
- The first candidate browser run preceded the app listener and failed with `ECONNREFUSED`. The next attempt verified HTTP health first. A duplicate diagnostic launcher observed `EADDRINUSE` and exited; the existing owned listener was preserved.
- Browser proof caught an invalid proposal recovery destination. Both a plain appointment path and a manually appended return path fail the existing canonical-journal check before sending. The form now calls the existing `appointmentHref` helper; no journal allowlist, command guard or recovery invariant was relaxed. A new test's alert locator also needed to exclude Next's route announcer.
- The complete browser journey then caught the offline shell's missing new presentation module. Its explicit build/precache lists now include the pure visit-guidance module. The existing content-hashed shell update mechanism, private owner caches and operation protocol are unchanged; no API/business data is added to service-worker caching.

Retain original failures independently from corrected runs. No assertion budget, skip, CI deadline or performance target is changed to obtain green checks.

## Remaining acceptance and programme work

Use the concrete [human checklist](../../field-closed-visit-acceptance.md#human-acceptance-checklist). Accepted timer r05 remains unchanged; no accepted native closed-visit mockup exists. Technical captures do not grant baseline adoption.

Next bounded work is the owner-led integrated Field Work/PT-30 demonstration, adjudication of remaining prior cases and benefit measurement using the retained original and completed-return narratives. Step 6's written PT-28 technical pass and update/rollback evidence retain their original scope. This increment does not complete all PT-28/PT-30, wider SV-06/SV-07 orchestration or operational acceptance. No merge or deployment is included.
