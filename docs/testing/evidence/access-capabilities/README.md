# AD-01 capability catalogue evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: local verification recorded; PR CI and independent review remain separate. Owner visual, device and operational acceptance separate.

## Scope and source

This continuation of [native access inspection](../../../decisions/access-review-native.md) adds the capability catalogue, filtered grant holders and explicit person-explanation context. Base: `7ef617f949c82a69e758058f9dac51507712ef17` on PR #410. Branch: `codex/ad01-capability-catalogue`. The first increment remains a separate prerequisite PR; this record covers the incremental catalogue work.

The catalogue is exhaustive against the 132-key server Capability union. It does not adopt role bundles, teams, access-changing commands, campaign cadence or D-020 operational policy. There is no migration, seed, capability/grant change, hosted provisioning or deployment.

## Verification record

Final application source: `f3349fdf34141b7215850c043b1936e5171aab72`. Database implementation proof: `fa89c3e`; subsequent runtime changes name the routes in the breadcrumb and correct singular-result copy. Tests extend `tests/database/access-inspection.test.ts` and `tests/browser/access-inspection.spec.ts`, which run in the existing application assurance suites.

| Check | Result |
|---|---|
| `npm run build` (including whole-project TypeScript) | Pass |
| Native browser/HTTP checks on compiled application | 15 pass across desktop, 390 px and 320 px; [raw result](browser.txt) |
| Navigation unit checks | 20 pass |
| Focused retained-r17 shell comparison | 1 pass; the prerequisite PR #410 menu-count correction is integrated |
| ESLint over the access module, page/API routes and database/browser tests | Pass |
| AD-01 database suite, disposable `ppo_synthetic_test` | 16 checks pass; [raw result](database.txt) |
| Naming, foundation and prototype checks | Pass; documentation assurance only |
| `npm run studio:check` | 354 entries / 200 source routes, no integrity errors; 326 unreviewed, 28 stale and 41 component reviews pending |

New database cases prove catalogue completeness and zero grants, hosted-only labelling, literal search/domain validation, denied and expired reviewer authority, working-company refusal, same-name company/site distinctions, cross-workspace exclusion, current versus expired/future/inactive grants, two-page completeness, hosted masking and unchanged users/grants/audit/sessions/working-company rows after reads. These assertions supplement the existing populated 0077→0078/reseed and person-explanation checks.

The first local database attempt failed in the new pagination fixture because one SQL parameter was inferred as both UUID and text. Explicit casts correct the fixture. Its test was also ordered after the existing hosted-identity fixture setup. A subsequent bulk fixture-user cleanup hit the ordinary 10-second statement limit through the full schema's foreign keys; bounded per-user cleanup replaced it. One individual cleanup also timed out while a production build ran. The unchanged final suite passes when run after the build (37.3 seconds). No timeout was increased and no runtime defect is attributed to those cleanup failures. The initial build found an overly narrow inferred state type in the editable capability input; an explicit string state preserves free entry and the final build passes. No passing result is inferred from failed attempts.

PostgreSQL initially could not bind the former local port; the task-owned disposable instance uses another loopback port. Environment files remain outside the repository. Failed fixture/build logs are retained alongside the final database result; no production database or account is used.

## Design boundary

The retained AD-01 capabilities view combines the catalogue with proposed roles/teams and an inspector. Native catalogue/detail routes use existing cards and controls, and show only real grants. This is a proposed adaptation; accepted native mockup images are missing. Source presence, automated functional proof, paired visual observation, owner/device/zoom/screen-reader acceptance and deployment remain separate. No review fingerprint is assigned by implementation.

The first browser run passed 12 of 15 scenarios; all three catalogue journeys expected a visible heading, whereas the shared register header delegates the visible title to the breadcrumb. Inspection also found that the new route inherited the parent label. Explicit catalogue/holder/person route metadata fixes the visible task and browser title, and the test now checks the breadcrumb. The original failed run is retained in `initial-browser-label-failure.txt`; the final browser result is recorded separately.


The second browser run also passed 12 of 15: its breadcrumb locator matched both the visible breadcrumb and the hidden hierarchy item. The corrected test selects the labelled visible list; the 15-scenario run passes without changing runtime behaviour or deadlines. `browser-selector-failure.txt` retains that failed run. The final copy-only adjustment avoids “1 capabilities”; the compiled build, native browser suite and captures were refreshed afterward.

## Visual comparison and handover

[Capture manifest](captures.json) binds twelve unedited PNGs to the source, Chrome version, UTC time, viewport and SHA-256. The working HTML hash is included. Native catalogue images show `shared.read` filtered; reference images show the unfiltered capabilities view, so they compare layout rather than fixture counts. Native holder images show Site-filtered grants; context images show the preselected Person access form before submitting a check.

| Width | Native catalogue | Native holders | Person context | Retained design |
|---|---|---|---|---|
| 1440 px | [Catalogue](native-1440-catalogue.png) | [Holders](native-1440-holders.png) | [Context](native-1440-context.png) | [Reference](reference-1440-catalogue.png) |
| 390 px | [Catalogue](native-390-catalogue.png) | [Holders](native-390-holders.png) | [Context](native-390-context.png) | [Reference](reference-390-catalogue.png) |
| 320 px | [Catalogue](native-320-catalogue.png) | [Holders](native-320-holders.png) | [Context](native-320-context.png) | [Reference](reference-320-catalogue.png) |

Observed: native pages use the live shell/breadcrumb, stacked search fields and grant cards instead of the retained combined table and inspector. Long company/site text wraps; same-name company keys remain visible; the phone header abbreviates the task and the hierarchy retains its full name. Native navigation remains separate from proposed role/team tabs. No horizontal document overflow was measured at any captured width. Cards, explanation fields and reference tables continue below the first phone viewport; physical keyboard occlusion, 200% zoom, touch and screen-reader acceptance are not established here. These are implementer observations, not an owner verdict or baseline adoption.

The follow-on PR is based on the read-only inspection branch from #410, including its tested menu assertion correction. Parent review/merge, full CI and this catalogue's independent review remain separate. Roles, teams, change requests, approvals and campaigns are still open AD-01 work.
