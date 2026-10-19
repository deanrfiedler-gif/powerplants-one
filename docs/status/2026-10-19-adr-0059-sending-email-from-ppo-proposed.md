---
title: ADR-0059 sending email from PPO proposed
date: 2026-10-19
---

[ADR-0059](../decisions/ADR-0059-email-sending-from-ppo.md) is proposed for Dean's decision. It settles Q1 of the accepted Emails EC-01 design, how people send email from PPO, which also gates Amendment A1 (sent email tracking). It compares four options for consent, permission, audit, retention, replies and tracking: everything from the person's own mailbox through Graph delegated `Mail.Send`; everything through the shared mailbox and the communications service (ADR-0058); a split; and no sending from PPO. It recommends the split: correspondence written in PPO goes from the person's own mailbox as that person, with delegated `Mail.Send` only and never `Mail.Send.Shared` or send-as, while customer notices M1–M4 stay on the shared mailbox exactly as ADR-0058 decides. Tracking applies to correspondence only, never to notices (D-025 R4, A1-Q1), through a tracking image and link redirect on PPO's own application that store the event type and time only for 12 months. Delivery states follow ADR-0058's mapping, and an open never counts as delivered. Questions E1–E9 carry recommendations.

Checked: `scripts/check_foundation.py`, `scripts/check_naming.py` and `scripts/build_status.py --check`. Not done: nothing is accepted, and no app registration, consent, mailbox, DNS change, migration, capability, sending code, tracking endpoint or customer message is authorised. No Microsoft documentation was fetched for this record; the Graph behaviour it relies on is to be verified in the pilot. No parent ID changes.

<!-- decision-index -->
[ADR-0059 — Sending email from Powerplants One](../decisions/ADR-0059-email-sending-from-ppo.md) is **proposed**, 19 October 2026, not accepted. It recommends that correspondence written in PPO goes from the person's own mailbox through delegated Graph `Mail.Send`, and customer notices stay on the shared mailbox through the communications service as ADR-0058 decides. Sent email tracking (Emails A1) would apply to correspondence only, storing the event type and time for 12 months.
