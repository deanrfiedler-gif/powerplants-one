---
title: Automation N2 technical assessment implementation
date: 2026-10-22
---

N2 adds ordered process stages, phase-specific compatibility and exact capacity/quantity rules, explicit manual staffing, directed interfaces and buffers, immutable source-bound assessment history and two retained internal HTML outputs. Javo Standard 2.0 and Plus remain the initial candidates; no manufacturer rating is approved or seeded. The [merged specification](../blueprints/nursery-automation-configurator.md) and [ADR-0061](../decisions/ADR-0061-nursery-technical-assessment.md) retain all EST and NAC identifiers.

Dean's [Automation naming direction](../decisions/automation-configurator-name.md) broadens the current display name beyond nurseries while preserving stable routes, database names and issued evidence. The native page, guide and shared-control bindings are maintained in the design register; accepted Automation mockups and owner visual review remain missing.

Migration 0117 adds empty immutable child history without seed or grant changes. Exact upgrade ledgers retain their earlier cases and add the new version, including late reserved Products installation. Eleven N2 unit cases, final N2 persistence and populated-upgrade checks, four late reserved upgrade cases, the build and the ten desktop/phone N1/N2 browser cases passed. Pre-merge review identified a contradictory-limit classification defect; the correction preserves NeedsConfirmation for inverted confirmed intervals and keeps established failures distinct. Different-model follow-up confirmed the correction with eleven independently passing unit tests and no remaining actionable findings; final-head CI remains the merge gate. The full local unit run retains three Windows filesystem failures reproduced on unchanged main. Remote CI and owner visual acceptance remain separate in PR #665; see [execution evidence](../testing/evidence/nursery-automation-n2/README.md).

Shared Products publication, delivery profiles/person-hours, installation and commissioning costing, paired CPQ receiving and quotation release remain N3/shared dependencies. N2 grants neither business acceptance nor production readiness and is not deployed by this change.
