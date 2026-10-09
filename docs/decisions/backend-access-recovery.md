# Backend access and recovery boundary

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 9 October 2026 (Australia/Brisbane). Requirements: PT-01 / AT-01 and the exact-output access portion of PT-18 / AT-20 / AT-36; existing NFR-01, DOC-01–DOC-06 and original-operation contracts remain intact. Review: source self-review and synthetic verification only; independent review and owner acceptance remain separate.

Dean asked for code work alongside his UI work in Claude and selected **backend permissions and recovery checks**. This authorises a bounded backend contribution on `codex/backend-access-recovery`, isolated from the original checkout and Claude's UI worktrees. It is a task-specific exception to the older one-writer guidance: the backend contribution does not edit pages, components, styles, UI guides or the design register. Shared status and evidence additions must be reconciled when the contributions are integrated. No merge or deployment is included.

The source baseline is main `184b933836b9790b4ffb6565552475a1af1eec24` (PR #375). Actual route adapters, synthetic sessions, PostgreSQL and document storage are exercised through a separate loopback test server. This tests server behaviour without starting or altering Claude's application. No framework, dependency, migration, seed, capability, permission policy or external integration is introduced.

The joined access proof covers assigned versus other sites, companies and workspaces; search and suggestions; direct previews; notification ownership and current source permissions; Finance list refusal; working-company narrowing; and original receipt recovery after a genuinely dropped successful HTTP response. Recovery must recheck current authority, return the exact original once authority is restored, and never create a duplicate record, accepted audit event, receipt or outbox task.

The baseline fails four storage-time permission challenges: issued and generated job-pack HTML/PDF endpoints authorise before storage, then return bytes even if the relevant grant expires during that read. The correction reuses `issueContext` or `readRenderJob` after the exact bundle is read, before returning bytes or recording an opened/downloaded event. It changes no file, manifest, historical issue, renderer, command or permission definition. Retaining only the earlier check would leave an observed gap; introducing a new authority model is unnecessary.

[Execution evidence](../testing/evidence/backend-access-recovery/README.md) retains the baseline failures, corrected checks and environment limitation. This is additional component evidence. It does not close the complete PT-01 approval/channel matrix, PT-18's simulated source-movement procedure, PT-23, PT-29 or owner-led PT-30. Physical-device, screen-reader, business and production acceptance remain separate.
