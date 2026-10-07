# Lead customer context execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Review: synthetic functional checks and limited capture inspection; paired visual, owner, physical-device and screen-reader acceptance pending.

LC-12 implements [customer resolution and accountable ownership](../../../decisions/lead-customer-context.md), the remainder of increment 1 in the [lead-to-delivery programme](../../../contracts/lead-to-delivery-continuity.md). The working implementation is based on `73cfdb4` (PR #359, itself based on Maintenance PR #357). The [manifest](manifest.json) retains tested source and evidence hashes. These checks do not establish final-head CI, merge, deployment or completion of the wider programme.

## Result and environment

Captured enquiry facts and original Activities remain unchanged. An explicit customer resolution can be corrected with retained history and preselects conversion. Native customer/contact/dated affiliation/site creation returns to explicit Lead review; each shared save has its own original receipt. Transfer requires the active current owner, an eligible recipient and every linked Activity version. Original accepted operations remain recoverable by the former owner only while current permissions and all-target visibility remain valid. New intent requires the new owner.

Migration 0073 adds empty immutable companions and guarded transitions. No capability, seed, grant, user, identity type, dependency or external business effect is added. Existing command payloads remain compatible. Windows, Node 24.21.0, PostgreSQL 16, isolated disposable `ppo_synthetic_test`, compiled loopback application, Playwright 1.63.0 and Chrome 154.0.8037.98. Connection settings remain outside version control.

| Check | Observed result |
|---|---|
| LC-12 database suite | Final 6/6 pass; exact transfer-history projection also passed in the isolated run |
| Combined LC-12, LC-11 and existing Leads database run | 18/18 pass before the additional distinct-creator recovery case; that sixth LC-12 case passed in the final run |
| Ten selected upgrade scenarios | Nine passed initially; one cleanup timeout passed unchanged in isolation with the same limits |
| Complete compiled Leads browser suite, desktop and phone | 15 pass; one existing desktop-only column test skipped on phone |
| Existing Leads validation units | 3/3 pass |
| Build, TypeScript and lint | Pass |
| Foundation, prototype, naming and studio | Pass; source presence is separate from pending visual/owner acceptance |

Database checks cover immutable capture and resolution history, exact original recovery, qualification against the current selection, transfer without Activity reassignment, changed Activity versions, hidden recipients/targets, revoked grants, old-owner new-intent refusal, late outbox rollback and direct SQL transition guards. The previous-72 populated upgrade preserves prior rows, receipts and grants. Selected cross-domain upgrade checks cover populated E1 estimating identities/cost/history, FI-01 historical grants, 0017/0018 Lead/Project receipts, policy persistence, and hosted demo runtime privileges/CRLF checksum history.

The browser journey uses actual native create and resolution controls, aborts accepted response delivery, confirms the original save without a second POST, reloads persisted context, and opens conversion with the current selection. The stale-edit case changes the Lead while the dialog is open and proves background refresh does not advance the submitted version. Its denied-state presentation uses a mocked 403; actual permission denial is separately covered in the database suite. No standalone HTTP suite, application/PostgreSQL stop/start or full cross-domain regression was run locally for this increment; compiled browser HTTP and selected upgrade checks are the bounded evidence, with broader CI still separate.

## Captures

Six automated LC-12 desktop/phone captures are retained. The agent inspected the current [phone created context](mobile-lead-created-customer-context.png): captured and resolved fields stay distinct, long synthetic names wrap and Convert remains reachable. The [desktop transfer comparison](desktop-lead-owner-comparison.png) has a stable modal header/footer and disabled transfer; it was captured while eligibility was still loading, so it is not a visual review of the settled no-recipient state. The browser assertion separately verifies that state. Remaining captures are retained without a claim of independent paired review. Exact new-state source mockup images are missing; no accepted fingerprint is assigned.

## Earlier failures retained

The first database run passed three cases and failed two because a new test fixture used `scope_kind` instead of the live `scope_type` column. The fixture was corrected; the negative SQL assertion now specifically requires SQLSTATE 23514 and cannot pass from a fixture failure. All six final cases pass.

The first expanded browser run passed eleven, skipped one and failed two because the test used the label `Organisation` instead of the existing `Existing organisation`. The locator was corrected. The final suite also includes the subsequent stale-refresh/denied-state cases and passes 15/15 applicable checks. Expected console errors come from deliberately lost responses, the actual stale-write 409 and the mocked denied-state 403.

One cross-domain upgrade attempt timed out while executing the pre-test `0001-recover.sql` cleanup during concurrent build load, before applying the migration. The unchanged scenario passed alone under the same limits. Both logs are retained; neither the earlier failure nor the retry is concealed or presented as a baseline regression diagnosis.

Evidence text is retained with LF bytes; the manifest records its exact hashes. Human review and deployment remain open, as do programme increments 2–6.

The first documentation check ran while evidence packaging was incomplete and reported the missing manifest link. The manifest was then written and the check rerun; this was an evidence-packaging failure.
