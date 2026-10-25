---
title: Owner decisions — email sending accepted, real rule set authority, Codex build limit
date: 2026-10-26
---

Dean asked for the next step and then for professional recommendations on every open decision. He replied on 26 October 2026: "proceed with your recommendations". This records what that settles.

- **[ADR-0059](../decisions/ADR-0059-email-sending-from-ppo.md) is Accepted**, with option C and the recommended answers to E1–E9. Email a person writes goes from that person's own mailbox; customer notices stay on the shared mailbox (ADR-0058). ADR-0058, the D-025 paper and the Emails design record carry pointers. E4 adds a sixth tracking state, "Viewed · may be automatic", which the Emails Figma frames do not yet show. Nothing is built; each stage E-S1 to E-S4 needs its own authorisation, and the tenant and consent are still to be confirmed with the IT contractor.
- **[Real rule set authority](../decisions/rule-sets-real-data-authority.md)** answers ADR-0066 Q6: real rule sets are never stored in this repository or the hosted demo, only in an approved private environment, family by family with a named engineering owner. The engineer walkthrough runs before the Rules studio design is put up for acceptance. The engineering owner for screens is not yet named.
- **[Codex build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit):** at most three Codex implementation pull requests in progress, and the five with failing checks are finished first. Added to CONTRIBUTING.md.
- **Pull request housekeeping (no repository content):** #686 was closed as superseded by #708, as Dean decided on 25 October. #694 and #708 carry comments that a second-model review is required before merge. The four R10 proposal pages are reviewed together once #712 is complete.

Checked: `scripts/check_foundation.py`, `scripts/check_naming.py`, `scripts/build_status.py --check`, the documentation scope check and a merge-marker scan. This pull request touches owner decision records, so it needs a second-model review before merge.

<!-- decision-index -->
- [ADR-0059: Sending email from Powerplants One](../decisions/ADR-0059-email-sending-from-ppo.md) was accepted by Dean on 26 October 2026: correspondence from the person's own mailbox through delegated `Mail.Send`, notices on the shared mailbox, E1–E9 as recommended; it authorises no build.
- [Real rule set authority](../decisions/rule-sets-real-data-authority.md) (PPO-RULE-SETS-AUTHORITY-DEC) answers ADR-0066 Q6: no real rule set in the public repository or hosted demo; only an approved private environment, family by family; walkthrough before the Rules studio design is accepted.
- [Parallel contribution rules](../decisions/parallel-contribution-rules.md) (PPO-PARALLEL-CONTRIBUTION-DEC) gained a Codex build limit on 26 October 2026: three implementation pull requests in progress at most.
