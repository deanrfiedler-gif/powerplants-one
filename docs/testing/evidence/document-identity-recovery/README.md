# Document identity and recovery evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed: 10 October 2026 (Australia/Brisbane). [Scope and decision](../../../decisions/document-identity-recovery.md). Requirements: PT-18 / AT-20 / AT-36. Source self-review and synthetic server observations are separate from independent review, owner acceptance, merge and deployment.

## Source and procedure

Application source is unchanged from main `184b933836b9790b4ffb6565552475a1af1eec24`. Final test checkpoint: `472df7eb4e8f064fb37eb232e67c0da6a4842927`. This independent branch contains neither PR #378 nor #379's runtime changes. The new tests did not uncover a runtime failure requiring a correction.

Nine scenarios run within two sequential procedures. The runner also counts their enclosing tests, so a complete successful child run reports 11/11 and the database-suite wrapper reports 1/1. The [explicit-store run](source-tests.txt) uses a retained task-owned store. The final wrapper also supports the normal CI environment with no configured document directory by creating its own canonical private temporary store and cleaning up only that exact directory; [temporary-store execution](ci-store-tests.txt) verifies that path. The initial test driver had a missing closing brace and failed before any application assertion; [initial diagnostic](initial-tests.txt) is retained separately. Correcting the driver did not change application code or acceptance criteria.

The first two successful runs precede the final review addition at `472df7e`: after registering the matching candidate, the old availability projection is set back to available and the old reference must still fail. The [final execution](final-tests.txt) reruns both procedures at that unchanged committed checkpoint. This guards against a false pass caused only by the unavailable flag.

| Scenario | Assertion |
|---|---|
| Identity-changing move | Actually rename the synthetic source file to a new opaque item ID. The new key retrieves the same bytes; the old key fails. A same-title/hash candidate cannot silently replace the selected source. An unavailable projection produces the existing specific `StaleSource` refusal and retains the original source owner. |
| Explicit reviewed successor | Original source metadata is physically append-only. Register a synthetic discovered candidate, then explicitly select it in a new pack revision with a reason and predecessor. Issue before Check is refused. Check and Issue create one distinct successor while retaining the original issue, source and evidence rows. |
| Missing version / changed bytes | Remove the candidate file, then place same-length different content at that item. An explicit key for those bytes can read them; preparation using the retained original key still fails. Restore original bytes and recover the original hash. |
| Rename with stable identity | Change only the display/availability projection's name/version. Available-source lookup shows the new display name; the immutable item/version/hash still retrieves the same source. |
| Joined source movement | On a completed synthetic pack → Service report → reconciled Finance chain, actually move/remove the source and put different bytes at its old key. All six issued HTML/PDF outputs stay byte-identical throughout and after source restoration. |
| Access/content boundary | Technician/coordinator, Systems, other-company and other-workspace identities cannot fetch Finance HTML/PDF. Anonymous requests fail authentication for every output. Technician cannot open staff preparation preview. Pack/report HTML and public manifest projections exclude the selected private canaries. |
| Missing pack bundle | Both HTML/PDF return retryable `ExactDocumentUnavailable`; restore the exact retained bundle and recover the original issue/hash. |
| Missing report bundle | Same refusal and original recovery, with no new render or issue. |
| Missing Finance bundle | Same refusal and original recovery, with no new render or issue. |

The reconciliation procedure runs before actual attendance because current pack preparation correctly requires an unstarted confirmed visit. The second procedure establishes all three issued outputs before changing the source. It does not bypass the attendance lifecycle to manufacture a joined successor.

The diagnostics retain source IDs, old/new item IDs, original/successor issue IDs and HTML/PDF hashes. Original source/revision/check/issue/recipient/acknowledgement/render/receipt/audit/outbox rows are compared exactly. Rejected amendments leave pack/appointment versions and issue events unchanged and create no receipt. The already-issued three-output procedure also compares business rows and issue/receipt/audit/outbox counts. Its pack downloads use the coordinator so they do not create technician retrieval events; this is not an assertion that genuine recipient downloads produce no retrieval evidence.

## Environment and reproduction

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and reviewed Chrome 154.0.8037.98. A fresh task-owned loopback cluster uses port 55923, database `ppo_synthetic_test` and `max_locks_per_transaction=512`. Previous task clusters are preserved. Configuration, credentials and generated files remain outside Git.

```sh
node --env-file=/absolute/private/proof.env --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/document-identity-recovery.test.ts
```

Only a disposable `ppo_synthetic_test` configuration is accepted. The wrapper is discovered by the existing database-suite wildcard and launches the driver with the existing `react-server` condition. With `PPO_DOCUMENT_DIRECTORY` configured it retains the explicitly provided private store; otherwise it creates and removes a test-owned directory outside the repository. Filesystem moves are constrained to that store. Both procedures reset the disposable database. Real existing renderers generate the outputs; there are no mocked document reads or hashes.

The real exported route adapters run **in process** with synthetic sessions and per-request working-company context. This is not an HTTP-transport, compiled-routing, browser, hosted or physical-device proof. The synthetic source registration/projection SQL is test setup, not a newly implemented application ingestion workflow. Anonymous refusal does not prove an authenticated customer portal. HTML/manifest canary assertions are not an independent PDF metadata/text-extraction or visual review.

## Validation and remaining scope

`npm run typecheck` and `npm run lint` pass; the final test-only addition also receives targeted lint. Foundation, prototype and naming assurance pass with no errors. [Foundation](foundation.txt), [prototype](prototype.txt), [naming](naming.txt). Logs preserve outcomes and normalize trailing whitespace only. No runtime build or complete unit/database/browser sweep is claimed for this test/evidence-only contribution.

PT-18's synthetic source-movement evidence is strengthened, but its full customer-channel/source-provider procedure and independent acceptance remain open. SharePoint identity changes, retention and source reconciliation require their own supported provider evidence. PT-01/23/29/30 and all 78 parent IDs/dispositions are unchanged; MYOB, SharePoint and native CAD authority remain as documented.
