# PT-30 integration and owner preparation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Recorded 10 October 2026 (Australia/Brisbane). Review: implementation review; independent and owner acceptance pending.

Dean authorised the proposed next step: review PT-23 #387 and PT-29 #389, integrate the reviewed changes after checks pass, rehearse the complete synthetic Service-to-Finance journey including restart/recovery, reconcile remaining findings and prepare the owner walkthrough. This authorises repository integration; it does not authorise deployment, live providers, business transactions or customer messages.

The `codex/pt30-integration` branch reuses this chat's clean, completed PT-01 worktree. Candidate `caecf7b` joins PT-01 main `8869437`, PT-23 `d0be6b0` and PT-29 `ccd7637`. Acceptance-ledger conflicts retain all three original source records and dispositions. PT-23's integration retains the PT-01 guards and main's icon work. The existing two-phrase instruction shortening preserves the combined 8,000-character limit.

Source review checks the two release guards, their corruption/rollback/retry tests, and PT-29's real-versus-injected state assertions and owned fixtures. Review by the implementing assistant is not independent human approval. Each PR's updated-head CI and merge are recorded separately from its earlier execution evidence.

The rehearsal reuses `playwright.acceptance.config.ts`, `tests/acceptance-browser/journey.spec.ts` and `scripts/step6-preservation.ts`: initial saved journey, exact saved-point application/database restart, preparation of a separate return visit, completion, and next-technician history. A new private loopback `ppo_synthetic_test`, document directory and two persistent browser profiles are isolated from all earlier retained runs. The original 3 October session remains intact. No migration, seed, dependency, grant, page, renderer or template is introduced.

[PT-30](../testing/prototype-acceptance.md#pt-30--complete-owner-demonstration) links AT-06/07/08/12/13/14/31. [BP-01](../blueprints/BP-01-master-blueprint.md) sections 18–20 preserve lifecycle separation, original-command recovery, source completeness and role-specific authority. The technical rehearsal cannot record owner participation or close other PT prerequisites. The [current readiness record](../testing/pt30-integration-readiness.md) separates retained passes, newly observed outcomes and open acceptance work; all 78 parent IDs and the authored catalogue remain unchanged.
