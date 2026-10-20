# Service inspection review and retained retests

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/service/inspections`. Scope: FI-04. Owner: Dean Fiedler. Native implementation; independent visual and owner acceptance pending.

## Accepted design implementation claim — 21 October 2026

This worktree claims the FI-03/FI-04 Inspections implementation from the owner-accepted "Inspections — accepted" design in "PPO - Design" (page `1339:4184`, notes `1345:2979`). The current user instruction authorises the build. The existing inspection commands, attempt/retest authority and online-only recovery contract remain the basis. Owner visual review remains pending.

Initial plan: the inspection screen and stylesheet, bounded inspection list reads if required, page-specific UI helpers and synthetic fixtures/tests; narrow FI-03/FI-04 register, guide and component bindings; both scope/route contracts; one status fragment and generated status/build sequence. Reuse the application shell, compact phone header, secondary menu, register table, Button/ButtonLink, Field, ReadState, ErrorNotice, record tabs/dialog and recoverable commands. The initial plan excluded migrations; the attribution gap below now requires an owner instruction. No new capability or dependency is proposed. Appointment detail and My jobs remain incoming handovers; their implementation files belong to their separate claims.

### Data-contract gap requiring an owner instruction

Source inspection found a gap between the accepted per-reading instrument presentation (D2/D5) and current persistence. Live Figma frames `1339:4442`, `1339:317844` and `1339:317680` show insulation resistance using SYN-MEG-002 and holding torque using SYN-TW-011. The attempt's readiness bar says an instrument is named for each reading. The live notes card `1345:2979` and File index row `1396:355197` agree with the acceptance record.

The built `Reading`/`ResultRow` has no instrument reference. `SaveInput.instrument_ids` and `ppo.inspection_instrument_uses` retain a set for the whole attempt. The latter's identity is `(workspace_id, attempt_id, instrument_id)`, without `check_key`. The existing submit check establishes that at least one retained instrument matches a required measurement basis; it does not establish which instrument the technician used for a particular reading. Matching type, range and unit would be inference, especially if two retained instruments share that basis. The current form selects only one instrument for the attempt.

Proposed bounded extension, **not adopted or implemented**:

- Retain explicit check-to-instrument links with the draft, scoped by workspace, attempt and stable check key, and referencing that attempt's retained instrument use.
- Freeze and include those links in submitted integrity evidence. Preserve historical attempt hashes and label earlier attribution as not recorded; never backfill an inferred association.
- Keep existing calibration-at-use and required measurement-basis checks, independent review, defect/retest authority and online-only recovery.
- Reserve a migration only after Dean authorises the extension and the live schema has been inspected. Include populated-upgrade proofs, exact migration-ledger updates and the shared Engineering consumer's compatibility checks. Add no capability, dependency or service infrastructure.
- Prove two checks with different instruments, two instruments with the same measurement basis, saved-draft reload, immutable submission, historical unlinked evidence and recovery of the exact original.

A layout-only alternative would explicitly label instruments as retained for the attempt and defer per-reading attribution. That would be a departure from the accepted design and also requires Dean's instruction. No such departure has been adopted.

D4 has a separate implementation gap: the Service command currently renders and records an output during issue. The shared `prepareBundle` already retains exact bytes before database issue, and the append-only Service event store may support a preparation record without a migration. Its proposed implementation must prove that previewed bytes are the issued bytes, stale sources refuse issue, and an uncertain preparation recovers the original. This is not a claim that a prepared-outcome flow already exists.

The read-only live schema inspection on 21 October 2026 could not connect to local PostgreSQL (`ECONNREFUSED`). The findings above come from current TypeScript and the repository migration history, not a verified live schema. Application implementation is held at the user's migration stop condition. Owner visual review remains pending; the claim does not deliver the page.

Reference provenance: imported working baseline `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`; native implementation starts from merged Step 6 `feb01e57c1ffdab0a5f8d1a5664ab5144bd37ccd`. Guide keys and source references remain stable.

## Page and handovers

Use r20 Register / worklist, Record detail and Review / comparison in the existing padded shell, `#ppo-service-inspections`, with one shell content scroll owner. The worklist opens `appointment_id`; attempts retain stable IDs. Reuse PageHeader, Button, Field, ReadState, ErrorNotice, native fieldsets/details and original-command recovery.

Incoming: Equipment/configuration, Service appointment and authorised scope, personal attendance, exact issued job pack and FI-05 readiness. Outgoing: frozen review, owned corrective Activity, linked fresh retest and internal controlled output. An outcome completes no receiving domain automatically. FI-06 remains unavailable.

## Desktop

Accepted design: the [Inspections design decision](../../../decisions/inspections-figma-design.md) of 18 October 2026, with captures 01–04 (desktop 1440 × 900) and 06 (tablet 1024) in [design r01](../../../reference/ui/quality-site-assurance/inspections-design-r01/README.md).

- **Register:** the Work orders grid, one row per attempt (D1). Columns: Visit, Procedure, Attempt, Review, Result, Defects, Equipment, Performer, Submitted and Site. Side-menu views: All attempts; Review: Awaiting review, Clarification requested, On hold, Returned; Follow-through: Retest due, Accepted not issued, Outcomes issued.
- **Attempt record:** the SV-06 record layout with a "Before outcome" readiness bar and tabs Readings, Evidence, Defects and retests, Review history and Outcome (D2). Each reading states value, criterion, result in words and the instrument with its calibration.
- **Review decision:** what failed first, then the reason and the decision (Accepted, Returned, Clarification required, On hold, as built), saved with "Save review decision" (D3). Returning keeps the attempt exactly as submitted.
- **Outcome:** after acceptance the primary action is "Issue outcome"; the Outcome tab shows the prepared internal outcome, its hash, what it keeps and a preview, and sends nothing to the customer (D4).
- **Compare attempts:** a later addition (Q2); the links are drawn, the view is not.
- **Access:** unchanged; review needs report read and work order edit access, as built (Q4).
- **Shell:** the proposed Conversations action sits left of the information icon; the shell amendment is still open.
- Nothing new is built.

At 1440 × 1000 and 1024 × 768 keep record context and save state readable. Fields use responsive columns; hashes and sources wrap without horizontal page overflow. Procedure preview, attempts, evidence, defects and outputs use shared cards. Required criteria remain visible outside source details.

## Mobile

Accepted design: capture 11 in [design r01](../../../reference/ui/quality-site-assurance/inspections-design-r01/README.md). The reviewer's Retests tab shows the chain in order: attempt 1's failure, the defect, the correction, the passing retest, the pending review and the outcome not yet issued, with Open visit and Review attempt pinned (D6).

At 390 × 844 and 320 × 844 stack fields with 16 px input text and 44 px controls. Evidence attribution, classification and hashes wrap. Verify actual 200% browser zoom, Tab/Shift+Tab, Enter, validation and global-guide focus return. The shell content region owns scrolling. Physical-device and screen-reader acceptance remain separate.

## State contract

Saved server drafts, unsaved browser entries, saving, stale conflict, uncertain original, denied access, held preparation and withdrawn applicability are distinct. Refusal/conflict retains active-page input. Recovery retains unchanged ID/payload before transport in same-tab storage. Closing the tab removes that recovery copy. No offline inspection queue exists; reconnect is online recovery.

## References and adaptations

Accepted Figma design: [Inspections design r01 captures](../../../reference/ui/quality-site-assurance/inspections-design-r01/README.md) (images 01–04, 06 and 11 for FI-04; twelve icon-free PNGs in all; design compositions, not application captures) and its [decision](../../../decisions/inspections-figma-design.md). The sentence below that no accepted FI-03/FI-04 image exists predates this acceptance on 18 October 2026. Images of the Evidence and Review history tabs, compare attempts, a tablet or 1024 record, denied access, withdrawn applicability and stale conflict states, and 200% zoom are still missing. The named Figma version "Inspections — accepted" is saved.

Exact retained reference: [PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html). Page types use retained theme r20. Quality r01 remains a proposed broad Quality/incident workspace; these consumers adapt it to bounded Service duties. No accepted FI-03/FI-04 desktop or phone image exists. Implementation captures are evidence, not owner approval.

See [decision](../../../decisions/service-inspections.md), [host contract](../components/service-inspections.md) and [verification](../../../testing/evidence/service-inspections/README.md). Review fingerprints remain unset.

Agent technical inspection, 1 October 2026, build `D49Y9dS7Qw2QbEKy6RmRr`: [1440 review](../../../testing/evidence/service-inspections/captures/review-readings-1440.png), [1024 review](../../../testing/evidence/service-inspections/captures/review-readings-1024.png), [390 capture](../../../testing/evidence/service-inspections/captures/capture-390.png), [320 capture](../../../testing/evidence/service-inspections/captures/capture-320.png). Wrapping, one shell content scroller, keyboard focus/validation and actual 200% zoom were checked. These implementation images do not replace the missing accepted mockups or grant independent owner/device/screen-reader acceptance.

## Original-receipt selection availability — 3 October 2026

Attempt buttons are disabled while the existing command guard is busy or has an unresolved original. They become selectable after recovery; permission and applicability still govern receiving actions. The fixture holds the real actor-bound receipt response and verifies disabled selection followed by enabled selection, on desktop and phone. `tests/browser/service-inspections.spec.ts` also awaits the exact recovered draft read before its unchanged display assertion. Existing FI-03/FI-04 and both inspection-route bindings remain; no new authority or offline protocol. [Current evidence](../../../testing/evidence/field-integrated-acceptance/README.md) records actual outcomes. Review remains pending; no fingerprint or accepted native mockup is manufactured.

## NAV discovery

Inspection review discovery requires report.read and service.work_order.edit together. Existing scoped per-visit checks remain; incompatible scopes reveal no record identity. Desktop/phone More and ordinary Workspace retain equivalent meanings. Host evidence and acceptance remain separate; see the NAV ledger.
