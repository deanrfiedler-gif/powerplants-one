# Service inspection review and retained retests

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:FI-04`. Scope: FI-04. Owner: Dean Fiedler. Native implementation; independent visual and owner acceptance pending.

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
