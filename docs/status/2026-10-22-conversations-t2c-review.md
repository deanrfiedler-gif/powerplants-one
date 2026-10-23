---
title: Conversations T2c independent review and R8 privacy correction
date: 2026-10-22
---

Claude (Opus 5.5) independently reviewed draft [PR #660](https://github.com/deanrfiedler-gif/powerplants-one/pull/660) at `79092a4d245c4817ebec3968a0ea8fcedc1d215b` (merge-base `002af00e`). One Low finding identified an enumerable R8 acknowledgement digest; no other defects were found in the reviewed P1/P3/P4 projection, availability, composition, lifecycle or warning enforcement. The reviewer confirmed 72 passing CI checks/one intentional skip and ran 19/19 focused unit cases; database, HTTP and browser tests were not rerun locally because of host load.

Codex reproduced and accepted the finding, replaced the digest with a server-held HMAC key and added enumeration/binding and HTTP cross-route recovery regression proofs. The affected unit inventory passes 22/22. The HTTP proof runs exclusively because it temporarily changes synthetic source access. Heavy local reruns are deferred under host load; current-head CI and actual results belong to the PR handover. [The design/evidence record](../decisions/conversations-t2c-design.md#independent-review-and-r8-correction--22-october-2026) separates the reviewed commit from the later correction. No migration, grant, capability, provider or dependency is added. Independent follow-up of the correction, Dean's acceptance and production readiness remain separate; the PR stays draft and unmerged.
