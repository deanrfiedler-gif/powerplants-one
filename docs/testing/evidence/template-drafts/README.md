# DK-06 template drafts execution evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Date:** 13 October 2026. **Status:** Local synthetic verification completed with the explicit baseline limits below; independent review, business acceptance and deployment separate.

Base: PR #471 at b524ea634da825d703f5633b2d83a74d86de37b7, on integrated main a333604. Contribution branch: codex/template-drafts-backend. Scope: [decision](../../../decisions/document-template-drafts-backend.md), [API contract](../../../contracts/document-template-drafts.md), DOC-03/DOC-06, OUT-09/OUT-10/OUT-14, AT-36.

## Executable coverage

- Unit validation: bounded structure, unsupported/executable constructs, duplicate keys, family/audience restrictions and explicit review observations.
- Database: default-denied duties; all three family bases; exact receipts; conflicts; independent review; history after edits; concurrent revisions; company/workspace/source permission loss; source-specific Finance authority; rollback and original retry; immutable SQL evidence.
- Real output boundary: issued Pack, Service Report and Finance originals and a separately queued Pack remain exact through proposal/review changes. The reserved Pack job then completes through its original worker; later edits preserve the issued PDF bytes.
- Populated 0090 upgrade: original output reservation, runtime templates/policies, grants/users, receipts and exact old ledgers survive 0092 and repeat migration/seeding.
- Products historical upgrade checks include 0025 with estimates before 0026, 0090 and reserved 0052 installed after newest 0092 history.
- Compiled HTTP: create, independent review, revise, retained history, cursor continuation, current scope, validation and original operation recovery.
- Restart proof: exact proposals/reviews/events and original receipts checked by separate write/verify processes around a PostgreSQL restart.

## Results and limits

| Check | Actual result |
|---|---|
| Focused schema/review units | 2 pass. |
| R1/R2 database run | 11 pass: six catalogue cases and five proposal cases, including exact issued-output preservation and original queued render completion. |
| Populated 0090 upgrade | Pass; all retained output/authority/receipt rows and original ledger entries unchanged; only 0092 added; repeated migration and seed inert. |
| Products historical upgrades | Three pass: 0025 (estimates across 0026 deferred identities), 0090, and 0092 with reserved 0052 installed afterwards. |
| Hosted-demo upgrade suite | All six pass on the isolated synthetic database; no hosted action was performed. |
| Compiled HTTP | Both R1 and R2 journeys pass; the R2 journey exercises creation, review, revision, historical reads, continuation and private original recovery through the compiled application. |
| Actual PostgreSQL/process restart | Pass: three exact original receipts, immutable events and both proposal revisions survived. [Machine-readable execution](execution.json) retains the result and source fingerprints. |
| Full unit suite, concurrency 1 | 794/797 pass. The same three Windows filesystem failures as R1 remain: two document-store cases and one recovery-path case. R1 reproduced them on untouched main a333604; those test and implementation files are still byte-for-byte unchanged from that baseline. |
| TypeScript, changed-source ESLint and full compiled build | Pass. |
| AD-01 generated capability model | All 107 groups pass; 148 capabilities with labels and family mapping. |
| AD-01 native browser | Local limit: Chrome 155.0.8059.40 fails its first full-page capture with Page.captureScreenshot. An isolated copy of the exact a333604 HTML and browser script reproduces the identical failure. Zero groups completed; no browser pass or visual acceptance is claimed. Final-head Linux CI remains separate. |
| Studio, foundation, prototype and naming | Pass: 362 register entries, 46 components, 208 source routes; 78 parent IDs; 609 document records. The existing 334 unreviewed and 28 stale visual reviews are retained. |

The initial broad unit invocation alongside the build overloaded the local runner and was stopped. The first Products 0090/0092 run timed out, and one initial demo upgrade hit the existing site-timezone query's statement timeout. Bounded reruns passed at the normal 120-second test deadline. The browser capture failure persisted after that load ended and was separately reproduced against unchanged main. No assertion, runtime timeout, store safety policy or browser check was relaxed. Initial authoring checks also caught missing Git-master metadata and the new capability family's display mapping; both were corrected before final checks.

Node 24.21.0 and the repository's existing dependencies; PostgreSQL 16 local disposable ppo_synthetic_test on an isolated port. No production source, external provider or business transaction. Test grants exist only in this disposable fixture; migration/seed adds none.

The native template page remains unbuilt; no visual/owner acceptance, application deployment, operational template schema or publisher authority is claimed. Existing R1 broad-unit Windows store failures are recorded separately in its evidence; they are not silently reclassified here.
