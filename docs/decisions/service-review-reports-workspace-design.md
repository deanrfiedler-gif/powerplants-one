---
document_id: PPO-SVC-REVIEW-DES
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Requested standalone design; browser verification and owner visual acceptance tracked separately
source_commit: 07ade644de06ff3b13e5af6ae9c299ca7c78c535
---

# Service Review & Reports — design and receiving handover

Dean authorised a module-only HTML workspace for **SV-06 Service review and controlled reports**, with **SV-07 Remaining work and follow-up**, using the supplied r20 theme and Work Orders r01 composition. The central question is: *What was completed, does the evidence support it, and what still needs to happen?*

Open [PPO-Service-Review-and-Reports-Workspace-r01.html](../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r01.html) in a current browser. Its fonts, styling, icons, fictional records and JavaScript are embedded. This is a proposed design reference, not an accepted application baseline or a live Service screen. No application route, migration, dependency pin, ERP adapter or deployment is changed.

## Sources and authority

Current repository source: `07ade644de06ff3b13e5af6ae9c299ca7c78c535`; tree `7a070efb308b551d36bd16132adad018652e9029`. AGENTS, README, STATUS, [BP-07](../blueprints/BP-07-service-operations.md), [ADR-0014](ADR-0014-p09-service-reports.md), [P09 handover](../delivery/p09-handover.md), the [service API](../contracts/service-api.md) and [P10 Finance amendment](../contracts/finance-handoff.md#p10-physical-implementation-amendment) govern the bounded receiving behaviour.

The supplied Work Orders r01 HTML has SHA-256 `cd36f26448a299d622b51d64c03beced91b8b5f68f098a17213fb35517506336`; theme r20 has SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Work Orders is present on [upload PR #200](https://github.com/deanrfiedler-gif/powerplants-one/pull/200), inspected at `45084d9b9bacf92373176b68995da7665f4acee4`. The upload's scope is not imported into this contribution. The shared Shell r14 remains an external container: this HTML adds no left rail or global masthead.

The r20 navy `#242a37`, green `#62bb46`, surface and status colours, controls, radii and embedded Roboto 400/500/700 font bytes are reused. New reports use distinct `SYN-PPO-RPT-070101`–`070106`, with separately typed work-order and appointment references in the same synthetic range. They reuse the exact Willowbank organisation/site/pump context and do not move the existing Work Orders fixtures forward or change their authority. Example service work, readings, attendance, contacts and sources are fictional. The housing image is a clearly labelled vector illustration; no real site photograph is claimed.

## Six connected views

| View | Review outcome |
|---|---|
| Review queue | Search, state filters, four clickable count cells and ordering across the same permitted fictional reports; counts state completeness. |
| Evidence review | Exact labour, travel, parts, reading, finding and illustrative image references; per-entry approval/return, source inspection and factual correction by the original technician. |
| Work outcome | Read the technician's declared Complete/Partial/UnableToProceed outcome, declarations and remaining scope; explicitly select the current site primary contact before accepting the exact review. |
| Customer report | Prepare one exact allowlisted HTML, verify its SHA-256, release those same bytes locally, download and inspect immutable issued history. |
| Customer response | Retain Accepted/Reservations/Declined/Unavailable/Disputed against the exact current issued presentation; require explanation, owner and due date for non-acceptance. |
| Remaining work & handoff | Retain owned remaining work and customer-response actions, revise owner/due date with history, prepare one unbooked return request per action and inspect separate Finance eligibility. |

Selected report and view are retained when the permitted preview role changes. Search/filter/order persist while navigating this tab; browser reload restores accepted local record changes but intentionally starts on the queue. This is not a substitute for the application's governed saved-view implementation.

## Required demonstration

1. Open **Irrigation repair · evidence needs correction**. The cartridge was replaced, but the housing seal still drips. The recorded pressure is 45 bar; the retained fictional instrument note is 450 kPa.
2. Review the pressure entry, return it with a meaningful reason, then return the submission. The reviewer cannot change the technician's facts.
3. Switch to **Morgan Chen** in Preview options. Correct the pressure to 4.5 bar, state the factual reason and resubmit. Original entry r01 and report r01 stay exact; successor entry/report identities are explicit.
4. Switch to **Alex Morgan**. Approve all six exact revised entries, open Work outcome, explicitly select Casey Taylor and accept the original attendance. Partial work creates its owned action. The work order remains Authorised.
5. Prepare and issue the demonstration customer report. The exact HTML is retained and downloadable. Distribution stays **Not sent**.
6. Record customer Reservations, an explanation, owner and due date. Prepare the owned return-visit request. No appointment, reservation or job pack is created.
7. Optionally open a factual correction cycle as Morgan. The accepted attendance, old report bytes and response remain historical; the prior presentation cannot receive another response during correction.

## Integrity, roles and recovery

The pure model checks the current preview role, report identity and expected version before each action. An identical original operation returns the same result; changed operation content is refused. Immutable prior revisions, issues, responses and attendance acceptance are not edited. Another tab's saved-state change blocks a stale write. These are client-side demonstration checks; they are not server authorisation, durable outbox or cross-device concurrency guarantees.

The local save is committed before a success label. Preview options can fail the next save before persistence or lose confirmation after persistence. A failed save retains the form. An uncertain save preserves the original command and its receipt in the same stored envelope; recovery checks the original role and produces no duplicate response, action or issue. Reload preserves accepted local records. Malformed/unsupported saved state is retained for export or explicit reset. All local data can be exported; reset affects only this workspace's key. No offline synchronisation, live account, external data retrieval or background sender exists.

Reviewer/issuer means the current synthetic service owner. Technician correction is limited to the original attendance author. The read-only and denied role previews remove mutation controls and scoped content. Role selection itself is a demo control, not sign-in. Live receiving implementation must reuse the current server grants and P09/P10 services.

## Deliberate receiving boundaries

- Approval covers the exact technical evidence. Original field quantities are distinct from Finance treatment; Service does not assign rates, billing, warranty settlement or stock effects.
- Partial/UnableToProceed may have accepted attendance with explicit incomplete declarations and remaining work. Incomplete declarations still block Finance readiness; partial work needs a separate Finance basis.
- A second started technician remains pending independently. Their attendance cannot be manufactured by accepting this technician's report.
- Changed scope requires explicit original-attendance-only disposition and reason; it cannot turn unfinished work into Complete. Changed prepared source/template/recipient blocks release and retains the attempt.
- Customer reports use an allowlisted projection. Internal notes, review comments, private source keys and root identifiers are excluded. A vector illustration is labelled as illustrative evidence, never a real photograph.
- Only exact current issued HTML receives a response. Earlier reports remain inspectable; responses never transfer to altered content. Unavailable records no invented respondent or signature. Identity is stated, not independently verified.
- **No controlled PDF is generated.** P09's real HTML/PDF renderer, template fingerprint, immutable byte store and distribution tasks must be reused during application integration. The HTML design demonstrates exact local HTML issue only.
- Return-visit requests are owned local preparation. Scheduler receiving, confirmation, availability, source rechecks and packs remain separate. No work-order or case closure is implemented.
- The integrated follow-up view covers the selected report. Cross-report recurrence aggregation, a global SV-07 worklist, scheduler acceptance/resubmission and action completion remain receiving refinements; no full SV-07 runtime acceptance is claimed.

## Verification and publication

Run `python3 scripts/build-service-review-design.py`, then `node scripts/check-service-review-model.mjs`. The build is deterministic. The existing UI baseline workflow retains its original baseline checks and adds this standalone model/browser suite using the already pinned browser/dependency installation and read-only contents permission. It records exact source and HTML hashes, normal/exception journeys and unmodified viewport screenshots in `Service-review-design-evidence`. No baseline acceptance hash or required branch-protection context is changed.

Local browser installation timed out. The connected preview browser then refused the local URL with `ERR_BLOCKED_BY_CLIENT`; no alternate local URL or browser-policy bypass was used. Local model checks and non-rendered DOM checks are distinct from actual browser evidence. Exact results, original captures and any remaining limits are recorded in the PR and [evidence record](../testing/evidence/service-review-r01/README.md). Browser/owner/device acceptance is never inferred from a model pass or PR merge.

Next bounded step: review this exact visual, then map the accepted workspace to the existing P09 service review/report APIs and P10 handoff receiving controls. Physical-device, screen-reader, 200% zoom and complete business acceptance remain separate.
