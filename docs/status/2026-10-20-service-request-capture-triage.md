---
title: Service requests SV-01/SV-02 implementation
date: 2026-10-20
---

[Draft PR #636](https://github.com/deanrfiedler-gif/powerplants-one/pull/636) refines the existing Service requests register, logging page and request record against the accepted PPO - Design page 1249:9313, named version Service requests — accepted. Dean separately authorised customer-statement capture and atomic triage, including scoped backend changes. Migration 0112 adds immutable reported-symptom statements; the existing triage command accepts its reviewed fields and permitted owned clarification in one transaction. No new stage, capability, seed, package or deployment is included; the remainder of ADR-0043 and Conversations stay out of scope.

The working design register, page contracts, component consumer bindings and Australian English guides are updated together. The [evidence ledger](../testing/evidence/service-requests-accepted/README.md) separates actual checks and local limits from owner visual review, which remains pending. The known Sites accepted-page implementation prerequisite remains separate; the native Site handover is retained. All 18 native intake database tests and 11 UI fixture cases passed, along with lint, typecheck and register/documentation checks. The native Site-to-statement-to-triage browser journey also passed. Broad CI results are recorded separately in the evidence ledger; local unit/build limits remain explicit. Documentation assurance is not business acceptance.

<!-- decision-index -->
[Service request statement capture and atomic triage](../decisions/service-request-capture-and-triage.md) records Dean's scoped authorisation, immutable customer evidence, atomic reviewed triage, owned clarification authority and deferred ADR-0043 scope.
