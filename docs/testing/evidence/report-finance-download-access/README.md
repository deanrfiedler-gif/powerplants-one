# Service and Finance download evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed: 10 October 2026 (Australia/Brisbane). [Scope and decision](../../../decisions/report-finance-download-access.md). These are local synthetic server observations; independent review, owner/device acceptance, integration and deployment remain separate.

## Source and result

Application baseline: main `184b933836b9790b4ffb6565552475a1af1eec24`. The test-only checkpoint is `2c28107785a665b33a68b6270cc6ac158ddfc843`; application source is identical to main. The fixed application and unchanged tests are committed at `31b8f6241cc1ff3b28de335838c69cb953ecf593`. No PR #378 application changes are included in this independent branch.

The [baseline run](baseline-tests.txt) passes three existing-behaviour scenarios and fails all thirteen storage-time authority challenges: twelve HTML/PDF challenges plus the issued report manifest return **200** after the relevant real database grant expires during storage. The [fixed run](fixed-tests.txt) passes **16/16 scenarios** through the standard database-suite wrapper. The child runner also counts its enclosing test, reporting 17/17; the wrapper reports 1/1.

An [initial driver run](initial-test-driver.txt) additionally failed its corrupt-storage fixture because it assumed an uppercase doctype. That assertion was corrected to change the parsed HTML's first character while preserving the bundle length and valid JSON. The baseline was then rerun against unchanged application source before the three runtime rechecks were added. This fixture correction is separate from the thirteen reproduced application failures.

| Scenario | Observed result after correction |
|---|---|
| Current role/company/workspace access | Authorised readers receive exact HTML/PDF hashes and lengths; Systems and other company/workspace identities receive no document or manifest values. Technician cannot fetch generated output; coordinator/technician cannot fetch Finance evidence. |
| Issued Service report HTML/PDF | Revoking either `report.read` or supporting `field.read.own` inside the storage read refuses release. Four challenges. |
| Generated Service report HTML/PDF | Revoking either `report.issue` or supporting `report.read` inside storage refuses release. Four challenges. |
| Finance evidence HTML/PDF | Revoking either `finance.read` or supporting `shared.finance.read` inside storage refuses release. Four challenges. |
| Issued Service manifest | Revoked `report.read` withholds hashes, filename and issue metadata after the same storage boundary. One challenge. |
| Missing storage | An injected adapter failure refuses all six byte outputs; restored storage retrieves the retained originals without issuing or rendering again. |
| Corrupt storage | A valid JSON bundle of unchanged length with altered HTML fails exact-content validation for all six byte outputs; restored reads match the original manifest. |

The authority hook wraps the real local store read, obtains real rendered bytes and then expires the synthetic database grant before returning to the application. It does not mock the domain reader or HTTP response. A second request while revoked fails before calling storage. Exact grant values are restored in `finally`; recovered downloads compare byte-for-byte with the pre-challenge original. Successful and denied responses are private/no-store. Denials contain neither file/hash headers nor retained issue/job identifiers, hashes or filenames.

Whole-row snapshots compare Service reports/revisions/reviews/issues/presentations/render jobs, Finance handoffs/revisions/reviews/reconciliations/outcomes/issues/render jobs, field entries, work orders, operation receipts, audit events, outbox jobs and activities. These remain unchanged across refusal and recovery. Synthetic access/session bookkeeping is outside that business-state comparison.

## Environment and reproduction

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and reviewed Chrome 154.0.8037.98. A new task-owned cluster uses loopback port 55922, database `ppo_synthetic_test` and `max_locks_per_transaction=512`; the previous proof cluster is preserved. HTTP binds an ephemeral loopback port. Credentials/configuration and generated documents stay outside Git.

With an isolated local-synthetic configuration and a private document store outside the repository:

```sh
node --env-file=/absolute/private/proof.env --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/report-finance-download-http.test.ts
```

The existing database-suite wildcard discovers the wrapper. It launches the driver with the existing `react-server` condition, resets only the named disposable database, creates an issued Service report and reconciled/issued synthetic Finance evidence, calls the real exported route handlers with opaque synthetic sessions and per-request working-company context, and closes its server/pool. It does not start or exercise compiled Next routing, browser UI, another application's database or a live ERP. Missing/corrupt-storage results are fault injection at the adapter boundary, not a SharePoint movement test.

## Additional checks and boundaries

- **Existing database regressions: 6/6 pass.** Current Finance direct-read/receipt authority, Finance storage-success/database-failure recovery, Service customer-safe projection, Service durable original recovery, missing/wrong-hash original refusal and issue-time revocation. [Results](regressions.txt).
- **Static/build:** `npm run typecheck`, `npm run lint` and `npm run build` pass. [Typecheck](typecheck.txt), [lint](lint.txt), [build](build.txt).
- **Repository:** foundation, prototype and naming checks pass with no errors; all 78 parent IDs remain. [Foundation](foundation.txt), [prototype](prototype.txt), [naming](naming.txt).
- **Design integrity:** `npm run studio:check` passes with no errors; 28 existing stale reviews remain. No review status is promoted. [Results](studio.txt).

The complete unit/database/browser suites, hosted execution, physical device, screen reader, visual review and owner demonstration are outside this bounded proof. PT-01's complete channel matrix, PT-18's rename/move/missing-version source chain and PT-23/29/30 remain open. Original parent IDs, issued references and acceptance statuses are unchanged.
