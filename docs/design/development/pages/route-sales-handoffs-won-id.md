# Won-deal receiving handover record — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/sales/handoffs/won/[id]`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-03. Route: `/sales/handoffs/won/[id]`.

## Native Sales implementation contract

Prepare and receive a precise delivery handover while preserving the immutable Won handover-due obligation.

- Won worklist: source deal and current receiving state.
- Brief: selected delivery items, exact evidence, destination basis and release prerequisites.
- Review: source fingerprint and independent return/accept decision.
- History: immutable Won obligation, submitted revisions and successor evidence.

Start with a Won opportunity. Preparation requires current deal ownership and edit access. A designated Projects or Service receiver needs its existing command capability and source visibility. Parts receiving has no implemented contract.

Customer acceptance, CRM Won, conversion, receiving, work release, scheduling, delivery and Finance are separate. ES-05/06/07 outcomes remain unavailable on the audited main. No routing thresholds are inferred.

Receiving creates no Project, Service work order, sales order, stock movement, booking or ERP/Finance transaction.

## Desktop

 retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

## Mobile

 stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-sales-handoffs-won-id` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.


## Native Won receiving (LC-16)

Keep this existing scope and page type. Incoming handover: exact accepted Won Sales event; outgoing: independently created native Project or Service work order and a separately reviewed typed binding. The Deal reads native receiving state and the retained Activity separately. It does not infer delivery completion from acceptance, a link or an Authorised work order.

Reuse shared Button, Field, SelectField, ErrorNotice, recoverable command journal, existing native lookup controls and record guard. Preserve the native Project Gantt and Service scope/readiness layouts. Proposed addition: a scoped Sales-context panel, explicit fixed-version comparison and create-and-return actions. Existing native form buttons remain documented legacy controls; no new theme or navigation system is introduced.

Desktop and phone: wrap reported scope and references; show original Sales revision beside current native state, owner and version. Keep Review, link reason, discard and original-recovery actions visible in normal document flow. A refresh must not silently substitute a reviewed comparison. Denied comparison reads remove its protected content. Unknown Sales site requires an explicit native site choice and does not rewrite the accepted source. New Service intake and work-order creation save independently before link review; existing native scope and authorisation controls remain.

Exact new-state mockup/HTML images are missing. Retained module references above are baseline context. Implementation captures and synthetic checks are recorded in `docs/testing/evidence/won-delivery-continuity/README.md`; they do not grant paired visual, keyboard/200% zoom, physical-device or owner acceptance. Review fingerprints remain unchanged.
