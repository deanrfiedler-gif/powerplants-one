---
title: Customer messages EC-04 implementation and proof
date: 2026-10-31
---

Codex claims the accepted [Customer messages EC-04 design](../decisions/customer-messages-figma-design.md) at `/email/customer-messages` and `/email/customer-messages/[id]`, using the merged synthetic communications backend. Dean authorised 20 concurrent page builds in this chat on 31 October 2026; seven existing Codex PRs had pushed source implementation at the preflight check. No competing EC-04 claim was found.

The dedicated branch is `codex/customer-messages`. Expected changes cover the page and record, shared Email menu integration, bounded communications read projections, focused tests, the existing communications contract, EC-04 page/guide/register entries, isolated component bindings and module integration, and evidence. No migration, capability, grant, dependency, provider or mailbox integration is planned. Retain the Sales Inbox rail label.

Implementation is present in draft PR #804: both routes, shared Email menu, exact confirmation, native withdrawal/reconciliation, reasoned class switches, bounded reads and uncertain-command recovery. Focused proof and four-width comparison are in progress; see [execution evidence](../testing/evidence/customer-messages/README.md). Application visual acceptance, owner acceptance and deployment remain separate and pending. The accepted design is not application acceptance. Exact-head Claude review and all CONTRIBUTING merge gates remain required.
