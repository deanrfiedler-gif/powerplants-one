# Appointment cards and readiness

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `appointment` · **Review:** Pending

Real confirmed/proposed appointment cards, scope-review warning and move action.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#records). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Keep site timezone, scope revision, dispatch hold and customer commitment distinct.

## Mobile

Times and readiness copy wrap; Move or reassign remains available as a non-drag control when permitted.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Proposed:** Inspect the proposed variant and its explanatory messages.
- **Review required:** Inspect the review required variant and its explanatory messages.
- **Read only:** Management actions unavailable in this example.

## Differences and limits

Dispatch remains held in this current component; catalogue fixtures do not represent a dispatch-ready visit.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Scheduling Step 4

The `policy-hold` catalogue fixture keeps the original appointment and reservation visible and names a published scheduling hold. It does not simulate resolution authority. The host prepares the proposed interval using exact policy/published-head evidence; the server rechecks every save. Controlled moves retain the historic pin. New holds and stale resolutions remain distinct from customer contact, preparation and pack acknowledgement.

Review policy preparation and impact reason/owner/publication at desktop and 390/320 px. Shared Button, fields, ReadState and ErrorNotice retain their contracts; legacy planner buttons remain an existing exception. There is no issued Step 4 mockup. Owner visual/device acceptance is pending. See `docs/testing/evidence/scheduling-policy-enforcement/README.md` for actual functional evidence; no review fingerprint is granted.


## Closed-visit consumer bindings

The FI-01/FI-02/FI-05 and My Jobs hosts reuse these controls for truthful personal history; Service work-order/appointment hosts provide the existing receiving path. Reproducible host states: `tests/helpers/service-journey.ts` (closed original without own attendance and completed separate return), `tests/browser/field-closed-visit.spec.ts` (validation, stale refusal, interrupted response/reload and original continuation), and `tests/database/field-closed-visit.test.ts` (scoped/unavailable navigation and delayed cached originals). These are persisted host examples, not an isolated gallery acceptance.

Inspect readable identifiers/history, one content scroll, 1440/1024/390/320 widths, keyboard links/focus recovery and actual 200% zoom. Pending read removes current receiving actions; saved history survives. No accepted native mockup exists for this addition; timer r05 bytes remain unchanged. Review/fingerprints remain unassigned. See `docs/decisions/field-closed-visit-guidance.md` and the corresponding execution ledger.
