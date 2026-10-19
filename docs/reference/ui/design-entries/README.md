# Design index entries

New design entries for the [HTML design index](../README.md) go here, one file per design, instead of into `../README.md`. Every design lock-in used to add a table row and a dated paragraph at the same place in that file, so each pull request conflicted with the others ([why](../../../decisions/merge-conflict-reduction.md#5-design-pull-requests-no-longer-share-generated-or-appended-files)).

## Add an entry

Create `YYYY-MM-DD-slug.md` (for example `2026-10-20-calendar.md`; the slug names your design, so no two pull requests write the same file) with this shape:

```markdown
# Site surveys and as-found briefs (CS-08)

| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Site surveys and as-found briefs — `/surveys` | [Design r01 captures](../customers/site-surveys-design-r01/README.md) (Figma, icon-free PNGs) | Owner-accepted design, 19 October 2026 | [Decision](../../../decisions/site-surveys-figma-design.md). CS-08; not built in this form. What the design shows. |

**Site surveys design, 19 October 2026:** What Dean accepted, what stays unconfirmed, where the decision and captures are. Listing it here does not repeat the dated inventory audit.
```

- The table row and the paragraph keep the wording rules in [How to maintain the index](../README.md#how-to-maintain-the-index): link real files, never invent an approval, keep design approval apart from code delivery.
- Links are relative to this folder (`../sales/...`, `../../../decisions/...`); `check_foundation.py` checks them.
- Entries on or before 19 October 2026 are in `../README.md` and stay there; correct them in place. `check_foundation.py` fails if `../README.md` gains table rows or dated paragraphs, so a new design cannot be slipped in there by hand.
- This folder's listing, newest last, is the index of designs added since 19 October 2026. No generated summary is committed, because a generated file is the thing that conflicts.
