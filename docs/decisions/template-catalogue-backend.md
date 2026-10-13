# DK-06 template catalogue and usage backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Status: authorised implementation; verification, independent review, owner acceptance and deployment are separate.

Dean requested the next backend module and then authorised proceeding with DK-06's first read-only increment. This session owns `codex/template-catalogue-backend`, based on merged main `a333604` (Projects, CPQ and Document Library integration). Output register/actions #468/#469 remain independent. This contribution uses the existing native definitions and consumers; it does not require those pending output APIs.

Traceability: BC-03, DK-06, DOC-02/DOC-03/DOC-06, AT-20/AT-36 and the [R1 receiving plan](document-form-template-management-design.md). Existing scope keys, parent IDs and issued references stay intact. The broader standalone design is a proposal, not proof of native template authoring or publication.

## Bounded implementation

Reuse the PostgreSQL/TypeScript domain services, existing output-family read permissions and signed paging under the adopted architecture. No new technology, database migration, seed, capability or renderer is needed. A separate template-management permission would expand access administration without giving R1 any additional authority; existing family grants plus native consumer checks supply this bounded read contract. General document-library permission alone cannot read Service or Finance template usage.

The three supported families are Job packs OUT-09, Service reports OUT-10 and Finance evidence OUT-14. Current and historical persisted definitions retain their exact IDs, versions, definition strings and hashes. Policy selection, content integrity and current renderer support are separate facts. Unsupported versions and changed renderer definitions remain inspectable with explicit holds. An unrecorded legacy dependency manifest stays unknown, rather than being reconstructed from today's files.

Usage follows saved pack revisions, reserved render jobs and issued output records, as applicable to each family. Each record is checked with its native source authority before public paging and again before return. Crew cannot inspect an unissued pack draft. Job reads retain issue permissions for packs and reports; Finance retains account/work and confidential-data scope. The catalogue serves no output bytes, regenerates nothing and records no distribution/download event.

The [API contract](../contracts/template-catalogue.md) specifies fields, completeness and refusals. [Execution evidence](../testing/evidence/template-catalogue/README.md) records actual checks and failures. UI, managed proposals, independent review, publication, use assignment, other form families and live providers remain subsequent work.
