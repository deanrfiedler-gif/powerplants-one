---
title: User guide stage 1 merged, and the release reader retries a refused read
date: 2026-11-01
---

PR #817 merged Tasks 5 to 9 of the [stage 1 build plan](../superpowers/plans/2026-10-23-user-guide-stage-1.md) into `main` on 1 November 2026 as merge commit 1fc00297, on Dean's instruction "merge #817". All 74 CI check runs on its head f352cffa had finished: 73 passed and the optional PT-27 was skipped. Dean waived the cross-model review of `src/guides/compile.ts` and `links.ts` that the [stage 1 build record](2026-11-01-user-guide-stage-1-build.md) listed as not done: "I am happy to skip the Codex review as I trust your work." [ADR-0065](../decisions/ADR-0065-guide-markdown-parser.md) now records stage 1 as implemented and merged.

**Implemented** (code on this branch; not reviewed, accepted or deployed): `src/guides/released-server.ts`, the production reader of `.ppo-guides/released.json`, now keeps one read per file and shares it between requests that arrive together, so a failure is logged once. A missing or damaged release file is kept as an empty library, as before. A read the file system refused (anything other than a missing file) is no longer kept: the next request reads again, so the guides return without a server restart. Two unit tests cover this; both fail with the reader as merged.

**Not done:** no guide was reviewed or published. The CRM Deals guide stays hidden until a business reviewer settles the meaning of Scoping, Quoting and Negotiation, the wording for the legacy I1 pipeline, and a walkthrough in the running application.
