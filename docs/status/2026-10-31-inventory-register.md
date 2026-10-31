---
title: Inventory SC-05 implementation claim
date: 2026-10-31
---

Codex claims the accepted Inventory SC-05 build at `/supply/stock`, following [the design decision](../decisions/inventory-figma-design.md). Dean explicitly authorised this build and raised the concurrent page-build limit to 20 in this chat on 31 October 2026. Seven open Codex PRs contained `src/` implementation at the preflight check; no Inventory claim was found. Receiving design PR #787 remained open and unmerged.

Scope: permission-scoped per-item reads over native Supply observations; register, snapshot and item record; Inventory rail label; preserved native observation form and command recovery. Unknown quantities remain Unknown. No Product mapping is inferred or persisted. MYOB remains the intended ERP authority; activity is evidence history, not stock movement.

Expected changes: `src/supply/`, `src/app/api/v1/supply/records/route.ts`, `src/shell/navigation.ts`, `src/shell/module-workspaces.ts`, focused Supply tests, the authoritative Supply contract and guide, narrow SC-05 changes in the design register and guides, page contracts, new component-binding and module-integration files, and synthetic comparison evidence. No migration, capability, grant or dependency is planned. Shared register edits will preserve unrelated entries.

Status: claimed; implementation, functional proof, visual comparison, independent review and deployment are not completed. The accepted design does not grant visual acceptance to the application.
