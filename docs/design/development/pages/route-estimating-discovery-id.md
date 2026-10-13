# Estimation Wizard discovery workspace — design reference

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/discovery/[id]`. Scope: **ES-02**. Owner: Dean Fiedler. **Status: Figma implementation; application visual review pending.** Application: `/estimating/discovery/{id}`. r20 page type: record workspace.

The [13 October implementation decision](../../../decisions/es02-wizard-figma-implementation.md) adopts the [accepted Figma design](../../../decisions/es02-wizard-figma-design.md) in the native page. The [22 immutable captures and hashes](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md) remain the exact appearance source. Earlier [board implementation](../../../decisions/es02-wizard-ui-build.md) and [r03 functional study](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) remain historical context; they do not override the accepted Figma composition.

## Purpose and handovers

One opportunity, one site and one selected alternative. Requirements, Configuration, Scope & delivery, Pricing and Review share a working copy. A save creates an immutable revision with a reason and current confirmations. Discovery review checks completeness; approval belongs to ES-04.

Incoming: CR-02/LC-13 accepted Sales context and permitted Facility/equipment references; CS-08 survey remains a declared future input. Outgoing: immutable discovery revision and Draft quotation. Manual estimating receives a saved Complete basis only by explicit adoption. ES-05/ES-06/ES-07 retain issue, response and receiving authority.

## Desktop

At 1440 × 1000 the shared labelled rail is 240 px, main column 820 px and summary 380 px; user collapse leaves a 76 px rail. At 1920 the main expands to 1300 px. The shared header remains 64 px; current shell utilities and permission-filtered destinations are retained. No second Estimating menu appears in this record page.

The title is 20 px bold with a synthetic marker, customer/site, owner and saved/working-copy status. Tabs and viewed alternative share a row. Five equal 48 px step controls show findings-derived status. Main gutters are 24 px; system tables extend to the column edges with local horizontal overflow. The bottom actions remain visible; the summary scrolls independently and closes on Alternatives/Revisions.

Requirements shows larger family cards and Add controls. Configuration shows six compact filter tiles: empty grey, pending white with amber words/dot, confirmed pastel green only after current evaluation. Infrastructure is a separate counted-once strip. Add system chooses family then category; existing r01 scopes expose an explicit classification review and are never silently relabelled. The selected-system editor retains actual fact/source/follow-up controls.

## Mobile

At 1024 px the rail is 76 px and the summary is a labelled bar/sheet. At 390/320 px use the phone record header, save-state row, equal tabs, viewed alternative, 44 px step navigation and horizontal family strip. Systems are list rows that open a full-page editor over the same draft. Back/Done restores the originating row's focus. A 72 px Summary/Save footer remains visible; this route hides the global shell header and bottom navigation. Tables in other views retain labelled local overflow. Phone Alternatives/Revisions images remain missing and their existing responsive forms are explicit adaptations.

## Components, states and accessibility

Reuse Shell v2, RecordTabs, Field/SelectField, FontAwesomeGlyph, validation, native dialog, command recovery, AreasEditor, SystemsEditor, evidence panel and scope preferences. Existing ES-02 scoped buttons remain a documented legacy control exception; no global token or control definition changes. The [component host](../components/estimation-journey.md) binds real fixtures and consumers.

Status has words as well as colour. Change links focus their fields. Native dialogs retain Escape and opener return; phone Back retains edits. Show loading, invalid/not checked, stale, denied, archived/read-only, unknown outcome, save review and saved-result states distinctly. Unknown original saves must be reconciled before new commands; refreshing a saved revision is not acknowledgement. Keep existing ES02-T27/T28/T54/T58 recovery guarantees.

## Verification and open work

See [execution evidence](../../../testing/evidence/es02-figma/README.md). Desktop source geometry and real save/cost invariants have separate assertions; source hashes never grant visual acceptance. Do not populate the review fingerprint without paired review. Real devices, assistive technology and owner acceptance remain open.

Q6 timing is visibly proposed with no invented persistence or commitment. Q7 reuses existing typed facts. The saved cost basis stays separate from current readiness and new discovery. Scope and route keys, all parent IDs and issued reference bytes remain unchanged. The Draft guide is `guide.page.estimating.discovery.id`; editing it does not publish operational guidance.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.
