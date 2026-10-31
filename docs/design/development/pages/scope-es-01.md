# Estimating intake and workload — design reference

Stable entry: `scope:ES-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.

## Purpose and current contract

ES-01 is the native permitted intake/workload front door. Its r20 type is register/worklist. Find the Opportunity brief, review independently owned Discovery readiness and continue with an exact option or saved cost revision. Intake acceptance, allocation/return commands and priority policy remain Not configured. Required response remains Unknown.

The [route contract](route-estimating.md) is the current desktop, tablet, phone, keyboard, bounded-count, selection/export and recovery specification. It implements the [accepted Intake & workload design](../../../decisions/intake-workload-design.md), including retained [captures 01–07](../../../reference/ui/estimating/intake-workload-design-r01/README.md) and later accepted amendments. All workload and My estimating work use separately bounded search-matched opportunity windows; My uses the estimating workspace owner. Readiness counts apply before the readiness filter in the selected owner window. The coverage is not a global workload total.

## Desktop

Follow the [route desktop contract](route-estimating.md#desktop): secondary menu, full-width register, overlapping snapshot and 360 px selection panel. Keep both owners, exact option/revision handovers and bounded counts visible.

## Mobile

Follow the [route mobile contract](route-estimating.md#mobile): compact shell view/filter header, 80 px list rows, full-screen snapshot, 320 px actions menu and keyboard/focus restoration.

## Source and decision history

The [24–25 September design board record](../../../decisions/es01-design-board.md) preserves the original P1–P9/O1–O2 decisions and B1–B5 findings. The 11 October accepted design replaces its persistent panel, drawer, section tabs, segments and full-detail phone cards. Native rules for canonical source identity, independent ownership, readiness, exact costs and current authority remain in force.

Historical implementation evidence remains unchanged: [first native increment](../../../testing/evidence/estimating-native-workload/README.md) and [September adoption](../../../testing/evidence/estimating-workload-design-adoption/README.md). The [current implementation evidence](../../../testing/evidence/intake-workload-accepted/README.md) records this build separately. The related [ES-02 wizard HTML](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) is a downstream reference, not the workload layout baseline.

## Incoming and outgoing handovers

Incoming: canonical Opportunity UUID, company, version, need, customer and site; current workspace owner, selected option, immutable Discovery revision and permitted saved estimates. Both Sales and estimating owners remain visible. A Sales next action and post-Won handover-due obligation are separate from an estimating response date or receiving acceptance.

Outgoing: Open Sales opportunity retains the source identity. Open discovery retains workspace and selected option; alternatives retain their exact option IDs. Saved-estimate links open exact version IDs and identify the Discovery revision costed; a later Discovery save never silently reprices them. Saved estimates remains a separate register at `/estimating?tab=estimates`, including browser restoration.

## Accepted Sales brief link (LC-13)

Follow the current [LC-13 contract](../../../contracts/lead-to-delivery-continuity.md), not the earlier create-then-link-only description. The workload reads explicit submitted/accepted brief state, receiver, immutable acceptance selection and source drift without issuing any command. Starting Discovery alone does not accept a brief or pre-confirm its reported scope.

For a new workspace, the native creation review rechecks editing authority, the assigned receiver, current accepted source and linking basis. Where selected and eligible, the adopted native command can atomically create and bind that exact accepted brief. Existing workspaces retain the separate reviewed link command, expected versions, reason and original-operation recovery. A changed accepted source prevents Start here; the owning flow resolves it. Denied source/target identities must not be retained as current.

Reuse the existing Sales link forms, command journal and native Discovery workflow. No receiving, linking, migration, grant or capability contract is changed by the register composition.

## Components, guides and review

The [consumer binding](../component-bindings/2026-10-31-intake-workload.md) records reused shell, register, menu, dialog, form, button and feedback controls with host states. The draft `guide.es.01` and `guide.page.estimating` describe the current route and remain subject to owner review.

See the [programme handover](../../../delivery/estimating-programme-handover.md) for native proof and remaining policy limits. Source presence, functional verification, application visual comparison, owner/device acceptance and deployment are separate. No test pass changes the review status.
