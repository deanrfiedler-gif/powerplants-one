---
title: Project billing B4 claimed
date: 2026-11-10
---

On Dean's instruction, a draft pull request now claims increment B4 of the [project billing decision](../decisions/project-delivery-billing.md#build-increments): rule R3, "field hours and parts on a fixed-price project are cost evidence". The rule is that every line of a Finance handoff for a work order linked to a project is `NonBillable`, enforced at submit, approval and begin processing, with additional work charged only through approved variation claims. B4 also updates TS-01's connected acceptance coverage. Codex builds it. Claude opened the claim and wrote the brief, and will review the build once.

Nothing is implemented yet. This fragment and the draft pull request are the claim only: no code, migration, permission, grant or contract change. Dependencies: B1 (migration 0122) and B2 are on `main`. B3 ([PR #883](https://github.com/deanrfiedler-gif/powerplants-one/pull/883)) is reviewed with its findings confirmed, but is not merged, and B4 implementation starts only after it merges. Claim UI and claim document output (OUT-14) stay outside B4. Repository checks run for this change: `python3 scripts/build_status.py --check`.
