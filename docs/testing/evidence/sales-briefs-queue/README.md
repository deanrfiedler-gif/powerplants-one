# Sales briefs queue — implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. PR [#702](https://github.com/deanrfiedler-gif/powerplants-one/pull/702). Functional proof and visual inspection are recorded below; owner acceptance, independent exact-head review, merge and deployment remain separate.

## Scope and provenance

CR-02 receiving queue at `/estimating/intake`, navigation ID `intake`, label Sales briefs. [Page contract](../../../design/development/pages/route-estimating-intake.md). The 25 October work is retained in preservation commit `25590474e87b10d872742b20105601ff28e26b05`; current main was merged before continuation. No migration, capability, seed, grant, dependency, live adapter or Discovery creation is added.

The accepted Figma version and nodes were inspected during the original work. Current implementation comparison uses the [retained five icon-free design captures](../../../reference/ui/estimating/sales-briefs-design-r01/README.md) and adopted shell/phone amendments. No private file link/key or Font Awesome Pro artwork is retained. Application captures use repository fallback SVGs and synthetic fixtures, with the Kit unset.

## Functional proof

Validation is in progress. Final commands/results and any omitted checks will replace this paragraph before publication. Native receiving commands and LC-13 remain independently tested; browser fixture evidence does not substitute for database/HTTP proof.

## Visual inspection

Capture comparison and the final image manifest will be recorded after the last UI corrections. Inspection does not grant visual acceptance.

## Bounded design adaptations

- The current shared top bar and compact phone header replace the historical capture's breadcrumb and duplicate phone toolbar under their adopted amendments.
- The register adds explicit as-at/completeness and paging. Counts use the whole matching permitted population; partial totals say “at least”.
- At 1024 px the shared menu becomes an overlay and the table scrolls horizontally. No accepted 1024 px drawing exists.
- At 320 px the state/date line wraps, increasing phone row height; search/filter combine and record previous/next move into More. No accepted 320 px drawing exists.
- Phone multi-selection uses press-and-hold plus an explicit Select briefs control and labelled checkboxes. The selected panel stacks in a shared dialog.
- Evidence, outcome/assumptions/unknowns, full native history, source-change recovery and historical-revision handovers retain more information than the single illustrated snapshot. These states have no complete accepted drawings.
- Returned and Accepted remain all-time views. Other permitted receivers' briefs remain visible; terminal source movement is shown in the snapshot, not the open Source changed view. The unresolved rail badge is absent.
- Application fallback SVGs differ from the icon-free capture placeholders. No licensed artwork is committed.
