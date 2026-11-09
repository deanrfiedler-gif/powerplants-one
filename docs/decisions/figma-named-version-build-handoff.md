---
document_id: PPO-FIGMA-NAMED-VERSION-HANDOFF-DEC
date: 2026-11-08
owner: Dean Fiedler
status: Owner decision 8 November 2026 ([DEAN] comment on PR #874); amends the build handoff in ADR-0067 and the design-to-build standard; changes no application behaviour
versioning: git
---

# Build from the named Figma version

## Owner decision — 8 November 2026

[ADR-0067](ADR-0067-design-to-build-operating-model.md) and the [design-to-build standard](../standards/design-to-build-standard.md) had Codex build from captures retained in the repository at lock-in, "not from Figma directly". The refined shell's S1 build ([PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874)) instead read its colour values and measurements from the accepted Figma design, and no captures had been retained. Claude raised the difference. Dean answered in chat that Codex should build from the Figma pages, because they are exactly how he wants the pages to look, and then posted this [DEAN] comment on #874 ([comment 6727550965](https://github.com/deanrfiedler-gif/powerplants-one/pull/874#issuecomment-6727550965)):

> Codex builds UI from the accepted Figma design itself, pinned to its named version, not from repository captures. For the refined shell that is the named version "Shell refined concept — accepted" saved on 8 November 2026, with the node IDs recorded in #873. The PR records the values it reads. Claude reviews against the same named version. A later Figma change needs a new named version and its own build step. Captures from the running application are as-built evidence, not a prerequisite. This amends ADR-0067's handoff.

## Rules

1. **The build source is the accepted design at its named version.** Codex reads the frames, variables and measurements from that version, never from the file's current state.
2. **The lock-in names the version.** The decision record gives the file name, the named version, its date and the node IDs of the accepted frames ([citing a design](../standards/design-to-build-standard.md#8-citing-a-design)). This, not a capture set, is what makes a page ready to build.
3. **The pull request records what it read.** Exact values (colours, sizes, spacing, breakpoints) and any discrepancy between frames, with the frame that governs. This is the fixed specification that review and later readers check against without opening a private file.
4. **Review uses the same version.** Claude's one review compares the build with the named version's frames. Where a running browser is available, Claude compares the running page; otherwise CI's captures of the running application.
5. **A design change is a new version.** Editing the accepted frames after a build starts does not change that build. It needs a new named version, a lock-in update and its own build step.
6. **Captures are as-built evidence.** Captures of the running application, taken in CI or review, record what was built. Design captures at lock-in become optional; existing retained captures and their READMEs stay unchanged.

## Why

- Dean's intent is that the app looks exactly like the accepted Figma pages, and Figma holds the exact values a capture only approximates.
- Pinning to a named version keeps what the capture step protected: a fixed reference for the build and the review, so a difference is either a build defect or a recorded later design change.
- Recording the read values in the pull request gives CI-independent, public evidence without committing private artwork.

## Limits

- Named versions depend on the Figma plan's version history, as [ADR-0067's consequences](ADR-0067-design-to-build-operating-model.md#consequences) note. The values recorded in each pull request are the lasting evidence in Git.
- Design ready, Dean's acceptance in words and the decision record are unchanged.
- No application behaviour, route, migration, permission, token or parent requirement ID changes. All 78 parent IDs remain.

Reverse by: a later [DEAN] comment or owner decision.
