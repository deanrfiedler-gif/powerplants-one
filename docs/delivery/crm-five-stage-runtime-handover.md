# CRM five-stage runtime and board recovery handover

**Document ID:** PPO-009-STAGES-HO · **Revision:** r01 · **Date:** 14 September 2026 · **Owner:** Dean Fiedler · **State:** implementation under verification; full increment A remains incomplete.

[Increment A #143](https://github.com/deanrfiedler-gif/powerplants-one/issues/143) · [accepted stage model](../decisions/crm-pipeline-stage-model.md) · [r02 plan and SA cases](crm-five-stage-implementation-plan.md).

Dean authorised repository-audit follow-through. This contribution builds on PR #148's additive catalogue at `bd5e829f8425ae1607509c806f691df03b3cc73c`; it does not rewrite migration 0021, original definitions, existing opportunities or event history.

## Delivered behaviour

- The stage command and detail controls read each opportunity's own catalogue. Forward movement is one ordinal; backward movement can reach any earlier ordinal. Unknown or cross-pipeline stages are refused before mutation. The database remains the final concurrent-write guard.
- Five-stage moves carry the original qualification note and identification action. Clients cannot replace those facts during movement. Contact removal still requires a currently permitted, owned, active identification action. I1 Enquiry/Qualified behaviour remains available for retained records and regression fixtures.
- A newly recorded stage event uses the exact database timestamp of the current-stage projection, including microseconds. Re-entry retains each original event; earlier events are not changed.
- Each editable board card has a labelled native stage button. Keyboard users can open the same controlled dialog, choose a stage, save and return focus to the moved card, on desktop and phone.
- A lost direct-drag response exposes **Confirm original save outcome**, using the original operation receipt and existing reconciliation path. Undo, Dismiss and further stage commands remain disabled while that outcome is uncertain. A definite refusal drops the provisional card placement; Undo sends no replacement command and opens no qualification dialog. Current saved information can be reloaded for comparison.

## Verification and limits

Local verification uses pinned Node 24.20.0 and npm 11.19.0. Lint, type checking, 84 unit tests, production build and all three Python documentation checks passed on this contribution; source-specific CI conclusions and original screenshots must be recorded on the PR before merge. The existing report-template filesystem-tracing warning is retained. PostgreSQL is unavailable locally and the pinned Chromium download failed with network 502/timeouts; database and browser cases therefore require disposable CI.

The new real-database case exercises six server moves, including Closing → Scoping and re-entry, original-receipt repetition, exact event/cache timestamp equality, retained qualification/owner/action, skipped/cross-pipeline refusal, stale version refusal and denied actor. The original direct-SQL cases remain. SA-07/08 browser cases perform a real concurrent edit or accept the original server command before dropping its response; they assert resulting events and command counts. SA-09 uses actual Tab/Enter/select-arrow input on desktop and 390 px. The two native-drag cases are explicitly desktop-only; they are skipped on phone rather than counted as phone drag proof. Component screenshots are required at desktop/390/320 px before merge.

No full SA, PT or business-acceptance status is promoted by authored tests or this handover.

## Remaining increment A cutover

Creation and Leads conversion still use the original I1 path. The board's default pipeline remains I1. The final cutover must switch these together under the accepted new database/storage epoch and revise DEMO-02; relabelling unqualified Enquiry history is forbidden. Inspection also found `ppo.check_conversion_operation()` in migration 0018 pins a converted deal to Qualified/version 2 and two original events. A new additive migration must preserve that historical branch while requiring an atomic Discovery/version 1 creation carrying qualification evidence for the new pipeline. Merely changing the Leads service literal would fail this invariant.

SA-10 and the persisted five-column SA-12 proof remain cutover work. Won/Lost (#144), Projects handover and owner transfer (#145) remain separate contracts; no authority or live integration is introduced by this contribution.
