---
title: My Work refined UI pages proposed in Figma
date: 2026-11-10
---

Dean asked for the refined UI pages of My Work to be built in a new private Figma file. They were drawn on 10 to 12 November 2026 inside the accepted shell, to the Sales module file's standard, so that the queue every module sends work to has one consistent, reviewable design set before any page is built. The file holds 139 sheets and boards across eleven scope pages:

- the Overview, My actions and the Activity window;
- Reviews & handovers, Blocked & waiting and the Team queue;
- Notifications and updates, Search, Conversations and Calls to log;
- interaction states and administration.

There are 27 dialogs and panels, 24 page states, 11 tablet sheets and 27 phone sheets. The Read me cards hold the sheet index and the audit.

On 11 November 2026 Dean added three requirements, drawn as proposals:

- an after-call card that offers to log a call when it ends;
- a full-screen call log on the phone, because calls there usually run in the phone's own app;
- voice notes on every call log, recording the person and never the call.

The [proposal record](../decisions/my-work-refined-ui-proposal.md) (PPO-MYWORK-REFINED-FIGMA-PROP) holds:

- the conformance declaration;
- the sheet inventory with node IDs;
- assumptions A1 to A42 and the proposed departures;
- the verification;
- the audit (corrections, refinements, gaps, new features, polish and a recommended order).

Nothing drawn completes, approves, closes, answers or sends anything that belongs to a source page. The file's link is not recorded here (ADR-0050, ADR-0053).

Checked: a scripted structural pass, position audit, counts scan, forbidden-word scan and story scan over every scope page; a contrast proof from the colour variables (33 of 34 pairs pass; the failure is recorded as C6); `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Every record, person, value and date shown is synthetic.

<!-- decision-index -->
[My Work refined UI proposal](../decisions/my-work-refined-ui-proposal.md) (PPO-MYWORK-REFINED-FIGMA-PROP) records the My Work pages drawn on 10 and 11 November 2026 inside the accepted shell in a new private Figma file, with Dean's after-call card, full-screen phone call log and voice notes. It is a **proposal** awaiting Dean's acceptance and authorises no application code, route, migration, permission, integration or deployment; all data is synthetic.
