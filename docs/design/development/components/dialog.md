# Modal dialogs

SC-01–SC-10 reuse WorklistPanel for native record, observation and allocation forms, including focused receipt/pick/POD capture. Existing catalogue fixtures and shared rendering are unchanged. The host retains dirty proposals on refused saves, confirms deliberate close, restores focus, and preserves unknown operations separately. Verify long labels and modal containment at 320 px in `tests/browser/supply.spec.ts`; executed evidence is recorded in the Supply Chain handover, separately from owner acceptance.

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `dialog` · **Review:** Pending

Actual WorklistPanel with editable content, confirmation, Escape and focus return.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Partial · **Location:** Components › Job pack, in the private "PPO - Design" Figma file

- Job pack / Decision dialog `302:5359`

The only drawn dialog is the page-scoped Job pack decision dialog; no shared modal component. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Opening creates a modal focus boundary. Confirm is local to the example; close and Escape return to the opener.

## Mobile

Inspect the dialog at phone width with long content and browser zoom; keep Close and Done reachable.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use arrows/Home/End in tabs or menus; Escape dismisses overlays.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.

## Differences and limits

Other module dialogs are still independent implementations; this does not declare one universal dialog contract adopted.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Page-scoped Job Pack variant

The [Job Pack dialog](job-pack-dialog.md) is separately inventoried with its actual pack consumers and state fixtures. I4 adds explicit Tab containment, including Shift+Tab from the focused heading. It retains r03 styling and does not change WorklistPanel or claim one universal dialog contract.

## SV-06 host binding

Service review and reports uses this existing component in `route:/service/reports`. The accepted source is PPO - Design, Service review and reports — accepted, page 1265:53; native owner visual review remains pending. Host states and synthetic fixtures are in `tests/browser/service-reports-design.spec.ts` and `tests/helpers/service-report-fixture.ts`; existing isolated examples are unchanged. See the [SV-06 contract](../pages/scope-sv-06.md) for alignment limits and [build evidence](../../../testing/evidence/service-review-build/README.md) for executed results.
