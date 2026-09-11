# Field technicians — integration handover

**Date:** 10 September 2026

**Decision:** [Approved r04 design](../decisions/field-technicians-design.md)

**Base:** `27782e1c6343461ba70a3cd9841c3ca720c6f30d` (main, merged PR #75)

**Branch:** `feature/service-field-technicians-r04`

Reconciled onto main `143d42bbcb62d0027a8eb52b71eb7eccdc565b12` (merged PR #89). The single status-note conflict retains both the Azure update and this design approval. PR #89 changes no application, package or database bytes relevant to this adapter.

## Delivered change

`/service/technicians` adds the accepted presentation to the existing Service navigation. It has Visits, Technicians and Needs preparation views; date/site selection, per-view filters, sorted visits, complete-response counts and the four-tab visit drawer. The component owns 24 px desktop / 16 px phone padding. The r04 source is frozen and checksummed; app styling reuses its scoped geometry and the shared Roboto font.

The app consumes the existing bounded schedule, appointment and work-order reads. It preserves current crew versions, scope identity/version and server-controlled permissions. Calendar/resource status is not availability or competency certification. Terminal visits do not raise stale preparation flags. Acknowledged packs do not bypass dispatch authority. The app uses My Jobs for persisted notes/evidence, and links to existing controlled records for changes.

No database, API, package manifest or dependency lockfile changes. No illustrative HTML fixtures are injected into the app. Existing service workflows and the global shell remain the authority. The older service-platform report branch is outside this change.

## Local verification

Pinned Node 24.20.0 and npm 11.19.0 were installed outside the checkout; `npm ci` used the existing lockfile. The environment’s default Node/npm failed the repository engine check before that correction; the pin was not relaxed.

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:unit`: 44 passed, including five new cases for retired assignments, dispatch/scope flags, terminal states, combined filters and DST-safe day windows.
- `npm run build`: passed; `/service/technicians` is included. The existing `src/reports/template.ts` dynamic filesystem tracing warning remains outside this change.
- `python3 scripts/check_foundation.py` and `python3 scripts/check_prototype.py`: passed. Naming check caught the project-instruction copy limit; the new guidance was reduced to its canonical decision link without relaxing the limit. Final `python3 scripts/check_naming.py`: passed (7,989 instruction characters).

Two new Playwright procedures are included in the existing desktop/mobile suite. They cover the approved view/drawer navigation, 24/16 px padding, independent filters, failure recovery, focus return, horizontal overflow and denied identity. They are **authored, not executed locally**. A browser URL policy prevented the earlier standalone browser preview; no alternate browser route was used for this integration. No rendered application screenshot, native-dialog browser acceptance, accessibility certification or real-device claim is made.

## Review and remaining checks

1. Run the existing application CI, including PostgreSQL/HTTP and the full desktop/mobile browser suite, on the published source. The new page changes no server grants, but integration regression remains a merge gate.
2. Review `/service/technicians` in the shared shell. The seeded fixture day is **21 September 2026**; the screen itself defaults to the actual current date. Verify long records, mobile cards, drawer focus and the 24/16 px outer margins.
3. Confirm controlled traversal into full visits, packs, exact-scope equipment and My Jobs under coordinator, assigned technician and denied identities. Counts cover permitted records for the selected window/site only. The existing site selector read returns up to 50 site choices; schedule limits and errors remain server-enforced.
4. Keep design approval separate from the application adapter’s browser acceptance and operational PP-01 acceptance. Merge and deployment are not asserted by this local handover.

Publication status: local review branch prepared; remote PR and CI results pending. The repository was verified public on this date; historical private-prototype wording elsewhere is not a visibility guarantee.
