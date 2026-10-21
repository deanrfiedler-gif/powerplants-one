---
title: Conversations navigation proof repair
date: 2026-10-21
---

Dean authorised a separate investigation of the Conversations navigation failure blocking Facilities PR #627. Codex claims the repair on `codex/conversations-navigation-proof`, cut from current main `bd5d6e6c`. The accepted [T1c design](../decisions/conversations-t1c-design.md#52-pages-and-components) opens the preferred thread on desktop and retains the list on phones; the failing browser assertion expected the list URL on both.

The planned change is limited to the Conversations browser proof and its existing page contract/guide and verification evidence. It will assert the exact desktop thread destination, the phone list and subsequent thread handover, and retain badge/current-page and permission checks. No application behaviour, migration, capability, dependency, Facilities implementation or assistant-core work is proposed. Synthetic verification and CI are pending; owner review, deployment and business acceptance remain separate.
