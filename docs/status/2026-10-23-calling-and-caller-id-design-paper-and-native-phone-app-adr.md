---
title: Calling and caller ID design paper and native phone app ADR
date: 2026-10-23
---

Dean asked for Pipedrive-style caller ID and call logging. On 23 October 2026 he accepted the recommended shape: "Proceed: write the calling spec and the native app ADR on the recommended basis, and start with stage 1." Later the same day he accepted every recommended answer: "Proceed with your recommended answers to Q1 to Q12 of the calling paper, and start stage 1 (1a Figma proposal and 1b server core)."

The [design paper](../decisions/calling-and-caller-id-design.md) sets out:

- the rules R1–R9;
- stage 1 in detail: phone numbers, number lookup, call events, Calls to log, click to call and the Log call sheet;
- stages 2–4 in outline;
- Q1–Q12, now answered.

[ADR-0063](../decisions/ADR-0063-native-phone-app.md) records one native phone app and amends [ADR-0032](../decisions/ADR-0032-mobile-installation.md) for phones by a dated note. ADR-0061 is claimed by two open pull requests, so ADR-0062 is left for that renumbering.

This pull request builds nothing: no route, migration, capability, dependency, provider connection, account or store listing. Stages 1a (Figma proposal) and 1b (server core) are authorised and proceed in their own pull requests. Stage 1c waits for the 1a design to be accepted, and stages 2–4 are not authorised. Teams call-record permissions, store approval and on-device caller ID are unverified, and each is proven in its own stage.

<!-- decision-index -->
[Calling, caller ID and call logging](../decisions/calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP) records Dean's 23 October 2026 acceptance:

- a call core in PPO that works with any phone system;
- one native Powerplants One phone app for caller ID and call-end prompts;
- Teams Phone as the first connector;
- subscription readiness as a later, separate decision;
- Q1–Q12 as recommended.

[ADR-0063](../decisions/ADR-0063-native-phone-app.md) is accepted in direction, with Capacitor subject to a spike.
