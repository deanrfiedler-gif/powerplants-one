# PT-01 permissions matrix evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed: 10 October 2026 (Australia/Brisbane). [Decision and scope](../../../decisions/permissions-matrix.md). Implementation self-review; independent review and owner acceptance pending.

## Source and procedure

The [written PT-01 procedure](../../prototype-acceptance.md#pt-01--server-permissions-and-information-isolation) is executed as one joined local synthetic server matrix. Main baseline: `e5a94730025cf7a1ad4c1d0b1450532f591dba32`. Test-only checkpoint: `f4610ea`, with application source unchanged from that main. The correction is `d08d7375f96653f5085a8414270a19a80d0265dc`; `29e8807cbdb05addec6e28b542419a5199717c84` adds a direct Finance-account tuple challenge with unchanged corrected runtime.

The [baseline](baseline.txt) passes 42 of 46 scenarios and fails four storage-time challenges: field-photo bytes and metadata, and response-mark PNGs retrieved by Technician and Coordinator, return HTTP 200 after their actual grant expires inside storage. The enclosing test also fails (47 runner tests, five failures). The same 46 scenarios [pass after correction](fixed-matrix.txt), through the standard database-suite wrapper.

The [final matrix](final-matrix.txt) passes **47/47 scenarios**, including the additional direct Finance account challenge (48/48 with the enclosing test; wrapper 1/1). [Source, command, environment and artifact hashes](verification.json) bind the final result. The initial exploratory run had one test expectation error: Finance reviewer has a seeded Activity-read grant and correctly receives an empty inbox. The corrected expectation is retained in the test-only checkpoint; the four reproduced application failures are separate.

## Explicit role matrix

These expectations apply to the same company-A issued pack, Service report, field photo, captured synthetic response mark and Finance handoff. A1/A2 are two sites in company A, B1 is company B's site, and C1 belongs to the other workspace. “Own” notifications remain subject to current source permissions. Site access alone does not confer document, Finance or approval authority. The [observed active grant fixture](role-grants.json) records all eleven actors and their actual scopes; Systems has no grants. Temporary grant challenges are restored exactly and add no seed.

| Identity | Site reads/search/previews | Notifications | Pack / Service HTML, PDF and manifest | Generated pack / report | Photo / response mark | Finance handoff, account and evidence | Review duty |
|---|---|---|---|---|---|---|---|
| Coordinator | A1, A2 | Own | Allowed | Allowed | Service review photo / allowed mark | Denied | Service |
| Assigned Technician | A1 | Own | Allowed | Denied | Field photo / allowed mark | Denied | None |
| Finance preparer | A1, A2 | Own | Denied | Denied | Denied | Allowed | No review |
| Finance reviewer | A1, A2 | Scoped inbox; no owned test notice | Denied | Denied | Denied | Allowed | Finance |
| Finance processor | A1, A2 | Denied | Denied | Denied | Denied | Allowed | No review |
| Finance reconciler | A1, A2 | Denied | Denied | Denied | Denied | Allowed | No review |
| Systems | None; empty search | Denied | Denied | Denied | Denied | Denied | None |
| Company-B coordinator | B1 | Own B notice | A outputs denied | A outputs denied | A outputs denied | A data denied | No A review |
| Other workspace | C1 | No A notice | Denied | Denied | Denied | Denied | None |
| Site observer | A1 | No owned test notice | Denied | Denied | Denied | Denied | None |
| Workspace observer | A1, A2, B1 | No owned test notice | Denied | Denied | Denied | Denied | None |

The ordinary fixture commands actually create, submit, review, issue and reconcile the retained records under Coordinator and distinct Finance duties. Validly structured review commands from every other matrix identity receive 403/404, preserve the whole report/handoff/review rows and create neither a command receipt nor an outbox job. This proves the Systems default denial without granting Systems a business role for the test.

## Written-step coverage and observed outcomes

| PT-01 step / expected outcome | Executed proof |
|---|---|
| Coordinator, Technician, Finance and Systems; two company/site scopes | Eleven opaque sessions; four known sites across three companies and two workspaces. Positive and negative expectations are explicit, not derived from runtime permission results. |
| Read assigned site; request another directly | Each identity requests all four site IDs and direct search previews. The Technician receives A1 and no A2/B1/C1 ID or title. |
| Request Finance data | Handoff reads, both Finance evidence formats and direct account observations. The independent F-01 fixture returns the exact company/customer/account tuple and 600.00 balance only to permitted Finance duties; substituting the same-name company-B customer refuses. |
| Search suggestions and previews | Full Site search, global suggestions, exact issued-pack search and direct previews; restricted company/site IDs, titles, customer notes and Finance-activity prose are absent from disallowed responses. |
| Document preview/export/download | Thirteen byte routes: issued/generated pack and report HTML/PDF, Finance HTML/PDF, field photo, Service review photo and captured response mark. Every allowed response matches its retained hash and byte count. Draft preview, manifests, report/handoff records and attachment metadata are separately checked. |
| Notification payloads and personal state | Own notices and obligations remain visible; other recipients cannot read or mark them. Changing source scope hides an already-projected notice before the one-result window and reduces owned/unread counts by exactly one, without creating personal state. |
| Repeat as Systems without business grants | Empty search; denied direct context, previews, notification targets/state, all bytes/metadata and both review commands. |
| Current authority / no restricted fields | Working-company selection narrows all selected channels; clearing it restores only granted access. Expired grants and inactive/anonymous identities reveal no protected data. Four storage-time grant challenges withhold metadata/PNG and restored access returns exact originals with unchanged attachment/response rows. |

All checked successes and denials are private/no-store. Errors carry no download filename/hash headers or protected test identifiers/titles. The storage hook wraps the real private store, reads the real bytes, then expires the database grant; it does not mock authorisation or fabricate the HTTP response. Metadata rechecks authority outside its recoverable storage-error catch.

## Reproduction and validation

Windows; Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and Chrome 155.0.8059.40. A task-owned loopback cluster on port 55931 uses `ppo_synthetic_test` and `max_locks_per_transaction=512`. Configuration, credentials, generated files and storage remain outside Git. The existing migration/seed registry is used without modification.

```sh
node --env-file=/absolute/private/proof.env --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/permissions-matrix-http.test.ts
```

The existing database wildcard discovers the wrapper. It starts its driver with the existing `react-server` condition, resets only the named disposable database, builds real domain fixtures and calls exported route adapters through an ephemeral loopback HTTP server. Per-request working-company scope and session resolution are exercised. This is server/API evidence; compiled Next routing, browser display and operational identity providers are separate.

- [Retained download regressions](download-regressions.txt): **24/24 scenarios**, job-pack access/recovery and Service/Finance output authority, including missing/corrupt storage and original recovery (two wrappers pass).
- [Selected field/photo/response regressions](photo-response-regressions.txt): **9/9**, existing current-scope, durable photo, exact Service inspection, immutable response and customer-safe projection cases.
- [Focused units](focused-units.txt): 18/18 search, navigation authority and working-company tests.
- [Build](build.txt), [typecheck](typecheck.txt) and [lint](lint.txt); the final test supplement has its own [lint result](test-lint.txt).
- [Foundation](foundation.txt), [prototype](prototype.txt), [naming](naming.txt) and [development register](studio.txt) assurance. The register retains 28 stale reviews and 322 unreviewed entries; design review state is not promoted.

The initial unit command named two nonexistent standalone test files and therefore ran no tests; the real three-file focused run above supplies the unit result. No full unit/database/browser sweep, hosted refresh, physical-device observation or independent review is claimed.

## Disposition

PT-01 has a joined synthetic server execution of its written role/company/site/search/notification/preview/export procedure. The [live acceptance ledger](../../field-integrated-acceptance-ledger.md) records that technical result separately from review, business authority and owner/device acceptance. The authored catalogue's original defaults, historical evidence, issued snapshots and all 78 parent IDs remain unchanged.

External customer access, live SharePoint ACLs, email/push/SMS delivery and every later module's export are not implemented PP-01 channels in this procedure and receive no pass claim. Their applicable future acceptance remains separate. Full PT-18 source/provider acceptance, PT-23/PT-29, owner-led PT-30 and production readiness are not closed by PT-01.
