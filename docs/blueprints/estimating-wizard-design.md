---
document_id: PPO-010-WIZARD-DESIGN
revision: r01
date: 2026-09-09
owner: Dean Fiedler
status: Design and synthetic demonstration; runtime integration not implemented
source_commit: f8035b5c55251da4da52430adf2f83094feccd6b
---

# Guided estimating — first package

## Outcome and authority

Dean proposed entering project requirements, generating most of an estimate and then fine tuning it. On 9 September he said “Proceed on that basis” after the recommendation to design and prove one repeatable equipment supply-and-installation package, ending in a quotation draft. This contribution fulfils that bounded design step under [PPO-010 / issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10). It includes a [clickable demonstration](estimating-wizard-mockup.html), [executable fictional rules](estimating-wizard-model.mjs), [design checks](../testing/estimating-wizard-check.mjs), and [decision/handover](../decisions/estimating-wizard-pilot.md).

The wizard prepares editable proposals; the estimator remains responsible for technical suitability, scope completeness and commercial judgement. No target percentage of automation is claimed. Measure effort and corrections in a later trial.

This is a design extension of [BP-04](BP-04-estimating-quotation.md), not a replacement for its costing or quotation records. Current manual E1 is implemented; the old discovery's “no estimating application” statement is historical. [ADR-0017](../decisions/ADR-0017-estimating-e1.md) and [E1's actual contract](../contracts/estimating-e1.md) govern current arithmetic and saved-version behaviour. General questionnaires remain E2; specialist calculation remains E5 with actual formula evidence. P01–P12 and other active contributions retain their scope.

## Pilot selection

Use a fictional monitoring sensor package at **Synthetic Example Nursery**. Stable demonstration definition: `SYN-PPO-SENSOR-PACKAGE-r01`; estimate/quotation examples: `SYN-PPO-EST-000901` and `SYN-PPO-QUO-000901`. These are readable references, not database keys or real catalogue products. No real customer, supplier price, operational quotation, source export or brand attachment is added to Git.

A small sensor package makes quantities, accessories, site labour, commissioning, training and freight visible without pretending to reproduce hydraulic, lighting, electrical or CREMS Screen Systems engineering. Capacity and installation coefficients below are deliberately fictional. The demo permits supply only as an exception, while the default proves supply and installation. Remote handover can be included independently. It never claims real wireless coverage or compatibility.

## Estimator journey and screens

| Screen | Main content and actions | Result |
|---|---|---|
| Requirements | Choose work/package; brief; shared customer/opportunity/site context; answer relevant questions; save and resume in the future application | Versioned confirmed inputs with explicit unknowns; no generated lines yet |
| Proposed solution | Grouped parts and service allowances, why each line exists, quantity basis, source freshness, unresolved inputs; first generation or comparison | Reviewable proposal; Apply is blocked by unresolved mandatory requirements |
| Estimate | Familiar editable costing grid; cost/sell/known subtotal distinctions; source details; manual adjustments and reasons | Estimator controls the result; no automatic approval or quotation issue |
| Quotation | Customer projection, scope, specifications, exclusions, assumptions, freight, lead time, terms, validity and reconciled sell schedule | Exact draft from the reviewed estimate; no internal costing or adjustment reasons |

The demo implements these four screens, requirement changes, one editable labour override, explicit rerun choices and the draft projection. Broader line editing, package selection, text extraction, server persistence, review approvals and output downloads are future integration work. The brief/customer are fixed fictional context in this first demonstration. Every demo session starts over on reload; no Saved claim or offline storage is used.

Use navy primary actions, the green selected-step accent, white surfaces, Roboto/Verdana, visible focus, labels, 44px controls, and natural 320px/390px reflow. On narrow screens forms stack and the cost table has contained horizontal scrolling. Essential explanations are available by expanding “Why this item?”, not hover alone. Reuse the existing intact repository logo on navy. Supplied Brand Guidelines 2026 pp17–18 confirm Roboto, navy `#242a37` and green `#62bb46`; no brand bytes are republished.

## Questionnaire and rules

Published definitions must carry stable question IDs, answer states, units, scope membership and revisions. Values extracted from a brief are suggestions until confirmed. Unknown is not false, zero or a valid default. Production answer states retain BP-04's NotAnswered, Deferred, Answered and Confirmed distinctions.

| Question key | Answer / validation | Effect |
|---|---|---|
| sensor_positions | Integer 1–16 for this fictional template | One sensor and one mount per position |
| gateway_requirement | New / Existing compatible confirmed / Unknown | New adds one gateway; Existing requires supporting compatibility evidence in runtime; Unknown blocks Apply and quote preparation |
| installation_required | Explicit Yes / No | Yes adds installation and commissioning; No removes proposed lines and changes customer scope |
| remote_handover_required | Explicit Yes / No | Adds one remote training hour; independent of installation |
| freight_basis | Explicit fictional allowance / Unknown | Unknown displays known subtotals and blocks Apply; runtime needs source/rate/date or an explicit allowance |
| installation_hours_override | 0.5–40 hours in 0.5-hour steps, reason required | Changes installation only; marks estimator adjustment |

The ranges are demonstration constraints, not manufacturer ratings. A real package needs verified products, compatibility, capacity, units, labour basis, source/effective dates and representative accepted calculations before activation. Questionnaire publication and package publication must be separately authorised capabilities; an estimator editing a draft must not silently change a reusable template.

## Worked estimate

All amounts are AUD excluding tax; tax is not calculated, matching E1's bounded arithmetic basis. Source: fictional fixture dated 9 September 2026. Cost and sell rates are independent explicit inputs, not an invented margin policy. Quantities in this demo produce exact integer-cent extensions. Future runtime uses E1's canonical decimal strings and authoritative HALF_UP line extensions; do not introduce browser floating-point authority.

| Stable line key | Quantity basis (4 positions) | Unit cost | Unit sell | Extended cost | Extended sell |
|---|---|---:|---:|---:|---:|
| gateway | 1 each, New selected | $600.00 | $800.00 | $600.00 | $800.00 |
| sensors | 4 each | $120.00 | $160.00 | $480.00 | $640.00 |
| mounts | 4 each | $15.00 | $20.00 | $60.00 | $80.00 |
| installation | 2 + 0.5 × 4 = 4 hours | $80.00 | $120.00 | $320.00 | $480.00 |
| commissioning | 2 hours | $80.00 | $120.00 | $160.00 | $240.00 |
| training | 1 remote hour | $80.00 | $120.00 | $80.00 | $120.00 |
| freight | 1 explicit allowance | $60.00 | $80.00 | $60.00 | $80.00 |
| **Total** | | | | **$1,760.00** | **$2,440.00** |

The estimator changes installation to **5.5 hours**, with reason “Extra access and cable routing time”. The revised cost is **$1,880.00**, sell **$2,620.00**. The customer sees installation quantity and sell extension, while the reason remains internal.

Next, change from four to **six positions**. The generated suggestion is six sensors, six mounts and five installation hours, costing **$2,110.00**, selling for **$2,920.00**. Because installation was manually adjusted, Apply requires a choice. Keeping 5.5 hours produces **$2,150.00 cost / $2,980.00 sell**; adopting five generated hours produces **$2,110.00 / $2,920.00**. Cancelling leaves the four-position edited draft unchanged.

## Rerun and manual-edit protection

Runtime matching uses template revision + configuration run + stable output key + scoped facility/system UUID; never match solely on description, row order or price. The demo uses stable line keys within one package only.

1. Store the original confirmed input/definition/rule/parts-map/source snapshots and exact generated lines.
2. Compare the new proposal against the last generated baseline and the estimator's current draft. Show Added, Changed, Removed, Unchanged and Unmatched, with cost/sell consequences.
3. Carry untouched generated lines forward. Preserve manual-only lines outside this run's membership.
4. For each adjusted line, explicitly keep the adjustment, adopt the new suggestion or resolve an unmatched item. Removed adjusted lines require Keep as an explicit extra or Remove. Keeping a line outside the new package must retain scope and warning context.
5. Apply atomically to the expected current estimate version. Cancelling has no effect. Repeating the accepted operation has one effect. A concurrent change returns comparison/recovery; no silent overwrite.
6. A saved/approved/issued source never changes in place. Create a successor and make any quote dependency change visible. A recipe refresh is a separate action from recalculating a wizard.

The demo protects labour quantities and reasons and compares quantities; it does not simulate price refresh, renamed/moved scope keys or every unmatched-line case. Those are mandatory runtime cases, not a claimed pass.

## Quotation Builder handoff

The Quotation Builder remains the downstream authoring capability. Its separately requested Rumbalara reference mapping is not re-created here: that source document and a maintained Builder-specific implementation contract were not present in the inspected main. This pilot defines a proposed input mapping against BP-04/E1, to reconcile with that work before integration.

| Wizard / estimate source | Quotation content | Control |
|---|---|---|
| Permitted shared customer/site/contact; estimate and exact saved-version IDs | Recipient, subject and reference | No duplicate master records; missing recipient details visible |
| Reviewed included package and line quantities | Scope and price schedule | Include affects money; visibility affects presentation; grouped totals reconcile |
| Confirmed technical answers and released specification reference | Specifications | No AI-invented performance or compatibility |
| Explicit excluded work | Exclusions | Removed services must not remain in included scope |
| Reviewed assumptions | Assumptions | No hidden conversion of Unknown to Confirmed |
| Explicit freight allowance/source and delivery responsibilities | Freight and delivery | Count freight once; distinguish allowance from actual confirmed charge |
| Supplier lead-time source and scheduling constraints | Lead time | Missing or stale values stay unresolved |
| Adopted terms template and validity input | Terms and validity | Do not invent company clauses or inherit an unrelated quotation's terms |
| Internal unit costs, source notes and adjustment reasons | No customer mapping | Whitelist the projection server-side; hiding DOM/CSS is not security |

The demonstration displays every listed quotation section. Unconfirmed lead time, terms and validity say “To be confirmed”; it is a complete **draft structure**, not an issue-ready offer. No sender address, legal contact block, signature, customer acceptance, sending or delivery facts are fabricated. A future draft revision binds exact estimate, input, narrative and template versions and hashes. Changing requirements creates a new draft; previous issued bytes and acknowledgement remain unchanged.

## Runtime integration and states

Use existing TypeScript domain services, PostgreSQL transactions, current scope checks, operation receipts and durable document adapter. Proposed configuration-run/definition records require a separately reviewed additive schema; no physical IDs, migrations or new ADR numbers are reserved here.

| State | Required behaviour |
|---|---|
| Loading / unavailable | Keep context; retry; do not display zero-price success |
| Incomplete requirements | Show known subtotal and owned missing input; preserve draft answers |
| Unsaved / saving / saved | Saved only after durable accepted receipt; exact source version visible |
| Conflict / uncertain outcome | Keep authorised proposal; compare current version or reconcile original operation before retry |
| Definition/source changed | Show revision and price/quantity effects; require deliberate regeneration |
| Access changed | Clear sensitive UI and reauthorise reads, writes, receipts and quotation files |
| Draft ready / not ready to issue | Distinguish preparation from technical/commercial approval and issue |

Existing `estimating.read`, `estimating.edit`, quote-read/prepare, current ownership and related-record visibility remain necessary. Template editing needs a separate future capability. API validation rechecks inputs, templates, units, cost sources and output bounds. Model execution accepts data and published rules, never arbitrary user-supplied code. AI is deferred; later it may propose answers and narrative with sources, without approving or authoritatively calculating.

## Acceptance and next implementation boundary

| Case | Observable result | Parent / current acceptance linkage |
|---|---|---|
| W01 Baseline | Four-position example produces seven lines and $2,440.00 sell | EST-02/04/05; EA-04/05, AT-04/27 |
| W02 Unknowns | Unknown gateway/freight shows incomplete known subtotal; no Apply/quote | EST-02/04; EA-04/05 |
| W03 Fine tuning | 5.5-hour override requires reason; $2,620.00 sell; original retained | EST-03/06; EA-03/17 |
| W04 Rerun | Six-position keep/adopt/cancel outcomes match worked example | EST-06; EA-16/17, AT-28 |
| W05 Removed/moved scope | Edited removal requires disposition; unmatched IDs never auto-match | EST-02/06; EA-15/17 |
| W06 Concurrency/retry | Current-version check and original operation replay prevent duplicate lines | EST-03/06; EA-03/17 |
| W07 Permissions | Denied scopes, revoked rights and safe-only reader cannot reveal costs | EST-07/08; EA-01, AT-01 |
| W08 Output | Safe draft totals reconcile; exclusions reflect lines; exact revisions retained | EST-08; EA-10/11, AT-26/36 |
| W09 Recovery | Save/restart/source refresh preserves inputs, edits and prior outputs | EST-03/06; EA-03/16/17 |
| W10 Usability | Keyboard plus desktop/390px/320px; no outer-page overflow; meaningful errors | EST-02/08; EA-18 |

W labels identify local design cases, not new master requirements. The model check exercises bounded W01–W05/W08 logic; it does not complete the full runtime cases or change any EA/AT acceptance status. No business speedup is measured yet.

Next: review this journey with Dean, select the first real package and collect a parts list, compatible variants, labour rules, current rate sources and two or three completed/redacted reference estimates. Then define a bounded integration slice using the existing estimate editor and draft output. Reconcile E2 questionnaire and E3 source requirements explicitly; do not invoke all of E2/E5 implicitly. In the trial compare manual versus guided preparation time, missing-line corrections and rerun edit loss. Set acceptance targets from the baseline measurement, not an arbitrary automation percentage.
