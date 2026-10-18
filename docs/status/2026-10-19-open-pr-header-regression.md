---
title: Open PR integration repairs Conversations and builder header fit
date: 2026-10-19
---

[PR #598](https://github.com/deanrfiedler-gif/powerplants-one/pull/598) found and repaired an R9 header regression when the new Conversations action and the existing development workspace are both visible with an expanded rail. The search now reserves equal side space at laptop widths. The component fixture and regression case cover both rail states and the builder boundary; shared component and shell masters record the change without granting visual approval. [Evidence](../testing/evidence/pr-backlog-integration/README.md) records the failed CI assertion, unchanged-main comparison and the separate existing 800 px expanded-rail limitation. Full combined CI remains the merge gate.
