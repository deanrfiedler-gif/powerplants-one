---
title: Customer messages EC-04 implementation claimed
date: 2026-10-31
---

Codex claims the accepted [Customer messages EC-04 design](../decisions/customer-messages-figma-design.md) at `/email/customer-messages` and `/email/customer-messages/[id]`, using the merged synthetic communications backend. Dean authorised 20 concurrent page builds in this chat on 31 October 2026; seven existing Codex PRs had pushed source implementation at the preflight check. No competing EC-04 claim was found.

The dedicated branch is `codex/customer-messages`. Expected changes cover the page and record, shared Email menu integration, bounded communications read projections, focused tests, the existing communications contract, EC-04 page/guide/register entries, isolated component bindings and module integration, and evidence. No migration, capability, grant, dependency, provider or mailbox integration is planned. Retain the Sales Inbox rail label.

Claim only: implementation, functional proof, application visual review, owner acceptance and deployment remain separate and pending. The accepted design is not application acceptance. Exact-head Claude review and all CONTRIBUTING merge gates remain required.
