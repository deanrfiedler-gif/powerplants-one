# Sales-to-Estimating Intake — r02 change record

**Document:** PPO-010-INTAKE-CR · **Revision:** r02 · **Date:** 13 September 2026  
**Prepared for:** Dean Fiedler · **Status:** Proposed design for review; application implementation unchanged.

r02 refines the combined potting-line pilot into three Powerplants One content screens. It corrects the readiness and handover omissions identified in the r01 audit and preserves capture, save, submit, clarify, accept and revise. Equipment selection and pricing remain deferred.

## Controlled files

| Item | Value |
|---|---|
| Deliverable | `sales-estimating-intake-preview-r02.html` |
| Bytes | 141,551 |
| SHA-256 | `de9cebe453dcf063386cf143ad3ad164022877ab3410223a365032c90578e46c` |
| Predecessor | `sales-estimating-intake-preview-r01.html` |
| Predecessor SHA-256 | `96c28c3b451ad3a95986fb8f98aa379a89af21bcc814b898479b1d236d9b7213` |
| Content container | `#ppo-intake` |
| Repository evidence | `main` at `1cc882e53020bdfb22f7e9192365d90b1d8282ab`, read during this revision |
| Declared viewports | 1440 × 960; 1024 × 768; 820 × 800; 390 × 844 |

The predecessor remains unchanged. This is a separate revision. No application branch, PR, deployment or baseline-register entry was created by this design task.

## Governing presentation

The [shared UI specification, section 7](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/standards/ui-style-specification.md) and [baseline register](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/standards/ui-baselines.json) govern the container structure. r02 reuses all 41 core token names and the values in [Field Technicians r05](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/reference/ui/field-technicians/powerplants-one-field-technicians-r05.html). That is an accepted design successor; its status does not imply that every value is already implemented across PPO. The [Engineering r02 integration decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/1cc882e53020bdfb22f7e9192365d90b1d8282ab/docs/decisions/engineering-r02-integration.md) corroborates the compact register, Roboto, navy controls, green selection and reuse of the shared shell.

The three documented token divergences between Field Technicians r05 and Job Pack r03 are not resolved globally here. This preview consistently uses the Field Technicians values: `--surface-hover: #f0f2f5`, `--line-soft: #e9ecf1`, `--success-tint: #f3f7f1`.

## Changes tied to audit findings

| Finding | r02 response | Result |
|---|---|---|
| A01 — duplicated product header | Removed the standalone navy product header and recreated wordmark. Scoped the component and reset beneath `#ppo-intake`. | Designed to fit inside PPO's existing shell. |
| A02 — excessive introduction and demonstration controls | One concise page title, compact request context, collapsed Preview controls and one footer note. | More space for the working brief. |
| A03 — inconsistent controls and dense nested panels | Shared token block, embedded Roboto, 24 px desktop / 16 px phone gutter, 44 px main controls, navy actions, green tab markers and one white workspace. | Consistent content-container presentation. |
| A04 — heavy popup boundaries | Borderless native dialogs with a soft shadow and muted backdrop; visible focus, labelled controls, Escape/Cancel and return-focus handling. | Clearer dialogs. Native keyboard behaviour remains to be browser-tested. |
| A05 — readiness omitted required inputs | One model readiness result combines submission requirements, numeric validity and open clarification replies. The display refreshes as answers change. | A blank problem or scope cannot display Ready to submit. Inline guidance and links identify missing fields. |
| A06 — technical uncertainty confused with submission completeness | Separate Ready to submit from estimating review items and Accepted for estimating. | A known gap can be handed over for clarification without implying acceptance. |
| A07 — handover omitted captured facts | All 24 answer fields are available in five expandable groups, followed by the submitted evidence references. | Container diameters, footprint, handling, robotics, desired outcome and requested date are included. |
| A08 — queue mixed working and submitted data | Queue rows use the submitted snapshot. A draft successor keeps the accepted basis, requested date from that basis, and agreed target. Unsubmitted first drafts appear only in Sales drafts. | Sales edits cannot silently replace estimating's queue facts. |
| A09 — queue lacked actionable context | Separate requested/agreed dates, revision, review/accepted owner, age since first submission and next action/owner. Smaller widths use record cards. | Estimators can identify the next action and its owner. |
| A10 — changes buried below the original scope | Before/after comparison appears first for a changed brief; phone comparisons stack by field. | The estimator sees the effect of a revision before the complete submitted brief. |
| A11 — unclear evidence and history | Evidence metadata can be added to a working brief and is frozen on submission. History includes attributable timestamps; acceptance requires a review acknowledgement. | Clearer evidence and revision boundaries within the simulation. |
| A12 — missing exception-state designs | Loading, empty, read failed, partial read, denied, saving, saved and conflict states are selectable. Partial reads and conflicts pause decisions. | Each required state has an authored surface. |

## Three screens and placement

| Screen | Proposed PPO location | Work supported |
|---|---|---|
| Sales intake | Existing deal → Scope & intake | Retained customer/site/owner context; Brief, System details and Evidence sections; live readiness; save and submit; respond to clarification; start a revision. |
| Estimating queue | Estimating → Intake | Search; status filter; oldest/requested-date sort; submitted facts; separate agreed target; owner and next action; open the relevant brief. |
| Handover review | Selected estimating request | Exact submitted answers/evidence references; change comparison; clarification and resolution; estimating owner and agreed target; acknowledgement and acceptance; history. |

The three top-level screen buttons are preview navigation. The file comments identify them, the review controls and footer as removable when each surface is mounted into its eventual application route. They add no global navigation or runtime role access.

## Preserved scope and mapping

The source field bank is unchanged: **476 numbered source items plus 10 supplementary anchors, mapped to 107 canonical field groups**. The r01 design and field maps are retained as reference files in the ZIP. Greenhouse and berry specialist questionnaires remain later work. This preview is a bounded subset of that bank, not a complete implementation of every repeatable structure.

| Preview fields | r01 canonical field groups |
|---|---|
| `problem`, `outcome` | `problem_summary`, `outcome_summary` |
| `build`, `context` | `build_scope`, `installation_context` |
| `scope`, `exclusions`, `assumptions` | `responsibilities` / `fulfilment_scope`, `exclusions`, `assumptions` |
| `output` | `response_type`, `requested_output_note` |
| `requestedDate`, `operationalDate` | `requested_by_date`, `operational_date` |
| `electrical` | `responsibilities` — electrical work item |
| `operations`, `min`, `max` | `operations`, `containers.diameter_min_mm`, `containers.diameter_max_mm` |
| `media`, `average`, `peak`, `sustained` | `media_types`, `average_rate`, `peak_rate`, `sustained_rate` |
| `footprint`, `interfaceNote` | `footprint`, `existing_equipment.interface_notes` / `interface_requirements` |
| `robotics`, `outfeed`, `handling` | `robotics_intent`, `outfeed`, `handling_constraints` |
| `changeReason`, `evidence` | `change_reason`, `evidence` |
| Read-only customer/site/Sales context; accepting owner and target | `customer_id`, `site_id`, `sales_owner_id`, `estimating_owner_id`, `agreed_target_date` |

This is semantic traceability, not an import contract. The preview uses one min/max diameter pair and simplified prose for several concepts. Production modelling must retain the repeatable records, units, attributed unknowns and references defined by the field bank. Choosing Named other for electrical responsibility still needs an identified party in the full contract; the preview's free-text scope can describe it but does not validate identity.

## Verification and limits

- **16 model checks passed**, including all six workflow actions, role guards in the simulation, invalid dimensions, mandatory answers, clarification and reviewer resolution, evidence snapshot retention, explicit acknowledgement, queue snapshot selection and preserved accepted revisions.
- **5 authored-template checks passed**, including full answer coverage, comparison-first order, required state surfaces, consistent readiness messaging and queue separation.
- **10 source checks passed**, including one scope container, scoped CSS, all 41 chosen core tokens, embedded fonts, declared viewport metadata and no external resource dependencies.
- Static document renders were generated at widths 1440, 1024, 820 and 390 and inspected for content grouping, readability and comparison order. These renders approximate form controls and do not establish browser layout, icon, native-dialog, focus, sticky-action or overflow behaviour.

**Browser acceptance is outstanding.** A prior browser attempt was rejected by the environment's URL policy; no alternate route was used to bypass it. The repository's browser baseline checker and an in-app comparison have not run for r02. No accessibility, print or application acceptance is claimed.

## Remaining design and implementation decisions

1. Review the three screens and workflow terminology against Sales and Estimating practice. Confirm the estimating owner and agreed-target requirements.
2. Before accepting this as an implementation baseline, verify all four declared viewports in a supported browser, including actual dialogs, keyboard navigation, long text, error focus and sticky actions. Compare within the live PPO shell.
3. Align the three new `SYN-PPO-INT-000101`–`000103` design fixtures with actual application seed references and register the accepted baseline. They are proposed intake identities, not asserted existing application records.
4. Reconcile the accepted intake contract with the current Estimating workstream before implementation. Retain real permission checks, durable saves, conflict recovery, versioned document retrieval and revision-level review attribution.

Pilot measures remain missing-information return rate, clarification rounds and time from first submission to accepted brief. No production KPI results or target improvements are invented by this preview. Automated equipment recommendations, compatibility decisions, pricing, quote issue, engineering release and delivery authorisation remain outside this refinement.
