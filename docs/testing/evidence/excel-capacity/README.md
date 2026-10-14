# Excel larger-workbook capacity — execution evidence

Owner: Dean Fiedler. Source: [PR #486](https://github.com/deanrfiedler-gif/powerplants-one/pull/486), implementation `e6177bd` on `codex/excel-import-capacity`, originally based on PR #485 `b2d3949`, with its subsequent `79720ce` Search-test repair integrated by ancestry. User-authorised Step 6 capacity; PPO-010 / BC-04 / XI-03/04/06/07/08. Code delivery, CI, independent review, owner acceptance and deployment remain separate.

## Selected envelope and measurements

The [decision](../../../decisions/excel-import-capacity.md) selects 500 complete lines and a 1 MiB UTF-8 costing request for the internal Excel receiver. Existing manual/CPQ limits and all parser resource limits remain. No new dependency, seed or grant. Migration 0097 requires accepted Excel evidence for estimates above 100 lines and replaces repeated full-import checks on line insert with exact local membership checks; the header retains the complete graph validation.

[Baseline samples](baseline.json) show the previous 100-line refusal. [Candidate samples](candidate.json) contain three runs each at 100, 250, 500 and 501 rows. Initial 500-line parsing plus review was 134–161 ms for a 485,327-byte synthetic workbook. The calculated native envelope was 148,655 bytes including the conservative reason reserve; review evidence was 934,685 JSON bytes. RSS values are sequential process observations, not isolated peak-memory measurements. These local samples and the database observations are not a production latency or concurrency commitment.

## Executed local proof

- 118 Estimating, CPQ, Excel and migration-registry unit cases pass. Coverage includes 250/500 exact independent totals, 501-row refusal, Unicode overflow, exact 1 MiB acceptance and one-byte-over refusal, and unchanged native manual/quotation bounds.
- 23 distinct database/upgrade scenarios pass across the regression suite and final targeted reruns: original first-save/re-import/quotation cases; 500-line concurrent first save, unchanged stable identities, explicit overflow, 499 Keep decisions, exact quotation totals and original receipt recovery; direct SQL refusal without accepted Excel evidence; rollback on a fault at line 500; populated 0096 history; populated E2 upgrade across 0026; reserved Products 0052 installation after 0097; and the Windows-encoded hosted-demo upgrade with original ledgers preserved.
- Nine compiled HTTP cases pass: existing E1/DR01/E2 routes and Excel preview, first save, re-import, quotation and capacity. The new case verifies 500 complete lines, no mutation for 501 rows and the 128 KiB quotation request boundary.
- Build, typecheck, full lint plus final changed-script lint, foundation, naming and studio checks pass. Foundation retains all 78 parents and 22 issued sources; naming reports 7,989 project-instruction characters. Studio retains 362 entries, 47 components and 208 routes, with 334 unreviewed and 28 stale entries; those are not accepted by this backend work.

[Actual restart proof](restart.json) passes after stopping and starting both the compiled application and PostgreSQL. The original 500-line workbook, revised 500-line workbook, exact comparison/decisions, native versions, 500-item Draft, stored HTML/PDF and all original receipts remain byte-for-byte or row-for-row unchanged. Accepted retries create no new rows.

[Large-output browser checks](capacity-browser.json) pass in Chrome 155.0.8059.40 at 1440, 390 and 320 px, with all 500 descriptions, the exact total and no document-width overflow. The 320 px capture was inspected: the unchanged template wraps the Quantity heading; no template/CSS revision or visual acceptance is claimed. [Independent PDF text/metadata extraction](capacity-pdf.json) confirms all 500 distinct line labels, total 1250.00, 24 pages, no attachments and no tested internal evidence fields. The PDF is 969,956 bytes, SHA-256 `50ffea4bc7faaefbe8a705a7f112923643bad808006c0f67cd1e0521c3b63959`.

Reproduce with `scripts/excel-capacity-profile.ts`, the named unit/database/HTTP suites, and `scripts/excel-import-restart.ts write capacity` / `verify` across real restarts. The workflow now runs the capacity path and retains its evidence. Full workbook/output/viewport artifacts remain in ignored `verification-evidence/excel-import-restart/`; compact results above are committed. [Database timings](database.json) record a separate completed local run, including the 499-line retained projection.

## Parent integration

The updated PR #485 parent adds only its status handover and a Search browser test that waits for the original response. Both status entries and the exact incoming test are preserved. No capacity application code, migration, fixture or executed proof source changed during this integration. Post-integration typecheck, changed-test lint, foundation and whitespace checks pass; the full capacity results above apply to the unchanged implementation. Combined CI remains separate.

## Corrections and limits

Initial capacity tests exposed the unchanged `latestMigrationVersion` value; it was advanced together with the registered migration and reviewed demo gate. The legacy parser refusal fixture was moved from 101 to 501 rows while retaining positive 100-line coverage. A new direct-SQL guard fixture initially hit the pre-existing predecessor and unique scope-revision checks; supplying a fresh scope revision and exact predecessor lets it exercise the intended Excel guard, and its final rerun passes. No existing timeout or substantive assertion was relaxed.

The larger receiver is internal to the Excel commands. Native manual/CPQ authoring, commercial issue/approval, richer sources, operational workbooks, independent/device acceptance and deployment are not established by these tests. History remains bounded at 100 accepted workbooks, but a maximum-size 100-version history and operational multi-user load were not benchmarked. Original template bytes and issued reference files are unchanged.
