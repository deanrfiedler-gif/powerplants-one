---
document_id: PPO-INSPECTIONS-READING-INSTRUMENTS-DEC
date: 2026-10-21
owner: Dean Fiedler
status: Owner-authorised attribution extension; implementation and visual review separate
source_commit: 4c1097cc4d6c5504a65aa4b359bd40a08078d199
versioning: git
---

# Inspections reading instrument attribution

Dean authorised the attribution extension and migration on 21 October 2026, in response to the implementation gap recorded in draft PR #647: “Authorise the attribution extension and migration (recommended)”. This supplements the [accepted Inspections design](inspections-figma-design.md).

FI-03 records explicit links from a reading to the instrument snapshots retained with its attempt. FI-04 displays those links. The server validates the selected instrument against the reading's measurement basis and calibration at test time. A submitted attempt freezes the attribution along with its other evidence.

Existing attempts retain their original hashes and evidence. An attempt-wide instrument list is not evidence of which instrument measured a particular reading; historical attribution is never inferred or backfilled. EN-08 retains its existing contract.

The change requires a reserved migration, live-schema verification, and populated upgrade proofs. It authorises no new capability, seed grant, integration or dependency. Code delivery and owner visual review remain separate from this decision.
