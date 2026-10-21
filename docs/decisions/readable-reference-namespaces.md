---
document_id: PPO-REFERENCE-NAMESPACES-DEC
date: 2026-10-20
owner: Dean Fiedler
status: Owner-adopted naming; implementation verification separate
versioning: git
---

# Readable references for new PPO records

Dean adopted this amendment on 20 October 2026: "Yes, adopt that naming approach across PPO for new records, preserving existing references. I approve the required migration—continue the Site surveys CS-08 build using SYN-SRV-000nnn."

For newly allocated PPO-owned references, use `<NAMESPACE>-<TYPE>-<NUMBER>`: `SYN-SRV-000031` for a synthetic survey and `PPO-SRV-000031` for a future operational survey. The synthetic namespace is `SYN`; the operational namespace is `PPO`. Six digits is a minimum, not a maximum. Each workspace and type has a continuing sequence in its synthetic or operational namespace; gaps are permitted, numbers are never reused and counters never reset annually. The synthetic allocator continues its existing counters so shortening the prefix does not restart numbering. Its historical database namespace key may remain `SYN-PPO`; that storage key does not determine the displayed prefix.

Existing assigned references, including `SYN-PPO-…`, remain unchanged and resolvable. Retained snapshots, original evidence, UUIDs and external MYOB/company/entity keys remain unchanged. Previously unnumbered surveys may receive their first readable reference without rewriting retained survey revisions or submission hashes. Missing historical visit/contact/recorder facts stay unknown. A synthetic record never becomes operational by changing its prefix. The operational format is adopted as a naming policy; enabling operational storage or integration remains separate.

UUIDs remain permanent technical identity. The readable reference is a separate immutable field for people. Revision, status, customer, site and owner remain separate fields. A survey may display `SYN-SRV-000031 · Revision 2` while keeping the same survey identity. `SRV` is the survey type; service requests remain `TKT` and work orders remain `WO`.

This supersedes the new-allocation prefix in [PPO-STD-001](../standards/naming-conventions.md#10-business-record-references), the corresponding allocation clause of [ADR-0005](ADR-0005-project-naming-adoption.md), and Q1's prefix in the [CS-08 design decision](site-surveys-figma-design.md). It does not rewrite those decisions' historical evidence or issued references. Existing examples using the longer prefix remain valid legacy examples. Apply the shorter prefix across new allocations, not as a survey-only exception.

The CS-08 migration and tests must prove concurrent allocation, permanent references, preservation of legacy rows and snapshot hashes, and upgrades from populated earlier histories. No new dependency, capability, grant or production data is authorised by this naming amendment.

## Existing specialised reference families

This change shortens the prefix of new application defaults across PPO and the central numeric allocator. Existing specialised configuration, maintenance and supply references retain their currently implemented opaque or manually entered suffix formats; changing those suffix contracts is separate work. Explicit historical seed/import references and external system keys remain exact. Neither a short prefix nor a future operational naming convention enables operational storage. New central allocations retain their existing counters and expand beyond six digits without truncation.
