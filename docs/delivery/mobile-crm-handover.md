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

The first implementation passed lint, TypeScript, 20 unit cases and production build. The completed change is being checked again after browser layout refinements. Local Chromium 143 rendered ten views at 320px, 390px and 1440px with fixture API responses; the captures were visually reviewed. That exercise validates presentation and lookup invalidation only, not backend persistence or permissions.

Three new PostgreSQL cases cover commercial/primary-contact projections, bounded scoped directory search and permitted site/facility counts. Three new browser procedures run in both phone and desktop projects: complete/reopen/follow-up persistence, Organisation Sites/navigation/keyboard checks, and lookup invalidation/unsaved-draft protection. Existing CRM conflict, receipt, permission and I2 responsive suites were adapted to the accessible controls and tabs. The application workflow runs the new focused database and browser cases before the existing full regression, including the repository's real database-restart proof.

Local PostgreSQL installation was unavailable under the execution environment's user/group restrictions. Database and HTTP/browser integration results must therefore come from disposable PostgreSQL in repository CI; no local fixture render is counted as this evidence. Foundation links to existing screenshot evidence cannot all be checked in the partial local checkout; full-checkout CI remains authoritative for that gate.

Publication and final CI results will be linked here once available. No merge, deployment, live-data test, physical-phone test or business acceptance is claimed by this working record.

## Remaining implementation sequence

1. Finish the current CI and phone/desktop journey checks, review permission/error states, and correct any regressions before integration.
2. Implement the shared Facility type/common/conditional-field contract and its approved greenhouse, berry and mixed-nursery scenarios. Carry exact Organisation → Site → Facility/Equipment IDs into estimate and service scope; prevent cross-site assignments. Current counts show permitted linked records, not an invented active-only total.
3. Apply the components to the bounded Projects J1 runtime when its dependencies are implemented. Projects currently remains Planned; there is no project persistence or permissions surface to verify in this increment.
4. Extend module-specific estimating/service flows through their current contracts. Opportunity Files and richer scope attributes require their actual document/field contracts; commercial draft outputs are already linked through E1.
5. Review the verified journey on a physical phone before an operational pilot. Production identity, hosting, integrations and customer data retain their separate existing readiness requirements.
