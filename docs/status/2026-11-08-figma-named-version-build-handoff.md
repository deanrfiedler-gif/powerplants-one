---
title: Builds follow the named Figma version
date: 2026-11-08
---

Dean amended the design-to-build handoff on 8 November 2026 in a [DEAN] comment on [PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727550965). Codex now builds UI from the accepted Figma design pinned to its named version, instead of from captures retained in the repository. The pull request records the values it reads, Claude reviews against the same named version, a later design change needs a new named version and its own build step, and captures of the running application are as-built evidence. The [decision record](../decisions/figma-named-version-build-handoff.md) holds the rules; [ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md#build-handoff) and the [design-to-build standard](../standards/design-to-build-standard.md) are amended to match. Existing retained captures are unchanged. No application code, route, permission, migration or token changes.

<!-- decision-index -->
[Build from the named Figma version](../decisions/figma-named-version-build-handoff.md) (PPO-FIGMA-NAMED-VERSION-HANDOFF-DEC) records Dean's 8 November 2026 decision that Codex builds from the accepted Figma design at its named version, with the read values recorded in the pull request, review against the same version, and captures of the running application as as-built evidence. It amends the handoff in ADR-0067 and the design-to-build standard.
