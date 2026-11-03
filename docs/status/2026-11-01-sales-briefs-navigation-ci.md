---
title: Sales briefs navigation CI expectation corrected
date: 2026-11-01
---

The full unit stage in [PR #702](https://github.com/deanrfiedler-gif/powerplants-one/pull/702) exposed a stale More-menu search expectation: the accepted Sales briefs label now correctly matches a search for Sales, but the expected destination list omitted its stable `intake` ID. Both Projects and Engineering CI ran 1,322 units with this single failure. The failure was reproduced locally and is attributed to this PR, not treated as unrelated.

The test now expects Sales briefs in the broader Sales search and explicitly verifies that an exact label search returns only `intake`, in workspace `estimate`, at `/estimating/intake`. Application behavior and permissions are unchanged. The focused navigation and queue suite passed all 19 cases, and targeted lint passed. Final-head CI is still a merge gate; several prior runs were cancelled and cannot be counted as successful proof.

The complete local unit run executed all 1,322 cases: 1,319 passed and three document-store/recovery cases failed. An unmodified archive of current main `c69a0922` reproduced those same three failures with the same errors on this Windows host, while its seven navigation tests passed. The document-store/recovery implementation and tests are unchanged from main. These baseline failures are retained as a local limitation; the full local suite is not reported green. TypeScript with the 8 GB limit and valid incremental cache, targeted lint, status-source validation and whitespace checks passed. Final-head Linux CI remains required.

The [native validation evidence](../testing/evidence/sales-briefs-queue/README.md) and inspected captures remain applicable because application source is unchanged. Claude review remains waived by Dean's direct instruction. Functional proof, visual inspection, owner acceptance and deployment remain separate; no deployment is authorised.
