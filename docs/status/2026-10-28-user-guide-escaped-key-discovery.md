---
title: User guide stage 1, guide discovery fails closed on unreadable front matter
date: 2026-10-28
---

ChatGPT's independent security re-review of PR #718, on 28 October 2026 against fb4bc093, confirmed four of the five second-model corrections and found **1 Important** defect remaining, with 0 Critical. PR #718 merged before it was fixed, so this follow-up fixes it.

**The defect.** Outside `docs/guides/pages/`, a guide key written with a YAML escape (`"guide\u005fkey"`) was found only when YAML read the front matter cleanly. Front matter with such a key and a YAML error, a duplicate `title` for one, was skipped as not a guide, so a guide with raw HTML in its body passed `npm run build`.

**Implemented:** `declaresGuideKey` in `src/guides/compile.ts` now fails closed. Front matter that YAML reports an error for, or that uses an alias (which a `<<` merge needs), makes the file a guide, so the compiler reports it and the build fails. Front matter that YAML reads cleanly is judged by its keys, as before.

**Consequence for Task 9:** `docs/guides/README.md` and any other Markdown file under `docs/guides/` outside `pages/` must have no front matter, or front matter that YAML reads cleanly with no alias, or it is treated as a guide.

**Checked** on Node 24.21.0 and npm 11.19.0, with the proxy, CA-bundle and `ANTHROPIC_BASE_URL` variables cleared for the unit tests. The two new regression tests failed before the fix and pass after it: a library case (an escaped key with a duplicate key, and an alias) and a spawned build that must exit 1 naming both lines. The full check list and its results are in the pull request.

**Review:** ChatGPT's independent second-model re-review of the correction at cb1d7a79, on 28 October 2026, found no defects in the corrected discovery path. It confirmed that parse errors now force compilation, that aliases and non-scalar keys cannot bypass discovery, and that plain and escaped guide keys are still recognised. That is code-review evidence only.

**Not done:** no acceptance scenario was run. No business approval or production readiness is claimed.
