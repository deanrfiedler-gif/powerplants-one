---
title: Products module alignment batch applied in Figma after Dean's answers and pinned by a new named version
date: 2026-11-13
---

Dean adopted the six recommendations of the [independent review](../decisions/products-module-independent-review.md) (PPO-PRODUCTS-REVIEW-PROP) on 13 November 2026, after saving the named version "PPO - Products module (accepted)". The review session then applied the alignment batch to the private Figma file "PPO - Products module". The review's section 9 and section 14 of the [proposal record](../decisions/products-module-refined-ui-proposal.md#14-alignment-batch--13-november-2026) record it.

- **Shell rules.**
  - The Pricing record header's primary is "Bind a cost source…" on all twelve Pricing record sheets, and the duplicate toolbar button is gone.
  - The Unresolved relationship header's primary is "Record a successor…".
  - Review steppers read "n of N in view".
- **Library widths.**
  - Filters and Columns panels are 360 px, and the other ten panels, including the snapshot, are 480 px.
  - Each width is bound to a local copy of the Library's drawer variables. This supersedes A5 of the proposal record.
- **References and words.**
  - Cost sources read `SYN-SRC-0024` to `SYN-SRC-0029`, as Estimating and the code show them.
  - Quoted revisions are two-digit.
  - Chips read "Source reported" and "Validity unknown".
- **Finish.**
  - A 48 px phone button.
  - Catalogue and Import desktop sheets in code order.
  - Import counts at the KPI value size.
  - A stale section label renamed.
  - The Read me cards updated.

Dean then saved the batch as the named version "PPO - Products module (accepted) · alignment batch". It is now the build basis that every build step from the record's section 6 cites. Nothing was changed in the file after it, so the Read me's "Dean saves a new named version" sentence stays and is superseded by section 13 of the record.

Checked:
- A script pass on all seven scope pages after the batch found:
  - 122 labelled sheets;
  - no child outside a sheet, no overlap, nothing outside a section, and 360 px section gaps;
  - no leftover six-digit cost source, one-digit quoted revision, "SourceReported", "to review" stepper, Warning-tone "Unknown", 24 px text or 432 px panel.
- Four sheets were read at full size.
- Every node ID is unchanged.
- `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass.

Not done:
- the Shell's record header behaviour variants and its 480 px snapshot drawer;
- Library adoption and the Library's own items;
- the Estimating file's two-digit revisions;
- the page guides and the GST wording rule.

No application code, route, migration, permission or integration changed.
