# Job Pack application integration

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Scope SV-05 / SC-06; requirements SVC-03, SVC-06 and OUT-09. Implementation record for the user-authorised Service Operations programme, based on `aed0c00` after I7 #309 (I6 #306 dependency). Review: conformance candidate; owner/device acceptance and deployment are separate.

## Baseline and authority

[Accepted r03](../reference/ui/job-pack/powerplants-one-job-pack-r03.html), SHA-256 `5b41481460984bdeb09f683b76a5ba30cdd805eb19f90735e725d01fedc6b825`, remains byte-identical. [Adopted decisions](job-pack-design.md), the [build plan](../delivery/job-pack-integration-build-plan.md), ADR-0011, ADR-0029 and the document contract govern the implementation. No pack snapshot, hash, OUT-09 template, command, migration or permission changes occur in I5.

## Host and handovers

The r20 record/detail page uses the existing full-bleed module root and owns its vertical scroll. The application shell retains Service navigation, identity, search and page guide. The accepted D8-A in-module breadcrumb remains. Shared Button/ButtonLink and ReadState compose the canonical JobPackEntry, used by Field Technicians and appointment detail. It reads the existing documents-domain appointment pack endpoint; failed, loading and denied reads hide stale action links. Only the server's can_prepare enables the no-visible-pack preparation link; Save retains all existing authority checks. Incoming appointment identity and outgoing exact pack, appointment and issued-document identities remain explicit.

## Conformance and deliberate adaptations

| Area | Application treatment | Evidence |
|---|---|---|
| Tokens, paper and rails | All 41 r03 tokens; existing shared fonts; 24/16 px padding and breakpoint layout | Component and compiled r03 checks |
| Saved sections | D6-A exact-text proof or frozen fallback; no live substitution | I6 byte/unit/database/browser proof |
| Title/readiness/history | D7-D10 verified scope and server outcomes, staff-only metadata | I7 proof and captures |
| Header | At most two actions; appointment link in section 01; prior issue link remains above the saved successor | I5 and retained I4 tests |
| Print | Named A4 workbench page, repeating exact reference/revision/state, page numbers, saved sections and explicit workbench warning | I5 print proof/captures; controlled output unchanged |
| Phone shell | Overrides an older identity-dependent grid so utility controls stay in the 64 px header; preserves CRM’s deliberate filter row | Shared component and compiled shell proof |
| Legacy CSS | Removed only unused pack-panel/status/field/form/choice selectors; retained pack-list, toolbar, hash and manifest consumers | Consumer search and regression checks |

The named print page uses r03’s margin-header approach, with every record-text code point CSS-escaped before insertion into the content string. A security regression test retains hostile quote, backslash and closing-style text safely. Initial fixed-header inspection failed on the final page and was replaced before delivery. The print scope releases the module and every clipping shell ancestor; it does not change other modules’ print styles. Browser printing from Preparation still prints the saved revision, explicitly excluding unsaved entries. The normal Print preview command still opens the existing saved server output.

The adopted departure register is retained below; later refinements do not silently amend these decisions.

| ID | r03 | Application treatment | Reason |
|---|---|---|---|
| DP-1 | No entry field in sections 01, 05, 06 | A notes field in each | The server requires all nine notes; an empty history selection must be explained |
| DP-2 | Saving updates draft r01 in place | Each save is a new immutable revision | `pack_revisions` is immutable evidence (ADR-0011) |
| DP-3 | Draft ↔ Review requested | The five server states and `needs_review` | D1; the decision record calls the preview wording a handover intention to be mapped |
| DP-4 | Required documents; required originating history entry (M5) | Not enforced; at least one source | No server concept exists. Proposed for a later increment |
| DP-5 | Selectable evidence requirements | Read-only, from scope items in the snapshot | Completion requirements belong to the authorised scope |
| DP-6 | Tool status, permitted exception, access status and confirmation entered on the page | Shown from recorded readiness assessments; assessed at `/service/appointments/<id>` | D4; "no six-item client checklist can replace server readiness" |
| DP-7 | Issue, acknowledgement, distribution and recovery outside the preview | Kept, as a fourth rail card and within the acknowledgement card | Existing P06 function must survive |
| DP-8 | Material / not-material assessment | Successor revision with a reason | D2; ADR-0011 treats every revision as material |
| DP-9 | Review and Dispatch stages; "PP-01 synthetic policy r01" | Server stage names (Authorisation, Booking, Dispatch, Completion) and the real policy key and version | The registry supplies real references, as the acceptance anticipated |
| DP-10 | `SYN-PPO-DOC-nnnnnn` document references | Title, `version_id` and hash from `pack_sources` | The open PPO-STD-001 type-code question is not forced by this build |
| DP-11 | `window` scroll, embedded font, demonstration footer controls | Module-owned scroll, shared Roboto face, no demonstration controls | Host contract |
| DP-12 | Sticky right rail | The right rail scrolls with the page; the contents rail stays sticky at the accepted 24 px | Found in I2: the live registry lists eight criteria with their recorded reasons, so the rail is taller than the viewport, and a sticky element taller than its scrollport hides its middle — including **Check this revision** — until the page ends |
| DP-13 | Header action "Prepare pack" | "Prepare successor revision" | Found in I2: every save is a new immutable revision (DP-2), so the accepted label would understate what the action does; it is also the name the P11 journey helper already uses |
| DP-14 | Class names `.layout`, `.notice`, `.field`, `.badge` … | The same rules under a `jp-` prefix | Found in I2: `globals.css` already defines `.notice`, `.field` and a 10 px `footer`, which would leak into the scope container. Tokens, values and geometry are unchanged and are asserted against the issued HTML |

DP-15 to DP-21 follow the adoption of D6–D10 on 23 September 2026 (§7); DP-22 was adopted on the same day, after I3 measured the defect it resolves. They are proposed in [build report](../delivery/job-pack-build-report.md) Appendix F and recorded here as adopted departures for the increments that deliver them.

| # | r03 | Application treatment | Why |
|---|---|---|---|
| DP-15 | Sections render live source values | A proved re-presentation of the frozen section text, with the exact text always one activation away | The page must show what Check and Issue freeze (D6-A) |
| DP-16 | The notice button performs "Submit for review" | The notice action moves focus to the card that holds the decision | One control per decision; unique accessible names across the browser suites |
| DP-17 | Six flat readiness rows | Registry criteria grouped by blocking stage, satisfied rows collapsed | Eight real criteria across three stages (D9) |
| DP-18 | Two header buttons | At most two by state; "View appointment" moves into section 01 | Header economy at every width |
| DP-19 | Breadcrumb "Service › Field technicians › Job pack" | "Service › Job packs › {reference}", beside the shell breadcrumb | D8-A; recorded as an accepted exception in the UI-consistency handover |
| DP-20 | Tools table with "Parts: not applicable" | Recorded controls table in section 07 and a compact list in 08; no parts row | No parts criterion exists, and the frozen control text is identical in both sections |
| DP-21 | Section 01 shows the coordinator, site address and visit status | Coordinator and live visit status omitted; the location stays in section 02 | Neither is in the pack read; the location is in the frozen arrangements text |
| DP-22 | Preparation action bar `position:sticky; bottom:12px` | **Fixed** above the shell’s navigation bar at ≤ 760 px; r03’s static fallback is kept below 650 px of viewport height | Found in I3. A sticky box may not be displaced above its containing block, and on a phone the form begins near the foot of the scrollport, so the bar was clamped to the form’s own top and fell behind the shell’s fixed bar — measured at 26 px of overlap at 390 px and 145 px at 320 px. A bottom inset, which §11 anticipated, does not reach the cause. Every r03 value — box, padding, radius, shadow, border, 44 px targets — is unchanged; only the positioning scheme differs. Because a fixed bar paints over the modal backdrop, it is hidden while a dialog is open |



## Evidence and remaining decisions

[Integration handover](../delivery/job-pack-integration-handover.md) and [I5 evidence](../testing/evidence/job-pack-i5/README.md) distinguish source, function, inspected appearance, device review and deployment. The three shared-core colour differences with Field Technicians r05 remain unchanged; the evidence swatch supports a separate owner decision. Physical-device and owner acceptance remain open. The original five uploaded reference PNGs cited by report Appendix E are unavailable in this session; fresh captures of the unchanged r03 are explicitly labelled with actual capture metadata, not represented as those historical uploads.
