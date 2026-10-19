---
title: Organisations CS-01 native implementation for owner review
date: 2026-10-19
---

[PR #604](https://github.com/deanrfiedler-gif/powerplants-one/pull/604) implements Organisations CS-01 at `/customers`, `/customers/[id]` and the organisation variant of `/customers/new`, following [D1–D7 and Q1–Q4](../decisions/organisations-figma-design.md). It includes the scoped register, snapshot, seven-tab record, Sales filters, creation/duplicate check, responsive layouts and drawn failure states. Shared record presentation is extracted and registered; existing commands, source authority, stable route/requirement IDs and original-operation recovery remain. No migration, seed, capability, grant, dependency or new calculation rule is added.

The [implementation record](../decisions/organisations-figma-implementation.md) and [paired native evidence](../testing/evidence/organisations-native-r01/README.md) state the actual reads, adaptations and executed checks. The existing source gaps remain explicit: open service is Unknown; quotation history is Partial; disconnected orders/visits/documents are not zero; financial visibility remains restricted. Current shell navigation, 44 px touch controls, real identifiers/dates and the required capture reason account for documented differences from the drawings. Desktop and phone tab orders follow their respective accepted compositions.

Local verification includes the new database and HTTP contracts, compiled CS-01 browser journeys, 24 selected desktop/phone regressions and the module host contract. Full unit execution and serial comparison reproduced three Windows filesystem failures on unmodified `main` at `70450f2e`; timing failures cleared in serial replay. The evidence records each command, its result and the unexecuted full fifteen-family quality matrix. CI remains a separate gate on the pull request; no green final CI result is inferred from local checks.

The design register, component catalogue/fixtures/consumers and Draft guides remain pending owner review, with existing review fingerprints untouched. Source captures are unchanged and no Figma operation occurred; the named version remains pending as the source states. No hosted deployment, business acceptance, production readiness or physical-device acceptance is claimed.

This completes the requested first-page implementation increment for Dean's review. People CS-02 is the next shared-record candidate, but no next page is started or authorised by this status entry. The wider inventory's source-audit and runtime-review limits remain in the [earlier fragment](2026-10-19-organisations-figma-build.md).
