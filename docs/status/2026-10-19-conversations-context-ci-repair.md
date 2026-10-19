---
title: Conversations context panel CI repair
date: 2026-10-19
---

Dean requested repair and merge of [PR #600](https://github.com/deanrfiedler-gif/powerplants-one/pull/600) on 19 October 2026. Codex owns the repair on `codex/pr-600-context-repair`, integrating the original context-panel commits with current main. The failing jobs reported React immutability errors in the Context button focus restoration. The page now owns and consumes the focus request through a stable callback; the button no longer mutates a prop. Browser coverage checks repeated keyboard reopen cycles and that a later viewport-driven mount does not steal focus. The status conflict is resolved by regeneration, retaining both T1c-3 and current main. The working route master records the focus behaviour. Local design-register validation passes; full CI remains the merge gate. This repair does not grant visual approval or production readiness.
