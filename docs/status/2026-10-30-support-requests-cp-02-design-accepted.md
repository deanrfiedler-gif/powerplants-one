---
title: Support requests CP-02 design accepted
date: 2026-10-30
---

Dean accepted the Figma design for CP-02, customer support request and conversation, after playing the flows: "Accept, lock it in". The [design decision](../decisions/support-requests-figma-design.md) (PPO-CP02-SUPPORT-REQUESTS-FIGMA-DEC) records departures D1–D16 and answers Q1–Q8:
- seven customer status words, each mapped to an internal fact, of which CP1 delivers three;
- who needs to act, in words, on every request;
- a guided new request with Received shown only after the commit, and an uncertain receipt that cannot create a duplicate;
- a customer-safe conversation that never shows internal notes;
- a staff public reply that is a separate action from internal notes, as an accepted amendment to SV-02;
- site coordinators seeing requests others raised at their sites;
- urgent issues steered to phone, with no after-hours number until a policy names one.

Q1 gives the recommended direction for D-024 without deciding it. Thirty-five icon-free captures with hashes are retained in [support-requests-design-r01](../reference/ui/customer-portal/support-requests-design-r01/README.md), and the design register page for `scope:CP-02` cites them. In Figma the capture copies sit on the Captures page from y = 470,000, and the Support parts moved to Components › Customer portal.

The named Figma version "Support requests — accepted" was saved on 31 October 2026 after Dean answered "proceed".

Checked:
- No Font Awesome instance or stray vector is left in the capture copies.
- No text colour differs from its bound variable, and no copy carries a prototype link.
- All three prototype flows were played in Figma Present mode, every link clicked. The faults found were fixed and replayed.

Not done:
- `/portal/support` is not built.
- The tablet, phone 320, staff and other state frames are not in a flow; they were checked by screenshot and script only.

No application code, route, migration, permission, grant, identity provider, customer message or parent ID changes.

<!-- decision-index -->
[Support requests design](../decisions/support-requests-figma-design.md) (PPO-CP02-SUPPORT-REQUESTS-FIGMA-DEC) records Dean's 30 October 2026 acceptance of the CP-02 design: a Support list scoped to one site, a guided new request whose result is never claimed before the commit, an uncertain receipt that cannot create a duplicate, a customer-safe conversation, customer status words taken only from facts, and a staff public reply kept separate from internal notes. Building it is not decided.
