---
title: Remote diagnosis and escalation SV-08 native implementation in validation
date: 2026-11-01
---

Codex continues [PR #810](https://github.com/deanrfiedler-gif/powerplants-one/pull/810) after Dean's explicit yes to proceeding beyond the three-build limit for this task. Findings [PR #801](https://github.com/deanrfiedler-gif/powerplants-one/pull/801) is still open at independently reviewed head `464f73dd`; its near-merge implementation is merged locally as the dependency, with its own outstanding review fixes retained as separate work. The shared Service review menu and Request remote diagnosis handover are narrow additions.

The synthetic vertical slice now includes case identity and SYN-ESC numbering, migration/seed 0124, native lifecycle, scoped case capability, readonly configuration capture, retained HTML/PDF evidence and hashes, recorded correspondence, Equipment-derived manufacturer support routes/warranty end, and My Work chase/next-action handovers. The [record contract](../contracts/service-escalations.md), [agent decisions](../decisions/service-escalations-native.md), page contract, guides and component bindings are updated. D3 requires an existing finding despite frame 04's unlinked example; Record next action updates that native finding. No manufacturer or customer message is sent.

Functional proof is in progress. Four focused unit tests passed. The reviewed Chrome 156.0.8078.80 browser/PDF prerequisite passed. Initial typecheck exposed integration errors which were corrected; a later check is pending. Initial lint found an unused import, now removed; rerun pending. Database validation found and corrected the missing capability constraint. The first lifecycle run timed out during slow schema setup and is not a pass. Test-cluster lock capacity was increased; only the disposable loopback `ppo_synthetic_test` cluster has reduced disk durability for proof speed. Two earlier seed timeouts did not reproduce in the unmodified-main proof checkout and are not labelled unrelated.

Real npm ci completed in this worktree without a Node engine override or a node_modules junction. The task's dev server uses port 3184. Python is installed as `python`; `python3` is unavailable here. Protected landing documents remain unchanged.

Visual review: the accepted reference captures have been inspected; application comparison is pending. Owner acceptance: unrecorded. Deployment: not run or authorised. Independent Claude review on the eventual exact head, full merge gates and final test outcomes remain outstanding. This is not a completed or production escalation process.
