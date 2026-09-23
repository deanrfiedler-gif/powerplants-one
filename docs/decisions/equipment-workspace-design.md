---
document_id: PPO-EQUIPMENT-DES
date: 2026-09-14
owner: Dean Fiedler
status: Authorised r02 refinement; visual review and application integration pending
source_commit: 42383fc2e3a85f6cf9c38c829683b14787578579
versioning: git
---

# Equipment and Installed Base workspace

The [r02 interactive HTML](../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) implements Dean's authorised refinement of the Equipment workspace. It connects an equipment register, record and service history, visit preparation, equipment-specific inspection capture, review and retest, manual/QR-result identification and sourced assistance.

The [r01 HTML](../reference/ui/equipment/PPO-Equipment-and-Installed-Base-Workspace-r01.html) is preserved byte-for-byte for comparison. Its seven existing asset identities are retained in r02; readable Asset and Work Order examples now use six-digit sequences. Two additional synthetic records demonstrate a second Northbank site and a component within an assembly.

This is an authored design for review. It does not update application routes, services, schemas, dependency pins, external adapters or hosting. It is not an accepted application baseline or production inspection procedure. The UI baseline register remains unchanged pending visual acceptance.

## Sources and design approach

Current `main` was confirmed at `42383fc2e3a85f6cf9c38c829683b14787578579`. The r02 branch starts from the reconciled Equipment r01 PR #183 head `928c3fec7f64a5433b1f48139435df1205562226`, which already includes that main and the Finance r02 documentation. The r02 pull request targets the r01 branch so reviewers see only the refinement. Its dependency must merge before this design reaches main.

The user's accepted audit supplies the change scope. Existing authorities remain the [Service data dictionary](../contracts/service-data-dictionary.md), [Service API](../contracts/service-api.md), [PPO naming standard](../standards/naming-conventions.md), [document issue contract](../contracts/document-issue-distribution.md), current blueprint and the authorised F01/F02/F08 package in [PR #182](https://github.com/deanrfiedler-gif/powerplants-one/pull/182). No parent requirement is added, removed or renamed.

The attached theme is labelled r18, but the available HTML identifies itself as **r16**. Its SHA-256 is `19d96d383fadfda3bb03b5939cb933a64e4b220e69b8cb9a21df3f48d90b794f`. The design reuses the embedded Roboto fonts, supplied compact on-navy mark, navy `#242a37`, green `#62bb46`, neutral surfaces, 1 px borders and bottom-only drawer corners. It makes no claim to r18-specific styling.

The existing standalone HTML/CSS/JavaScript approach is retained. Model operations and DOM interaction are separable for targeted regression checks; no framework or application dependency is introduced. The HTML is self-contained and makes no network requests.

## Audit corrections

| Finding | r02 behaviour |
|---|---|
| Earlier review reasons overwritten | Each decision has its own immutable entry: submission ID/revision, reviewer, decision, reason, owner, due date and timestamp. Hold and clarification entries remain after the next decision. Original submissions remain separate from later drafts. |
| Cross-equipment or historically wrong context | Events carry an equipment ID and an event-time location snapshot. Pump 03's installation remains at the trial bench; its later move is retained separately. Climate-controller follow-ups appear only in that equipment's history. |
| Empty image accepted | Upload rejects zero-byte, unsupported, oversized and signature-mismatched files. Native image decoding must succeed with positive, bounded dimensions before attachment. Decoder failure provides a replacement/retry message. |
| Damaged saved state prevents loading | Navigation, filters, asset hierarchy, drafts, preparation, submissions, reviews, defects, activities and events are checked before render. Saved images are decoded again. Failure preserves original bytes and opens recovery with export and confirmed reset. A render boundary provides the same recovery route. |
| Passing inspection cannot be returned | Return for correction, Request clarification and Hold review are independent of numeric pass status. Each requires a reason, accountable owner and due date. Acceptance requires no failed or unavailable assessment. |
| Preparation omitted from submitted revision | Snapshot retains work order ID/revision, exact visit window/timezone, contact, installed and served context, access and isolation source IDs/revisions/extracts, acknowledgements and all five prerequisite groups with owners/review dates. |
| Location hierarchy oversimplified | Linked organisations, addressed sites, facilities/growing areas and equipment. Northbank has two sites; Pump 03 is installed in an irrigation shed and serves three growing blocks. Parent/component and predecessor links are separate. |
| Assistant citations lost | Saved follow-ups retain exact source IDs/revisions/extracts and the applying person's attribution. Link/update an existing obligation is offered before creating another; exact duplicates and stale source drafts are rejected. |

Review entries and snapshots are append-only through the design's controls. The local JSON is not cryptographically immutable or server-authorised; that distinction remains in Guide and the implementation boundary below.

## Expanded design coverage

| Area | Delivered scope and limits |
|---|---|
| Register and queue | Search reference, serial, manufacturer/model, organisation, site, installed and served area; combined site/facility/type/owner/due/condition filters. Whole-register totals and filtered equipment results are labelled separately. Queue distinguishes preparation, submission and review outcomes. Due calculations use the disclosed synthetic reference date, 14 September 2026. |
| Equipment details | Manufacturer and model are separate; commissioning and installation dates, firmware/software, criticality/impact, stable UUID, parent/component and predecessor links are shown. Lifecycle, operating condition, identity confidence and recorded-field completeness have separate labels. Completeness is a disclosed synthetic fixture value, not a verified health score. |
| Record maintenance | Reviewer-only, two-stage confirmation for create, correct, relocate, replace and retire. Reason, actor and previous context are retained. Correct can reassign a same-site parent without cycles. Relocation reassesses service areas and clears access confirmations. Active components block assembly retirement/replacement until reconciled. Replacement creates a new identity and does not infer warranty or commissioning. |
| Visit readiness | Work order, contact, visit timezone/window, access/isolation source, biosecurity, induction, crop access, irrigation/shutdown restrictions, tools and source owners/review dates. Outside-window and changed-restriction scenarios block submission until resolved. Current preparation is distinct from frozen submitted preparation. |
| Inspection templates | Equipment-specific checks for fertigation, pump, climate control, monitoring, ventilation and lighting. A visible issue enables a conditional detail/evidence check. Monitoring and lighting illustrate unavailable criteria. Every example limit is fictional and labelled at capture. |
| Defects and retests | Failed checks create explicitly linked defects. Repeated failures reuse the unresolved defect for that check and retain submission references. A passing accepted retest closes only the applicable linked defect; the existing OEM obligation remains open. New revisions have fresh preparation and evidence. |
| Evidence | Multiple photographs, check associations, editable draft captions, original file name/type/size/dimensions, progress and invalid-file recovery. Maximum eight originals, 8 MiB each, 20 MiB per revision and 40 megapixels. Phone HEIC or larger originals require a compatible smaller original. No silent resizing or compression. A separately labelled synthetic illustration supports the demonstration. |
| Identification | Known, unknown, malformed, ambiguous serial, retired/removed, damaged/replaced label, unavailable and restricted-record scenarios. Confirmation compares reference, serial, organisation, site and installed facility. Camera capture is not implemented; the sample result and manual fallback are explicit. Identification does not alter identity confidence or grant access. |
| Lifecycle context | Inspectable read-only relationships to maintenance planning, service agreements, warranty evidence, replacement history and service bulletins. The owning workflow is named; no coverage, scheduling or bulletin-application decision is implied. |
| Assistant | Equipment-scoped scripted summary, inspectable exact sources, editable proposal and explicit reviewed save. It uses the same native modal as other drawers, including on mobile. No provider connection or automated action. |
| Interface | Clear primary actions, explicit draft/read-only states, field-level errors with an error summary, focus restoration after navigation and modal close, native modal semantics with Tab/Escape handling. Detailed implementation notes are in Guide; fictional criteria and uncertain coverage remain beside their content. Native browser verification remains outstanding. |

## Primary synthetic journey

1. Open Fertigation unit 01, `SYN-PPO-AST-000101`, at Northbank's Propagation site / Irrigation room. Read work order `SYN-PPO-WO-000241` and the visit sources for 15 September, 07:30–10:00 AEST.
2. As Alex Morgan, confirm correct physical equipment, access/induction, authorised isolation and current restrictions; select current fictional instrument `SYN-PPO-INS-000009`, CAL-r02.
3. Enter **5.60 bar** and **2.00 mS/cm**, select Satisfactory, add a finding and attach a captioned photograph or labelled example to each numeric check. The pressure fails the explicitly fictional 4–5 bar criterion.
4. Submit. The full preparation, equipment/configuration, template, instrument, readings and evidence are frozen. One pressure defect links to this submitted revision.
5. Switch to Casey Reed. Return for retest with a reason, owner and due date. Alex starts the successor revision with fresh acknowledgements and evidence.
6. Repeat a failure if desired. Both detailed review reasons remain in the archive. Finally submit **4.60 bar** with suitable evidence and accept as Casey. The pressure defect closes; the separate OEM clarification does not.
7. Also try a passing first submission followed by Return for correction, Request clarification or Hold review. These decisions depend on the whole evidence package, independently of numeric results.

For horticulture context, inspect Pump 03's installed versus served locations and original installation event; filter Northbank's Growing-on site; inspect the fertigation dosing-pump component; try the ambiguous monitoring-hub serial in Identify. Guide contains the remaining exploration steps.

## Persistence and recovery

r02 uses only `ppo-equipment-workspace-r02`; r01's source and local key are untouched. Current drafts, submissions, reviews, preparation, record changes, obligations and history can be exported as a synthetic JSON session. The original image bytes are retained.

Browser storage may be unavailable or too small for larger original photographs. The visible Session only state instructs the reviewer to export before closing. This is not an offline synchronisation queue or durable server receipt. A damaged stored session is not replaced automatically: the recovery screen offers original-data export and a separately confirmed reset. The role selector remains disabled while saved evidence is being validated.

## Validation and remaining sign-off

The exact HTML digest and check results are in [the r02 evidence manifest](../testing/evidence/equipment-workspace-r02.json).

- `scripts/check-equipment-design-r02.mjs`: **69 checks passed**: 49 model/static checks and 20 DOM-emulation checks. They cover the eight audit regressions, repeated retests, held and returned passing work, readiness changes, unavailable/conditional checks, image rejection paths, citations, hierarchy, controlled maintenance, identification states, restart/recovery and every equipment tab/template.
- Node **24.21.0**, npm **11.19.0**, jsdom **27.0.1** for optional local DOM assurance. Existing dependency pins and lockfile are unchanged.
- Full repository `npm run lint` passed. Documentation foundation, prototype, naming and `git diff --check` are required before publication and recorded in the manifest.
- The DOM harness substitutes native dialog methods and an image decoder that accepts only the known synthetic fixture. It exercises decoder rejection and success handling; **it does not prove native image decoding, rendered layout, real keyboard behaviour or assistive-technology operation**.
- Browser visual verification remains **not run**. The earlier Browser URL security policy rejection is respected; no alternate preview route or renderer was used to bypass it.

Before accepting a visual baseline, review 1440, 1024, 390 and 320 pixel widths, 200% zoom, native modal focus/Tab/Escape and focus return, screen-reader announcements, real JPEG/PNG/WebP acceptance and malformed-image rejection, phone photographs, quota recovery and the complete technician/reviewer journey. Camera capture, real identity/access permissions, live document sources, offline/server integrity and integration require separate implementation and acceptance.

## Traceability and implementation boundary

CRM-01/CRM-06 and DAT-01–DAT-03 govern equipment/customer/site identity and distinct account authority. SVC-03/SVC-06 cover preparation, retained service history and unresolved work. DOC-01/DOC-02 govern exact source context and controlled issue. F01/F02/F08 are derived authorised delivery scope; later lifecycle workflows remain with their owning modules. The 78 parent requirements remain intact.

Production integration must reuse canonical Asset/Site/Facility/configuration/location/event and Activity identities, server permissions and durable concurrency/receipt controls. MYOB remains the intended ERP authority; SharePoint owns controlled business documents. Local role checks and snapshots do not implement those guarantees. No migration, real customer record, operational inspection limit or new reference allocator is delivered here.

## Preserved r01 evidence

r01 SHA-256 remains `24c8196564e1636c9ab846d5adf34dd462f66c9017ce8c28a83e7ea01e34d310` (171,342 bytes). Its [evidence manifest](../testing/evidence/equipment-workspace-r01.json), original model checks and DOM check remain unchanged for comparison.

The initial r01 PR head `61aff57dbbb72e40d04bce4e25e3c739a5bfd9c4` failed eight application jobs at the same three forbidden CommonJS imports in its new DOM script. PR #183's continuation replaced those imports with ES modules, preserved the HTML and reconciled current main. The r02 check uses ES modules from the start and is included in full repository lint. The later audit found cases outside r01's original demonstration checks; r02's regression suite records those additional cases without rewriting the earlier evidence as broader acceptance.
