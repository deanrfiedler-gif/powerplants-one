---
document_id: PPO-AD03-PLAN
title: AD-03 — Data Quality Workbench — Build Plan
date: 2026-09-17
owner: Dean Fiedler
scope_id: AD-03
status: Planning report complete; HTML implementation and executed verification pending
source_repository: deanrfiedler-gif/powerplants-one
source_branch: main
source_commit: 86802e9cbaa7f0f72a5108018802a3d95e0a4285
versioning: git
---

# AD-03 — Data Quality Workbench

**HTML module build plan · Revision r01 · 17 September 2026**

This report defines the next standalone Powerplants One HTML module and its eventual detailed Markdown companion. It describes the intended screens, information, commands, source boundaries, synthetic examples and verification work. **The AD-03 HTML has not been built by this planning task, and the test cases in this report have not been executed.**

The recommended outcome is a practical workspace for investigating unreliable records, proposing an exact correction, reviewing its evidence and following the correction through the responsible domain. A duplicate suggestion, a reviewer decision and a successfully applied correction must remain separate facts.

## Contents

1. [Purpose and expected outcome](#1-purpose-and-expected-outcome)
2. [Verified baseline and source treatment](#2-verified-baseline-and-source-treatment)
3. [Scope and design conformance](#3-scope-and-design-conformance)
4. [Module ownership and receiving boundaries](#4-module-ownership-and-receiving-boundaries)
5. [First-release scope](#5-first-release-scope)
6. [Primary demonstration journey](#6-primary-demonstration-journey)
7. [Workspace composition](#7-workspace-composition)
8. [Quality queue and triage](#8-quality-queue-and-triage)
9. [Record comparison and evidence](#9-record-comparison-and-evidence)
10. [Correction proposal editor](#10-correction-proposal-editor)
11. [Impact assessment and retained relationships](#11-impact-assessment-and-retained-relationships)
12. [Independent review and return](#12-independent-review-and-return)
13. [Application, handover and original-outcome recovery](#13-application-handover-and-original-outcome-recovery)
14. [Case lifecycle and independent states](#14-case-lifecycle-and-independent-states)
15. [Data model and identity rules](#15-data-model-and-identity-rules)
16. [Detection and validation rules](#16-detection-and-validation-rules)
17. [Roles, confidentiality and exports](#17-roles-confidentiality-and-exports)
18. [Synthetic fixture catalogue](#18-synthetic-fixture-catalogue)
19. [Visual design, accessibility and responsive behaviour](#19-visual-design-accessibility-and-responsive-behaviour)
20. [Persistence and exception handling](#20-persistence-and-exception-handling)
21. [Technical construction and package structure](#21-technical-construction-and-package-structure)
22. [Build sequence and completion gates](#22-build-sequence-and-completion-gates)
23. [Planned verification matrix](#23-planned-verification-matrix)
24. [Decisions, measures and later implementation](#24-decisions-measures-and-later-implementation)
25. [Source register and report assurance](#25-source-register-and-report-assurance)

## 1. Purpose and expected outcome

AD-03 will help a data steward answer five questions: what appears wrong, which exact records and sources support that finding, who owns the affected field or relationship, what a proposed correction would change, and whether the responsible system actually accepted it.

The workbench should address duplicate candidates, missing identities or serial numbers, incomplete site/address relationships, invalid parent links, equipment installation versus served-area inconsistencies, external-key mismatches and unit/context problems. These are the retained AD-03 concerns in the page coverage register. [S02]

Its value extends across CRM, equipment, estimating, service, documents and reporting. An incorrect site relationship can place equipment under the wrong grower location; an ambiguous serial can attach later service work to the wrong asset; a provider key without company context can point to a different ERP entity. The design must make those consequences visible before a correction is applied.

The first release should demonstrate a complete, bounded local correction and a complete reasoned “keep separate” decision. More consequential operations should have honest receiving boundaries. Automatic customer or asset merging, external master updates and historical document rewrites are outside the first release.

The user-facing deliverables should be one self-contained HTML file and a professional Markdown report describing the delivered behaviour, fixtures, source reuse, verification and limitations. Both should align with PPO's existing workspace design. The current document is the plan for those deliverables.

## 2. Verified baseline and source treatment

The source hierarchy is current user instruction, maintained repository requirements/contracts, exact design-package evidence, proposed AD-03 composition and explicitly fictional examples. Recommendations below must not be mistaken for adopted corporate policy.

| Source category | Inspected position | Build implication |
|---|---|---|
| User direction | DK-03 and DK-06 were confirmed done; DK-05 was subsequently delivered in this conversation; AD-03 was recommended next and this report requested | Continue the agreed design sequence without rebuilding those modules |
| Repository | Main refreshed and inspected at `86802e9cbaa7f0f72a5108018802a3d95e0a4285` | Pin this planning baseline; refresh again when building |
| Page scope | Coverage register r06 retains AD-03 as a P1 new-design brief; its explicit dependency list is empty | Preserve AD-03; adjacent packages provide useful patterns, not invented mandatory runtime gates |
| Latest design index | Lists the Administration workflow map; no dedicated AD-03 workspace is listed at the inspected baseline | Treat the map as planning context rather than a finished workbench |
| Existing application | `/admin` and retained recovery screens provide bounded owned exception review | Do not describe those screens as an existing general data-quality, merge or configuration console |
| Product quality F07 | Calls for duplicate/mapping/stale/partial exception handling, reviewed correction and original-operation recovery | Use the relevant slice; integration health and document operations remain with their owners |
| Customers/Sites and Equipment | Existing designs retain stable identities, installation/served relationships, event-time history and controlled corrections | Extend those semantics; avoid a second editable equipment or customer master |
| DK-05 delivery | Standalone HTML/report delivered; its GitHub publication was blocked in this session | Do not depend on unpublished DK-05 source being available on main |
| Visual basis | r20 source bytes and maintained Customer 360/SH-06 style sources inspected | Reuse concrete assets and patterns; no fresh rendered visual comparison is claimed |

The r20 source SHA-256 is `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Source-byte inspection is evidence of the planning basis, not visual acceptance of a future AD-03 screen. [S01–S06, S10–S12, S15]

## 3. Scope and design conformance

| Required declaration | AD-03 proposal |
|---|---|
| Existing scope identity | **AD-03 — Data-quality workbench**, page coverage register r06 |
| Inherited parent set | CRM-08, FIN-06 and NFR-01–NFR-12 as recorded for the AD family; inheritance does not mean this module implements every parent in full |
| Principal supporting scope | F07/F07-A and its existing CRM-01/CRM-06, FIN-06 and NFR-01/05/09/11/12 relationships; DAT-01–DAT-03 identity context |
| Acceptance relationships | Relevant portions of AT-21 migration/data reconciliation and AT-18/AT-31 source/financial reconciliation remain broader acceptance work; no parent procedure is closed by this HTML |
| Primary r20 page type | **Work queue + persistent detail** |
| Supporting page types | Review / comparison, Form / guided workflow, Document & evidence workspace and Record detail |
| Shell boundary | Workspace interior only; shared application rail, masthead, global search and identity remain outside the module |
| Reused components | SH-06 queue/detail and source-route patterns; Customer 360 fonts, icons, forms, choice controls and contextual inspection; Customers/Sites and Equipment relationship/history semantics |
| Incoming handover | Permitted finding, exact record/source versions, company/site scope, evidence basis, affected field or relationship, accountable owner and date state |
| Outgoing handover | Reviewed exact correction proposal or reasoned no-change disposition; domain-owned correction request; retained receiving result and owned follow-up |
| Exceptions and recovery | Missing/partial/stale evidence, ambiguous identity, access loss, returned review, unsupported policy, version conflict, failed local save and unknown receiving outcome |
| Proposed departures | Six local views, field-by-field correction comparison and typed affected-reference categories; one narrow simulated Equipment correction path |
| Verification | Separate model, generated-DOM, native browser, visual/device and owner acceptance records; every planned test below initially unexecuted |

No parent ID is added or renamed. Local scenario and test labels in this plan are package references, not new business record types or production numbering codes. A future quality-case readable reference must follow the naming standard rather than assuming an unallocated `DQ` production prefix. [S02, S05, S06, S13]

## 4. Module ownership and receiving boundaries

AD-03 owns the investigation record, its exact proposal and review history. The authority to edit the underlying business record belongs to the relevant domain and field policy. Reviewer acceptance is necessary evidence where configured; it does not create permission or an ERP receipt.

| Area | AD-03 responsibility | Responsibility retained elsewhere |
|---|---|---|
| Customers, people and sites | Compare identity/address/party evidence; prepare field or relationship corrections | CRM/shared commands; legal identity, site operator and billing meanings remain distinct |
| Facilities/growing areas | Detect missing context, cycles and invalid site/parent links | Customer/location owner controls lifecycle and taxonomy; no silent cross-site move |
| Equipment/installed base | Compare serial/model/location evidence; propose bounded current-record correction | Equipment owns correction, relocation, replacement, retirement, component and served-area rules |
| MYOB account/item references | Show exact company/provider/entity identity and mismatch | MYOB remains ERP authority; AD-05 owns mapping/reconciliation detail and the proven receiver |
| Vocabulary, units and policy | Explain the rule/version and prepare a review request | AD-02 owns approved configuration/policy publication; a correction case cannot publish new rules |
| Integration failures | Link a quality finding to its original run/operation | AD-04 owns broader connector health, retry and external result reconciliation |
| Imports/migration | Review findings from a labelled batch observation | PD-05/AD-06 own import processing, migration, coexistence and cutover |
| Documents and knowledge | Preserve exact evidence and identify affected references | SharePoint/DK-01/DK-02 retain document authority; DK-05 retains article review; DK-03 owns issue/distribution |
| Approvals and activities | Produce an exact review task or prepared owned follow-up | SH-06 routes to domain-owned actions; Activities/Notifications own their delivery and completion |
| Audit and support | Show the case's permitted history and scoped review export | AD-07/AD-09 own wider audit/export and operational release/recovery facilities |

No generic administrator role should gain financial, technical or equipment approval authority merely by opening this workspace. The current recovery screens reinforce that a review note neither approves work nor restores ordinary access. [S03–S05, S07–S12, S14]

## 5. First-release scope

### Complete interactive journeys

The HTML should support permitted queue/search/filter/triage; exact record comparison; source inspection; reasoned duplicate disposition; a typed correction proposal; affected-reference review; independent return/acceptance; application of one supported correction through a labelled local Equipment receiver; original-result reconciliation; history; prepared external/domain handover; and scoped export.

Private annotations should have their own local edit history; they must not change the reviewed proposal digest or substitute for evidence shared with the reviewer.

A supported local correction should change only a proposed, explicitly PPO-owned Equipment identity field under fixture policy, such as correcting a mistyped serial transcription from reviewed evidence. The simulator should create a new current record version and retain before/after values. It must not claim to execute the existing application endpoint or impose a new real field-ownership policy.

### Findings covered, application deliberately bounded

| Finding family | Required first-release behaviour |
|---|---|
| Similar names / suspected duplicates | Evidence comparison; Keep separate, Confirmed duplicate requiring owner resolution, or More information needed |
| Missing/wrong equipment identity | Fully editable proposal and review; bounded simulated serial correction when policy/evidence permit |
| Missing site/address/parent data | Typed proposal and impact preview; prepare the responsible location-owner handover |
| Installation versus served-area inconsistency | Explain separate relationship meanings; prepare domain correction without inferring relocation |
| External-key mismatch | Show composite source identity and supporting evidence; prepare AD-05 handover only |
| Unit or representation mismatch | Preserve original value/unit/precision; prepare source-owner clarification/correction; no automatic dimensional conversion |
| Partial/stale observation | Retain last successful observation and owned next action; prevent unsupported resolution |
| Genuine duplicate canonical records | Retain both identities and all links; route a reviewed consolidation request; no live merge, deletion or automatic redirect |

Bulk correction, automatic merging, arbitrary JSON field editing, production scans, real ERP writes, live notifications, migration execution, financial posting and access-grant changes are excluded. This bounded scope still provides a complete primary journey without implying that one generic correction engine can mutate every domain.

## 6. Primary demonstration journey

Use two fictional pumps with distinct stable asset identities at the same organisation's two addressed sites. Both display “Pump 1”; one current serial value was mistyped and now resembles the other asset's serial. The displayed similarity creates a candidate investigation, not a duplicate decision.

1. **Investigate.** The steward opens the candidate case. Both stable IDs, company/site paths, installation locations and source versions are visible.
2. **Compare.** Retained equipment evidence establishes two physical assets. The steward records a proposed Keep separate disposition and identifies the mistyped serial on one current record.
3. **Propose.** Create correction proposal r01 with exact old/new serial, source evidence, author, target record version, policy basis and rationale. The old source text is retained unchanged.
4. **Assess impact.** Show current identity/display references, a draft visit preparation and an already issued job pack. Explain that the current record may be corrected while the issued pack remains an exact historical snapshot.
5. **Return.** An independent reviewer requests clarification of the source revision. Preserve the original submitted proposal and finding.
6. **Correct.** The steward prepares r02, adds the required exact source and responds. Re-submit; the reviewer accepts the exact corrected proposal and response.
7. **Apply locally.** The authorised domain operator rechecks current scope, record/evidence/policy versions and impact completeness. The simulated Equipment receiver records one new current version and one result.
8. **Recover.** An interruption scenario hides the first response. Reconciliation retrieves the original mock receiving result; another equivalent command is held until the outcome is known.
9. **Verify and close.** Confirm the intended field now matches the accepted proposal and the duplicate finding is resolved as Keep separate. Retain both asset IDs, the original serial transcription, both proposal revisions, review decisions and exact receiving receipt.
10. **Follow up.** Record the independently owned review of the draft visit reference. Leave the issued pack and its original crew acknowledgement unchanged.

The fixture policy and receiving adapter are explicitly fictional. A separate scenario must show a genuine duplicate remaining Awaiting domain action when no approved consolidation receiver is available.

## 7. Workspace composition

| Local view | User question | Main content and controls |
|---|---|---|
| **1. Quality queue** | What needs attention, and who owns it? | Counts with coverage; search; named filter choices; owner/priority/due; selected-case detail; capture/assign/clarify |
| **2. Record comparison** | Are these records wrong, different or insufficiently evidenced? | Stable identity cards; full location paths; field comparison; source observations; exact evidence panel; duplicate disposition |
| **3. Correction proposal** | Precisely what should change? | Allowed correction type; target version; before/after fields; sources; rationale; effective-date meaning; validation; saved draft |
| **4. Impact & relationships** | What would the correction affect? | Current relationships, draft dependencies, retained historical snapshots, external targets, completeness and owned next actions |
| **5. Review & resolution** | Is the proposal accepted, and did its owner apply it? | Frozen revision; findings/responses; review decisions; receiving readiness; original operation/result; closure verification |
| **6. History & follow-up** | What happened and what remains outstanding? | Case/proposal/source/decision/result timeline; exact revisions; reopened findings; prepared receiving requests and owned follow-ups |

Use one workspace title, “Data quality”, with local AD-03/design context. Keep the header compact: scoped export, Help and a quiet preview-information control. Put filter chips and view controls in a secondary toolbar rather than crowding the main action row.

A selected case carries its stable local identity, subject context and current independent states across the views. Case age and time awaiting the current review are separate measures; missing timestamps remain unknown. Store instants in UTC with an explicit display timezone, and preserve date-only due dates as dates. Exact revision selection must persist when changing tabs. The back action should restore queue filters, sort, selected row and focus. A missing exact revision must open an unavailable state rather than substitute the newest proposal.

The wide queue should combine a register and persistent detail. Source/record inspection uses one right-side panel with **Open full detail**. Full comparison and substantive editing belong in the main content area; short reasons and confirmations use a centred dialog. Avoid multiple overlapping inspection panels.

## 8. Quality queue and triage

### Rows and summary measures

Each row should show case reference, finding type, short explanation, subject record reference, organisation/site context, accountable owner, priority, age, due date or Date needed, investigation state, source coverage and next action. Duplicate candidates should show distinct stable identities rather than a single combined name.

Suggested summary tiles are Unassigned, Needs evidence, Awaiting review, Awaiting domain action and Outcome unknown. A tile must link to its matching filtered records. Totals should be labelled “permitted cases in this response”; incomplete or failed reads must not become a zero count.

Predefined views should include My work, All permitted, Duplicate candidates, Missing context, External mappings, Returned to me, Ready for review, Waiting for source and Closed. Personal/team saved-view authoring belongs to SH-05 and is not required here.

Filters should combine finding family, owning domain, organisation/site, source/provider, owner, priority, investigation state and due-date state. Search can match permitted references, labels, serials and origin references. The report must identify the fields actually indexed; it must not claim semantic or AI search.

### Capture and triage

A manual finding captures type, subject identity, exact source/origin reference, observation, context, owner and due date or explicit date-needed reason. A detected finding also carries rule ID/version and scan/observation identity. Human capture should not require the user to invent a rule or source revision.

Assignment, reassignment, priority changes, clarification and dismissal require appropriate capability and a reason where they materially change responsibility or disposition. Dismissal records No issue found or Out of scope with the reviewed basis; it does not delete the source record or hide an unresolved receiving operation.

Repeated ingestion of the same finding identity should update observation history or reopen the existing case, rather than create another business obligation. A changed rule or new source event can create a linked recurrence. “Same title” is not a sufficient deduplication key. Notification acknowledgement never closes the underlying quality case.

## 9. Record comparison and evidence

Comparison must make identity and provenance easier to judge than surface similarity. Start with record type, stable internal ID, readable reference, organisation, addressed site, record status and current version. Then show the relevant field values and relationships.

| Comparison concern | Required distinction |
|---|---|
| Equal display names | Shared label versus same stable identity versus independently confirmed same physical entity |
| Serials | Exact source text, manufacturer/model context, verified/unknown status and source date; no universal serial uniqueness assumption |
| Locations | Organisation → addressed site → facility/growing area → installed location; served areas are separate links |
| Site parties | Operator, property owner, service customer and bill-to meanings remain distinct |
| External identity | Provider/connection, company, entity type and external key; local display name is not a mapping key |
| Numeric values | Original representation, value, unit, precision and meaning; unknown, zero and not applicable differ |
| Source state | Last successful evidence, current observation status, review basis and completeness; historical and current are separate |

Use explicit labels such as Same value, Different value, Missing, Unknown, Not applicable and Restricted/unavailable where disclosure is permitted. Colour alone must not carry meaning. A comparison mismatch is a finding to investigate; it is not proof that the newer or longer value is correct.

For candidate duplicates, show why the candidate was raised: repeated local name, overlapping identity key or a declared rule result. Do not present an invented “98% duplicate confidence” score. Preserve the raw values even if the search/suggestion layer uses a documented normalised representation.

Sources should open at the exact retained version. Each evidence link needs title/reference, owner/provider, version or explicit unversioned observation, timestamp, scope, relevant excerpt and content identity where bytes are retained. A changed or unavailable source creates a clear hold or owned request. It cannot silently resolve to latest.

The steward should be able to record that an apparent duplicate is two distinct assets, or that evidence remains insufficient. Access to one side of a comparison never grants access to the other; the interface should offer a scoped unavailable state without exposing hidden names or keys.

## 10. Correction proposal editor

The editor should guide a typed proposal rather than expose arbitrary object fields. A proposal begins with a specific correction kind and a supported receiving domain. It is saveable while incomplete, but cannot be submitted until its required evidence and target are established.

| Proposal field | Requirement |
|---|---|
| Case and proposal identity | Stable local IDs, revision number, predecessor and draft/submitted state |
| Target | Typed record ID, current expected version, company/site scope and owning domain |
| Field/relationship intent | Allowed field ID or relationship operation; reject unsupported targets |
| Before value | Frozen exact value from the selected target version; never supplied as authority by free text |
| Proposed value | Typed value, unit/context if relevant, explicit clearing intent when applicable |
| Rationale | Explain the defect, evidence and reason this proposal is appropriate |
| Source set | Exact source identities/versions/excerpts or observation identities; required versus contextual evidence |
| Applicability | Which organisation/site/asset/relationship and time context the correction concerns |
| Impact basis | Exact dependency/relationship observation and its completeness; required follow-ups |
| Authority basis | Fixture field owner, receiving capability and policy version; missing policy remains Not configured |
| Author/reviewer context | Attributable author; intended independent review role; due date or date-needed state |
| Optional working note | Private steward annotation, separate from the submitted rationale/evidence and excluded from scoped review exports |

For a serial transcription correction, preserve serials as strings, including leading zeros, separators and case unless the declared source rule requires a supported transformation. A known replacement asset is not a serial correction; replacement requires the Equipment lifecycle workflow.

For locations, separate “the current record was wrong” from “the asset physically moved”. A physical relocation requires effective history and affected relationships. AD-03 must not fabricate a past move date or change event-time snapshots by editing the current site field.

The UI should display no-effect proposals and reject submitting them as substantive corrections. Explicitly clearing a known value needs its own reason and supported rule. Empty input must not silently become zero or a wildcard.

Submitting freezes proposal content, sources, target versions, authority basis and impact selection into a canonical digest. Changes after return or a decided outcome use a new revision. The comparison must show changes in scope, field ownership, evidence and affected references as well as field text.

## 11. Impact assessment and retained relationships

Impact review should distinguish the actual proposed mutation from consequences requiring another owner's decision. A count of linked records alone is insufficient; each receiving reference needs a typed meaning.

| Reference category | Expected treatment |
|---|---|
| Current master/display relationships | Show precisely which supported current field or link would change through the owner |
| Draft work or preparation | Mark potential reassessment; prepare an owned action; do not silently approve or update its content |
| Approved scopes and technical decisions | Retain original exact snapshot and authority; route a new review if current use is affected |
| Issued quotations, packs and reports | Preserve original bytes, hashes, issue identities and acknowledgements; correction does not rewrite them |
| Historical installation/service events | Retain event-time organisation/site/equipment context; a correction may append explanatory evidence |
| External mappings and transactions | Show intended receiver and original company/entity key; no local master substitution or posting |
| Unknown or incomplete dependency response | Hold commands whose supported policy requires complete impact; expose an owned next action |

Required follow-ups need a receiving domain/target, owner, due date or Date needed, reason, source case/proposal and origin event. Deduplicate the same obligation using a stable origin/target/purpose key. A new source event or materially revised proposal can justify a separate linked action.

A prepared action should display **Prepared locally** until actual receiving evidence exists. It must not appear Sent, Received or Accepted because a button was clicked in this file. Existing SH-06 and domain design files can be referenced through bounded previews, but the standalone AD-03 file does not update them.

Exact issued-reference and acknowledgement treatment follows the existing document contract. [S09, S16]

Complete fixture coverage means complete within the declared fictional set and query scope. It is not a claim that every customer, service record or external use has been searched.

## 12. Independent review and return

The review screen should show the exact proposal revision, target/current-version comparison, required evidence, field owner, impact snapshot and unresolved findings. The reviewer should be able to inspect sources without losing their place.

Supported outcomes are Accept exact proposal, Return for correction, Request information and Decline. Each outcome retains reviewer, date/time, reason, proposal digest and relevant policy basis. Acceptance is blocked by missing required evidence, unsupported mutation, unresolved blocking findings, unavailable target scope, changed source/record versions or unconfigured approval policy.

The author cannot accept their own correction under the demonstration policy. Preview role changes are a usability aid; later application authority must be derived on the server.

Findings need stable IDs, the original proposal/section, required correction, blocking/advisory status and accountable owner. An author response binds to the corrected proposal digest. Responding alone does not close a blocking finding; the reviewer must accept that exact correction. Later material edits invalidate the response's applicability to the new content while retaining the earlier evidence.

A Keep separate or No issue found disposition also requires a reviewed evidence basis when the fixture policy says it is material. It has an application outcome of Not required, rather than a fabricated business-record mutation. A confirmed duplicate without a supported owner receiver can be reviewed and handed over, but cannot be marked Applied or fully resolved solely on review acceptance.

## 13. Application, handover and original-outcome recovery

### Supported local application

The first-release mock Equipment receiver should accept one narrow correction class. On apply it must check current actor scope, expected target version, proposal digest, accepted decision, source/impact/policy versions and allowed field set. It should return a result containing the original operation ID, target identity, before/after versions, applied change, receiving actor/time and result identity.

The case's correction status changes to Applied only after that exact result is retained and matched to the accepted proposal. Post-application verification must compare the resulting version/value with the intended change. If the record changed independently in the meantime, the case remains open for review rather than being overwritten.

Represent the domain invocation as a proposed typed contract. Do not invent an actual API route or claim that the current Equipment application already supports that serial-correction endpoint. All target mutations in this HTML are local synthetic simulations.

### Prepared receiving requests

For site, relationship, genuine-duplicate, unit and MYOB mapping corrections, prepare an exact request for the responsible owner. Record subject/version, proposed fields, reason, required evidence, review decision, impact and next action. The request remains Prepared locally. If a fixture later demonstrates a returned or accepted receiving response, label it Simulated and bind it to that exact request.

### Uncertain outcomes

Every material apply attempt needs a unique operation identity and canonical payload hash. Repeating that identity with the same payload reopens its existing result; reusing it with changed content is refused. An unknown outcome holds equivalent attempts against the affected target even if someone tries a new operation ID.

The interruption fixture should model a receiver that applied the original proposal but whose response was not observed. Reconcile must inspect the original mock receiver ledger, validate the proposal/target/result binding, and recover the one result. A confirmed not-applied result can enable the original retry under declared conditions; a still-unknown or contradictory result remains held with an owner.

Recovering an already completed historical receipt is different from authorising a new apply. Recheck current access before showing that receipt, but do not erase the original result because today’s source or target has changed. Retain the recovered exact outcome and raise any new reassessment separately. When lookup confirms that nothing applied, a retry must satisfy current mutation readiness without changing the original payload; an incompatible proposal remains held for owned resolution.

An unknown apply cannot be dismissed, reset into a new attempt or superseded into another mutation while concealing the original. Restart, stale-tab and failed-save handling must preserve enough original intent to explain what is known. No local simulator should be described as proving external transaction durability.

There is no one-click Undo. A later reversal or correction needs a successor proposal against the current target, its own impact and review, and an explicit receiving capability. Financial reversals and historical document issue changes remain outside scope.

## 14. Case lifecycle and independent states

The workbench should avoid one ambiguous “Resolved” badge that conceals incomplete evidence or an unknown apply result.

| State axis | Proposed values / meaning |
|---|---|
| Investigation | New, Assigned, Investigating, Needs information, Awaiting review, Awaiting domain action, Closed |
| Proposal | Draft, Submitted, Returned, Accepted, Declined, Superseded |
| Receiving outcome | Not required, Prepared locally, Pending, Outcome unknown, Applied, Rejected |
| Evidence/coverage | Current, Stale, Missing, Partial, Unavailable; exact meanings shown beside the source |
| Duplicate disposition | Unassessed, Keep separate, Suspected duplicate, Confirmed duplicate requiring owner resolution |
| Due-date state | Due date known, Overdue, Due today, Date needed; no date is not On time |

These values are proposed design vocabulary and must be checked against maintained domain enums before application integration. A changed evidence basis can make an accepted proposal no longer eligible to apply without deleting the acceptance record.

Closure requires a reasoned no-change result, or a verified supported receiving result plus explicit disposition of required follow-up. If follow-up remains independently open, show that fact and its owner; do not imply completion of the receiving task. Unknown apply outcomes prevent closure.

A recurring finding should append a reopening event or create a linked successor case according to the declared rule. The original closed outcome and its source basis remain available. A rule scan returning no findings on partial data cannot close the case automatically.

## 15. Data model and identity rules

| Logical record | Minimum content and invariants |
|---|---|
| QualityCase | Stable ID; finding family; subject set; source/rule identity; scope; owner/due; investigation state; origin and history |
| FindingObservation | Observation/run ID; rule/version; observed values; source-as-at; completeness; classification; correlation to prior observations |
| RecordSnapshot | Typed ID; exact version; permitted fields; organisation/site; source/provider ownership; canonical content identity |
| EvidenceLink | Exact retained source identity/version or observation; required/contextual role; content hash when retained; permission and availability observations |
| ProposalRevision | Stable revision ID; predecessor; target/expected versions; typed changes; rationale; evidence; impact and policy basis; digest; submitter/time |
| ImpactSnapshot | Query scope/as-at; completeness; affected exact references; effect classification; required receiving owners/actions |
| ReviewFinding / Response / Decision | Exact revision/digest; independent actors; reasons; retained correction/acceptance sequence |
| CorrectionOperation / Receipt | Original operation/payload identity; exact proposal; target; status; receiving result and before/after versions |
| ReceivingRequest / FollowUp | Exact origin/target/purpose; scope; evidence; owner/due; Prepared locally or evidenced simulated outcome |
| CaseEvent | Attributable action; capture/recorded times; exact before/after or referenced revision; reason; immutable history through controls |

Use stable internal identities rather than display names for joins. Preserve readable references separately from provider keys. ERP mapping identity must include connection/provider, company, entity type and external ID; equal text in two companies does not mean the same record. [S04]

Names, phones and serials remain text. Decimal quantities and units retain their original representation and exact semantic meaning. Zero means a known numeric value, not unavailable information. Missing dates and unverified identities need explicit status/reason.

Site and equipment context should preserve Organisation → Site → Facility/Growing area. A pump may be installed in an irrigation shed and serve several blocks. A parent/component link, a physical installation location and a served-area link are three different relationships. Historical events retain their event-time context. [S07–S09]

Source content and original submitted proposals should be append-only through the UI. Canonical hashes establish byte/content identity, not evidence truth or cryptographic protection against editing a downloaded local file.

## 16. Detection and validation rules

The prototype should run an explicit set of deterministic fixture rules when the user selects **Check fixture data**. Show rule ID/version, assessed scope, examined records, completeness, run date and resulting findings. No scheduled scan or AI service is needed.

| Rule family | Example finding | Guard against false certainty |
|---|---|---|
| Repeated local names | Two “Pump 1” labels | Suggest comparison only; stable IDs, sites and evidence govern disposition |
| Missing identity | Required serial or site context absent under a declared rule | Do not fabricate a value; distinguish a required field from a genuinely optional serial |
| Conflicting identity | Same serial text under overlapping manufacturer/model context | Not a universal serial-uniqueness violation; evidence may show replacements or legitimate repetition |
| Invalid hierarchy | Self-parent, cycle, prohibited parent or cross-site relationship | Use typed hierarchy and policy; do not silently move or flatten records |
| Installation/served mismatch | Link points outside permitted recorded context | A pump serving several blocks can be valid; compare relationship meaning and source |
| External-key mismatch | Missing company/entity or competing mapping | No name-based account selection; request authoritative mapping review |
| Unit mismatch | Area source in hectares compared with an m² field | Retain raw units/precision; propose reviewed conversion only if owner/rule support it |
| Stale/incomplete source | Current observation failed or covers only part of the set | Preserve last successful facts; no false all-clear or verified zero |

Rules should not expose numeric quality scores without a defined denominator, record scope and treatment of unknowns. A first release can use clear finding counts and coverage labels. It should not infer operational readiness, financial reconciliation, equipment health or crop risk from a clean metadata scan.

A reviewed Keep separate decision should suppress the same known false positive only for its bound record/evidence/rule basis. New evidence or a material identity change must make reassessment visible. No permanent unrestricted “ignore all future duplicates” switch.

## 17. Roles, confidentiality and exports

| Fictional role | Permitted demonstration actions | Limits |
|---|---|---|
| Observer | Read permitted cases, comparisons and history | No proposal or target mutation |
| Data steward | Capture/triage findings, draft corrections, respond and prepare handovers | Cannot accept own proposal or invent source ownership |
| Independent reviewer | Inspect exact evidence, record findings/decisions and accept responses | Review is not authority to bypass the receiving domain |
| Equipment domain operator | Apply the supported accepted local correction and reconcile originals | Current scope/policy/source versions still govern; unsupported fields remain refused |
| Restricted-scope user | Work within a bounded company/site subset | No hidden counterpart names, serials, counts or exports |
| No permitted scope | Denied state | No subject-detail residue, protected counts, search suggestions or downloads |

Synthetic identities may combine capabilities to demonstrate a workflow, but actual actor and scope decisions belong on the server. An administrative support profile has no implicit technical, customer-master or financial delegation.

Filter before generating displayed counts, comparisons, detail, source excerpts, impact lists and exports. A user's ability to see one record does not grant permission to discover its restricted counterpart. Recheck access at submit, review, apply, reconciliation and download.

The primary export should be a scoped Markdown or JSON review copy containing case identity, exact proposal/decision, permitted source references, before/after values, impact and outcome. Suppress private working notes, unrestricted diagnostics, credentials and hidden records. A review copy is not an importable backup.

Every embedded fixture is inspectable by someone holding the HTML. Role controls demonstrate receiving behaviour and cannot secure real confidential data. Use only synthetic examples and explain that boundary in Workspace information and the companion report.

## 18. Synthetic fixture catalogue

Use sixteen fictional cases with enough shared records to exercise relationships and deduplication. “DQ-01” to “DQ-16” below are scenario labels, not allocated business-reference types. Fix the initial evaluation date at 17 September 2026 and disclose the preview clock.

| Fixture | Situation | Expected demonstration |
|---|---|---|
| DQ-01 | Two assets called “Pump 1” at different addressed sites | Evidence-supported Keep separate; no automatic merge or global name uniqueness rule |
| DQ-02 | One pump's serial was mistyped and resembles another asset | Primary correction, return, exact resubmission, independent acceptance and local Equipment result |
| DQ-03 | Two canonical asset records appear to represent the same physical pump | Retain both IDs and evidence; prepare controlled owner consolidation request; no generic merge |
| DQ-04 | Serial or identity evidence missing | Save investigation and clarification; refuse invented correction and unsupported closure |
| DQ-05 | Physical site address confused with a billing address | Separate site/location from account/bill-to authority; route exact owner request |
| DQ-06 | Facility parent causes a cycle or crosses an unsupported site boundary | Clear graph validation and owned correction; no silent reparenting |
| DQ-07 | Irrigation-shed pump serves three outdoor blocks | Valid installed-versus-served distinction; additional invalid link investigated separately |
| DQ-08 | Same external key text under two ERP companies | Composite identity comparison; no MYOB mapping selected by name or key alone |
| DQ-09 | Growing-area footprint source uses a different unit/precision | Retain raw measurement; no automatic area sum or unreviewed conversion |
| DQ-10 | Partial import observation misses a subset of records | Partial counts and stale last-success context; no zero-defect assurance |
| DQ-11 | Target/source changes after proposal acceptance | Apply held; original acceptance retained; exact successor/refresh comparison |
| DQ-12 | Access to one comparison target is revoked | Scoped unavailable state, no protected metadata leakage and no retained actionable proposal shortcut |
| DQ-13 | Local mock receiver applied correction but response is lost | Outcome unknown, equivalent repeat blocked, original-result reconciliation |
| DQ-14 | Missing configured field-owner/review rule | Not configured; owned next action; no permissive fallback |
| DQ-15 | Previously dismissed candidate recurs on new evidence | Retained prior outcome plus explicit reassessment basis |
| DQ-16 | Correction affects draft preparation and an issued pack | Owned current-use review; original issued bytes/hash/acknowledgement unchanged |

Add scenario controls for Complete/Partial/Failed/Loading/Empty reads, changed sources, storage conflict, failed local write and damaged saved state. These are labelled demonstrations, not claims of live provider failures. Avoid excessive toggles on ordinary business screens; put them in a compact preview-options surface.

Reuse the horticultural distinctions from existing designs: greenhouse structure, propagation use, tunnels, pack rooms, open growing areas/irrigation blocks and equipment sheds. Do not create competing taxonomy values simply because a familiar facility name appears in the UI.

## 19. Visual design, accessibility and responsive behaviour

Use the inspected r20 design lineage through Customer 360 and SH-06. Reuse embedded Roboto with Verdana fallback, navy `#242a37`, green `#62bb46` selection accents, light workspace surfaces, labelled statuses and existing line icons. Primary actions should be navy with white text. Green should identify context/selection rather than become a new primary-button convention. [S10–S12, S15]

The queue should expose the next meaningful action without showing every possible action in every row. Full comparison should have labelled before/after values, field ownership and evidence immediately adjacent. Keep low-level command payloads, digest internals and build information in collapsible evidence or Workspace information unless needed for a decision.

Use modeless inspection for ordinary record snapshots with one active panel, a visible close control and Open full detail. Full source reading or a consequential confirmation may use a modal. Preserve focus and context when a panel closes, including when a render replaced the original trigger. Keyboard trapping applies only to modal surfaces.

On phones, show a clear list → detail → Back to list path. Convert wide comparisons into field cards retaining both record identities, before/after labels and warnings. Do not force users to compare unlabeled values after columns collapse. Forms should stack, full references should wrap, and final actions must remain reachable without horizontal page overflow.

Plan native review at 1440, 1024, 768, 390 and 320 px, plus 200% zoom. Check keyboard navigation, Enter/Space, Tab/Shift+Tab, Escape, error-summary focus, dialog names, source-panel return, screen-reader status announcements and touch targets. Reduced-motion treatment and non-colour status labels are required. These are planned checks; CSS presence or DOM emulation alone cannot establish accessibility or visual acceptance.

## 20. Persistence and exception handling

Use a versioned module-specific local state envelope. Persist the case, exact proposal revisions, source observations, decisions, original operation ledger and mock receiving results. Preserve the exact earlier issued fixtures. Avoid storing a misleading “saved” label before a write succeeds.

| Situation | Required behaviour |
|---|---|
| Unsaved proposal | Clear unsaved indicator; deliberate save/discard on navigation; current form retained on validation failure |
| Failed local save | Preserve in-tab state, show failure, pause conflicting material actions and retry the same save without repeating the business command |
| Stale local tab | Compare expected state/base; preserve edits and show review/export/reload; do not silently overwrite |
| Invalid schema or corrupt saved JSON | Retain original readable bytes; pause writes; scoped recovery information and deliberate reset |
| Missing source/version | Retain exact reference and reason; no latest substitution; owned information request |
| Partial/failed reads | Keep last successful snapshot with age/status; distinguish failed request from completed empty response |
| Review returned | Retain original submission/decision; create corrected successor and compare changes |
| Unsupported field/receiver | Explain responsible domain; prepare request or hold; no decorative success toast |
| Outcome unknown | Retain original identity and evidence; hold equivalent attempts and use original-result lookup |
| Access revoked | Suppress protected display/export immediately; refuse apply/reconcile results outside current scope |

Use expected versions and a local base comparison to demonstrate stale-tab refusal. State the limitation: localStorage is not an atomic multi-user transaction system. A later application must perform version/policy/access checks and record mutation, audit/outbox and receipt together in its authoritative transaction. [S04]

A deliberate Reset demonstration may replace the entire fictional workspace after explicit review, including mock operations. It must be labelled as a demo reset, never recovery of an unknown real operation. The production receiving contract must preserve outstanding operations through session expiry, restart and support intervention.

No offline field synchronisation, service worker, real provider connection or automated scan schedule is included in this HTML build.

## 21. Technical construction and package structure

Retain the established standalone HTML/CSS/JavaScript design pattern with a deterministic Python assembler. This meets the one-file deliverable requirement, permits local fixture work and avoids a new runtime dependency. Record that reuse decision in the design handover. Building a new React application route or service would expand this design increment; it is a later receiving task under the existing architecture. [S04, S10–S12]

Separate the pure domain model, synthetic fixture catalogue and UI controller. The model should own capability checks, typed proposals, readiness, state transitions, digest generation, repeat-safe result recovery and permission-filtered projections. The controller should own navigation, form state, accessible rendering, local persistence and explicit scenario controls.

Proposed paths:

| Artifact | Proposed path |
|---|---|
| Issued HTML | `docs/reference/ui/data-quality/PPO-Data-Quality-Workbench-r01.html` |
| Detailed delivered-feature report | `docs/reference/ui/data-quality/PPO-Data-Quality-Workbench-Report-r01.md` |
| Stable working plan | `docs/delivery/data-quality-workbench-build-plan.md` |
| Design/receiving handover | `docs/decisions/data-quality-workbench-design.md` |
| Maintained sources | `docs/design/data-quality/` with README, template, CSS, fixtures, model, controller and source manifest |
| Builder | `scripts/build-data-quality-workbench.py` |
| Model check | `scripts/check-data-quality-model.mjs` |
| Generated-DOM check | `scripts/check-data-quality-dom.mjs` |
| Native-browser check | `scripts/check-data-quality-browser.mjs` |
| Evidence | `docs/testing/evidence/data-quality-r01/` with actual results, source/output identities and inspected captures where produced |

Use existing source fonts/icons and inspect their exact edition before copying. Preserve source licences and provenance. Pin hashes of reused assets; fail assembly when they change unexpectedly. Escape embedded script boundaries and all user-visible text. Ensure opening the artifact makes no external request.

All identifiers and illustrative technical/business data must be fictional. Do not copy operational customer records into the public repository. Do not register new application routes, change database migrations, alter dependencies or create deployment infrastructure in this increment.

When the HTML is built, update the latest-family index, document register, current status and stable design record in the same reviewed contribution. Preserve unrelated work and issued references. Do not promote the accepted UI baseline or overwrite a prior issued HTML merely because the new tests pass.

## 22. Build sequence and completion gates

| Stage | Work | Concrete exit evidence |
|---|---|---|
| B1 — Reconcile scope and sources | Refresh repository/AGENTS/status, inspect actual current reuse files, declare proposed field ownership and supported receiver | Pinned manifest, conformance table and fixture policy; no invented API/merge support |
| B2 — Model and fixtures | Define typed cases/proposals/review/receipts and sixteen scenarios; preserve exact evidence and historical references | Primary model journey plus failure/refusal results before UI claims |
| B3 — Queue, comparison and editor | Implement scoped worklist, persistent detail, source inspection, typed corrections and exact navigation | Working create/triage/compare/save/submit journey with unsaved-input preservation |
| B4 — Review, impact and receiving flow | Add return/successor/response acceptance, impact categories, local domain apply and prepared owner requests | One full correction and one no-change outcome; no historical rewrite or generic merge |
| B5 — Recovery and confidentiality | Add original-result reconciliation, stale source/tab, local write failure, corrupt state and current scope enforcement | Meaningful negative/replay/access tests and honest local durability limits |
| B6 — Native and document review | Exercise generated artifact, keyboard, layout, phone, exports and digest/build checks; write detailed companion | Actual results and exact artifacts; unresolved environment limits explicitly recorded |
| B7 — Package and handover | Update indexes/register/status, prepare branch/PR if authorised and accessible, save requested deliverables | Reviewable package and downloadable HTML/report; publication outcome stated accurately |

The user has requested this plan now; these stages describe the subsequent build. Do not execute migrations, deploy, send notifications or open operational correction cases as a side effect of preparing the report.

“Done” for the design package means the stated working behaviour exists, meaningful checks are recorded, the report matches the actual file and source/authority boundaries are explicit. Native checks that cannot run must remain unverified. Owner acceptance and application integration remain separate statuses.

## 23. Planned verification matrix

Every test below is **planned, unexecuted**. `AD03-Tnn` identifiers are local build references. The future evidence record must report actual test names/results and map any untested requirements, rather than treating the number of checks as proof of completion.

| ID | Area / scenario | Required observable result |
|---|---|---|
| AD03-T01 | Queue and identity: Scoped queue and counts | Only permitted cases/subjects contribute; a denied scope reveals no protected names, counts or selected-detail residue. |
| AD03-T02 | Queue and identity: Search, combined filters and return | Search/filters/selection restore after exact detail; clearing filters does not mutate cases. |
| AD03-T03 | Queue and identity: Unknown owner or due date | Unassigned and Date needed remain explicit; unknown dates never become On time. |
| AD03-T04 | Queue and identity: Repeated original finding | The same source/rule/subject observation reopens its original case/result without duplicate obligations. |
| AD03-T05 | Queue and identity: New observation after closure | A changed material source or rule creates explicit reassessment with prior outcome retained. |
| AD03-T06 | Queue and identity: Two pumps with the same local name | Distinct IDs and sites support Keep separate; no name-based merge or global name-uniqueness rule. |
| AD03-T07 | Queue and identity: Same serial text with different context | Manufacturer/model, replacement and evidence context govern the finding; no unsupported global serial constraint. |
| AD03-T08 | Queue and identity: External key repeated in another company | Company/provider/entity identity is checked; no cross-company mapping or name-based account selection. |
| AD03-T09 | Evidence and structure: Missing serial/evidence | Incomplete investigation remains saveable; submit/apply is held without inventing a value. |
| AD03-T10 | Evidence and structure: Unknown, zero and not applicable | Each meaning remains distinct in forms, comparisons, counts and exports. |
| AD03-T11 | Evidence and structure: Hierarchy self-parent, cycle and cross-site parent | Invalid typed relationship rejected with input retained; no partial reparenting. |
| AD03-T12 | Evidence and structure: Installed location and three served blocks | Legitimate service relationships remain valid; installation is not changed merely to match a served area. |
| AD03-T13 | Evidence and structure: Physical move proposed as transcription correction | Route to the lifecycle owner; do not rewrite a current site field as a substitute for an effective move. |
| AD03-T14 | Evidence and structure: Unit and precision mismatch | Original value/unit/precision retained; unsupported conversion and overlapping-area total refused. |
| AD03-T15 | Evidence and structure: Missing or changed exact source | No latest-version substitution; original citation remains inspectable within scope and readiness is held. |
| AD03-T16 | Evidence and structure: Partial and failed scan | Partial/failed states differ from complete empty results; no verified zero-defect claim or automatic closure. |
| AD03-T17 | Proposal and review: Draft save and reload | Exact entered fields, source set and target version survive a supported successful save/reload. |
| AD03-T18 | Proposal and review: No-effect or unsupported proposal | No-effect submit and arbitrary field/domain mutation refused; clear supported next action shown. |
| AD03-T19 | Proposal and review: Explicit clearing of a known value | Requires a supported field rule and reason; blank is not silently applied as zero/null. |
| AD03-T20 | Proposal and review: Freeze submission and canonical digest | Submitted fields/source/impact/target basis are immutable through editing controls; independent hash agrees. |
| AD03-T21 | Proposal and review: Author attempts self-acceptance | Refused even when preview navigation offers review content. |
| AD03-T22 | Proposal and review: Missing configured field/review policy | Not configured blocks consequential action; no default approval authority is inferred. |
| AD03-T23 | Proposal and review: Return and corrected successor | Original r01 and return rationale remain; r02 has an explicit predecessor and changed-field/source comparison. |
| AD03-T24 | Proposal and review: Author responds to blocking finding | Response remains unresolved until independent acceptance against its exact current proposal digest. |
| AD03-T25 | Proposal and review: Edit after finding response | Earlier response/acceptance cannot satisfy changed content; evidence remains in history. |
| AD03-T26 | Proposal and review: Review acceptance without receiving authority | Accepted proposal remains unapplied; operator still needs current capability and domain readiness. |
| AD03-T27 | Impact and receiving: Typed affected references | Current, draft, approved, issued and historical references get distinct effects; no generic update-all command. |
| AD03-T28 | Impact and receiving: Incomplete impact assessment | Supported policy requiring complete impact blocks apply; owned completion action retained. |
| AD03-T29 | Impact and receiving: Issue snapshot and acknowledgement preservation | Hash original issued pack bytes/response before and after correction; identities and bytes remain unchanged. |
| AD03-T30 | Impact and receiving: Supported Equipment serial correction | One target version changes through the local owner simulator; before/after and exact accepted proposal are retained. |
| AD03-T31 | Impact and receiving: Genuine duplicate without merge receiver | Both canonical identities/relationships remain; reviewed consolidation request stays Prepared locally/Awaiting domain action. |
| AD03-T32 | Impact and receiving: MYOB/source-owned correction | Prepared owner handover only; no local master overwrite, ERP success or financial posting claim. |
| AD03-T33 | Impact and receiving: Duplicate follow-up preparation | Same origin/target/purpose returns existing obligation; a genuinely new origin can have a separate linked action. |
| AD03-T34 | Impact and receiving: Post-application verification | Applied value/version/result must match the accepted proposal before correction closure; mismatches stay owned. |
| AD03-T35 | Concurrency and recovery: Target changes after acceptance | Expected-version refusal preserves proposal; earlier acceptance is not transferred to refreshed content. |
| AD03-T36 | Concurrency and recovery: Source or policy changes before apply | Freshness/authority re-evaluated; incompatible current basis holds application. |
| AD03-T37 | Concurrency and recovery: Repeated same operation/payload | Original successful result returned; target is not corrected a second time. |
| AD03-T38 | Concurrency and recovery: Same operation with changed payload | Refused; original operation/result cannot be rebound to different content. |
| AD03-T39 | Concurrency and recovery: Response lost after simulated apply | Outcome unknown retained; equivalent new operation blocked; original lookup returns one exact result. |
| AD03-T40 | Concurrency and recovery: Still unknown or confirmed not-applied lookup | Unknown stays held; confirmed not-applied permits only the documented original retry path after current checks. |
| AD03-T41 | Concurrency and recovery: Local write failure | In-tab proposal/result retained; further material work paused; same-save retry does not repeat the business effect. |
| AD03-T42 | Concurrency and recovery: Two local versions and corrupt schema | Stale save preserves edits; corrupt state preserves original readable bytes and never silently resets into ready state. |
| AD03-T43 | Access and navigation: Permission revoked before review/apply/reconcile | Recheck both subject and receiver; refuse operation/result disclosure outside current scope. |
| AD03-T44 | Access and navigation: Scoped exports and unsafe text | Private notes/hidden payloads excluded; user text escaped; export contains only permitted exact case evidence. |
| AD03-T45 | Access and navigation: Missing exact revision, tabs and browser Back | No newest-version substitution; exact selected revision persists across local views and queue return. |
| AD03-T46 | Native and packaging: Long records and responsive comparison | Inspect 1440/1024/768/390/320 px and 200% zoom; labels, warnings and final controls remain usable without page overflow. |
| AD03-T47 | Native and packaging: Keyboard, dialogs, panels and assistive reading | Complete primary journey with native keyboard/focus; modal trapping, modeless inspection and error/status announcements work as specified. |
| AD03-T48 | Native and packaging: Deterministic package and source guards | Repeat build is byte-identical; unexpected reused-source change fails; generated HTML makes no external resource/data request. |


### Evidence to retain during the build

Record source commit and exact reusable asset identities; final HTML/report sizes and SHA-256; actual Node/npm/browser versions; successful commands and failing/unexecuted cases; and the exact artifact used for each check. Model tests must assess retained evidence and externally observable invariants. Generated-DOM checks should execute the assembled HTML, not only a separate controller copy.

Native tests should capture the queue, comparison, proposal, review, unknown outcome and phone detail, with human inspection of the produced images. A test harness supplied for later use is not an executed test. DOM dialog shims do not establish real focus trapping, layout, clipboard/download behaviour, screen-reader support or visual acceptance.

Run applicable repository foundation, prototype and naming assurance when packaging the eventual contribution, plus lint and whitespace/conflict checks. Broader application/database tests are only required when the actual change or required repository gate warrants them. Record unavailable environments honestly and preserve failed results rather than replacing them with a success claim.

## 24. Decisions, measures and later implementation

### Proposed defaults and policy questions

The following design choices are sufficient to build an honest synthetic demonstration. They do not settle operational policy on behalf of data owners.

| Topic | First-release proposed treatment | Later decision/evidence required |
|---|---|---|
| Correction ownership | Explicit per-field fixture owner; one supported local Equipment correction class | Adopted field-family ownership under D-011 and actual receiving command capability |
| Duplicate handling | Suggestions require review; Keep separate is first-class; true consolidation is a prepared owner request | Legal/customer/asset merge rules, surviving identity, aliases, access, reference treatment and reversibility |
| Reviewer separation | Independent author/reviewer actors in the demo | Real competent/delegated roles and policy exceptions, if any |
| Severity and deadlines | Fictional priority/due examples with reasons; no universal SLA or automatic crop-risk score | Approved triage rules, calendars, escalation and criticality definitions |
| Freshness and completeness | Explicit observed-at, last-success and coverage; no invented global expiry duration | Per-source acceptable age, verification and impact-completeness rules |
| External mappings | Composite provider/company/entity identity and prepared AD-05 handover | Actual tenant/entity contracts, matching policy, permitted writes and correlated result lookup |
| Units and transformations | Source representation retained; unsupported conversions held | Approved unit vocabulary, exact conversion/rounding rules and field-owner responsibility |
| History and correction reversal | Append-only evidence; successor proposal instead of one-click undo | Retention, effective-date correction, legal hold and supported reversal procedures |
| Receiving task integration | Local prepared actions, explicit simulated responses where authored | Activity/domain command contracts, delivery receipts and completion ownership |
| Access and audit | Synthetic scope projections and review-copy export | Server authorisation, least-privilege diagnostic access and controlled export/retention |

Missing policy is represented as Not configured with an accountable next action. The builder need not ask the user to approve invented real policies before creating labelled fixtures; it should preserve these open decisions in the report.

### Useful measures

Start with measures that can be explained from a defined source window: unresolved cases by finding family, unassigned cases, cases missing due dates, age of the oldest open case, median time to reviewed disposition where enough records exist, correction outcomes, reopened cases and incomplete scan coverage. Distinguish investigation closure from applied correction and receiving-task completion.

For each number retain the scope, as-at date, completeness, denominator and definition. Do not combine different units or currencies, report unknown data as zero, or present a synthetic fixture statistic as a live company KPI. Target performance thresholds should be agreed through actual owner evidence rather than invented in this report.

### Later application receiving work

A later implementation should reuse PPO's modular monolith, typed domain services, PostgreSQL transactions, current identity/grant model, operation receipts and outbox. It needs field-owner policy, authenticated source reads, exact target versions, transactional command/review/result binding, permission-filtered history and supported domain integrations. It must not add a generic record-edit endpoint that bypasses domain rules.

A future scan service needs declared rule/version ownership, query scope and pagination/completeness, repeat-safe finding ingestion, rerun/reopening policy and appropriate diagnostics. Migration and external writes require their own contracts and acceptance evidence. Those are receiving requirements, not capabilities delivered by the standalone HTML plan.

## 25. Source register and report assurance

Repository links below are pinned to the inspected planning baseline. They establish scope and design evidence; none proves that AD-03 has already been implemented. DK-03/DK-06 completion and the delivered DK-05 files are retained from the user's direction and this conversation, independently of historical coverage labels.

| Ref | Source | Use and evidence limit |
|---|---|---|
| S01 | Repository guidance and current design index: [AGENTS.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/AGENTS.md); [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/README.md); [STATUS.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/STATUS.md); [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/reference/ui/README.md) | Current constraints, dated delivery status, package discipline and available design families. |
| S02 | HTML Page Coverage Register r06: [PPO-HTML-Page-Coverage-Register-r06.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | Existing AD-03 identity, P1 planning priority, exact inherited parents, description and neighbouring AD-01–AD-10 boundaries. |
| S03 | BP-01 master blueprint: [BP-01-master-blueprint.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/blueprints/BP-01-master-blueprint.md) | CRM-08, FIN-06, DAT context, D-011 ownership, interface and acceptance relationships; source systems retain authority. |
| S04 | BP-02 platform architecture r13: [BP-02-platform-architecture.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/architecture/BP-02-platform-architecture.md) | Typed domain services, composite external keys, exact versions, current authorisation, transactions, receipts/outbox and unknown-result recovery. |
| S05 | Product quality register F07/F07-A: [product-quality-register.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/requirements/product-quality-register.md) | Duplicate and mapping review, partial/stale observations, attributable correction and no blind replay or second accounting master. |
| S06 | HTML module conformance r01: [html-module-conformance.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/standards/html-module-conformance.md) | Scope identity, r20 page type, actual reuse, receiving boundaries, declared departures and separate acceptance. |
| S07 | Customers, Sites & Growing Areas design and audit: [customers-sites-workspace-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/decisions/customers-sites-workspace-design.md); [customers-sites-workspace-audit-r02.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/decisions/customers-sites-workspace-audit-r02.md) | Stable location references, site parties, installed/served meaning, approved taxonomy direction, current correction versus physical lifecycle and workspace-only visual treatment. |
| S08 | Equipment & Installed Base r02 handover: [equipment-workspace-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/decisions/equipment-workspace-design.md) | Retained stable assets, event-time location, independent lifecycle relations, controlled correction and original evidence. |
| S09 | Service data dictionary r13: [service-data-dictionary.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/contracts/service-data-dictionary.md) | Typed records and exact retained scope/issue/response semantics; serial uniqueness is not assumed for approved scope assets. |
| S10 | SH-06 handover and maintained source guide: [cross-module-approvals-handover-design.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/decisions/cross-module-approvals-handover-design.md); [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/design/approvals-handover/README.md) | Queue + detail composition; exact source routing; domain decisions retained by their owners; standalone assembly pattern. |
| S11 | Customer 360 maintained source guide: [README.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/design/customer-360/README.md) | Embedded fonts/icons/choice lineage, deterministic build, escaping, scoped projections and unknown-value treatment. |
| S12 | Inspected component styles: [workspace.css](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/design/customer-360/workspace.css); [workspace.css](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/design/approvals-handover/workspace.css) | Concrete navy/green/neutral tokens, controls and queue/detail lineage; source inspection rather than rendered approval. |
| S13 | PPO-STD-001 naming conventions: [naming-conventions.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/standards/naming-conventions.md) | Separate stable identity, readable reference, external company/entity key, revision and state; preserve existing codes. |
| S14 | Current retained exception screens: [exception-screens.tsx](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/src/components/exception-screens.tsx) | Bounded owned recovery review and current read/capability limits; not a full administration or data-quality console. |
| S15 | Theme & Style Board r20: [powerplants-one-theme-style-board-r20.html](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html) | Source-byte identity checked; current shared visual basis. No native rendering or visual approval performed for this plan. |
| S16 | Document, issue and distribution contract: [document-issue-distribution.md](https://github.com/deanrfiedler-gif/powerplants-one/blob/86802e9cbaa7f0f72a5108018802a3d95e0a4285/docs/contracts/document-issue-distribution.md) | Exact issued content, original attempts/results, retained responses and separate domain follow-up. |

### Selected retained source identities

These SHA-256 values describe inspected planning-source bytes. The eventual builder must refresh and record the exact assets it actually reuses.

| Source | SHA-256 |
|---|---|
| `docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html` | `672f626ddfdfc2c67287c646e97485681872b1bb29ddddedf4072917db71a770` |
| `docs/design/customer-360/workspace.css` | `2c52567378725c76c11bc1268d378bb97436bd2995381f35334186264d126c9e` |
| `docs/design/approvals-handover/workspace.css` | `8ca224918580acb0717baaf503aac2f4d827b3cc16aec1f630e2a1b9ad5305f4` |
| `docs/decisions/equipment-workspace-design.md` | `d8c3da0bf98c3ccd077f9ecf2cdf4efd12cabc2524bda0bb89fb0a839be97733` |
| `docs/standards/html-module-conformance.md` | `b457ba511c645ae134103514550c30b96258bea39f5af294cd6e76bc747366af` |
| Theme & Style Board r20 | `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` |


### What this planning task checked

Repository access and the main commit were refreshed. The AD-03 page brief, AD-family boundaries, current design index, F07 requirements, architecture/identity rules, customer/equipment handovers, source styles and bounded recovery implementation were inspected. The plan was checked for consistent scope, complete section navigation, source references, sixteen scenario IDs, forty-eight planned test IDs and explicit separation of proposed behaviour from delivered capability.

Those are report/source checks. No AD-03 code, native browser test, application route, migration, operational scan, source-system transaction, message, deployment or merge is delivered by this report. There is no new business approval or corporate policy decision.

**Next bounded step:** build AD-03 r01 through B1–B7, starting with the duplicate investigation and reviewed serial-correction journey. Retain the true-duplicate, source-owned and unsupported-policy examples as explicit receiving boundaries. Deliver the HTML with its detailed companion report and actual verification record.
