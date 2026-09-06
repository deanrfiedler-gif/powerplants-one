# PPO shared UI and CRM design handover

**Revision:** r01 · **Date:** 6 September 2026 · **Owner:** Dean Fiedler, private prototype · **Parent:** PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9) · **Status:** Repository design handover; implementation and acceptance remain separate.

## Result and authority

Dean authorised publication of the brand-derived shared specification, supplied logo and synthetic Board/Grid mockups, with maintained CRM and I2 guidance. The [UI specification r02](../standards/ui-style-specification.md), [C01–C07 specification r02](../blueprints/crm-screen-specification.md), [preview/captures](../blueprints/crm-ui-mockups/README.md), [I2 UI guidance](crm-i2-ui-guidance.md) and [decision note](../decisions/ui-brand-and-crm-layout.md) form the handover. The issued r01 conversation documents/captures retain their original bytes; the working specification adds repository links and scope guidance.

Baseline main was `ddc1a3cce769e011939e621d8d5f176542f48f8c` (PR #38), tree `d6d374ec30c620276e402d6a15f5adbc4d25bf02`. Work uses the dedicated `docs/ppo-ui-crm-design-handover` branch. I1 issue #39 / draft PR #40 and P09 issue #36 / draft PR #37 were active; neither branch is edited here. I1 keeps its existing scope and owns preparation of the full I2 starter. The [UI addendum](crm-i2-ui-guidance.md) is ready for it to consume.

## Source and export treatment

The original brand PDF governs exact colour, typography and logo evidence; its Markdown transcription is secondary. The logo and reattachment matched exactly. The [manifest](../blueprints/crm-ui-mockups/manifest.json) records supplied-PDF, logo and original capture hashes. Only the approved logo and synthetic design outputs enter Git. No operational Pipedrive record, original screenshot or full company PDF is committed.

The standalone HTML carries the same fictional fixture and UI as the conversation preview. Export removes the host frame, embeds only the used Lucide 1.17.0 geometries and includes font/icon notices. It uses no API, network, local/session storage or service worker; temporary creation resets on reload. It is a design document, not a new application route or hosted site.

## Verification and publication evidence

The original conversation preview passed 30 browser assertions plus a focused 390/320 px filter-reflow check using Chrome for Testing headless shell 151.0.7922.34. Full desktop Board/Grid, representative tablet/phone views and all four original specification PDF pages were visually inspected. Those original captures are preserved, not relabelled as application screenshots.

The repository export has its own repeatable `node docs/blueprints/crm-ui-design-check.mjs` check in the existing CRM design workflow. It checks the actual exported file for view/filter equivalence, known/unknown values, search/empty/detail/dialog behaviour, temporary creation/reload, keyboard focus, desktop/phone reflow, logo integrity and no network/storage. Its evidence records the source head, executed checkout/tree, input hash, captures and actual result. Existing `crm-design-check.mjs` screen/state checks remain intact.

Local export verification passed on 6 September 2026 with Chrome 151.0.7922.34 at 1800, 1024, 736, 390 and 320 px. The exported desktop Board, desktop Grid and phone Board captures were visually inspected; text, icons, complete logo and contained scrolling rendered correctly. The standalone conversion was verified independently of the original preview captures. The local authoring copy has no Git checkout/tree identity; final publication checks below use the complete CI checkout.

The publication PR records actual final results for foundation, prototype, naming, CRM design and the existing application assurance workflow. Those full repository checks run on GitHub's complete checkout; the local authoring copy contains only this handover's files and is not presented as a full application validation environment. Check runs are attached to the exact PR head/merge test tree. Merge uses the checked expected head; the PR's merged commit and current-main verification complete the publication record. No independent human review is claimed.

## Limits and next step

This changes documentation/design assets only. It does not implement CRM persistence, permissions, stage transitions, relationships, financial basis, ERP linkage or live migration. It adds no migration, grants, application dependency or deployment. All 78 parent IDs and existing acceptance statuses remain unchanged; issue #9 and AT-25 remain open/planned.

Complete and verify the active I1 work, then incorporate this visual direction into the maintained I2 starter against actual merged main. Implement the separately authorised Board/Grid slice with real server and browser evidence. Resolve operational mapping and commercial-basis questions before claiming those capabilities; the design preview is not business acceptance.
