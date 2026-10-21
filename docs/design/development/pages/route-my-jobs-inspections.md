# Service inspection capture

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/my-jobs/inspections`. Scope: FI-03. Owner: Dean Fiedler. Owner visual review pending; no review fingerprint is assigned.

## Authority and source

The [accepted design decision](../../../decisions/inspections-figma-design.md) governs this page. Source: "PPO - Design", named version **Inspections — accepted**, page `1339:4184`, notes `1345:2979`; File index `630:2`, row `1396:355197`. The live notes and index agree with Git. Dean separately [authorised explicit reading instrument attribution and its migration](../../../decisions/inspections-reading-instruments.md) on 21 October 2026.

Desktop frames: `1339:4220` register, `1339:4442` awaiting review, `1339:4542` returned decision, `1339:4684` outcome ready, `1339:317844` capture. Tablet: `1339:4792`. Phone: `1339:317656` My inspections, `1339:317680` capture 390, `1344:3577` capture 320, `1343:3284` submit sheet, `1339:4851` retests. States: `1344:3746` disconnected, `1344:3909` uncertain submit, `1344:4086` not attending. Parts: `1344:4285`.

The twelve [icon-free retained captures](../../../reference/ui/quality-site-assurance/inspections-design-r01/README.md) remain unchanged. Images 05, 07–10 and 12 cover capture; 01–04, 06 and 11 cover review. Earlier [Quality r01](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html) is historical context. Source provenance remains `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`; the native workflow began at `feb01e57c1ffdab0a5f8d1a5664ab5144bd37ccd`.

## Page and handovers

Use r20 Form / guided workflow and Document / evidence workspace for FI-03; Register / worklist, Record detail and Review / comparison for FI-04, within the existing full-bleed shell at `#ppo-service-inspections`. Rail destinations remain My inspections and Inspection review. Use the shared compact phone header. No Conversations shell amendment is included.

Incoming: Appointment detail and My jobs; authorised Service scope, equipment/configuration, personal attendance, acknowledged issued pack and FI-05 readiness. Outgoing: frozen attempt, independent review, owned corrective Activity, fresh linked retest and internal inspection outcome. Existing permission checks govern every command and record. No receiving domain completes automatically.

Reuse SecondaryMenuFrame/useSecondaryMenu, RegisterTable/RegisterChip/RegisterEmpty/RegisterFooter, RecordTabs/RecordPanel, Button/ButtonLink, LocalDateTimeField, ReadState/ErrorNotice, WizardDialog, RecordIdentity, usePhoneHeader, ProductIcon and the recoverable command journal. See the [host component contract](../components/service-inspections.md). No new shared component, capability, grant or dependency is introduced.

## Desktop

At 1440 × 900, review has a compact toolbar, flush view menu and one grid row per submitted attempt. Views are All attempts, Awaiting review, Clarification requested, On hold, Returned, Retest due, Accepted not issued and Outcomes issued. Performer and Site filters operate over the bounded permission-filtered result. At tablet 1024 × 900 the secondary menu overlays rather than squeezing the register.

Records show the procedure, attempt, performer, visit and state before a readiness strip. A ruled summary sits beside the tabbed readings. Show each value, criterion, result in words, named instrument and retained calibration at use. Review preserves failed readings and reasons. Acceptance and issue remain separate: prepare exact HTML/PDF, inspect their hashes and files, then issue the same retained bytes after fresh authority/source checks.

## Mobile

At 390 × 844 and the drawn full-length capture widths 390 and 320, use one scrolling capture form and a compact shared header. Save draft and Submit inspection stay reachable. Numeric value and unit wrap without page overflow; qualitative choices use two columns at 320. My inspections contains only the current performer's work on permitted assignments, grouped To do, Submitted and Finished. Review retains the original failure, defect, correction, retest, independent review and outcome chain.

## States and integrity

Loading, empty, read error and denied access use the existing read/error controls. Stale results never confer command authority. Unsaved fields, saved server drafts, save in progress, version conflict and uncertain original are distinct. Disconnection shows the last saved time and disables commands. Unsaved edits exist in memory only. There is no offline inspection queue.

Missing personal attendance or current readiness explains why recording is disabled and links to My jobs. Submission first presents the saved checks and failed-check consequence; the server evaluates, freezes and assigns corrective work atomically. An uncertain command retains its original ID and payload in same-tab storage. Recover the original or retry it unchanged; attempt selection is disabled until resolved. Closing the tab or clearing storage removes that recovery copy.

Explicit reading instrument links belong to that attempt's retained snapshots and become part of its frozen hash. Migration 0115 leaves legacy attribution unrecorded and preserves old hashes. No inferred backfill is allowed. Calibration renewal does not repair historical use.

## Unspecified and excluded

Compare attempts (Q2), JPEG photos (Q3), new Evidence and Review history tab layouts, the technician clarification reply design and Conversations need separate work. Existing evidence/history authority remains. No tablet record, 200% zoom, stale-conflict, withdrawn-applicability or general permission-denied composition was drawn; reuse existing semantic controls and record resulting differences.

Per-reading capture timestamps are not retained by the existing model: show actual attempt save/test times, never invented times. Column settings and bulk actions have no adopted behaviour in this page contract. Review these gaps with Dean; do not imply acceptance from source presence.

The implementation retains explicit test-time, reason/observation, calibration and exact-evidence controls. They make the phone capture longer than the drawn composition; Evidence and Findings remain in the same scroll flow. Desktop Save/Submit remain at the capture pane's bottom edge. The shared compact phone header and its More menu use the current shell contract. The retest cards group retained reviews and correction details by attempt; exact source events remain available. These visual differences require owner review and do not amend the accepted reference.

## Verification and review

[Build verification](../../../testing/evidence/service-inspections/accepted-design.md) records checks, viewport comparisons and limitations. [Earlier workflow evidence](../../../testing/evidence/service-inspections/README.md) remains historical evidence. Source presence, functional proof, code delivery, deployment and owner visual review are separate. Visual review remains pending.

The phone My inspections list keeps its level-one heading available to assistive technology while the compact header supplies the visible title. Original-submit proof holds the request before commit, verifies recovery controls are disabled, then observes the committed response being lost before reloading for the exact receipt. The uncertainty banner alone does not establish transport completion. Owner visual/device acceptance remains pending.
