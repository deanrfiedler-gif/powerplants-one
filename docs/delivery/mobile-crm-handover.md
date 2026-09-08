# Mobile CRM implementation handover

**Revision:** r01 · **Date:** 8 September 2026 · **Owner:** Dean Fiedler · **Parent:** PPO-009 / issue #9.

Implementation is based on main `923bd9b90412c80782331b7085a6880750f12640` in the existing Next.js/PostgreSQL application. The [mapping decision](../decisions/mobile-crm-implementation.md) identifies components, data and permissions. The approved standalone walkthrough remains reference evidence; this increment changes the working application.

## Delivered behaviour

- Shared mobile header, five-destination bottom navigation, keyboard-contained More menu, tab panels, 44px controls, 16px inputs and text-labelled status styles. Desktop navigation and CRM Board/List remain available.
- Opportunity cards emphasise the primary customer contact. Internal owner remains in Details, List and filtering; Activity owner remains with the action.
- Organisation lookup uses bounded server search and explicit result selection. Changing its text clears selection and dependent site/contact context immediately. Loading, empty, error, revoked access and stale-version states remain distinct.
- Timeline opens the saved Activity. Completing it preserves its outcome and provides a return path for creating a separate follow-up. Date/time entry uses Brisbane time with an exact persisted instant. Existing command receipts, version checks and reconciliation remain in use.
- Details contains customer context and Requirements and scope; Commercial resolves the existing estimate and exact draft quotation versions through current permissions.
- Organisation Details shows a count summary and View sites. Sites contains the permitted sites and their facility/growing-area hierarchy. Estimating and Service use the common shell, form and status presentation.

## Verification record

The first implementation passed lint, TypeScript, 20 unit cases and production build. The repeated local static/unit/build check also passed after the first layout refinement; the final focus and shared-heading capture corrections are included in the next CI run. Local Chromium 143 rendered ten views at 320px, 390px and 1440px with fixture API responses; the captures were visually reviewed. That exercise validates presentation and lookup invalidation only, not backend persistence or permissions.

Three new PostgreSQL cases cover commercial/primary-contact projections, bounded scoped directory search and permitted site/facility counts. Three new browser procedures run in both phone and desktop projects: complete/reopen/follow-up persistence, Organisation Sites/navigation/keyboard checks, and lookup invalidation/unsaved-draft protection. Existing CRM conflict, receipt, permission and I2 responsive suites were adapted to the accessible controls and tabs. The application workflow runs the new focused database and browser cases before the existing full regression, including the repository's real database-restart proof.

Local PostgreSQL installation was unavailable under the execution environment's user/group restrictions. Database and HTTP/browser integration results must therefore come from disposable PostgreSQL in repository CI; no local fixture render is counted as this evidence. Foundation links to existing screenshot evidence cannot all be checked in the partial local checkout; full-checkout CI remains authoritative for that gate.

[PR #61](https://github.com/deanrfiedler-gif/powerplants-one/pull/61) contains the implementation. At commit `1a379ac2`, [Application run 34173507638](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34173507638) passed all three new PostgreSQL cases and 13/14 focused browser cases, including completion and persisted follow-up on phone and desktop. The remaining case identified mobile menu focus leaving the dialog; explicit keyboard wrapping was added. [E1 run 34173507755](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34173507755) reached the restart proof but its screenshot locator referenced the replaced estimate heading class; capture helpers now use the shared heading. Documentation assurance passed. These failed runs are retained; corrected-head regression remains in progress. No merge, deployment, live-data test, physical-phone test or business acceptance is claimed by this working record.

## Remaining implementation sequence

1. Finish the current CI and phone/desktop journey checks, review permission/error states, and correct any regressions before integration.
2. Implement the shared Facility type/common/conditional-field contract and its approved greenhouse, berry and mixed-nursery scenarios. Carry exact Organisation → Site → Facility/Equipment IDs into estimate and service scope; prevent cross-site assignments. Current counts show permitted linked records, not an invented active-only total.
3. Apply the components to the bounded Projects J1 runtime when its dependencies are implemented. Projects currently remains Planned; there is no project persistence or permissions surface to verify in this increment.
4. Extend module-specific estimating/service flows through their current contracts. Opportunity Files and richer scope attributes require their actual document/field contracts; commercial draft outputs are already linked through E1.
5. Review the verified journey on a physical phone before an operational pilot. Production identity, hosting, integrations and customer data retain their separate existing readiness requirements.

## Corrected-head results and publication continuation

At published commit `84f1df3c040a174c37ca8b9ab4e517697941fc93`, [Application run 34173922048](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34173922048) passed 3/3 mobile projection/database cases and 14/14 CRM journey/browser cases. The wider I2 suite passed 10/12; the two failures were the same desktop/phone test waiting for Organisation related Activities before opening the new Timeline tab. The local test now opens Timeline before asserting the actual response and canonical Activity link. The subsequent full application regression/restart stages were skipped and remain pending.

[Estimating E1 run 34173922045](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34173922045) passed 11 PostgreSQL cases, 2 HTTP cases, all 10 desktop/phone cases, and the three-application/two-database-restart proof at that published commit. Documentation run 34173922080 passed. Local final lint, typecheck, 20 unit cases and build passed after the header/style refinements. The final twelve-view fixture review also passed, including explicit menu keyboard wrapping and no horizontal page overflow at 320/390/1440px; it remains UI-only evidence in Chromium 143.

Automatic approval review rejected publishing the final patch to the same private repository, stating that the current user-authored transcript must explicitly authorise the destination and code publication. Repository identity/permissions and prior user-authored mobile implementation authority were checked; the latter was retrieved through Personal Context. Review still rejected the retry. No alternate publishing route, merge or deployment was attempted. Dean subsequently confirmed publication of the named final-refinements patch to `deanrfiedler-gif/powerplants-one` and the update and verification of PR #61. This confirms the intended repository work, but automatic approval review subsequently rejected both the combined 31-file upload and the exact original nine-file patch. The stated reason remained missing explicit current authorisation for the payload and destination. No repository write succeeded in this continuation; PR #61 remains at `84f1df3c`. No alternate publishing route or merge was attempted.

Before publication, P11 merged into main at `b3597f79413f87b9b2f1ce75a66a2addefbb0e34`. The branch integrates that exact main, retaining its session clearing, recovery, scoped reads, original-output and workflow checks. Two overlapping UI hunks were resolved to keep both the mobile Organisation Timeline and keyed related Activities, and both the mobile header and active Service planner navigation on appointment details. Lookup inputs also expose the existing P11 validation target attribute. Repository CI must run again on the combined final patch before integration.


The reconciled local source passed lint, TypeScript, all 20 unit tests and production build. Naming assurance passed with 86 document records and PP-01 assurance retained all 78 parent dispositions. A repeated twelve-view fixture browser review passed at 320/390/1440px with no document overflow or browser errors; refreshed board, Organisation and Estimating captures were inspected. This is UI-only evidence and does not replace disposable-database CI. The reviewable `ppo-mobile-crm-main-ready.patch` applies to main `b3597f79`; it includes the mobile changes while preserving the merged P11 baseline. Publication, combined backend/browser regression, normal merge and actual-main verification remain blocked/pending.

## Explicit publication and final verification

Dean explicitly authorised uploading `ppo-mobile-crm-main-ready.patch` to `deanrfiedler-gif/powerplants-one`, updating PR #61, completing verification and merging when checks pass. Publication succeeded at `ffa1728825e91beefcab9177487a21110b5b6f5d`, tree `f74b806be292f9987815ae45c869da56fe2b1567`, preserving both prior mobile history and P11 main. The earlier publication blocks above are historical. Integration review also aligned the retained P11 recovery keyboard test with the phone All modules menu; its recovery/original/permission assertions remain unchanged.

The [PR #61 publication record](https://github.com/deanrfiedler-gif/powerplants-one/pull/61) is authoritative for subsequent exact-head CI outcomes, normal merge and actual merged-main checks. These run results are recorded externally to avoid changing the tested source merely to append its own final commit ID. No fixture capture counts as PostgreSQL persistence or permission evidence. Physical-phone review and operational acceptance remain separate.
