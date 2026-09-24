# Field readiness over CS-06

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation decision for the authorised synthetic FI programme, 24 September 2026. Owner visual and operational acceptance remain separate.

The execution preflight fetched main `0f10b7fb46a8ab512e9b019573ece272cf5920b9` (tree `a5b0624f19205909e67b83b437bc1edb79510f3a`). PR #314 was the only open PR and concerns ES-02 documentation. The original planning checkout is untouched; `feat/fi05-field-site-readiness` owns this increment in its dedicated worktree.

Live PostgreSQL inspection confirms CS-06 already owns revisioned requirements, reviewed evidence, preparations and acknowledgement events. Reuse those tables and the existing TypeScript/PostgreSQL transaction, receipt and audit services. A second readiness master or migration would duplicate their semantics. No technology, dependency, capability or grant is added.

The generic CS acknowledgement requires `shared.edit` and is not bound to an appointment. Add a narrow field command requiring `field.capture.own`, current assignment and permitted CS source reads. It retains a CS Preparation snapshot plus Acknowledged event with a `FieldReadinessReview` discriminator, exact appointment/assignment/schedule/scope/pack binding, actor, selected activity and explicitly selected facilities. This acknowledges reading the source and its unresolved conditions, without editing requirements or certifying evidence. Normal CS editing/review duties remain unchanged.

Fact: current Resources bind a User, but have no canonical Person link. Do not guess a Person from a display name or allow an arbitrary visitor to stand in for the signed-in technician. Individual induction therefore remains unverified for this actor, with an explicit blocker wherever it applies. A later authoritative User/Person mapping is an open dependency, not an inferred successful induction.

Decision: selected facilities/activity are the technician's explicit preparation context, not a change to authorised scope. Show this distinction and preserve the selection. Site-wide requirements apply only when the CS source explicitly records null Facility scope; never inherit a parent Facility's requirements. Appointment times come from Scheduling. Source/configuration changes invalidate the presented binding; old acknowledgements remain immutable. Unavailable sources and missing criteria/evidence remain unknown.

The first increment is online. FI-02 will extend the existing owner-bound original-operation protocol after the server contracts are verified. An online save is not an offline durability claim. Receipt lookup rechecks the original appointment assignment and CS read permission. A retry with changed meaning conflicts; an unknown result retains the original operation.

Traceability: FI-05 / CS-06, SVC-03/06/10, NFR-01/07/09, ADR-0042 and the Quality/Site Assurance proposed r01 reference. Acknowledgement grants no entry, induction, isolation, work, dispatch, report or Finance authority.
