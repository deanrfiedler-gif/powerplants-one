# Sales board and record cards

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `sales-board` · **Review:** Pending

Stage columns, owner avatars, next activity, card actions, collapse and stage movement.

## Source and reference

Design: [ppo-deal-pipeline_r38.html](../../../reference/ui/deals/ppo-deal-pipeline_r38.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Figma components

**Status:** Mapped · **Location:** Deals · CR-04 549:2 › Page components (proposal), in the private "PPO - Design" Figma file

- Deals/Card `551:947`

Board card on the accepted Deals · CR-04 page (24 October 2026). The Default variant is used; the Rotting variant is a labelled proposal that no frame uses, because the app has no rotting rule. The card stays on the Deals page; moving it to Components `1:4` is separate work. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Amounts are AUD excluding GST; unknown estimates remain explicit. Change stage is the keyboard and touch alternative to drag.

## Mobile

Use the actual mobile stage layout; long titles and activity descriptions wrap without obscuring actions. The catalogue supplies an explicit selected stage and a shared selection menu so every stage remains browsable in a narrow frame.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Loading:** Read in progress; no success is inferred.
- **Read only:** Management actions unavailable in this example.
- **Compact:** Current compact-density variant.

## Differences and limits

Board styling remains a CRM variant. Compact targets and narrow-screen behaviour need owner/device review.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Deal return context

Title links open the canonical Deal Workspace with the current local Deals URL as return context. Only the Deals route is accepted as a return destination. Existing snapshot, resize, move and date-edit controls retain their authority. Catalogue fixture links remain intercepted. CR-04 insights use the identical returned page without widening its query or weighting amounts.

## Figma component reference — 13 October 2026

The user-specified r37 design is now an editable Deals proposal (`549:2`) in the "PPO - Design" Figma file, separately from the runtime r38 reference. `Deals/Card` (`551:947`) supplies Default and Rotting variants with text properties; `Deals/List row` (`551:948`) and `Deals/Phone list row` (`555:7166`) carry source fixtures. `Deals/List header` (`588:6771`) and the desktop row now reuse the shared PPO Grid cells from accepted Leads. Fields, checkbox options and 30 source SVG icon components support the composed views. Fills, strokes, spacing and radii reuse PPO tokens or scoped source-specific Deals tokens. Existing shared shell and Button definitions were reused without changing their masters.

The 18 board/list/phone fixtures preserve the source names, stage counts, values, primary contacts where shown and next activities; rot, missing-action, overdue and unknown-value examples remain visible. New Figma components are references for `route:/sales/opportunities`, not new runtime exports or catalogue renderers. Existing consumer bindings and runnable state fixtures remain unchanged.

The 14 October user screenshot governs the stage/card polish: matching outgoing/incoming 8px edges, 78px headers, thin source glyphs, expected-close flags, activity-type icons, overlapping avatars and task badges. The follow-up gap/border refinement uses the shared 8px spacing token for gutters and card insets, 264px whole-pixel columns and 248 x 264px card masters/instances. Cards retain 7px corners and uniform 1px inside #dce0e5 borders. A 1932px stack prevents the longest stage from clipping its last card. The 8px gutter is a proposed departure from the issued 9px spacing. The surrounding workspace has no separate rounded module container. The list uses 40px rows, 14px text, shared grid borders/checkboxes/tags/actions, and a horizontal overflow area for its separate contact and due columns. These local component changes propagate to four board compositions; runtime fixture and consumer bindings remain unchanged.

[Evidence](../../../testing/evidence/deals-figma/README.md) records updated desktop visual inspection at 1440 x 960 on 14 October and the prior 390 x 844 phone inspection on 13 October. Owner/device acceptance, full HTML interaction coverage, 320px/tablet views and runtime alignment remain open.

## Figma design accepted — 24 October 2026

Dean accepted the finished Deals page, now "Deals · CR-04" (`549:2`), on 24 October 2026 ([decision](../../../decisions/deals-figma-design.md#acceptance--24-october-2026), [captures r02](../../../reference/ui/crm/deals-design-r02/README.md)). The board was reconciled with the code, so the Deals/Card master and its 72 instances changed:

- the six shortcuts are Snapshot, Activities, Documents, Next activity, Change stage and Edit deal, as in `crm-worklist-board.tsx`; Change stage replaces the email shortcut, and each shortcut is 22 px wide;
- task-count badges are hidden, because the app has no internal tasks on cards;
- the health line shows the app's next-action label (Next activity planned, No next activity, Overdue activity) in words and colour; the r37 signals (rotting, single-threaded, quotation expired, close date passed) and "Waiting on …" are gone;
- icons are the Font Awesome Light icons the accepted pages use (expected close flag-checkered, calendar, list-check, paperclip, eye, pen, table-columns); the legacy `Deals/Icon/*` masters are unchanged;
- instances are 212 px wide in 228 px stages so all five stages fit beside the labelled Sales rail at 1440; the master stays 248 px.

The Rotting variant is kept only as a labelled proposal. The runtime board has not been built to this design; compare it with the r02 captures when it is.
