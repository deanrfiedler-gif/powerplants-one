# Claim-specific Finance evidence — 13 November 2026

Owner: Codex. Implementation: [PR #932](https://github.com/deanrfiedler-gif/powerplants-one/pull/932), stacked one level on [C1 #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905). Dean instructed proceeding with the recommended backend increment. The [OUT-14 contract](../../../contracts/document-issue-distribution.md#claim-specific-out-14--13-november-2026) and [implementation decision](../../../decisions/project-delivery-billing.md#claim-evidence-implementation--13-november-2026) define this bounded internal format. FIN-05/FIN-06, DOC-03/DOC-06, OUT-14 and AT-31/AT-38 remain unchanged parent references.

## Review correction and real-renderer verification — 13 November 2026

[Claude reviewed `4a11488e`](https://github.com/deanrfiedler-gif/powerplants-one/pull/932#pullrequestreview-5883201207) and found no application-code defects, with one verification defect **D1**. The compiled gateway returns `Cache-Control: private, no-store`; the test incorrectly required the equivalent directives in the other order. Commit `db7052757` compares normalized directive tokens and still requires both `private` and `no-store`. Route/gateway behavior, PDF size, hashes, exact repeat bytes, CSP, `nosniff` and access-refusal assertions are unchanged.

The C1 review fixes and current main are merged. The single connected-helper import conflict is resolved by retaining both `verifyClaimEvidence` and `maintenanceTestDates`; both claim-output assertions remain present. There is no new application, renderer, migration, permission or grant behavior in this correction. The source build includes main's People-register correction; later integrations change tests/documentation only.

### Independent evidence at the reviewed head

Claude's supported Chrome 157.0.8103.78 execution passed **5/5 claim DB cases, 1/1 connected case, 64/64 WorkOrder/template regressions, 2/2 claim units and a genuine PostgreSQL restart**. Claude inspected the real ProjectClaim (10 pages) and AgreementCharge (6 pages) PDFs. The HTTP request case passed; the renderer case failed only D1. These results belong to `4a11488e`, not to the correction. Both subsequent Application assurance runs at that original head reproduced the HTTP header-order failure; no green HTTP result is attributed to those runs.

### Correction execution

At executed source `e18a7c5828f0ee20903b32f118fd80c824ae3e24` (C1 parent `4b07fba0a`), followed only by this evidence update:

- **Compiled HTTP: 2/2 passed**, after a fresh reset, with the ordinary compiled gateway and real renderer. Both request/replay/conflict/access proof and original HTML/PDF proof complete. The saved synthetic HTML is 804,825 bytes and PDF is 529,985 bytes; their SHA-256 hashes match the retained manifest. Repeated reads are byte-identical, both cache directives are present, and CSP, `nosniff` and denied access assertions pass. [HTTP result](review-fix-http.txt), [manifest](review-fix-http-manifest.json).
- **Connected B4/M2/C1: 1/1 passed**, 56,025 ms under the unchanged 120,000 ms deadline, without renderer substitution. Both real claim outputs remain verified alongside the dynamic agreement term, exactly one six-monthly occurrence and covered no-posting result. [Connected result](review-fix-connected.txt).
- Production build, final TypeScript and focused lint passed. Foundation, naming, migration/status/documentation checks are recorded with publication. The full child unit suite was not repeated; C1's local one-second installer-lock failure and isolated 11/11 pass remain explicit in its evidence. Current-head CI must resolve the remaining execution gates.

The first successful HTTP execution omitted its source-head metadata because this test container has no Git executable. The final recorded run above reset the database again and supplied the exact SHA explicitly; the retained manifest now matches it.

[Correction provenance](review-fix-validation.json) records the exact executed source, runtime, hashes and results. A temporary local Docker image supplies official Chrome 157.0.8103.78, accepted by the unchanged browser gate with Playwright 1.65.0. The disposable database is PostgreSQL 16.15, with Node 24.21.0/npm 11.19.0. No renderer mock is loaded. The container is test infrastructure outside Git, not a new application dependency or deployment.

## Implementation

The existing request/worker/private-store/download path now supports exact reconciled ProjectClaim and AgreementCharge entitlements. Each row records its exact monetary amount, currency, tax basis and original entitlement identity; service quantities are not interpreted as money. The output includes immutable source/review/reconciliation/target evidence and correction requests as at preparation. It is restricted Finance evidence, explicitly synthetic and not an invoice or customer distribution.

The fixed version-3 renderer is bound to the selected existing Finance template and policy. The request transaction materialises its deterministic immutable definition in the existing template table. No schema, seed, grant, policy migration, framework or external service is added. The original version-1/2 renderer source files and existing template policy remain unchanged. Template publication is not expanded to accept user-authored claim formats.

Historical source checks allow evidence of a reconciled effect after project closure or agreement withdrawal, while retaining current Finance, company, account and native source authority. Agreement issue authority covers every site on the original revision. Original operation replay rechecks that authority. Finalisation checks current source, template/policy and permissions before releasing the reserved issue. Storage-success/finalisation-failure recovery locates the same original bundle; it does not rerender.

## Historical implementation execution

Cloud setup succeeded with Node 24.21.0, npm 11.19.0 and disposable PostgreSQL 16.15. Required Chrome is unavailable: `browser:check` reports the missing `/opt/google/chrome/chrome`. No older browser was substituted. Renderer-dependent local runs explicitly load the existing `project-claims-synthetic-renderer.mjs`; its short synthetic PDF-like bytes prove command/storage behavior only. The application server does not load that helper.

| Check | Result and boundary |
| --- | --- |
| Claim database cases | 5/5 passed, no skips, after the historical request-guard change; synthetic renderer, real PostgreSQL |
| Unmocked command-only case | 1/1 passed: reconciled-state/exact-ID guards and concurrent same-operation request receipts; no rendering invoked |
| Connected B4/M2/C1 component | Final run 1/1 passed with the synthetic renderer: closed-project AUD 135,090 claim and separate AUD 4,800 agreement charge outputs; covered 90 MIN/1 EA remains no-posting; unchanged measures and duplicate-fee refusal retained |
| Existing WorkOrder output regression | Three selected cases passed: issue-owner revocation after durable storage, changed source after rendering and revoked read access; synthetic renderer, unchanged assertions |
| Application checks | Studio, full lint and TypeScript passed; 1,455/1,455 unit tests, zero failures/skips; production build passed. The environment restart interrupted the first build; remaining checks were resumed, not reported as a successful uninterrupted `npm run check` |
| Compiled HTTP commands | 1/1 passed without renderer mocks: exact request/replay status and receipt, changed-command conflict and foreign-scope/wrong-duty refusal |
| Real-renderer HTTP output | Authored, not locally executed successfully; requires supported Chrome |
| PostgreSQL restart and separate command processes | Passed for both stored claim outputs: changed actual postmaster identity, exited original command process, exact hashes/byte lengths and original request receipts, duplicate worker no-op, and unchanged Finance/receipt/outbox snapshots. Synthetic rendered bytes only; no HTTP/browser restart claim |
| Documentation | Foundation, prototype, naming, migration numbering, status sources and 44 documentation unit tests passed; committed-scope and final whitespace checks recorded with the publication |

The initial database run failed because test fixtures used the Finance preparer (without `finance.issue`) and an agreement owner without the withdrawal command's historical authority. The corrected fixtures use the existing Finance reconciler and agreement reviewer. No application grant or permission was relaxed. The initial HTTP typecheck found two inferred-local-variable errors; explicit types correct those test declarations.

The environment replacement interrupted one connected rerun after its catalogue/history case had passed. The full connected case was then rerun successfully from a fresh fixture. The first regression selector did not match the connected case's actual name; the file-level no-case result is not counted as connected coverage. Its three selected WorkOrder cases are counted once. The restart helper's first invocation had an incorrect import, corrected before its successful write/restart/verify cycle.

Reproduce the focused persistence suite after sourcing the successful setup environment:

```sh
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --env-file=.env.local \
  --experimental-test-module-mocks --import tsx \
  --import ./tests/helpers/project-claims-synthetic-renderer.mjs \
  --test --test-concurrency=1 --test-timeout=120000 \
  tests/database/claim-finance-evidence.test.ts
```

The native database glob retains all five new cases. `scripts/http-suite.ts` runs the new HTTP file exclusively from a fresh synthetic database. Its real-renderer case requires a PDF larger than 1,000 bytes and validates exact protected HTML/PDF, SHA-256 response headers and denied access. It saves the synthetic fixture's actual HTML/PDF and manifest under `verification-evidence/http/claim-finance-evidence/`, included by the existing HTTP artifact upload. No mock is selected by ordinary tests or CI.

The restart helper is `tests/helpers/claim-finance-evidence-restart.ts`. Run the connected `finance-project-ts01.test.ts` alone against a fresh synthetic database first, then invoke the helper as `write <local-directory>`. Restart the actual disposable PostgreSQL instance and wait for readiness, then invoke `verify <same-directory>` in a new Node process. It does not reset the database or simulate a restart. Retained results name the actual browser-version marker, so synthetic-byte evidence cannot be mistaken for rendered PDF evidence. [Validation provenance](validation.json) and [restart result](restart-result.json) bind the retained logs and source files.

## Review and delivery boundaries

The full independent review is complete at `4a11488e`; targeted COMMENT confirmation of **D1 only** remains. C1's C1-2/C1-3/C1-4 are confirmed separately; its C1-5/C1-6 fixes have their own targeted handover. PR #932 is already ready for review; that state was set outside this correction and is preserved. It is not evidence of merge readiness. Current-head CI is recorded on the PR and must finish successfully. The full DB/HTTP/browser/upgrade suites were not repeated locally for this test-only correction.

Claude's noted shared `rendererVersion` label mismatch predates this increment. It remains outside D1; immutable renderer source bytes are not rewritten. Current test manifests accurately retain the actual browser version alongside that pre-existing renderer label.

This component is not the complete TS-01/TS-02 manual procedure, owner visual acceptance, operational accounting approval, live MYOB/SharePoint integration or customer distribution. Nothing was merged or deployed. Dean retains merge ownership.
