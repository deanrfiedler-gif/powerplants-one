# Excel quotation continuation execution evidence

Owner: Dean Fiedler. Execution date: 14 October 2026. Independent review/business acceptance: open. Synthetic local implementation on `codex/excel-import-quotation-backend`, stacked on revised-workbook PR #484. [PR #485](https://github.com/deanrfiedler-gif/powerplants-one/pull/485), implementation commit `10d0d23`; this handover link is a documentation-only successor. [Decision](../../../decisions/excel-import-quotation-backend.md), [API/workflow](../../../contracts/excel-import-quotation.md), [plan](../../../delivery/excel-estimate-import-plan.md).

## Scope and provenance

PPO-010, EST-02–EST-05, EST-07/08, DOC-01/02; bounded XI-03/06/07/08. Existing native Draft service/template and decimal rules, immutable audit evidence, operation/outbox and stored output worker are reused. No migration, seed, grant, dependency or issued reference changes. Live PostgreSQL quotation/audit triggers were inspected before selecting this design.

## Execution ledger

| Proof | Result |
|---|---|
| Relevant units | 102 passed: Excel reader/review/re-import and estimating arithmetic/validation families. |
| PostgreSQL | 29 passed: 23 existing E1/taxonomy/E2 cases and six new continuation cases. Includes populated upgrades, unchanged legacy DTOs/receipts/outputs, exact source review, all four include/print combinations, duplicate races, stale choices/quote/source/selection, explicit retained/PPO-only choices, immutable review, late-outbox rollback, quote-only denial, revocation and render interruption recovery. |
| Compiled HTTP | Five passed: native E1 saved journey and Excel review, first save, re-import and quotation continuation. Authentication/origin, explicit confirmations, exact evidence, original receipt/replay, denied cross-company/internal reads and real output rendering are exercised. |
| Browser | Reviewed Chrome 155.0.8059.40; exact output checked at 1440, 390 and 320 CSS px, with no outer-page overflow, expected total and hidden/source exclusions. Screenshots at 1440 and 320 were inspected. This is output evidence, not import UI acceptance. |
| PDF | Bundled pypdf independently extracted text and metadata from the real two-page PDF. Local choice set totals AUD 57,867.63; hidden/source text absent, no embedded attachments. PDF SHA-256: `c33a77bca6f0a643fac8296139d3f1648b157064106556948eae61e33262df1d`. |
| Actual restart | Passed after stopping/restarting the compiled application and PostgreSQL. Changed postmaster time, unchanged original/revised workbooks, native versions, quotation/review/job, exact HTML/PDF, all receipts/audit/outbox rows and all three replays without new effects. |
| Application/documentation gates | Build (including TypeScript), lint, foundation (78 parents, 22 issued sources, 9,549 local links), naming (7,975 instruction characters), studio:check and diff checks passed. Register: 362 entries, 46 components, 208 routes; 334 unreviewed and 28 stale remain visible. |

The first new database run exposed an over-broad test regex matching CSS `margin`; it was corrected to test the sensitive `margin_percent` field. The focused rerun and final combined 29-case run passed. No renderer or database baseline failure was waived.

Reproduce the units with `node --import tsx --test tests/unit/excel*.test.ts tests/unit/estimating*.test.ts`. Against disposable `ppo_synthetic_test`, run `tests/database/estimating.test.ts` and `tests/database/excel-quotation.test.ts` sequentially with the existing database harness. Build and start the compiled loopback app, then run the four Excel HTTP files and the native estimating E1-HTTP01 case. `scripts/excel-import-restart.ts write` records both original/revised workbook histories plus the exact Draft, review, render job, receipts and output bytes; stop/restart the actual app and PostgreSQL, then run `verify`. The script asserts a changed PostgreSQL postmaster time and unchanged exact evidence, outputs and replay effects.

Local synthetic artifacts are under ignored `verification-evidence/excel-quotation/` and `verification-evidence/excel-import-restart/`. CI runs the new database/HTTP checks, extends the existing real restart proof, and uploads those output directories. No operational source files or credentials are included in this evidence package. Passing these checks does not grant a visual review fingerprint or establish operational readiness.

## Limits

No native Excel upload/review UI is delivered. The browser proof covers the existing Draft output at desktop/mobile widths, not the future import journey. At 320px, the unchanged native template wraps some amounts and quantity labels within their cells; this remains a visible presentation limitation and visual acceptance is open. E4 issue, commercial approval, sending, representative operational workbook compatibility, independent/owner acceptance and deployment remain outside this contribution. CI status is reported independently from local execution.
