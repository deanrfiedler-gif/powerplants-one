# Backend access and recovery evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed: 9 October 2026 (Australia/Brisbane). Source baseline: `184b933836b9790b4ffb6565552475a1af1eec24`. [Scope and decision](../../../decisions/backend-access-recovery.md). These are synthetic server observations, separate from independent review, owner acceptance, integration and deployment.

## Result

On unchanged application source, the four general access/recovery scenarios passed and all four storage-time document-authority scenarios failed: the issued and generated HTML/PDF adapters returned **200** after the relevant grant was expired during the storage read. [Baseline results](baseline-tests.txt) retain every failing assertion. The test driver was initially unformatted; later formatting, early-failure database cleanup and a positive cache-header assertion do not change those four denial assertions.

The corrected adapter rechecks the exact issue or render-job authority after reading the immutable bundle. All eight scenarios pass via the standard database-suite wrapper; the child runner counts its enclosing test as a ninth test. [Corrected results](fixed-tests.txt).

| Scenario | Observed result |
|---|---|
| Direct site, search, suggestions and Finance | Assigned site remains available; other site/company/workspace titles and IDs are withheld. Systems has no business search results or Finance access. A working-company selection narrows a workspace reader's actual HTTP results. |
| Lost successful response and receipt recovery | Server deliberately closes the connection after the create adapter commits. Original actor recovers the saved receipt; other identities are refused. Expired edit authority blocks lookup and original-command replay while ordinary read access remains independent. Restored authority returns the same receipt; changed content conflicts. The record, accepted audit, receipt and outbox task compare exactly with the saved snapshot. |
| Notifications and previews | Another recipient cannot read the notice. Expired source-read authority removes its content and obligation from the inbox and blocks direct notice/preview access. Restoring the grant restores the original title. |
| Issued document isolation | Systems, other company/workspace and Finance identities cannot obtain the pack's HTML, PDF or manifest; the assigned technician can preview the exact issued pack but cannot inspect the staff preparation preview. |
| Issued HTML and PDF storage-time revocation | Both refuse revoked `pack.read` before returning bytes or adding a distribution event. Restored authority retrieves identical original bytes. |
| Generated HTML and PDF storage-time revocation | Both refuse revoked `pack.issue` after storage. Restored authority retrieves identical original bytes. |

The storage challenge wraps the real local adapter read and expires the real synthetic database grant after obtaining the original bytes. It does not replace the domain readers or manufacture a denied response. Positive downloads verify the manifest hash and private/no-store headers; restored downloads compare actual bytes. Rendered files remain in the private task-owned store outside Git.

## Environment and reproduction

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and reviewed Chrome 154.0.8037.98. The task uses its own cluster on loopback port 55921 and only `ppo_synthetic_test`, plus an ephemeral HTTP port. Configuration, credentials and generated documents remain outside the repository. The harness calls the real exported adapters with synthetic sessions and per-request working-company context; it is not a compiled Next routing or browser proof.

The first setup attempt exhausted default PostgreSQL lock capacity while resetting the full retained schema. [Original setup failure](setup-failure.txt) precedes all application assertions. Increasing only this disposable cluster's `max_locks_per_transaction` to 512 allowed the unchanged setup to run; CI already configures additional lock capacity. No application threshold, migration or hosted setting changed.

With an isolated local-synthetic configuration whose database is `ppo_synthetic_test` and private document store is outside Git:

```sh
node --env-file=/absolute/private/proof.env --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/backend-access-http.test.ts
```

The wrapper starts the test driver with the existing `react-server` condition convention. The normal database-suite wildcard discovers the new test; no CI workflow change is required. The harness resets its disposable database, renders a real synthetic job pack and closes its own server/pool. Never point it at another running application's database.

## Additional validation and limits

- **Existing job-pack regression:** 4/4 selected database cases pass: exact output/two acknowledgements, render-failure recovery, unavailable historical source and current recipient access. [Results](pack-regression.txt).
- **Static/build:** `npm run typecheck`, `npm run lint` and `npm run build` pass.
- **Repository:** foundation, prototype and naming checks pass. `npm run studio:check` has no integrity errors; the existing 28 stale reviews remain visible. All 78 parent dispositions remain unchanged.
- **Unit limitation:** both selected `tests/unit/document-store.test.ts` cases fail locally with `ExactDocumentUnavailable`. Replacing the sole modified application file with its main version and confirming `git diff --exit-code HEAD -- src` reproduces both failures on unchanged main application source. [Control results](unit-main.txt). The corrected file was then restored byte-for-byte. No store guard or unit assertion was relaxed, and no causal diagnosis or unit pass is claimed.
- **Lifecycle:** the task-owned HTTP server and database connections close after proof; the separate PostgreSQL cluster is stopped with its files and exact rendered originals retained outside Git. Claude's processes, database, UI branch and checkout are untouched.

Full PT-01 is not promoted: the complete Service/Finance approval matrix and every channel still need their own joined disposition. PT-18's source rename, identity-changing movement and unavailable-version procedure remain open. This contribution adds no UI, schema, grant or seed change and does not close PT-30 or establish owner/device acceptance. No full local database, unit or compiled-browser sweep is claimed. Full contribution CI, protected merge and hosted deployment remain separate.
