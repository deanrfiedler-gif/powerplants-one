---
title: Calling core server, stage 1b
date: 2026-10-23
---

Dean authorised calling stage 1b on 23 October 2026: "Proceed with your recommended answers to Q1 to Q12 of the calling paper, and start stage 1 (1a Figma proposal and 1b server core)." The [calling core contract](../contracts/calls.md) describes what is now built:

- labelled phone numbers for people and organisations, read into E.164 in the company's region, with unreadable text kept and flagged;
- number lookup, with every permitted match and nothing hidden;
- call events and Calls to log, with click to call that completes nothing;
- skip with a reason, and skipped events purged after 30 days;
- Log call, which creates one completed Call activity with immutable call details.

The existing single phone field keeps working, and it refuses rather than guesses once a person has several numbers.

The change consists of migration 0118 and [ADR-0064](../decisions/ADR-0064-phone-number-library.md), which adds libphonenumber-js 1.13.15. It adds no capability, grant, seed or page. Call events are a new business identity type, so 0118 follows the `identity_target` rule.

Nothing is visible in the app until stage 1c builds the UI to the accepted stage 1a design. The phone app (stage 2) and the Teams connector (stage 3) are not authorised. The lockfile change alters the DK06-OUT09-1 fingerprint, as every dependency update does. Validation results are recorded in the pull request. A different-model review is required before merge.

<!-- decision-index -->
[ADR-0064](../decisions/ADR-0064-phone-number-library.md) records reading phone numbers with libphonenumber-js, adopted as Q7 of [PPO-CALLS-CALLER-ID-PROP](../decisions/calling-and-caller-id-design.md) on 23 October 2026.
