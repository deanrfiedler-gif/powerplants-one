---
title: Access & readiness CS-06 native build
date: 2026-10-20
---

Draft PR #629 implements the CS-06 page at `/sites/[id]/readiness` against the [accepted Access & readiness design](../decisions/access-readiness-figma-design.md), including D1–D7/Q1–Q4. Live PPO - Design frames, notes and File index were read. Source: Access & readiness — accepted, page `1400:346423`, notes `1400:347414`; retained icon-free evidence remains unchanged.

Dean authorised professional supporting backend/journey improvements on 20 October. The [implementation decision](../decisions/access-readiness-native-build.md) records isolated requirement drafts in existing immutable snapshots, independent publication, visit binding and stale acknowledgement refusal. No migration, new capability or dependency is required. Field consumers continue to read active requirements. Existing journey fixtures now establish independently published requirements.

The native composition reuses the shared record, tabs, controls, icons and compact phone header, with grouped requirements and exact review/acknowledgement facts. Register, both page contracts, guides and component bindings are updated together. P4 is gated; weekdays and Conversations stay outside scope. Acknowledgement grants no work authority, booking, resources, pack issue or dispatch clearance.

[Verification evidence](../testing/evidence/access-readiness-native/README.md) records executed checks and Windows limits. Twelve focused database tests passed against a disposable `ppo_synthetic_test`; five native browser tests, the persisted CS-06 browser journey, focused unit, type, lint, register, naming and foundation checks passed. Register bindings and independent browser journey fixtures were corrected after the first CI run. A save/read race found by the persisted journey is fixed: further actions wait for the refreshed record and select the saved visit basis. Source presence, functional proof, owner visual review, independent review and deployment remain separate. Native owner visual review and deployment are pending; Figma acceptance is not application acceptance.
