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

## Remaining contract boundaries

Only Enquiry and Qualified currently exist. A drop uses the selected stage form because qualification evidence is mandatory. New stage/outcome/handover contracts, organisation/site/owner reassociation, the full facility taxonomy, multiple person phone/email channels, job-title/person-record-owner fields, arbitrary attachments, quote issue/acceptance and live integration remain separate work. Existing site/facility hierarchy and person affiliation roles are retained. The Pipedrive export informed field concepts without being imported.
