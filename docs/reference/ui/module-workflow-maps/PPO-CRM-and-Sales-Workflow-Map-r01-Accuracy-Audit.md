# CRM & Sales Workflow Map r01 — accuracy audit

**Audit date:** 13 September 2026  
**Reference:** PPO-CRM-and-Sales-Workflow-Map-r01.html  
**Repository snapshot:** [main 1cc882e](https://github.com/deanrfiedler-gif/powerplants-one/commit/1cc882e53020bdfb22f7e9192365d90b1d8282ab)  
**Disposition:** Seven precision findings corrected in the existing r01 reference. Scope and presentation retained.

The central workflow and its implementation/design distinctions are supported by the source evidence. The audit found several omissions and over-broad statements that mattered for correct use of the reference: the legacy entry route, retained Lead identities, exact actor authority, Activity lifecycle restrictions, email follow-up constraints, a numeric ceiling and journey-branch meaning. These have been corrected. The original did not claim that the accepted five-stage pipeline, owner-transfer policy, formal intake or live integrations had already been implemented.

The corrected map is suitable as a dated design and implementation reference. It is not a substitute for accepted operating procedures or a certification of deployed application behaviour.

## Evidence and audit method

- Rechecked live `main`; it remains **1cc882e53020bdfb22f7e9192365d90b1d8282ab**, the same commit used by r01. This was a correctness audit, not a silent update to a different repository version.
- Checked all **16 core procedure descriptions, 42 gates and eight journey definitions**, together with their supporting topics, record boundaries, requirement mappings, exceptions and examples, against the relevant source families below.
- Verified the contents of **34 repository source files against their Git blob identities** in the pinned commit. One cached source had an extra trailing blank line; refreshing it restored an exact match without changing any commercial-read claim.
- Checked the separate Intake Design r01 against its embedded original text and SHA-256. Its **a02ea22f4514757983f0b8d3bc8cd8fe80f8a787** baseline and “design delivered for review” status remain explicit. It is not represented as a document committed at the CRM map’s head.
- Read current command, validation, authority and schema amendments together. Earlier blueprint or migration statements were not treated as overriding later source. A source-reading conclusion is distinguished from a fresh database, browser, deployment or business-acceptance test.
- Retained existing CRM-01–CRM-08 requirement titles. Local CS identifiers remain navigation aids, not new approved requirements or acceptance results.

## Findings and corrections

| Finding | Significance | Correction |
| --- | --- | --- |
| A01 · Current entry versus accepted target | Moderate | Current code can create an Open Enquiry with an initial Activity, then qualify it to Qualified. Lead conversion separately produces a Qualified opportunity. Discovery–Closing and retirement of Enquiry remain the accepted successor design. |
| A02 · Saved Lead identity and conversion repairs | Moderate | Saved Lead company, owner and organisation/site/contact IDs are retained. Supported text and lifecycle fields may change; conversion can resolve missing links while retaining existing resolved links. Current Activity update cannot change site/access/kind/links, so an incompatible original graph is a hold requiring a supported resolution, not an invitation to rewrite or omit source evidence. |
| A03 · CRM mutation and qualification authority | Moderate | Current existing-Lead/deal mutations require their current owner plus relevant permissions and relationship checks. Conversion additionally checks opportunity-create/context eligibility. For an unknown contact, the identification action must be Open/InProgress, CustomerContact or RelationshipReview, owned by the Lead owner and linked to the resulting opportunity. Other next actions may retain a different eligible owner. |
| A04 · Activity lifecycle versus reassignment | Moderate | Only the current Activity owner with activity.edit and current access can start, complete or cancel. Start requires Open; complete/cancel allow Open or InProgress. An authorised editor may update/reassign an active Activity after version/eligibility/all-target checks. Completed/Cancelled content cannot be updated or reassigned through this command. |
| A05 · Private-email follow-up limits | Low | The follow-up is a CustomerContact Activity owned by the mailbox actor, requires a known due instant, and is created only once for the message. LinkEmail refuses to change the opportunity once a follow-up exists. It does not copy the private body, replace the deal’s designated next action or connect to a live mailbox. |
| A06 · Current amount input limit | Low | The current field permits 0 through 999,999,999.99, up to two decimals, or blank/null for unknown. This is a validator limit, not an approved commercial threshold, currency model or forecast policy. |
| A07 · Journey highlights and branch meaning | Moderate | Removed that return from the closed-outcome journey; reopening remains an explicitly proposed supporting control. Aftercare now numbers account context → aftercare → new enquiry, with actual delivery feedback shown as a conditional input. New-enquiry optional entry now points to the actual aftercare-to-enquiry connection. |

### A01 — Current entry versus accepted target

**Original issue:** The overview strongly emphasised qualification in Leads but did not explain the still-implemented direct opportunity entry. A reader could mistake the target Lead-first model for the only current entry route.

**Verified position:** Current code can create an Open Enquiry with an initial Activity, then qualify it to Qualified. Lead conversion separately produces a Qualified opportunity. Discovery–Closing and retirement of Enquiry remain the accepted successor design.

**Corrected locations:** Current capability table, pipeline topic, Discovery procedure and implementation view.

**Evidence:** [Current opportunity qualification and next-action commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/opportunities.ts), [Current direct opportunity creation and next-action inputs](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/validation.ts), [Original opportunity schema and direct Enquiry creation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/db/migrations/0010-crm-opportunities.sql), [Accepted five-stage direction · history and amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-pipeline-stage-model.md), [Five-stage plan r02 · later corrections and split increments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/delivery/crm-five-stage-implementation-plan.md).

### A02 — Saved Lead identity and conversion repairs

**Original issue:** Capture/linking language and the customer-identity change row were too broad about what could change after a Lead was saved. The conversion-return wording also did not explain the limits on repairing an Activity context mismatch.

**Verified position:** Saved Lead company, owner and organisation/site/contact IDs are retained. Supported text and lifecycle fields may change; conversion can resolve missing links while retaining existing resolved links. Current Activity update cannot change site/access/kind/links, so an incompatible original graph is a hold requiring a supported resolution, not an invitation to rewrite or omit source evidence.

**Corrected locations:** Lead and account procedures, identity/conversion topics, CS-G01/G17/G18, CS-C01 and CS-X01/X02.

**Evidence:** [Current Lead fields, lifecycle and conversion validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/validation.ts), [Current manual Lead and conversion commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/service.ts), [Retained Lead identities and atomic conversion constraints](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/db/migrations/0018-crm-leads.sql), [Current shared Activity commands and permissions](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/activities/activities.ts).

### A03 — CRM mutation and qualification authority

**Original issue:** Several controls used “permitted editor/actor” without stating the current-owner guard. Contact-identification action wording omitted the exact kind and same-owner requirement.

**Verified position:** Current existing-Lead/deal mutations require their current owner plus relevant permissions and relationship checks. Conversion additionally checks opportunity-create/context eligibility. For an unknown contact, the identification action must be Open/InProgress, CustomerContact or RelationshipReview, owned by the Lead owner and linked to the resulting opportunity. Other next actions may retain a different eligible owner.

**Corrected locations:** Qualification, scope, health, recovery and next-action procedures/gates, with direct authority sources added.

**Evidence:** [Current Lead authority and owner eligibility](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/context.ts), [Current Lead conversion receipt reauthorisation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/receipt-authority.ts), [Current CRM relationship and owner eligibility](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/context.ts), [Current manual Lead and conversion commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/service.ts), [Current deal information, scope and stage commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/refinements.ts), [Current opportunity qualification and next-action commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/opportunities.ts).

### A04 — Activity lifecycle versus reassignment

**Original issue:** “Activity owner/actor” could be read as allowing any permitted editor to complete or cancel an Activity; active-only reassignment was not explicit.

**Verified position:** Only the current Activity owner with activity.edit and current access can start, complete or cancel. Start requires Open; complete/cancel allow Open or InProgress. An authorised editor may update/reassign an active Activity after version/eligibility/all-target checks. Completed/Cancelled content cannot be updated or reassigned through this command.

**Corrected locations:** Activities, ownership, information view, CS-G21/G34 and the ownership journey.

**Evidence:** [Current shared Activity commands and permissions](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/activities/activities.ts), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md).

### A05 — Private-email follow-up limits

**Original issue:** The description of one follow-up was sound but incomplete about its owner, date and retained deal association.

**Verified position:** The follow-up is a CustomerContact Activity owned by the mailbox actor, requires a known due instant, and is created only once for the message. LinkEmail refuses to change the opportunity once a follow-up exists. It does not copy the private body, replace the deal’s designated next action or connect to a live mailbox.

**Corrected locations:** Activity procedure, private-mail topic and CS-G35.

**Evidence:** [Current private synthetic email links and follow-up](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/email/service.ts), [Synthetic email provider · no live mailbox connection](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/email/provider.ts), [Demo CRM and private Email integration scope](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/demo-email-crm-integration.md).

### A06 — Current amount input limit

**Original issue:** The map stated non-negative values with up to two decimals but omitted the implemented ceiling.

**Verified position:** The current field permits 0 through 999,999,999.99, up to two decimals, or blank/null for unknown. This is a validator limit, not an approved commercial threshold, currency model or forecast policy.

**Corrected locations:** Health procedure, forecast topic, current rules and CS-G23.

**Evidence:** [Current deal value/date/scope and two-stage validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/refinement-validation.ts), [Current exact amount summary and unknown-value count](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/value-summary.ts).

### A07 — Journey highlights and branch meaning

**Original issue:** The loss/reopening journey reused the Negotiation-to-Scoping return, which could suggest it was a reopening route. Aftercare numbered two independent inputs as if both were sequential main-path steps.

**Verified position:** Removed that return from the closed-outcome journey; reopening remains an explicitly proposed supporting control. Aftercare now numbers account context → aftercare → new enquiry, with actual delivery feedback shown as a conditional input. New-enquiry optional entry now points to the actual aftercare-to-enquiry connection.

**Corrected locations:** CS-J02, CS-J07 and CS-J08; the accepted stage policy and underlying connection identities remain unchanged.

**Evidence:** [Accepted five-stage direction · history and amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-pipeline-stage-model.md), [Five-stage plan r02 · later corrections and split increments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/delivery/crm-five-stage-implementation-plan.md), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md).

## Material claims confirmed

| Area | Audit conclusion | Source basis |
| --- | --- | --- |
| Accepted pipeline | Discovery → Scoping → Quoting → Negotiation → Closing; qualification belongs in Leads in the target model, and Won/Lost are separate outcomes. | [Accepted five-stage direction · history and amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-pipeline-stage-model.md), [Five-stage plan r02 · later corrections and split increments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/delivery/crm-five-stage-implementation-plan.md) |
| Current implementation | Enquiry/Qualified and Open remain current. Bidirectional two-stage changes and immutable stage events already exist. | [Current deal value/date/scope and two-stage validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/refinement-validation.ts), [Current deal information, scope and stage commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/refinements.ts), [Current two-stage movement and immutable event amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/db/migrations/0017-crm-ui-refinements.sql), [Current scoped Board/Grid worklist and returned-page counts](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/worklist.ts) |
| Lead lifecycle | New, Contacting and Nurturing are active states; Disqualified and Converted are separate. Archive is a separate flag. There is no Qualified Lead status. Converted is terminal. | [Current Lead fields, lifecycle and conversion validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/validation.ts), [Retained Lead identities and atomic conversion constraints](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/db/migrations/0018-crm-leads.sql), [Current manual Lead and conversion commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/service.ts) |
| Conversion preservation | One atomic conversion retains original Lead, source, owner and compatible Activity identities. Current authority precedes original receipt retrieval; a retry is not a second opportunity. | [Current manual Lead and conversion commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/service.ts), [Current Lead conversion receipt reauthorisation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/leads/receipt-authority.ts), [Shared operation identity, canonical payload and receipt recovery](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/platform/operations.ts), [Retained Lead identities and atomic conversion constraints](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/db/migrations/0018-crm-leads.sql) |
| Next-action health | Unavailable, Needed, DueNeeded, Overdue and Upcoming are distinct current worklist results. Completing an Activity does not automatically choose a replacement or move a stage. | [Current scoped Board/Grid worklist and returned-page counts](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/worklist.ts), [Current opportunity qualification and next-action commands](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/opportunities.ts), [Current shared Activity commands and permissions](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/activities/activities.ts) |
| Worklist scope | Counts have ReturnedPage basis. Only a single complete result is Complete; multi-page windows remain Partial. Snapshot change requires refresh. | [Current scoped Board/Grid worklist and returned-page counts](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/worklist.ts) |
| Value summary | Minor units are summed exactly; missing value is separate from known zero. The caller owns aggregation scope. A complete weighted or multi-currency forecast is not established by these fields. | [Current exact amount summary and unknown-value count](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/value-summary.ts), [Current deal value/date/scope and two-stage validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/crm/refinement-validation.ts), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md) |
| Estimating visibility | The Commercial tab is a permission-checked read of an estimate projection and eligible quote references, with separately checked create eligibility. It is not quote issue or customer acceptance. | [Current permitted estimate projection for CRM](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/estimating/reads.ts), [CRM Commercial tab · read-only estimating route](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/app/api/v1/crm/opportunities/[id]/commercial/route.ts) |
| Formal intake | Save, submit, clarify, accept and revise are described in a separate design for review. Answered differs from reviewer Resolved; accepted predecessor remains visible while a successor is pending. | embedded *Sales-to-Estimating Intake Design r01* (separate original baseline retained in the HTML) |
| Quotation history | An exact draft is separate from issued output; issue is separate from response/acceptance. Alternative offers remain within one pursuit and are not automatically summed as multiple wins. | [Estimating & Quotation · BP-04](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-04-estimating-quotation.md), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md), [Accepted five-stage direction · history and amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-pipeline-stage-model.md) |
| Ownership transfer | H-01, H-02 and H-03 remain open. Proposed immediate handover after server acceptance does not establish a recipient-acceptance workflow. No Activity/downstream ownership cascade is implied. | [Opportunity handover · H-01 to H-03 remain open](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-opportunity-handover.md), [Opportunity handover · proposed exact contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/contracts/crm-opportunity-handover.md), [Five-stage plan r02 · later corrections and split increments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/delivery/crm-five-stage-implementation-plan.md) |
| Won and downstream work | Customer evidence, Sales outcome, receiving responsibility and authoritative ERP confirmation are separate. Won does not by itself create a Project, Service booking, ERP order, invoice or payment. | [Accepted five-stage direction · history and amendments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-pipeline-stage-model.md), [Five-stage plan r02 · later corrections and split increments](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/delivery/crm-five-stage-implementation-plan.md), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md), [Projects & Commercial Delivery · BP-06](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-06-projects-commercial-delivery.md) |
| Aftercare | Aftercare and growth are accepted scope, but automatic triggers or opportunity creation are not current runtime claims. Actual work feedback and relationship review require accountable follow-up. | [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md), [Accepted CRM product scope and deliberate deferrals](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-approved-scope.md) |
| Retained systems and deferrals | Pipedrive remains the operational CRM under the stated coexistence design. MYOB retains accounting authority. CRM proposal/signature generation, broad marketing and external prospecting remain deferred; no live integration or migration is performed by the map. | [Accepted CRM product scope and deliberate deferrals](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/crm-approved-scope.md), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md), [Master blueprint · CRM parents and source authority](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-01-master-blueprint.md), [Synthetic email provider · no live mailbox connection](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/src/email/provider.ts) |
| Worked examples | The first three examples are correctly labelled fictional adaptations of the intake design. The fourth is explicitly a fictional map-authored scenario. No actual customer order, product capacity or price is asserted. | embedded *Sales-to-Estimating Intake Design r01* (separate original baseline retained in the HTML), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md) |
| Parent traceability | All eight parent titles match the existing requirement register. Procedure groupings and summaries do not claim passed acceptance. | [Existing CRM-01 to CRM-08 parent register](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/requirements/requirements.csv), [CRM blueprint · accepted r02 scope and wider lifecycle](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/blueprints/BP-03-crm.md) |

## Unresolved matters retained rather than invented

1. **Direct customer acceptance during Quoting.** The earlier stage decision permits a direct move to Closing, while the later plan retains one-stage forward moves and rejects a two-stage forward jump. The map exposes this inconsistency. It does not fabricate a Negotiation event or silently authorise a shortcut.
2. **Ownership-transfer H-01–H-03.** Initiator authority, effective timing and receipt-authority exceptions require their own decisions. General approval of CRM scope did not settle them.
3. **Won-to-delivery contract.** Whether Won creates downstream work, links existing work or marks a handoff due remains separately bounded. Receiving acceptance and ERP order confirmation must not be inferred.
4. **Opportunity pause/reopen and forecast policies.** Detailed transition rules, evidence requirements, value definitions, confidence and currency basis remain future policy/implementation work. Current Lead reopening and manual amount fields do not implement those features.
5. **Formal intake runtime.** The intake package demonstrates design; server persistence, permission mapping, notifications and downstream impact commands require their own implementation and acceptance.
6. **Current context-repair limits.** A Lead conversion blocked by retained Activity context is correctly shown as a hold. An unsupported site/access rewrite is not offered as a repair.

## Corrected-reference verification

The rebuilt HTML passed JavaScript syntax validation; generation of **138 reading/detail bodies**; identifier, source, requirement and companion-link checks; pure search and deep-link checks; and calculated SVG checks for text widths, footer alignment, gate clearances, path endpoints and journey roles. All eight journeys and five views are retained. Existing companion-map files were not changed.

This verification did **not** run a live database or the PPO application. It did **not** verify deployed permissions, integration outcomes, browser rendering, keyboard interaction, mobile behaviour, assistive technology or print pagination. Those remain separate acceptance checks. No repository content, branches, pull requests or operational records were changed.

## Artifact identity

- Original r01 reviewed: SHA-256 `2022ec62bb8696e584941ccbd04b37444ab21ff97e91b30fb2976584ca69b1aa`.
- Corrected r01: SHA-256 `494928193dfe82104e9acadb374bfd86068c25fc01ae2f7e47a19171d6eeb2b3`.
- Repository files checked against pinned Git blob identities: **34/34 matched**.
- Embedded intake original: SHA-256 `5ac8d89874e827d93fd827fbc059738caba6176323868eab259fc26c8f6f37ec`.
- Source inventory: **34 pinned repository files + one separately embedded intake design**.

The r01 filename is retained because this pass corrects accuracy within the accepted scope. Its evidence footer and implementation view record the audit.
