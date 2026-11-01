# Excel import UI evidence

Owner: Dean Fiedler. Builder: Codex. Date: 31 October 2026. [PR 800](https://github.com/deanrfiedler-gif/powerplants-one/pull/800), branch `codex/excel-import-ui`, based on main `1402c87b9069def4dcd4d82f291cd991cff40ca5`. Synthetic data only.

## Separate delivery statuses

- Functional proof: the three native/browser tests passed before the final comparison-total and focus refinements; final rerun recorded below when complete. The existing 26 focused unit checks and the targeted workspace persistence check pass.
- Visual review: builder comparison against retained accepted frames; final application capture inspection in progress. This is not visual acceptance.
- Owner acceptance: open, including parent EST-02 to EST-05, EST-07, EST-08, DOC-01 and DOC-02.
- Deployment: not performed or verified. Independent Claude review and complete CI are separate merge gates.

## Functional proof and XI trace

The browser fixture creates synthetic workbook bytes using the existing native workbook helpers. It drives the real loopback APIs and isolated PostgreSQL, including native reviewed sources and FX. Only the explicitly identified refused/failed/stale presentation checks intercept API responses. Original workbook downloads are checked byte for byte before and after re-import.

| Trace | Executed UI evidence | Remaining open acceptance |
|---|---|---|
| XI-01 Supported workbook | Native 12-line, seven-section workbook; exact destination; ready review, four confirmations, first durable save and retained original bytes. | Departmental workbook assessment, operational compatibility and owner acceptance. |
| XI-02 Reconciliation | A missing cost blocks saving with Unknown; corrected upload proceeds. Native source pricing compares before/after and keeps sell unchanged. Draft shows all five native reconciliation amounts. | Full malformed-cell, precision, control-total and offset-error matrix was not rerun as UI proof. |
| XI-03 Scope and access | Missing target refusal, observer/read-only refusal, native stale commit from a second tab; context 403 and preview 409 presentation checks. Expected versions and exact selected Complete discovery remain native authority. | Full cross-company/site/option, revocation, direct receipt and permission matrix was not rerun. |
| XI-04 Atomicity/replay | Real first-save transaction commits, its response is deliberately dropped, then original operation lookup recovers the accepted version. Stale competing save returns native 409. | All store/audit/receipt injection combinations, before-commit timeout and simultaneous retry matrix remain open here. |
| XI-05 Revisions | Revised workbook requires explicit Keep, replacement confirmation and a successor save. Earlier retained original bytes remain identical. Existing comparison/projection tests pass. | Full manual-line/multiple-option/reorder history matrix and original-output comparison remain open here. |
| XI-06 Customer safety | Kept line without workbook proposal needs explicit include and print choices. Native Draft preview excludes the reviewed source reference; exact Draft save opens its record. Native FX/landed pricing preserves sell. | PDF/metadata/output rendering and all include/print combinations were not executed by this UI suite; customer/owner acceptance remains open. |
| XI-07 Capacity/files | Damaged ZIP is rejected; all 12 populated rows remain accessible; source download bytes match. | Full 0/1/100/101/500-line, ZIP/security/Unicode/date-system/memory matrix not rerun. Same-tab storage may refuse a file below the parser's 5 MiB limit. |
| XI-08 Durability/UX | Correction, native save progress, lost-response recovery, mobile line access and four-width overflow checks. Final rerun adds Summary Escape/focus return and decision-inclusive total versus saved result. | Actual app/DB/storage restart durability, physical devices, full keyboard/screen-reader and 200% zoom acceptance remain open. |

All XI-01 to XI-08 retain open acceptance. A test named for that range is a trace, not a claim to execute every scenario in the parent acceptance register.

## Visual comparison and differences

Accepted references: [Excel import r01](../../../reference/ui/estimating/excel-import-figma-r01/README.md), named version “Excel import, Products and Inventory — accepted”. Source captures remain unchanged. Application captures use the local fallback icon drawings; the browser capture helper refuses a Font Awesome Kit script. No Pro artwork is committed.

The implementation preserves the Wizard shell, selected rail destination, context, four stages, findings by effect, summary and bottom actions. Differences are explicit:

1. The current main shell supplies its current rail, icons, search and spacing. Full requested breadcrumb text is retained semantically, while the shared shell truncates visible labels at constrained widths. No Excel rail item was added.
2. Synthetic fixture names, dates, receipt/actor UUIDs, 12 lines and warnings differ from the composed 48-line reference. The UI shows exact server data; it does not invent display identities, upload times or workbook metadata. Evidence timestamps remain ISO format.
3. Shared labelled native file selection replaces drag-and-drop artwork. The drawn template-download action is outstanding because no secure native template-download workflow is supplied by the existing APIs.
4. Stage captions use Current step/Complete; phone uses a compact step label rather than the drawn step chooser. Native 44 px buttons and readable fields can be taller than the reference's compact controls. Summary uses the existing Wizard dialog and hides the desktop sidebar at 1024 px.
5. Findings show each native message and locator. Zero-count error sections are omitted. Full row review is a filterable scrolling table with lazy original-cell disclosures; it is the recorded recommendation for undrawn detail, not an accepted composition.
6. Confirmation includes the native reason field and exact hashes. Pending saves retain the original operation with explicit Check original outcome / Retry exact original controls. Success displays the native version and receipt.
7. Revised-workbook omissions appear before incoming line disclosures so required Keep/Remove decisions are reachable. Changed fields use current/previous versus incoming values. Proposed all-line totals use the unchanged native projection and decimal arithmetic; workbook included sell is labelled separately. This is more explicit than a workbook-only total.
8. Pricing stages 1 and 2 use existing labelled source selectors, dates and optional charge controls. Stage 3 shows native rate evidence and per-line allocation tables. Native FX authoring/review controls remain out of scope. These undrawn controls follow the [recorded Codex recommendation](../../../decisions/excel-import-figma-design.md#implementation-recommendations--31-october-2026), not design acceptance.
9. Draft choices are explicit per-line cards. The customer article uses only native customer-safe content; no invented PDF preview or output action is supplied. Five reconciliation figures distinguish estimate sell, workbook included sell, reviewed workbook sell, retained-line sell and Draft total.
10. Import evidence uses labelled retained fields and lazy exact disclosures. The evidence section and estimate-record actions follow the recorded recommendation. Same-tab journal capacity is a functional limitation, not a claim of offline support.

## Validation record

Dedicated loopback runtime: PPO_PORT 3217; isolated PostgreSQL 16 on 55447; database `ppo_synthetic_test`. No shared or hosted data was used. Real `npm ci` passed with Node 24.22.2/npm 11.19.0, no engine override and no node_modules junction. It reported eleven moderate dependency audit findings; this PR changes no dependency.

- TypeScript with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`: passed after native projection extraction.
- Focused node suite: 26 passed (Excel comparison, contextual navigation, shell breadcrumbs, module workspaces, department navigation and all four Font Awesome catalogue checks).
- Targeted database E2 persistence case: one passed, including the Implemented import availability marker and immutable selected scope/operation race proof.
- Lint, studio, foundation, naming and status checks: final results pending below.
- New browser suite: initial complete run three passed; final rerun pending.
- Existing `tests/browser/estimating-wizard.spec.ts`: rerun pending. An earlier beforeAll fixture failed on PostgreSQL's ten-second statement timeout while reading timezone names. The same fixture from unmodified main succeeded against the isolated database, so the failure was not reproduced on main and is not labelled unrelated.

Earlier development runs exposed a missing test Origin header, ambiguous locators, slow cold compilation and full-page continuation navigation. Those were corrected; internal continuations now use Next Link. One rerun command used Playwright's variadic `--project` option incorrectly and discovered no tests; the corrected command is used below. No claim of passing the entire repository database/HTTP/browser suite, full CI, PDF rendering, operational workbook compatibility or restart durability is made.
