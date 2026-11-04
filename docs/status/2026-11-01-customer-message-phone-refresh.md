---
title: Customer message refresh remains reachable on phones
date: 2026-11-01
---

Codex addresses the [#804 phone refresh handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/804#issuecomment-6547659540) in a separate child branch, `codex/customer-message-phone-refresh`. At phone widths only duplicate record navigation links are hidden; Refresh message remains visible with its existing loading and command guards. EC04-B05 is unchanged.

The [evidence clarification](../testing/evidence/customer-messages/README.md#phone-refresh-follow-up--1-november-2026) distinguishes the original eight reported passes from Claude’s later 25/26 run and known mobile failure. Browser execution, visual comparison, independent review and CI remain pending. No merge, acceptance or deployment.
