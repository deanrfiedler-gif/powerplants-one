# PPO-012 — Projects discovery and first-increment boundary

**Date:** 7 September 2026 · **Revision:** r01 · **Owner:** Dean Fiedler · **Status:** User-authorised discovery; build proposal awaiting invocation.

Dean described Projects as an eventual replacement for his detailed **PPA - Project Delivery System - PROTOTYPE** workspace, beginning with basics. After the proposed next step of BP-06 discovery and first-increment design, he instructed “Ok. Proceed with the next bounded step.” This authorises the bounded source assessment, project list/detail designs, logical contract, acceptance plan and reviewable repository handover. It does not invoke J1 code or a source cutover.

The [BP-06 package](../blueprints/BP-06-projects-commercial-delivery.md) recommends bringing forward J1 register/milestones/owned follow-up after verified P10–P12 completion. This is proposed sequencing, not a new technical dependency or acceptance of every proposed stage/field. Full Projects stays in Wave C. P01–P12 remain unchanged; J1–J5 are local BP-06 labels only.

Reuse the delivered shared Organisation/Site/Activity/identity/receipt model and BP-02 architecture. Current main `1f13dd8d6f5006559152fe9d5410aed3fff64234` includes E1; current ActivityLink has no Project target, and P05's ProjectReference is not a typed Project. J1 must implement that target with real scope and relationships. No migration/ADR sequence slot or runtime grant is allocated by this design.

PPO-011 / BP-05 remains a dependency of broad project technical release and commissioning acceptance. J1 deliberately records manual coordination milestones only. Source native FS/SS dependencies, separate approval lifecycles, unknown states and source identifiers remain preserved design obligations; template policies and other-project governance are not automatically adopted.

D-010/D-014/D-026 and issue #12 remain open. The [handover](../delivery/projects-discovery-handover.md) records actual verification and publication. No operational or master AT acceptance follows from publishing a design.
