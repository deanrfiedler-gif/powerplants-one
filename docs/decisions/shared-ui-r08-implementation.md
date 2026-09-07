# Accepted r08 shared layout and CRM implementation

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **Parent:** PPO-009 / #9, CRM-01/02/03/04/08 and shared PP-01 presentation.

Dean accepted `ppo-ui-design-review.html` r08 and explicitly requested implementation of its shared layout and CRM. He then requested continuing directly to the next step. This authorises the presentation implementation, verification and normal repository publication; existing application authority and operational boundaries remain.

## Accepted presentation

- Compact 84 px desktop navy navigation (72 px at narrower desktop widths), intact existing logo and 24 px white icons. Hover and selected backgrounds use `#343c4c`; the selected item has a green left accent. Service routes are grouped and remain accessible through module navigation.
- A module-specific header with concise synthetic-data identification. Existing server-backed identity switching opens on demand throughout business screens; changing identity still clears displayed records and unsaved forms and locks offline originals as before.
- Compact CRM search, stage filter, Board/List selection and navy creation action. Search/filter/sort/page context and independent presentation scroll positions remain within the mounted worklist.
- Stage columns fit the available desktop width. One vertical board scroll moves every column beneath an opaque fixed header row. Matching grey surfaces, white separators, directional header edges and the rounded final header follow r08.
- Equal-height cards retain the actual title, customer/site, opportunity owner, reference, Open outcome and designated Activity. Activity footers use server-classified overdue, due-needed, next-action-needed, upcoming and unavailable states. Names have hover/focus descriptions. Two-line title/activity previews link to canonical full records.

## Application mapping

The accepted reference demonstrates six fictional commercial stages. The current persisted contract remains Enquiry → Qualified with Open outcome. This implementation renders the server's actual two-stage definition and page counts. It does not add commercial amounts, closing dates, stage movement, owner transfer, automatic rotting assessments or a second scheduler. Activity links open the existing authorised Activity record; planning continues in the canonical opportunity form with its existing version/receipt checks.

This is an explicit mapping of the accepted visual language to the implemented domain, not an acceptance of I3 commercial semantics. No migration, seed, grant, domain service, receipt, dependency pin, issued source or output template is changed. P11 #54/#57, E1, Projects and portal work remain separately owned.

## Verification and supersession

The [implementation handover](../delivery/shared-ui-redesign-handover.md) records actual results and publication. This decision supersedes older presentation directions about a green primary action, wide navigation and horizontally scrolling minimum-width stage columns. It does not revise their original business contracts or historical evidence. Full AT-25 and operational transition remain open.
