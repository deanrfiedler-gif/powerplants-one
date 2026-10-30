---
title: Guide discovery treats an escaped guide key as the same key written plainly
date: 2026-10-30
---

**Purpose and ownership.** This is a separately owned draft follow-up for the main-target PR #740, stacked one level onto its head `a0c1b797`. It is written by the Claude session landing #740 under Dean's authorisation of 29 October 2026. It fixes the defects found by the Claude review of the ChatGPT-authored parts of #740 at `a0c1b797`. No other contributor's branch is written. Integration milestone: #737; architecture: ADR-0065, decision 8.

**Defects closed.** Each let a guide outside `docs/guides/pages/` whose key was escaped, such as `"guide\u005fkey"`, skip discovery. The build then passed and wrote a release file. In each case the same file with a plain `guide_key` was refused.

- **Front matter that is a list or nests the key.** Behind an exact `---` opener, discovery only searched the raw lines for `guide_key`, so an escaped key in a list item or under another key was missed. An exact opener's front matter now declares a guide when it could hold a guide key once YAML's double-quoted escapes are decoded, at any depth and in any shape. This needs no parse, so front matter without a possible guide key is no longer refused for a YAML error. An exact opener with a spoiled closer and no guide key, which `d8e7742f` had begun refusing, is skipped again.
- **Openers with text or invisible characters.** `--- # front matter`, `---yaml`, `--- yaml`, a no-break space, a zero-width space and a form feed beside the dashes were not recognised as opener attempts. Any first line that starts with three dashes, after spaces or invisible characters, is now one.
- **Keys hidden by code masking.** After a spoiled opener, discovery masks Markdown code, and YAML could make a key look like code. Examples are a fence-like line inside a block scalar, and a heading-shaped comment before indented keys. The library's loose rule, a guide key line in the first 40 lines, now also reads those lines as YAML would decode them, so it catches an escaped key wherever it catches a plain one.
- **A key cut in half at line 40.** Codex's review of #755 (5708817813) showed that the loose rule cut the file at 40 lines before decoding, so a key starting on line 40 and continued by an escaped line break was missed. The rule now reads each line that starts in the first 40 to its end, following escaped line breaks however far, in time linear in the file's length. A key starting on line 41 stays outside the rule, escaped or plain.

**Decision: the code-example controls.** Five controls from `abd832b5` kept an escaped key inside a fenced or indented example in a file's opening lines. The same examples with a plain key had always been refused by the loose rule. Under Dean's standing order, an escaped key is now treated like a plain one. Within the first 40 lines, a guide key line in code is refused either way. The five controls move their examples past line 40, where they still show that discovery masks Markdown code. The early fenced example is now a refusal case.

**Tests that now prove the key matters.** The exact-closer cases from #745 inherit a duplicate key, which on its own made discovery refuse them. A new check removes their escaped key and requires them not to be guides.

**Regression coverage.** Eleven attempted guides are covered:
- an exact opener with a list or a nested key;
- six opener variants;
- a fence-like line in a block scalar;
- a heading-shaped comment before indented keys;
- a fenced example in the opening lines;
- an explicit key past line 40 behind `--- # front matter`.

Each is checked against the compiler and the library, beside its plain-key twin, and in a spawned build that must exit 1 and write no release file. Two controls stay excluded and build cleanly: exact openers with a `--- ` or `----` closer and no guide key. Without this change, all three of these tests fail.

**Line-40 boundary coverage.** Keys behind a fence-like line in a block scalar, which discovery masks, are checked with their plain twins, in LF, CRLF and lone CR:
- a key starting on line 39 or 40 and continued past line 40 is refused, as is a 30-line continuation from line 40;
- the same keys starting on line 41 stay excluded and build cleanly.

Without the boundary fix, this test fails.

**Merge gate.** This needs final-head CI, an independent review by a model family other than Claude, adoption into #740, and the #740 → `main` gates before it lands. No operational acceptance, merge or deployment has occurred.
