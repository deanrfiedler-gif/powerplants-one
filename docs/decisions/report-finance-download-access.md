# Service and Finance download access

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 10 October 2026 (Australia/Brisbane). Requirements: PT-01 / AT-01 and the exact-output access portion of PT-18 / AT-20 / AT-36; NFR-01 and existing DOC-01–DOC-06 contracts remain intact. Review: source self-review and local synthetic verification; independent review and owner acceptance remain separate.

Dean authorised the next backend permissions and recovery slice alongside his UI work in Claude: Service report and Finance HTML/PDF downloads. This branch starts independently from main `184b933836b9790b4ffb6565552475a1af1eec24`. The earlier job-pack contribution in PR #378 remains separate. This is the same bounded parallel-writing exception: no UI, page, style, shared control, design register, dependency, migration, seed or permission definition changes. Shared status/evidence additions require reconciliation at integration. No merge, deployment or live transaction is included.

Actual HTTP tests confirm that issued Service reports, generated reports and issued Finance evidence return bytes after access expires during a private storage read. The issued report manifest also returns metadata. Pre-existing checks correctly deny access already revoked before the request, but that does not protect the storage interval.

Reuse the existing authority functions immediately after reading and validating the retained bundle: `reportContext` for issued presentations, `readReportJob` for generated output, and `financeContext` for Finance issues. These check the current scoped grants and supporting field, Service ownership or Finance account/work context. The change preserves original bytes, hashes, presentation/issue identities, render attempts and command receipts. It introduces no new authority or retrieval side effect. Holding database locks throughout an external storage read would add contention and is unnecessary for this bounded correction; retaining only the initial check leaves the reproduced gap.

[Execution evidence](../testing/evidence/report-finance-download-access/README.md) preserves the failing baseline, corrected driver, fixed result and selected existing regressions. This supplements PT-01/18 component evidence; it does not close their complete channel/source-movement procedures, PT-23, PT-29 or owner-led PT-30. MYOB remains intended ERP authority, SharePoint business-document authority and native CAD authoring authority. Synthetic documents and adapters establish no live integration or production claim.
