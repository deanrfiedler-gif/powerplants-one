---
title: T2e offline fixture preparation
date: 2026-10-24
---

Owner: Codex for Dean. Dedicated branch `codex/t2e-fixture-preparation`, based on current main `e1aeb1ad539afa10eccf46e89c2c188af8bc80a5`. GitHub inspection confirmed PR #679 merged at that commit with final head `37603e08cad9f1a7bf6097ca273aebbd0830a9fb`; its 72 checks comprise 71 successes and the intentional PT-27 skip. The refreshed merged-tree check used `adef52b6c9667cf1a90298796b16fe32612acedb`. Claude reviewed `99721da67f28d9726ade8f3d186b044c8b9880e0`; no subsequent independent review is claimed. Prior setup/mobile failures passed unchanged retries with causes unconfirmed.

No overlapping open issue or PR was found on 24 October. This task claims the remaining corpus gates in the [T2e plan](../decisions/conversations-t2e-evaluation.md): machine-checked catalogue, canonical synthetic preparation, read-only evidence export and offline request/cost bounds. Expected shared paths: that plan, `tests/fixtures/assistant/t2e-cases.json`, `docs/testing/evidence/conversations-t2e/README.md`, `docs/delivery/conversations-t2d-local-adapter.md`, and narrowly necessary assistant contracts; implementation and tests stay in existing assistant/scripts/test folders. No migration, permission, UI, dependency or protected landing-page change is planned.

Dean authorises implementation, synthetic fixtures, offline validation, push and CI repair. This new PR must remain draft and unmerged. Corpus approval, merge permission, calibration/spending, live results, owner acceptance and production readiness remain separate. No credentials or provider account settings may be inspected; no live provider API call is authorised. Current contribution validation and independent review remain pending.
