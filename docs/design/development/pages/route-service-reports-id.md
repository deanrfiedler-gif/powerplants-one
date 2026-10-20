# Service review and reports — record contract

Stable entry: `route:/service/reports/[id]`. Owner: Dean Fiedler. Delivery: draft SV-06 build, includes embedded FI-07. Owner visual review: **pending**. Existing parent requirement IDs are unchanged.

## Accepted source and delivery boundary

Source: **PPO - Design**, page **1265:53**, named version **Service review and reports — accepted**. Dean accepted D1–D6 and Q1–Q2 in the [design decision](../../../decisions/service-review-figma-design.md). Source design acceptance is not application visual review: **owner visual review pending**, no reviewer, date or fingerprint assigned.

| View | Figma node | Retained icon-free capture |
| --- | --- | --- |
| Desktop register, 1440 × 900 | 1266:190 | 01 |
| Submitted snapshot | 1267:929 | 02 |
| Evidence | 1269:1621 | 03 |
| Review submission, returning | 1269:2112 | 04 |
| Customer report ready to issue | 1270:2196 | 05 |
| Customer response | 1271:2457 | 06 |
| Tablet register, 1024 | 1271:2894 | 07 |
| Phone register | 1271:3948 | 08 |
| 320 px register | 1271:13017 | 09 |
| Phone Evidence | 1271:9242 | 10 |
| Record customer response sheet | 1271:12493 | 11 |
| Loading / no matches / could not load | 1271:13201 / 1271:13297 / 1271:13383 | 12 |
| View only / newer report refusal | 1271:13460 / 1271:13592 | 12 |

Page parts: **1265:122**. Binding notes: **1271:299637**. Index: **630:2**, SV-06 row **1277:298201**. Captures 01–12 are in [Service review design r01](../../../reference/ui/service/service-review-design-r01/README.md); they remain unchanged. Live frames, not retained HTML or generated code, supply the composition.

## Desktop

D1: a flush register with the shared Service rail and 240 px secondary menu. All reports / My reviews; Review: To review, Returned to technician, Ready to issue; After issue: Awaiting response, Response not accepted, Remaining work open. My reviews means the currently owned work order, not a new assignment grant. Counts and filters cover only the permitted members of the existing latest-200 candidate window (Q1); older reports remain linked from attendance.

D2: a semantic grid with checkbox selection, Open in sequence, Export list, Technician and Customer filters, removable criteria, report-reference sorting and an as-at time. Selection never changes records. Export contains only the displayed/selected permitted rows and neutralises spreadsheet formula prefixes. Columns retain Report, Visit, State, Outcome, Attention, Technician, Attendance, Customer, Site, Customer response, Remaining work, Work order, Revision and Updated.

D3: opening a desktop row displays the large two-column snapshot with Close / Previous / Next, Open report and permitted Review submission. Escape restores the opener. Tablet keeps the grid horizontally scrollable and moves the menu to the shared overlay.

D4: the record has a state-labelled header, Open work order and a permission/state-specific primary action; a readiness strip; ruled Summary, Customer/site/equipment and Work order sections; Evidence, Work outcome, Customer report, Customer response and History tabs. Details additionally appears on phones. Work outcome and history retain the existing facts and commands rather than inventing new workflows.

D5: Review submission opens in Evidence. Entry decisions and reasons, submission decision, authority disposition, internal remarks and explicit permitted site contact use the existing exact-version/hash command. Review drafts stay mounted across tabs; refreshing does not silently rebind their original version. A newer source refuses the command and retains the input. Technical approval is not Finance approval or inspection clearance.

Customer report retains DraftEvidence and IssuedReport identities, protected byte/hash checking, exact HTML, PDF retrieval, issue and original output retry. Issuing sends nothing. Customer response retains subject, explicit response choice, stated name/role, optional synthetic PNG mark, remarks, next action, capture time, append-only correction and same-tab uncertain-receipt recovery.

## Mobile

At 390 and 320 CSS px use the shared compact header and five-tab phone navigation; Service review remains under More (D6). Register rows show visit/date, report/customer, state, attention and declared outcome. Filters open a labelled panel; no horizontal document overflow. Evidence keeps readable entry facts, horizontal tabs and the pinned work-order/review actions. View-only omits mutation actions. Response capture uses a full-width sheet; protected exact presentation remains inspectable.

The phone record keeps a bounded tab scroller above an in-flow action or view-only footer. The footer reserves its actual height above the shared navigation, including wrapped text at 320 px; it must not cover the final Details handover to technician evidence. Review save controls stick to this scroller rather than a second viewport offset.

The response sheet covers the phone shell with modal focus containment, a focused heading and pinned Record response / Customer unavailable / Cancel controls. Customer unavailable only selects the existing choice and focuses the reason. Dirty close confirms discard; unresolved operations cannot be dismissed. Separate subject, stated name/role, optional mark and capture time remain explicit exact-command fields, making the form longer than the simplified drawn example.

Labelled native controls, semantic table headers, status words, visible focus, keyboard tabs/popovers, explicit cancel and dirty-navigation protection are required. Empty, filtered-empty, loading, failed read, denied, view-only, partial completion, returned entry, invalid/stale save and uncertain result are distinct. Failed register reads clear rows/counts rather than presenting stale permission-filtered data.

These routes are online review/issue surfaces, not a new offline capability. The existing owner-bound field offline workspace and [FI-07 contract](../../../contracts/field-customer-response.md) remain authoritative. No offline review, issue, background sending or automatic replay is introduced.

## Shared components and handovers

Reused: Button / ButtonLink; RegisterTable / RegisterSortHeader / RegisterChip; RecordTabs / RecordPanel; SecondaryMenuFrame / useSecondaryMenu; shared phone header and RecordIdentity; WorklistChoice / WorklistMenu / WorklistPanel; ProductIcon through the existing Font Awesome mapping; ReadState / ErrorNotice / Stamp; ReportPhoto; ExactReportPresentation; useUnsavedChanges and recoverable-command journal. New report parts are page-local, not a new shared component family. Tokens supply all new colours, borders, focus and surface treatment; the existing iframe sizing preserves exact retained bytes.

Incoming: P07 completion/attendance, P09 review/audience/output, FI-03/04 evidence and restrictions, FI-05 readiness, FI-06 holds. Read the [Inspections decision](../../../decisions/inspections-figma-design.md) with the service review decision. Outgoing: existing work-order/technician links, owned Activity and permitted Finance handoff. No inspection attempt or hold is cleared, no return visit is booked, and no customer is contacted here. Remaining work open is the bounded cross-report queue (Q2), not standalone SV-07.

## Unspecified details and adaptations for Dean

- No source defines a numerical “looks wrong” rule. Attention uses recorded review/response/work state, not an invented reading calculation; the sample 45 m reading stays a technician original.
- The current issue command renders/verifies a distinct IssuedReport; it does not promote DraftEvidence bytes. Copy identifies draft versus issued output explicitly rather than claiming that draft HTML becomes the issued report. Confirm the final customer-report wording against that existing authority.
- Response follow-up is assigned to the current Service owner with **Due date needed**. Dates/owner changes remain on the Activity; the response form does not invent a due-date command.
- Dedicated frames for Work outcome, History detail, tablet record, after-issue output, correction, original-photo inspection, Finance handoff, desktop empty/error and hover remain unspecified. Existing behaviour is retained; no acceptance is inferred for these adaptations.
- Register queues are filters within the 200-report window. No cross-window totals, permanent saved views, bulk mutation, sending, standalone Customer response page or Findings build is implied.

## Verification and review

Implementation proof and local limitations are recorded in [SV-06 build evidence](../../../testing/evidence/service-review-build/README.md). Source presence, functional proof, design acceptance, application visual review and deployment remain separate. Documentation checks do not confer business acceptance.
