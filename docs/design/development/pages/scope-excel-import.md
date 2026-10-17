# Excel estimate import and review — design reference

Stable entry: `scope:excel-import`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/import`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement the existing upload → validate/review → save estimate → quotation design. Workbook and HTML prototypes exist; application integration remains outstanding. This is an additional design brief, not a new adopted scope ID.

1. Upload or stage the intended workbook in the planned flow
2. Review validation, mapping and every rejected line
3. Save only the reviewed estimate basis and retain import provenance

## Desktop

Accepted design: the [Excel import design decision](../../../decisions/excel-import-figma-design.md) of 15 October 2026, with captures 01 to 09 and 13 in [Excel import design r01](../../../reference/ui/estimating/excel-import-figma-r01/README.md). It reuses the accepted [Estimation Wizard](../../../decisions/es02-wizard-figma-design.md) shell and parts.

- **Launch:** "Import Excel estimate" is a secondary action in the Wizard's Review Actions when discovery is Complete and no estimate exists. Re-import, pricing and the Draft quotation start from the imported estimate. No rail item; the breadcrumb is "Estimation wizard / Excel import" (shell top bar amendment, 16 October 2026).
- **Layout at 1440:** the Estimating rail with Estimation wizard selected, the Wizard context header, four step cards (Workbook, Review, Confirm & save, Saved), a scrolling main column of 772 px content, a 380 px Import summary panel and a sticky action bar with Previous and the primary action.
- **Review:** a banner, three tiles (Validation, Reconciliation, Scope or Sources), findings by effect (Prevents saving, Confirm before saving, Informational) naming the sheet, table and row, then the line grid with filter chips, section totals and control totals compared to the cent. Unknown totals show Unknown.
- **Confirm and save:** four confirmation rows (Source calculation, Scope, Reconciliation, Source warnings), a reason, and a list of what will and will not be saved.
- **Saved:** the receipt, next steps (price from reviewed sources, prepare a Draft quotation, import a revised workbook) and the import evidence.
- **Compare, pricing and Draft:** the same shell. Comparison counts Added, Changed, Unchanged, Not in workbook and PPO-only lines, requires Keep or Remove for every omitted line and lists reviewed prices that the workbook replaces. Pricing shows source revisions, FX and landed allocation to the cent. The Draft reconciles totals, requires choices for kept lines and previews customer-safe content.

At 1024 × 768 the rail collapses and the summary is hidden behind the Summary button. Record the actual dimensions and any approved adaptation here after paired design/application review.

## Mobile

Accepted design: captures 10 to 12 in [Excel import design r01](../../../reference/ui/estimating/excel-import-figma-r01/README.md).

- **Review at 390 × 844:** the compact Wizard header, a status line, the step navigation, totals, reconciliation, findings groups and "Show all lines", with Summary and Continue to confirm at the bottom.
- **Saved:** the receipt card and the next steps as full-width buttons, with Open estimate at the bottom.
- **Blocked at 320 px:** the errors and warnings with their row locators, totals with Cost Unknown, and Upload corrected file.

At 320 CSS px and 200% zoom, keep the same task and record context. Inputs use readable 16 px text and touch controls use the shared minimum target. Side-by-side comparison of many lines is a larger-screen task.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Excel import design r01 captures](../../../reference/ui/estimating/excel-import-figma-r01/README.md) (icon-free PNGs; not application captures)
- [excel-estimate-import.html](../../../blueprints/excel-estimate-import.html)

## Behaviour, handovers and verification

The draft User Guide `guide.excel.import` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
