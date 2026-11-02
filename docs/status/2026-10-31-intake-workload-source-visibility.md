---
title: Intake workload stops distinguishing absent and denied Sales briefs
date: 2026-10-31
---

PR #703's first [Claude review](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#pullrequestreview-5720597983) identified a hidden Sales-handover existence disclosure. The workload now returns `sales_brief: null` for both absent and denied briefs, with generic no-readable-brief copy. Its Start navigation eligibility also stays identical between those cases; disabling only the denied case would retain an existence signal. The [agent decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/703#issuecomment-6538451426) records that choice under the standing order, not as Dean's acceptance.

The [route contract](../design/development/pages/route-estimating.md) and [component consumer note](../design/development/component-bindings/2026-10-31-intake-workload.md) describe the boundary. Start opens the native creation review; no creation, receiver, source, command or receipt authority changes. Readable accepted-source drift still disables Start, and non-authority failures still fail the workload read.

The second review finding is also corrected: short date labels use Australia/Brisbane for both the printed date and year comparison. A regression exercises New Year across UTC, Los Angeles and Auckland browser zones.

Validation in the dedicated Windows worktree: seven workload unit cases, two focused native PostgreSQL cases (the new privacy regression and accepted-source drift), one native HTTP case, four responsive presentation cases, full TypeScript, focused ESLint and studio:check passed. The new privacy regression proves identical rows/counts/Start eligibility for absent and inaccessible briefs, native creation-options refusal and unchanged receipts. The three changed desktop/tablet captures were re-inspected; eleven other captures are byte-identical. Both native desktop/phone handover reruns passed, including the generic Sales-context wording, Discovery entry, keyboard focus and URL restoration.

Final foundation, status, naming, migration-registry, documentation-scope and whitespace checks passed.

See the [evidence record](../testing/evidence/intake-workload-accepted/README.md) for the original implementation proof and follow-up validation. Broader suites and compiled-build proof remain with CI, and the corrected head requires a new Claude review. Owner/device acceptance, merge and deployment remain separate.
