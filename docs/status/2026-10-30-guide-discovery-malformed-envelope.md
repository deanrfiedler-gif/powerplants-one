---
title: Guide discovery reads the whole malformed envelope and every comment preamble
date: 2026-10-30
---

**Purpose and ownership.** This is a separately owned draft follow-up for the main-target PR #740, stacked one level onto it. It is written by the Claude session that owns #735, under the work allocation recorded on #740 (comment 6511776243) and Dean's authorisation to land the guide-discovery fix. No other contributor's branch is written. Integration milestone: #737; architecture: ADR-0065, decision 8.

**Defects closed.** Both let a guide outside `docs/guides/pages/` with an escaped YAML guide key skip discovery, so `npm run build` passed and wrote a release file instead of refusing it.

- **Malformed-opener closer.** The independent review of #745 (5705882866) showed that, with a spoiled opener (`--- `, a BOM or a leading blank line), discovery stopped at the first delimiter-like line. A block scalar holding an indented `---`, or a `----` line, therefore hid a later escaped key. A spoiled opener has no trustworthy closer, so discovery now probes every line after it for a guide key, with Markdown code still masked.
- **Comment preamble.** #740's comment 6508552215 showed that two complete HTML comments on one line, or a multiline comment followed by another on its closing line, ended the preamble scan early. Discovery now strips every complete comment on a line. A leading comment that never closes now fails closed: the file is treated as a guide when a decoded guide key appears after it.

- **Multi-line keys.** Codex's executed review of #749 (5707083000) showed that the line-by-line probe missed a key spanning lines. Examples are an explicit `? key` with its `: value` below, or a flow mapping, behind any malformed envelope and with any line ending. The probe now also reads the lines after the opener as a YAML stream, and each run between delimiter-like lines on its own. It checks every key YAML recovers, with Markdown code still masked.
- **Invalid text before a multi-line key.** Codex's re-review (5707405123) showed that a line of invalid plain text before an explicit key stopped YAML recovering the pair, and the line probe skipped `? key` lines. Discovery now reads an explicit `? ` key line on its own. It also re-reads the YAML from each line that can open a multi-line key (an explicit key, a flow collection or a quoted key). Each such read covers at most 64 lines, so the work stays linear in the file's length.
- **A key longer than the read window.** Codex's third review (5707757203) showed that a quoted key whose escaped line breaks ran past those 64 lines was skipped. When the window, rather than a delimiter-like line or the end of the file, cuts off a key YAML is still reading, discovery now refuses the file. Such a key is an open quoted scalar or flow collection, or an explicit key with only blank lines, comments or its own deeper content after it.

**Guide-specific evidence.** A spoiled opener, and the reads above, now first check that the text after it could hold a guide key once YAML's double-quoted escapes are decoded. Every key YAML reads is literal text or a double-quoted scalar, so a file failing that check cannot declare a guide key. This keeps the window refusal to files that mention a guide key. It also stops ordinary Markdown behind a `----` rule being refused because YAML reads `*emphasis*` at the start of a line as an alias. Behind `----` or `--- `, 1,332 of the 3,714 file-and-opener combinations across the repository's 1,857 tracked Markdown files were refused before this change. Afterwards, only `docs/guides/crm-deals.md`, which is a guide, is refused, once for each opener.

**Unchanged.** An exact `---` opener still closes at the next exact `---`, as `readFrontMatter` does. The strict compiler is unchanged and refuses every malformed envelope at line 1.

**Regression coverage.** Thirty-one attempted guides are covered.
- Six are delimiter-like-line cases: a spoiled, BOM or blank-line opener, each with a block scalar holding `  ---` and with a `----` line.
- Five are comment-preamble cases: adjacent, spaced and CRLF adjacent comments, a multiline comment followed by another, and an unclosed comment.
- Eight are multi-line-key cases. Explicit keys appear after a spoiled, BOM or blank-line opener, after a `----` line, after an unclosed comment, and behind adjacent comments, across LF, CRLF and lone-CR endings. A flow-mapping key appears behind a BOM opener.
- Five are invalid-prefix cases: a line of invalid text, then an explicit key (LF, CRLF and lone CR), a flow-mapping key or a single-line key.
- Seven are read-window cases after invalid text. A quoted key has 62, 63 or 70 continuation lines, the last also with CRLF and lone CR. An explicit key and a flow mapping each follow 70 comment lines.

Each is checked against the compiler, the library and a spawned build, which must exit 1 and write no release file. Eight controls stay excluded and build cleanly. They are:
- adjacent comments before clean metadata;
- a spoiled opener with a block scalar and no guide key;
- a spoiled opener with an explicit non-guide key;
- invalid text before an explicit non-guide key and prose with braces;
- an unclosed comment with no guide key;
- emphasis at the start of a line behind a `----` rule;
- 80 lines of prose with links, braces and apostrophes that mentions `guide_key`, behind a `----` rule;
- a 70-line quoted non-guide key after invalid text.

Without this change, the two detection tests and the control test fail.

**Merge gate.** This needs final-head CI, an independent review by a model family other than Claude, adoption into #740 by its owner, and the #740 → `main` gates before it lands. No operational acceptance, merge or deployment has occurred.
