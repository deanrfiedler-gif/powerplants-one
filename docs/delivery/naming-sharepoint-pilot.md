---
document_id: PPO-NAM-PILOT
revision: r01
status: Staged implementation and acceptance plan; live cases not run
owner: Dean Fiedler — personal prototype owner
date: 2026-09-15
---

# Naming, Communications and SharePoint — Pilot, Acceptance and Implementation Plan

[Package/evidence](naming-sharepoint-handover.md) · [Functional specification](../blueprints/naming-and-communication-assistance.md) · [SharePoint configuration](../architecture/sharepoint-information-architecture.md) · [Requirements](../requirements/naming-assistance.csv)

## 1. Delivery sequence and authority

Dean authorised four written deliverables, a synthetic HTML prototype and existing-contract/register updates. This plan defines receiving work; it does not authorise tenant changes, real messages, paid services or business-file migration. The adopted scope is shared assistance within the existing seven domains and P01–P12 architecture. New local increment labels N0–N6 below are scoped to this package.

| Increment | Scope / dependency | Reviewable completion evidence |
|---|---|---|
| N0 — this package | Naming standard r04, functional/configuration specifications, HTML, contracts and traceability | Repository checks, exact theme provenance, model/browser checks and handover; visual acceptance recorded separately |
| N1 — first application slice | After N0 publication/review: one synthetic new-upload/rename journey with real server permissions, rule/proposal records, one mapped destination and durable operation history | Scoped API/schema/fixtures, restart/replay and negative-access proof. No SharePoint or email writes |
| N2 — first SharePoint read pilot | After N1 and named tenant/owners/identity/resource grants: isolated three-library sandbox, read-only metadata and identity mapping | Complete paged inventory, direct/provider/PPO access checks, renamed/moved item read-back, disconnect and cleanup; no app writes |
| N3 — reviewed file writes | After N2 and explicit test write scope: fictional new file/folder plus individual/batch rename of eligible working items | eTag/collision/lock/partial-batch/unknown-outcome reconciliation, unchanged content hash, restart and audit. No native CAD, cross-library migration or issued-file rename |
| N4 — controlled SharePoint issue | After N3 plus D-012/D-024 evidence: one exact approved-template report output and protected retained snapshot | Exact manifest/revision/hash, denied ordinary overwrite, failed finalisation recovery, supersession and restore. Library configuration alone is insufficient |
| N5 — PPO communication drafting and later sending | Draft/title assistance can follow N1. Actual sending depends on the existing Microsoft read pilot plus separately approved mailbox/recipient/send scope | Draft persistence, reply preservation, privacy, one notification effect per event, unknown-send reconciliation and honest accepted/delivered states |
| N6 — native Outlook compose assistance | After subject rules/draft workflow reviewed; independently scoped add-in/client support and installation | Supported Outlook client matrix, new/reply/forward behaviours, permitted record selection and safe failure. No assumption of universal interception |

N5/N6 do not depend on SharePoint write approval where they have no file dependency. A live report email does depend on the exact authorised attachment/output workflow. The [existing Microsoft pilot](email-calendar-microsoft-pilot.md) remains owner-only, read-only; its permissions are not widened by this plan. Customer portal and native CAD work retain their own dependencies.

## 2. First demonstrated journey

Use Banksia Demonstration Nursery — Synthetic, Example propagation site, Greenhouse 2 / Growing area A. Work `SYN-PPO-WO-000001`, appointment `SYN-PPO-APT-000001`, equipment `SYN-PPO-AST-000001`, report `SYN-PPO-RPT-000001`.

1. Select the work context and proposed Work Documents folder.
2. Suggest a portable filename for a fictional controller-terminal PNG; inspect original, context and destination; simulate filing.
3. Review an existing working note, then a batch containing ready, missing-context and protected-source cases; preserve every decision/result.
4. Resolve a duplicate target and a simulated uncertain rename through explicit investigation. Check the same item/content identity and one effect.
5. Simulate release of the pre-reviewed synthetic report r01 to Issued Documents. Changing bytes in the real application would require a successor revision, not rename.
6. Prepare a new email subject using the report reference; save only a local simulated draft. Switch to reply mode and preserve the original conversation subject.
7. Create one simulated service-linked follow-up task and inspect its generated notification subject. Record-created, draft-created and sent outcomes stay distinct.
8. Open history to follow the original filenames, selected library, report revision, subject and task. Reload deliberately resets the HTML sample; N1 must prove durable application state.

## 3. Acceptance matrix

Each case requires its actual stage/environment/source and result. N0 results are model/browser evidence only and are recorded in the handover. N1–N6 cases are **Not run** until implemented and executed. Full parent requirements are not closed by this matrix.

| Case | Exercise / observable expected result | Stage | Child requirements |
|---|---|---|---|
| NA-01 | Complete one work→file→report→subject→task journey; same confirmed references and distinct states across views | N0/N1 | NC-01/02/05/09/11 |
| NA-02 | Missing record/revision and ambiguous description; no guessed identifier, r01, approval or filing success | N0/N1 | NC-01/03 |
| NA-03 | Manual invalid extension, traversal, reserved name, long path, case collision; actionable refusal preserving original | N0 subset/N1/N3 | NC-03 |
| NA-04 | Batch with ready, protected and failed members; immutable per-item decisions; successful items not retried | N0/N1/N3 | NC-04/06 |
| NA-05 | Supplier/CAD/issued original; rename blocked, documented retained-name exception/alias available | N0/N1/N3 | NC-06/07 |
| NA-06 | Source name/version or rule changes after preview; stale approval refused, refresh/re-review required | N0/N1/N3 | NC-04/08 |
| NA-07 | Provider accepts rename but reply is lost; same-operation investigation resolves once; hash and identity unchanged | N0 simulation/N1/N3 | NC-08/15 |
| NA-08 | Provider name update succeeds but metadata write fails; partial state retained, reconciled without second rename | N1/N3 | NC-08/15 |
| NA-09 | Wrong company/record/library/actor, revoked access and direct SharePoint URL; deny data and mutation consistently | N0 actor simulation/N1/N2/N3 | NC-12 |
| NA-10 | New subject, user adjustment, duplicate prefix, reply and incoming historical message; readable template, original reply preserved, no source rewrite | N0/N1/N5 | NC-09/10 |
| NA-11 | Task creation and notification retry; one Activity/event intent, private source email never copied implicitly, no send/completion claim | N0/N1/N5 | NC-11/12 |
| NA-12 | Issued r01 altered/reissued as r02; exact prior snapshot/hash/response remains, no inherited acknowledgement | N4 | NC-07/16 |
| NA-13 | Multi-page read, empty page with continuation, out-of-scope item; complete checkpoint only after all selected pages | N2 | NC-13/15 |
| NA-14 | Rename/move/permission/version-unavailable/read failure; preserve provider context, owned recovery, no substitution of latest | N2/N3/N4 | NC-13/15/16 |
| NA-15 | Keyboard only, focus return, long reference, 320/390/768/1440 widths, enlarged text and phone touch | N0 browser subset; N1 + physical device review | NC-14 |
| NA-16 | Database/process restart, original retry, version compatibility, lost draft and unsent recovery | N1/N3/N5 | NC-08/15 |
| NA-17 | Microsoft draft/send timeout; original-intent reconciliation; accepted request not called delivered/acknowledged | N5 | NC-10/15 |
| NA-18 | Outlook new/reply/forward, supported/unsupported clients, disconnected add-in; no silent thread change or leaked record metadata | N6 | NC-10/12/14 |
| NA-19 | Retention expiry/hold/delete/restore; exact issued content available according to configured policy; failures owned | N2/N4 | NC-16 |
| NA-20 | Disconnect, worker cancellation, token removal/cache cleanup and retry; no resumed access or deletion of originals | N2–N6 | NC-12/15/16 |
| NA-21 | Existing source naming→alias search→permitted record lookup; original file and dependent native references retained | N1/N3 | NC-06/13 |
| NA-22 | Upload body fails while metadata exists; no false Saved or Issued; recover original upload or retain owned failure | N1/N3 | NC-02/08/15 |

## 4. Pilot evidence and useful measures

Capture code commit/tree, document/rule/template revision, environment, test actor, fixture version, provider item/version references, original operation ID, steps, expected/actual results and redacted screenshots. Keep private identifiers/tokens and real file/email content out of Git. Record model, browser, server, provider, physical-device and owner acceptance separately. N0 screenshots use fictional content only.

Before a live pilot, measure a small representative sample of current filing/search tasks and repeat the same tasks with assistance. Report sample size and medians/ranges rather than claiming an unsupported saving. Track time to file; time to find the correct revision; suggestion acceptance/edit/exception rates with denominators; missing-context incidence; duplicate/conflict incidents; partial/unknown outcomes resolved; and incorrect record links. Missing baselines and target percentages stay unassigned until observed. Zero access leaks, silent overwrites or duplicate material effects is an acceptance requirement; performance/time-saving targets need evidence.

## 5. Launch and recovery checklist for receiving work

Record named pilot owner, Microsoft administrator, library owner, test users, isolated environment, approved resource inventory, intended operations and observation/cleanup dates before connecting. Verify authenticated identity and minimal selected access independently of the synthetic actor selector. Confirm monitoring and exception ownership before enabling writes. No company user or administrator is appointed by this document.

Stop mutations on unexplained access, incorrect linkage, content alteration, duplicate effects or unreconciled unknown outcomes. Preserve original files/receipts, stop the affected operation/worker, investigate exact provider identity and restore from the verified procedure when needed. Do not bulk reverse names without checking later edits/collisions. Teardown disables connection first, then revokes access and cleans authorised test caches/staging, retaining approved content-free evidence. Operational originals are not deleted during teardown.

## 6. Next bounded implementation starter

After review/publication, specify N1 as one issue/branch: shared deterministic rule validation plus one persisted synthetic file-review operation with server permissions, original-name search, stale-preview handling and replay recovery. Use the existing document adapter and outbox; no new service/framework. Add forward-only migrations only when that task is authorised, update all migration registry tests required by AGENTS, and pass applicable repository/application suites. Do not fold live Graph sending, Outlook add-in, bulk migration or new operational libraries into N1.

Staff instructions follow reviewed actual behaviour. The HTML walkthrough is a design review aid, not a staff operating procedure for SharePoint.
