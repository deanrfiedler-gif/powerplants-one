# Engineering r02 — first implementation handover

10 September 2026. The [acceptance decision](../decisions/engineering-r02-integration.md) records Dean's approval of r02 and instruction to begin implementation. Source starts from merged main `e1ffbf28696f30be29d230351ab3be7f366862a2`. The unchanged accepted HTML and audit are recorded in the source manifest. Follow-up remains under [PPO-011](https://github.com/deanrfiedler-gif/powerplants-one/issues/11).

## Implemented in this branch

- Engineering navigation, permission-aware quick add and global search in the existing shell. The accepted register, responsive cards, column resizing and four-section drawer are integrated as React components.
- Requests linked to one existing, visible Project or Opportunity; immutable source context, design brief and discipline; currently eligible assigned engineer; separate optional package deadline and next-action date.
- Queued, In design and Awaiting information coordination states. Awaiting information requires a missing-input description. Changes require a reason and the current version.
- Attributable review notes and immutable change history. A note or coordination status cannot approve engineering effort, certify a design or release a document.
- Search, discipline and attention filters, My work, server pagination and sorting within the visible page. The initial engineer filter offers All engineers and Assigned to me; a full named-engineer filter is a follow-up refinement.
- Original-operation receipts, optimistic concurrency and transactional evidence. An uncertain save retains its original command and disables leaving/editing until retried. Request and note drafts remain in memory while navigating the module. Closing a dirty coordination form requires an explicit discard decision; stale edits cannot overwrite newer records.

`GET /api/v1/engineering` provides the scoped register. `/options` resolves authorised source records and eligible engineers. `POST /engineering` creates a request. `GET /engineering/{id}` returns detail and the latest 100 events. `POST /engineering/{id}/coordination` and `/notes` append versioned changes. The existing `/operations/{operation_id}` endpoint checks current Engineering and source permissions before returning a receipt.

## Data and access

Additive migration 0020 introduces `engineering_packages`, `engineering_events`, engineering.read/create/edit capabilities and the ENG display-reference type. No applied migration is rewritten. The seed grants only the matching existing synthetic coordinator scopes; it inserts no business packages. Source-context visibility and current owner eligibility are checked on commands and original replay. Lists and selectors exclude inaccessible contexts. Existing hosted-demo setup/upgrade code gains explicit Engineering grants and new-table privilege verification; no live upgrade is executed by this repository change.

Use the existing Node 24.20.0, npm 11.19.0, Next.js/React and PostgreSQL 16.15 stack. No application dependency is added. Only column widths enter browser persistent storage; business data and pending commands remain server-side/in memory. Synthetic data remains mandatory in this prototype.

## Deliberately subsequent work

The accepted Reviews/Released views and Deliverables/Technical queries sections currently show explanatory empty states. There is no simulated SharePoint connection or seeded review/issue authority. Subsequent increments cover controlled drawing/model metadata and links, SharePoint file identity/version handling, supported CAD previews, technical queries, reviewer assignment, exact review snapshots, approval and formal issue/transmittal workflows. Verify the actual SharePoint/SOLIDWORKS/PDM arrangements before choosing integration behaviour. Native CAD retains authoring and SharePoint retains document ownership.

Missing package/action dates stay visible; they do not imply a deadline. The assigned engineer owns the next action in this increment. Broader effort approval, service-specific context, independent action ownership, archived packages, older-history pagination and named-engineer filtering remain open. BP-05, ENG-01–ENG-07, D-008/D-019 and AT-15/AT-37 are not fully delivered by this first slice.

## Verification and review

The original implementation passed all 64 unit tests, TypeScript, ESLint, the Next.js application build, and the foundation/prototype/naming checks. After incorporating main PR #106, fresh TypeScript, lint on the reconciled scripts/tests, all 66 unit tests (including both Azure CLI startup paths), and foundation/prototype/naming checks pass. A fresh full build and native database/browser checks remain assigned to final-source CI. These use the pinned Node 24.20.0 binary and the unchanged locked application dependencies; npm installation/CI reproducibility is left to pinned npm 11.19.0 in CI. The build retains the existing reports/template.ts dynamic-filesystem tracing warning. PostgreSQL is not available in this workspace, so the following database and actual-HTTP browser cases are authored but have not run locally. Five database cases cover scoped access and revocation, project/presales intake, original replay, persistence after closing connections, safe migration/seed reruns, concurrent version conflicts and immutable evidence. Two actual-HTTP browser journeys run in desktop and phone configurations and cover creation, uncertain note retry, reload persistence, stale updates, discarded-edit confirmation, rejected origins and cross-company reads.

The dedicated Engineering workflow uses disposable PostgreSQL 16.15, pinned tools and Chromium. Existing full application and Azure demo preparation workflows retain their wider regression and upgrade coverage. Native database/browser CI must pass on the final review source before merge; local static/unit/build checks do not substitute for it. No production data, external customer messages, SharePoint/CAD connections, main merge or Azure deployment are performed by this change.

## Publication and main reconciliation

Implementation was committed at `7cd93bd` on `feature/engineering-r02-integration`. Automatic approval review initially rejected public publication. Dean subsequently explicitly authorised publishing this implementation branch and opening a draft PR in his public `deanrfiedler-gif/powerplants-one` repository. This resolves that hold.

Main advanced to `7cdf07f56b29cc009a49a987d5fc0593361bfc8f` through PR #106's Azure operator import-cycle repair. The review branch incorporates that main commit, retaining both status entries and the new `demo-runtime.ts` imports alongside the Engineering capability additions. Engineering runtime, migration, seed and test files remain unchanged from `7cd93bd`. The draft PR records publication and exact-source native CI results. No main merge or Azure rollout is included in this authorisation.
