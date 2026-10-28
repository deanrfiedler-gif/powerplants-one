---
title: Guide security, malformed front-matter envelope detection
date: 2026-10-29
---

**Scope and ownership.** This stacked, ChatGPT-owned correction addresses the Important unresolved finding on PR #735, src/guides/compile.ts:132 (review discussion r4404583362). It targets #735's contributor-owned branch but does not push to or merge that branch. Integration gate: #737; ADR-0065 decision 8; review policy: CONTRIBUTING.md.

**Threat and fix.** The prior correction closes malformed YAML with an exact --- opener, but returns before inspecting any escaped guide key when the opening line contains trailing whitespace, a BOM or an earlier blank/comment line. Those files are silently skipped outside docs/guides/pages and can make the build succeed despite prohibited content. Discovery now recognises delimiter-like opening lines after blank/comment preambles, asks the existing YAML parser for decoded guide keys and retains strict fail-closed handling for exact openers. For malformed envelopes, it requires guide-key or unsafe alias/complex-key evidence instead of rejecting every damaged ordinary Markdown document. readFrontMatter remains strict: identified malformed guides fail compilation and do not produce release output.

**Regression evidence provided to CI.** The unit/library and spawned-build cases cover BOM, leading blank/comment, indentation, whitespace, CRLF, combined malformed openers, malformed closers, encoded flow keys, invalid YAML, nested aliases, and clean encoded keys. Negative controls cover plain Markdown, fenced YAML examples and regular or malformed non-guide front matter. They test errors and release-file absence as well as expected non-guide build success.

**Scope guard.** No runtime parser, renderer, URL allowlist, publication-visibility rule, route, contract, permission, migration, workflow configuration or dependency changed.

**Validation and review gate.** This fragment describes proposed tests, not a passing result. Independent second-model review by a model different from ChatGPT is required on the exact submitted head. All applicable checks, current-main reconciliation and reviewer defect dispositions must pass before the owner can consider the related PRs merge-ready. Nothing here authorises a merge, deployment or business acceptance.
