# CRM five-stage runtime and board recovery handover

**Document ID:** PPO-009-STAGES-HO · **Revision:** r02 · **Date:** 14 September 2026 · **Owner:** Dean Fiedler · **State:** implementation under verification; full increment A remains incomplete.

[Increment A #143](https://github.com/deanrfiedler-gif/powerplants-one/issues/143) · [accepted stage model](../decisions/crm-pipeline-stage-model.md) · [r02 plan and SA cases](crm-five-stage-implementation-plan.md).

Dean authorised repository-audit follow-through. This contribution builds on PR #148's additive catalogue at `bd5e829f8425ae1607509c806f691df03b3cc73c`; it does not rewrite migration 0021, original definitions, existing opportunities or event history.

## Delivered behaviour

- The stage command and detail controls read each opportunity's own catalogue. Forward movement is one ordinal; backward movement can reach any earlier ordinal. Unknown or cross-pipeline stages are refused before mutation. The database remains the final concurrent-write guard.
- Five-stage moves carry the original qualification note and identification action. Clients cannot replace those facts during movement. Contact removal still requires a currently permitted, owned, active identification action. I1 Enquiry/Qualified behaviour remains available for retained records and regression fixtures.
- A newly recorded stage event uses the exact database timestamp of the current-stage projection, including microseconds. Re-entry retains each original event; earlier events are not changed.
- Each editable board card has a labelled native stage button. Keyboard users can open the same controlled dialog, choose a stage, save and return focus to the moved card, on desktop and phone.
- A lost direct-drag response exposes **Confirm original save outcome**, using the original operation receipt and existing reconciliation path. Undo, Dismiss and further stage commands remain disabled while that outcome is uncertain. A definite refusal drops the provisional card placement; Undo sends no replacement command and opens no qualification dialog. Current saved information can be reloaded for comparison.

## Verification and limits

Local verification uses pinned Node 24.20.0 and npm 11.19.0. Lint, type checking, 85 unit tests, production build and all three Python documentation checks passed on this contribution; source-specific CI conclusions and original screenshots must be recorded on the PR before merge. The existing report-template filesystem-tracing warning is retained. PostgreSQL is unavailable locally and the pinned Chromium download failed with network 502/timeouts; database and browser cases therefore require disposable CI.

The new real-database case exercises six server moves, including Closing → Scoping and re-entry, original-receipt repetition, exact event/cache timestamp equality, retained qualification/owner/action, skipped/cross-pipeline refusal, stale version refusal and denied actor. The original direct-SQL cases remain. SA-07/08 browser cases perform a real concurrent edit or accept the original server command before dropping its response; they assert resulting events and command counts. SA-09 uses actual Tab/Enter/select-arrow input on desktop and 390 px. The two native-drag cases are explicitly desktop-only; they are skipped on phone rather than counted as phone drag proof. Component screenshots are required at desktop/390/320 px before merge.

No full SA, PT or business-acceptance status is promoted by authored tests or this handover.

## Discovery creation and conversion cutover

New UI opportunities require qualification evidence at Discovery. Unknown contacts require the initial identification Activity to belong to the opportunity owner. Converted Leads create exactly one Discovery/version-1 opportunity event atomically with their original conversion record and Lead event; original Activity identities, context checks and operation recovery remain. Leads retain their own New/Contacting/Nurturing/Disqualified/Converted status model; there is no invented Leads “Qualified” status.

Additive migration 0022 replaces the conversion guard with catalogue-specific branches: the retained I1 Qualified/version-2, two-event shape remains valid; the new pipeline requires Discovery/version 1 with qualification facts. The existing identification Activity FK retains its workspace/company/target but becomes deferred, matching the required atomic opportunity/Activity creation cycle. A deferred evidence guard retains qualification facts, requires an owned active identification action for an unknown contact at creation/movement/contact change, and binds stage-entry time to its exact event. No row, original receipt or grant is rewritten. Registry assertion and demo-upgrade changes were reviewed against these additive constraints; 0022 adds no seed and does not reset or activate a demo epoch.

The board defaults to the five-stage pipeline and offers a separate selector for retained I1 records. An explicit `?pipeline=I1` route preserves the original regression/restart journey. API callers omitting the pipeline filter retain the I1 default for compatibility; the current UI sends its selected pipeline explicitly. Legacy create-command canonical payloads omit the new qualification field, preserving recovery of older accepted operations.

New database coverage checks qualified Discovery creation and repeat receipt, all six movements and exact timestamps, unknown-contact creation and refusal of direct qualification replacement. The persisted browser case checks five columns, keyboard save/focus return, original qualification and event history after reload, with desktop/390/320 screenshots. Leads tests assert Discovery/version 1 and the one-event conversion. Existing I1 cases remain separately identified; these checks are not an owner acceptance claim.

[DEMO-02 r03](private-prototype-demo.md) now specifies the new isolated database/storage epoch and a 2/1/1/1/1 synthetic stage distribution. This is a preparation recipe; no new hosted epoch has been activated and no actual owner demonstration has run. SA-10/12 and the complete increment A decision remain under verification until the original CI evidence and epoch demonstration are recorded.

Won/Lost (#144), Projects handover and owner transfer (#145) remain separate contracts. No authority or live integration is introduced.

## Audit integration checkpoint — 14 September 2026

PR #148 merged normally as `d05598ae99a0aababb3ee3b31d9f882cac442fd7` after all 15 exact-head checks passed, including full Application run `34775694063` / job `103773275264`. PR #155 source `07fa41c83aaad87bd4d0cf58b07420ec28ac52c8` passed focused CRM run `34779342518` / job `103783366292` and compiled browser job `103783366091`; its full Application result is separately pending. The original keyboard, refused-drag and recovered-original captures, plus desktop/390/320 component layout, were inspected. These are I1 regression/runtime-control evidence, not the new persisted five-column cutover proof.

Downloaded original archives passed ZIP integrity and matched GitHub's digests: CRM interaction artifact `10325520082`, 4,199,392 bytes, SHA-256 `969e5e8d81ffccbf2ed92e1aeb401c4fb0d99f063580989ea88cdd42e63497e0`; header/board artifact `10324601078`, 2,672,834 bytes, SHA-256 `c109670d13ea8ebc033cd7c9b949029dac49ba4d73083c06fe5714e7d116f47d`.

`feat/audit-crm-integration` combines the original commits from register assurance #151, command-response evidence #154, runtime #155 and Discovery cutover #156 on the merged catalogue. The shared STATUS conflict is reconciled and the register retains all revisions. Combined CI, new cutover captures and exact-main verification must complete before declaring delivery. No P11/P12 completion, policy adoption, hosted reset or deployment follows from this integration checkpoint.

The first cutover CI (`044e698`) caught two ordering defects before merge: missing identification returned a generic row-constraint error, and a newly created identification Activity was blocked by the original immediate FK. The command now returns the specific missing-input error before insertion; migration 0022 defers that exact FK until commit, alongside the owned-active-linked evidence guard. The rollback case also supplies a well-shaped unavailable identification ID so a failure after tentative insertion still proves no partial effects. Fresh combined CI is required for these corrections.
