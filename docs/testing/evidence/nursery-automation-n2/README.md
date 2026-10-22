# Automation N2 execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic software evidence; supplier, owner visual, physical-device, screen-reader and production acceptance remain separate.

Implementation: ADR-0061 and the merged Automation specification (stable nursery-automation filename). N2 covers NAC-R01–09 and bounded technical portions of NAC-AT01–07, 19–22 and 28. N3 shared delivery, Products publication, paired CPQ receiving/pricing and NAC-AT23 complete quotation journey are not delivered by N2.

Validation is in progress. Record final executed results here before marking the PR ready. Initial nine pure rule cases passed; later independent review added manual staffing and source-authority regressions. PostgreSQL runs use a dedicated loopback-only ppo_synthetic_test database. The old temporary N1 cluster could not start (missing pg_notify); no application regression was inferred and a fresh isolated cluster was created.

No manufacturer limit is approved or seeded. The independent fixtures' rates, geometry and review names are synthetic test evidence only. Exact technical HTML outputs are internal study snapshots, not released CPQ manifests.
