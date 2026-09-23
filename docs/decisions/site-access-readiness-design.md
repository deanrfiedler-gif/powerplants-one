# CS-06 — Site access and horticultural readiness design

<!-- versioning: git; committed history is authoritative -->

**Date:** 16 September 2026 · **Owner:** Dean Fiedler · **State:** Authorised design delivered for review; application integration and owner acceptance remain separate.

## Outcome and authority

Dean requested the Site access and horticultural readiness module, an interactive HTML and a professional detailed companion Markdown report aligned to the supplied r20 board. The scope matches CS-06 and its r04 horticultural expansion, and adopted F08/F08-A under [#181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181). Parents PRJ-04, SVC-03/04/06/10 and NFR-02 retain their existing meanings and acceptance boundaries.

[HTML r01](../reference/ui/site-access/PPO-Site-Access-and-Horticultural-Readiness-r01.html) · [Detailed feature report](../reference/ui/site-access/PPO-Site-Access-and-Horticultural-Readiness-Report-r01.md) · [Verification](../testing/evidence/site-access-r01/README.md).

The design starts from main `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. Open #208, #209, #210 and #211 were inspected as independent contributions; their source is not merged here. The uploaded r20 board has SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`, matching the r20 source identified by the maintained Customers/Sites design. Its fonts and shared Intake tokens guide this module-only workspace.

## Delivered views and rules

Six connected views: Overview; Requirements; Visitor & biosecurity; Work windows; Visit preparation; Review & history. Eight fictional facility/area identities, two sites, fifteen starter requirements and five evidence records demonstrate explicit applicability, crop windows, induction validity, movement, clean-down, shutdown and service tools.

A requirement applies only through explicit same-site site-wide or facility scope and its declared activity. Parent relationships, structure, use and crop labels do not establish readiness. Whole attendance intervals and season dates are checked against recorded site-local windows. Captured evidence needs review; expiry and exact visit/person scope remain independent. Acknowledgement never clears blockers, completes an action or grants work authority.

Source drafts preserve active revisions until reviewed. Publication retains before/after evidence, original snapshots and acknowledgement bases. Preparation snapshots include current blockers and state work authority as Not granted. JSON export, local save, stale-tab refusal, session-only recovery and an unavailable-source scenario support review.

## Receiving boundaries

Customers/Sites continues to own location context. Work Orders retains work-scope authorisation. Scheduling retains crew/availability, timing and confirmation controls. Job Pack retains exact controlled issue and required acknowledgement; dispatch/start still rechecks the current source and authority. My Work and Notifications may reference owned clarifications and source-change consequences but must not equate notice reading with action completion.

No application route, dependency, migration, provider adapter, operational source, live message, business transaction, permission change or deployment is included. Preview roles are demonstrative, not server security. Both sites use Australia/Brisbane; overnight/multi-window/DST scheduling, real attachments, evidence withdrawal, import/restore and automatic cross-module impact propagation remain implementation work. The report identifies the smaller new-window authoring boundary explicitly.

## Handover

Use `python3 scripts/build-site-access-design.py` to reproduce the HTML. Focused model/browser checks and the repository foundation/prototype/naming checks provide component evidence; exact results belong to the linked verification record and PR. Keep owner review, integration acceptance, F08-A completion and production readiness separate. The existing issued coverage-register HTML and audits are preserved; the maintained design index and product-quality register receive additive links to this contribution.

Publication limitation: automatic approval review blocked the push to the personal repository, treating its destination as inferred. No remote branch or PR was created. Local model/DOM and documentation checks pass; native browser and visual review remain pending.

Next bounded step: obtain explicit repository destination approval, publish the prepared review branch/PR, run the prepared native verification and review the rendered workspace, then specify one server-backed site-instruction → appointment → controlled pack journey with source-change, authorisation and concurrency tests.
