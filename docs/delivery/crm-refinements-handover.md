# CRM refinements implementation handover

**Revision:** r01 · **Date:** 9 September 2026 · **Owner:** Dean Fiedler · **Parent:** PPO-009 / issue #9.

## Source and decision

Implementation starts from merged main `fab85c568f8b72dfe19c7ef1dd6195ba1f340d14` (PR #61), on `feature/crm-desktop-mobile-refinements`. The [decision](../decisions/crm-desktop-mobile-refinements.md) records Dean's implementation authorisation and the exact mapping of desktop r11/mobile r07 to current application contracts.

No original design file with embedded operational screenshots, Pipedrive export, credentials or production data is included. Repository visibility reported by GitHub is public; historical documentation describing a private prototype is not an access-control guarantee.

## Change map

- `crm-worklist` / `crm-deal-controls`: two card hit areas, snapshot, keyboard alternative, desktop stage drag, version-bound undo, core and scope editors.
- `crm-screens`, `opportunity-commercial`, `crm-refinements.css`: full deal, four tabs, responsive layout, actual commercial document links.
- `crm-directory`, `context-screens`: desktop tables, compact mobile contacts, scoped queries and persisted personal views.
- `crm/refinements`, `crm/refinement-validation`, migration 0017: strict versioned commands, dedicated event snapshots, atomic receipts/outbox and database guards.
- Focused unit/database/browser cases and `crm-refinements.yml`, alongside the unchanged retained application assurance workflow.

## Current verification

Local `npm run check` passed: lint, TypeScript, all 33 unit cases (including four new refinement groups) and the Next.js build. The existing reports-template dynamic filesystem tracing warning remains. An initial dependency-directory symlink build failure was resolved by copying locked dependencies into the checkout. Foundation, prototype and naming documentation checks also passed. Local PostgreSQL is unavailable and package installation failed on environment identity permissions; database and actual browser evidence must come from the existing pinned CI runner, not a simulated backend.

The implementation was committed locally after automatic approval review initially rejected publication to the public repository. Dean then explicitly authorised publishing this implementation to `deanrfiedler-gif/powerplants-one` and opening the pull request on 9 September 2026. This resolves the publication authorisation block. Final-source database/browser CI and merged-main integration remain separate pending verification.

Local review also corrected full-width card activation, mobile record link labels, selected-stage prefill, stale-form preservation on failed background reads and removal of retained stage feedback after denied access. Existing screen-state probes now observe the actual directory endpoint and approved Organisation heading; all prior deadlines and denial assertions remain.

A branch or green component test alone is not merged-main publication or complete business acceptance.

## PR #69 saved-view and retained assurance correction

The first published head `b3f9ad5790c839a4153fe6bc2e042bfbbd2413cb` failed the two directory browser cases in [CRM refinements run 34300208951](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34300208951), job 102305313920. Both stopped at the exact `Saved view` label lookup; both deal journeys and all four database cases passed. The logged information/scope/NaN rejections belong to the passing negative database test.

Saved views are implemented, not deferred. The select was nested inside its label, so Playwright 1.63.0's label-text matcher also collected its descendant option text. `Saved view` therefore did not match exactly, even with only the default option. Asynchronous option loading alone does not explain this defect; `selectOption` already waits for the requested option after resolving its control. The artifact ZIP remains attached to the original run; local materialisation returned HTTP 403, so this diagnosis uses the exact source and job log, not a claim to have inspected its screenshots or trace.

Directory selects now use separate visible labels and unique React IDs. The browser case retains the exact locator and 120-second deadline, checks its accessible name, saves non-default filters/page size/columns, observes the real GET after reload, verifies the stored preset and applies it to the UI. No persistence assertion is removed.

The same original head also exposed an E1 upgrade assertion comparing pre-migration whole rows against a schema with new fields: [run 34300208908](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34300208908), job 102305313893, E1-DB10. The assertion now includes only the exact added opportunity defaults and null historical event snapshot, retaining full equality for all existing fields, original events, receipts, activity links, outbox rows and migration hashes. P11 job 102305314313 also showed duplicate permission alerts from simultaneous directory/preferences denials; the locked directory now presents one denial and continues to hide its business content and controls. The retained identity test is unchanged.

Local lint, TypeScript, 33 unit cases and build passed during this correction. Fresh corrected-head CI remains required; other retained I2/restart/full-suite failures on the original head remain under review. No merge or complete application acceptance is claimed.

Follow-up head `b68bb8eedaade0ddecff8bb826299be14ff65377`, [run 34301846559](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34301846559), passed all four database cases and three of four browser journeys, including mobile directory persistence. Both projects found the corrected label. Desktop failed the new response-body assertion because its observer could capture a save-time preferences GET from the outgoing document. The observer now admits only requests started after the reload commits to the main frame and removes its listeners afterwards; preset-content, exact label, restored presentation and original deadlines remain. E1's corrected database and HTTP components also passed on this head; full assurance is still separate.

## Remaining contract boundaries

Only Enquiry and Qualified currently exist. A drop uses the selected stage form because qualification evidence is mandatory. New stage/outcome/handover contracts, organisation/site/owner reassociation, the full facility taxonomy, multiple person phone/email channels, job-title/person-record-owner fields, arbitrary attachments, quote issue/acceptance and live integration remain separate work. Existing site/facility hierarchy and person affiliation roles are retained. The Pipedrive export informed field concepts without being imported.
