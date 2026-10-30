---
title: Guide discovery reads the whole malformed envelope and every comment preamble
date: 2026-10-30
---

**Purpose and ownership.** This is a separately owned draft follow-up for the main-target PR #740, stacked one level onto it. It is written by the Claude session that owns #735, under the work allocation recorded on #740 (comment 6511776243) and Dean's authorisation to land the guide-discovery fix. No other contributor's branch is written. Integration milestone: #737; architecture: ADR-0065, decision 8.

**Defects closed.** Both let a guide outside `docs/guides/pages/` with an escaped YAML guide key skip discovery, so `npm run build` passed and wrote a release file instead of refusing it.

- **Malformed-opener closer.** The independent review of #745 (5705882866) showed that, with a spoiled opener (`--- `, a BOM or a leading blank line), discovery stopped at the first delimiter-like line. A block scalar holding an indented `---`, or a `----` line, therefore hid a later escaped key. A spoiled opener has no trustworthy closer, so discovery now probes every line after it for a guide key, with Markdown code still masked.
- **Comment preamble.** #740's comment 6508552215 showed that two complete HTML comments on one line, or a multiline comment followed by another on its closing line, ended the preamble scan early. Discovery now strips every complete comment on a line. A leading comment that never closes now fails closed: the file is treated as a guide when a decoded guide key appears after it.

**Unchanged.** An exact `---` opener still closes at the next exact `---`, as `readFrontMatter` does. The strict compiler is unchanged and refuses every malformed envelope at line 1.

**Regression coverage.** Eleven attempted guides are covered. Six are delimiter-like-line cases: a spoiled, BOM or blank-line opener, each with a block scalar holding `  ---` and with a `----` line. Five are comment-preamble cases: adjacent, spaced and CRLF adjacent comments, a multiline comment followed by another, and an unclosed comment. Each is checked against the compiler, the library and a spawned build, which must exit 1 and write no release file. Three controls stay excluded and build cleanly: adjacent comments before clean metadata, a spoiled opener with a block scalar and no guide key, and an unclosed comment with no guide key. Without this change, the two detection tests fail.

**Merge gate.** This needs final-head CI, an independent review by a model family other than Claude, adoption into #740 by its owner, and the #740 → `main` gates before it lands. No operational acceptance, merge or deployment has occurred.
