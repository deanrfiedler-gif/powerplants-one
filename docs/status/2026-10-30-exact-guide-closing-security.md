---
title: Exact guide front-matter closing delimiter security follow-up
date: 2026-10-30
---

**Purpose and ownership.** This narrowly scoped, separately owned draft follow-up targets the ChatGPT-owned main-target PR #740, in response to the Important independent Claude finding recorded under PR #735. It is stacked one level directly onto #740. No contributor branch is overwritten. Integration milestone: #737; architecture: ADR-0065, decision 8.

**Security correction.** Strict readFrontMatter closes a valid opening --- only at an exact later --- line. The old declaresGuideKey discovery stopped earlier at indented ---, --- plus trailing whitespace or ----, so an escaped guide key later in the actual front matter could be omitted and forbidden guide content could escape build validation. For exact openers, discovery now uses the compiler's exact closing rule. Malformed openers retain the separate conservative discovery policy.

**Regression coverage.** Direct compiler, library and spawned-build cases cover the three mismatched delimiters, decoded escaped guide keys, forbidden Raw HTML, nonzero exit and no released.json on failure. An ordinary contents document with a valid YAML block scalar holding indented --- remains excluded and its spawned build succeeds.

**Merge gate.** Run final-head guide/unit, lint, TypeScript, production build and applicable CI, resolve independent different-model findings, reconcile with current main and obtain the owner's separate authorisation. No operational acceptance, merge or deployment has occurred.
