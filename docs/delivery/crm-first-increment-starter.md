# Powerplants One — First CRM implementation starter

**Revision:** r01 · **Date:** 6 September 2026 · **Status:** Prepared only; copy into a new session to authorise the bounded implementation described below. The PPO-009 discovery session does not execute it.

---

Act as senior business analyst, CRM product designer, solution architect, full-stack developer and quality engineer for Powerplants One (PPO), Dean Fiedler's personal private synthetic prototype.

Implement only **BP-03 I1 — Owned opportunity and qualification follow-up**, the first bounded CRM implementation increment. Carry it through real persistence/permissions, meaningful verification, reviewable repository handover, normal expected-head merge and verification of actual merged main. Prepare I2's maintained starter, then stop.

Repository: https://github.com/deanrfiedler-gif/powerplants-one

CRM discovery parent: **PPO-009 / issue #9**, distinct from **PP-01 P09 — Service review and reports**. I1 is a BP-03-local sequence label, not P13 or a new parent requirement.

## 1. Objective and authority

Deliver one end-to-end synthetic sales journey: select an existing permitted organisation → create an Open opportunity with an accountable owner and initial next Activity → complete that Activity with an outcome → record qualification/progress → plan the next action or show clearly that one is needed. The record and history must survive reload and process restart. Out-of-scope actors must not read or mutate it through any direct or related route.

I authorise necessary local implementation/dependencies within the maintained stack, one focused I1 implementation issue linked to #9 after checking for existing work, an isolated dedicated branch, additive forward PostgreSQL migration and non-destructive synthetic fixtures, domain/API/UI/permission changes required for this slice, actual automated/manual checks, documentation/traceability, commits/PR, normal merge after applicable checks/review, and verification of the actual merged main.

This authority applies when I invoke this starter. It does not arise merely because the starter is stored in the repository. Use synthetic data only. No live Pipedrive mutation/read expansion, operational import, migration execution, runtime Pipedrive connection, mailbox/calendar sync, communication, automation activation, paid service, hosting, production integration, access/visibility/membership/branch-rule change or source cutover is authorised. Pipedrive retains its operational role.

## 2. Verify the live baseline first

Use the connected GitHub capability; verify connected user, private repository visibility and actual permissions, main SHA/tree, newer changes, current issue #9 and its comments, CRM branches/PRs, current P09 issue/PR/handovers, checks/reviews and accessible rules. Inspect actual local status before writing. Use a fresh checkout/worktree and a dedicated descriptive CRM branch; preserve unrelated work. Never reset newer main to an earlier checkpoint.

Start with the [CRM discovery handover](crm-discovery-handover.md) and its [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/9#issuecomment-5557062585) for the actual discovery head/main/check identities. The discovery starting reference was P08 main `85bd2fcc388495cc24dc2ee4f273accc49da2f24`, tree `7406ceb9b000e616410489bb66503a6e9e8c6c08`; P09 was active in issue #36 / draft PR #37. These are historical starting evidence, not the implementation baseline.

Preserve P01–P09 behaviour **as actually delivered** at your live baseline. If P09 is still in progress, identify overlap and coordinate shared unions/dispatch before editing; do not take over P09. Do not declare an unmerged branch complete. If P09 has merged, read its exact contracts/handover and include its regression suite. Any newer P10+ work must also remain intact.

Check migrations, ADRs, API/record IDs, configuration/seed receipts and open PR reservations before allocation. P09 reserved migration 0009 and ADR-0014 during discovery; do not reuse or assume the next number. Keep I1's changes compatible with the latest full identity/capability/audit/outbox/receipt dispatch and unchanged old operation hashes.

## 3. Read the maintained authority

Read AGENTS.md, README.md, docs/STATUS.md, CONTRIBUTING.md, PPO-STD-001 and maintained project instructions. Read BP-03, its parity assessment, screen specification and implementation sequence in full for I1; relevant BP-01 section 09, CRM-01–CRM-08/PAR-01–PAR-18 and complete AT-25. Read BP-02, ADR-0007/0008 and later relevant decisions, current physical SQL/TypeScript contracts, service dictionary/API/document/Finance contracts, P08/P09 handovers and current acceptance/traceability.

D-013/D-025 and unresolved account evidence remain open. Unknown operational licence/pipeline/field/automation configuration does not block this explicitly synthetic first slice. Do not invent real account settings or treat the design as owner-accepted parity. Preserve issued source bytes and all 78 parent requirement IDs.

## 4. Exact included scope

Use one immutable, clearly fictional pipeline definition with stages **Enquiry → Qualified**, `close_outcome=Open` throughout. No value/probability or forecasting. Require an existing permitted organisation and active eligible owner. Optional existing site/contact must satisfy P02 company/person/affiliation boundaries; unknowns require explicit reasons. No automatic organisation/person creation or merge inside the opportunity command.

Create typed Opportunity/configuration/event records using the shared permanent identity registry and existing atomic reference allocator with the reserved **SYN-PPO-OPP** type. UUID, readable number, label, version, stage and close outcome remain separate. Company and original relationship/link context are fixed for this slice; reassociation requires later impact-aware design.

CreateOpportunity must persist Opportunity, initial **CustomerContact** or **RelationshipReview** Activity, typed links, initial event, audit, receipt and outbox atomically. Do not add unnecessary sales-specific Activity kinds. Add only an explicit typed Opportunity ActivityLink with real workspace/company FK and same-site/context rules; Opportunity is not an existing Activity target. Preserve all other Activity target visibility and completion semantics.

RecordQualificationAndProgress permits Enquiry → Qualified only under the current owner and scoped edit capability, expected version, valid definition, recorded need, and a permitted contact or an owned identification action. No broad PATCH/state bypass. No separate LeadCandidate, arbitrary stage jump, pipeline transfer, Won/Lost/reopen or owner transfer in I1.

PlanOpportunityAction creates/designates a permitted active linked Activity with explicit owner and due instant or due-needed. Completing the designated action retains the exact outcome and yields **Next action needed** unless another active action is deliberately designated. It must not silently move the stage, invent a deadline or send anything. Existing Activity commands keep their current owner/start/complete/cancel rules and accepted payload hashes.

## 5. Server authority and recovery

Use current sharedOperation/transaction/lock/audit/receipt/outbox patterns. Server derives actor/workspace/time; strict typed validation and body size; unlisted actor/state/version manipulation rejected. Commands recheck current permissions, relationships, eligible owner and expected version under transaction locks. Unique/deferred/FK constraints must also protect direct SQL writes and competing transactions.

Add explicit scoped `crm.opportunity.read/create/edit` capability support and eligible selectors; initial actions are Internal and need relevant shared internal and Activity permissions. Ownership grants no access. Do not add manager/administration capability without included behaviour. Retain Systems/unassigned identities' lack of default business authority. Site/company/person boundaries cannot be broadened by group hierarchy.

Test all-target Activity visibility and current-permission receipt dispatch for Opportunity. An inaccessible opportunity must suppress its linked Activity content. Lists/search/filter/selector/count/detail/operation routes cannot leak title, existence, notes or source keys. A source-file link would need independent file permission, but no CRM file feature is implemented in this slice. Hidden and nonexistent target responses remain indistinguishable.

Replay same operation/content returns the original authorised receipt and causes one effect. Same key/different content conflicts. Timeout after commit is reconciled through operation lookup with current permission before any new intent. Stale versions preserve safe proposed input and require deliberate comparison/retry; no silent overwrite. Identity change/revocation clears sensitive visible context. No CRM cache/IndexedDB/service-worker expansion or P08 recovery-capability reuse.

## 6. User experience

Follow existing navy/green synthetic styling, Roboto/Verdana and navigation. Add a CRM Sales worklist, New opportunity and Opportunity detail/progression/action path. Reuse canonical organisation/person/site context and current Activity screens where suitable; no duplicate account app. Use a responsive list initially; the broader design-only board and later-domain wireframes are not an I1 build mandate.

Show synthetic context, current stage, owner, next action, due date-needed/overdue, source time and saved/unsaved/uncertain status. No probability/revenue cards. Provide keyboard operation, visible focus, labelled errors, empty/loading/unavailable/denied states, long-content wrapping and phone reflow. Match BP-03 screen definitions for the included subset and clearly defer the rest. Wireframes are illustrative, not backend authority or proof.

## 7. Explicit exclusions

Do not implement separate leads, full Pipedrive configuration parity, unrestricted edits/reassociation, pipeline board/dragging, arbitrary stage policies, closing/reopening, ownership transfer, territory/account-plan builders, products/prices, quoting, forecasts, exports/deletion, file upload/SharePoint, communication sync, notifications/rules, mobile offline, migration/import, customer commitments, service-review/report/customer responses or Finance. Do not change P09 code/contracts except a genuinely necessary shared extension reconciled with that workstream and documented in the PR.

## 8. Meaningful verification

Run maintained Python checks, `npm run check` and the actual current database/HTTP/browser/CI gates. Follow engine pins; do not weaken tests or claim local verification under a mismatched engine. If disposable CI is the valid environment, record the exact tested head/tree/run/attempt and actual checkout identity. Preserve all baseline cases; add tests that challenge included behaviour rather than mirroring implementation.

Execute CA-01–CA-08/CA-10 I1 subsets and CA-13 responsive scope from the CRM plan: atomic rollback, real DB FKs and competing qualification/action updates, create/retry after lost response, same-key different content, eligible owner checks, multi-company/person/site isolation, all-target Activity leakage, revoked identity and current-permission receipts, invalid inputs, unknown due and terminal-action recovery, actual HTTP and browser reload.

Prove fresh migration and upgrade from current accepted main; repeat seed does not overwrite edits/revive grants/reset references/duplicate actions. Preserve old migration/seed bytes and accepted IDs/hashes/audit/history. Execute application/PostgreSQL process restart and read the accepted opportunity/action/receipt afterward; browser screenshot alone is insufficient persistence proof.

Inspect original desktop 1440×1000 and phone 390×844 captures after intended data loads, plus 320px reflow/keyboard/error/conflict/denied/unavailable states. Record screenshot commit/tree, scenario, viewport and actual evidence. Real mobile hardware remains unverified unless actually tested. CRM online tests do not prove offline support. CA cases and AT/PT statuses change only for work actually executed; full AT-25 remains Planned and issue #9 stays open unless all discovery acceptance is separately met.

## 9. Handover, publication and stop

Update BP-03 implemented/proposed distinctions, affected shared contracts/decisions/registers, CRM sequence, STATUS and traceability proportionately. Record a detailed I1 handover: files/domain/schema/API/UI changes; exact migration/run/recovery commands; current baseline/PR/head/tree; actual checks and failed-run dispositions; permissions/integrity/UI evidence; unresolved account/policy limits; no operational transition. Maintain one focused implementation issue linked to #9; do not close #9 through a PR keyword.

Before normal merge, reread current main/PR head, latest diff, checks, requested/submitted reviews, unresolved threads, private visibility, permissions and accessible rules. Reconcile newer shared documentation/code without removing P09 content. Respect actual controls; never force/bypass or change settings. Inaccessible rules are a recorded limitation, not proof every rule was inspected. Self-review is not independent approval.

Merge with the expected head SHA. Verify resulting main SHA/tree and parents, merged PR state and actual merged-main workflow results. Record final identities in an external issue publication comment and link it from the handover; avoid circular self-SHA claims. Preserve durable repository evidence and provide concise links.

Prepare only the next bounded I2 starter based on verified delivered scope and remaining evidence. Stop after I1 publication/preparation. Do not begin I2, continue P09/P10, activate integration or contact customers.
