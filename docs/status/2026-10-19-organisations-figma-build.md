---
title: Accepted page inventory and Organisations implementation claim
date: 2026-10-19
---

Dean's 19 October implementation brief authorises an inventory of accepted page designs followed by Organisations CS-01 only, with a stop after that increment. This Codex session owns branch `codex/cs01-organisations-figma-build`, cut from `main` at `fe0dd1c3`, in its dedicated worktree. The initial contribution claims the work; inventory verification and the design-region gap analysis are in progress. No application change or completed parity is claimed by this initial entry.

The scope is `/customers`, `/customers/[id]` and the organisation form at `/customers/new`, following the [accepted Organisations design](../decisions/organisations-figma-design.md) and its [icon-free captures](../reference/ui/customers/organisations-design-r01/README.md). Shared controls, source reads, page contracts, Draft guides and component examples will be changed only where this composition requires them. Existing creation variants, commands, permissions and recovery remain in scope for regression verification. The named Figma version remains pending as recorded by the source; no Figma write is authorised.

Open pull requests #600 and #601 claim Conversations, #602 claims the Site surveys design lock, and #603 updates dependencies. None claims Organisations as read on 19 October. Their work is excluded. The application shell, hosted deployment, issued references, production systems and customer communication are excluded. Inventory findings do not authorise the next page, a new migration, grant, capability or calculation rule. Owner visual review, functional proof, CI, merge, business acceptance and deployment remain separate.
