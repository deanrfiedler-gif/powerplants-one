---
title: Conversations T2d independent-review corrections
date: 2026-10-22
---

Date: 22 October 2026. Owner: Dean Fiedler. Executor: Codex.

Claude independently reviewed [draft PR #664](https://github.com/deanrfiedler-gif/powerplants-one/pull/664#issuecomment-6339292849) at 829ae67c03810de3337c94fb80aac51c98458507. Codex verified the Medium history-bound and Low inherited-TLS-trust findings and implemented corrections under [ADR-0061](../decisions/ADR-0061-local-claude-adapter.md): oldest-first bounded history fitting with truthful omission reasons, explicit bundled CA trust and pre-credential process-option guards. Additional proofs cover the default worker factory through the actual SDK/owned HTTPS transport, transport failure bounds and billing metadata. The unnecessary speed option is omitted; Unknown reservation behavior remains conservative and is clarified in the T2b design table.

No live provider request or real-key inspection; no T2e, deployment, new migration, capability or grant. Current main is integrated through the existing branch; T2c's branch remains untouched. Correction validation and exact-head CI are recorded in the [evidence](../testing/evidence/conversations-t2d/README.md) and PR execution ledger. The PR remains draft, unmerged and without auto-merge. Independent follow-up on the corrected head and Dean's acceptance remain pending; no visual review or production readiness is claimed.
