# DK-06 controlled template use evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic backend verified with the limits below. Independent review, owner acceptance, native controls and deployment remain separate.

[PR #477](https://github.com/deanrfiedler-gif/powerplants-one/pull/477) builds on R3 #476. Initial base: 52f5636706f2ad586f4317f743d096f418a34598. The integrated parent is cbcfb1faff50f8a2c1648d6af99e281bce6f9fc7, retaining Output Distribution 0091 alongside template migrations 0092ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“0094. The [decision](../../../decisions/template-use-assignment-backend.md) and [contract](../../../contracts/template-use-assignment.md) bound R4 to company/site OUT-09 use. [Execution summary](execution.json) records source hashes and actual outcomes.

The proof uses isolated loopback PostgreSQL 16.15, ppo_synthetic_test, Node 24.21.0, npm 11.19.0 and the pinned Chrome channel. Private configuration, raw logs and generated business evidence remain outside Git. No shared or hosted database is reset.

| Check | Actual result |
|---|---|
| Integrated R4 scenarios | All six pass: default denial and exact adoption/recovery; trusted-time intervals, overlap and gap rules; concurrency and atomic rollback; direct SQL guards; current scope/authority; native PDF issue without template-management grants; refusal of stale issue after durable storage. |
| Populated 0093 upgrade | Pass: exact publication/output/authority/audit/receipt/seed rows and original ledger preserved; only 0094 added; repeated migration/seeding inert; retained R3 definition remains supported. Future assignment permits the original queued legacy output until activation; changed pre-activation baseline blocks preparation. |
| Integrated R3 and native pack regression | All six R3 scenarios pass. The combined 47-case run passes 46; one old pack fixture attempted direct insertion of a managed template, which R3 correctly refuses before storage. The corrected native-publication fixture passes with the original retained-output assertions and an explicit StaleSource check. |
| Populated R2/R3 and ES-07 upgrades | All three integrated populated-upgrade cases pass. The focused run also includes the repaired pack fixture: 4/4 pass. All three template upgrades passed before parent integration. |
| Reserved Products migration | 25/93/94 pass before integration. Integrated 25/91/94 checks also pass (3/3). |
| Hosted-demo upgrade | Five initial cases pass; one reset times out. The unchanged conflicting-ledger and late-rollback cases pass together on retry. Integrated CRLF-ledger and rollback checks also pass (2/2). |
| Compiled HTTP | All seven journeys pass against the integrated build: library, catalogue, drafts, copied-base authority, publication and R4 assignment/succession/recovery/revocation. |
| PostgreSQL/process restart | All four library/R2/R3/R4 verifiers pass after an actual isolated PostgreSQL restart. R4 preserves the exact policy/assignment rows and actor-private receipt, and resolves the same current selection. Evidence hashes are retained in the execution summary. |
| Full local unit suite | 795/798 pass before parent integration; two added output-register units pass after integration. The same three Windows filesystem failures were reproduced on untouched main a333604 during R1. Affected sources and tests are unchanged. |
| TypeScript, changed-source ESLint and full build | Pass on the integrated runtime. The corrected pack fixture also passes ESLint, and final TypeScript passes afterward. |
| AD-01 capability assurance | 107 model groups pass with 150 capabilities; all 40 native browser groups pass on Chrome 155.0.8059.40. This is automated behaviour evidence, not a new visual-review or owner-acceptance record. |
| Working register | Pass: 362 entries, 46 components, 208 source routes; 334 unreviewed and 28 stale reviews remain explicit. |
| Foundation / prototype / naming | All pass on the integrated documents: 78 parent requirements, 9,512 links, 6,009 files, 615 document records and 7,984-character project instructions. Documentation assurance is not business acceptance. |

## Corrections and retained limits

CI exposed exact migration tails still ending at 0093. Every affected populated-upgrade assertion now retains its original ledger and includes the exact additional version; integrating the parent also retains 0091. The hosted-demo gate was reviewed for the additive empty schema and unchanged grants. The HTTP runner isolates R4's fresh-database proof and restores the seeded permission baseline afterward.

The old pack template-change fixture inserted a version-three row without R3 publication evidence. The fixture now creates a reviewed publication through native commands before changing the test-only legacy pointer. The original retained-output assertions remain, with an explicit StaleSource assertion added. No runtime guard or deadline is relaxed. A single-filter demo retry passed its test body but left its deliberately conflicting ledger for suite teardown; rerunning it with the original following rollback case passed both.

The local Windows shell did not advance from its restart invocation after PostgreSQL reported ready. The four verifiers ran as separate fresh processes and all passed; the idle owned wrapper and isolated server were stopped after verification.

R3 renderer and dependency-source bytes remain unchanged. No new framework, dependency, seed, user or grant is introduced by R4. Existing workspace pointers and issued outputs are preserved. The native DK-06 page remains unbuilt; other families, broader applicability, independent review, owner acceptance and deployment remain open. GitHub CI is separate from these local outcomes.
