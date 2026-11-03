---
title: PJ-05 browser CI fixture cleanup and phone Refresh
date: 2026-11-03
---

PR #803 merges main `b7bc7a460` cleanly and repairs the two causes found in the newest failed browser jobs at `7171630d`. The browser spec records and removes only grant IDs added by its fixture, including after failed preparation, and opens More actions before the record Refresh interaction when that menu is present. The accepted phone record capture and existing consumer note support the overflow placement. Every existing assertion and timeout, the shared browser spec, application code and fixture helpers remain unchanged.

Foundation (including design tokens), prototype, naming, status, migration numbering and 44 documentation regressions pass. Complete `npm run check` passes after the authorised network retry, including 1,356 unit tests and the build. A real database query around the actual setup/teardown callback bodies confirms identical original coordinator rows (79 → 87 → 79) and all grants (437 → 524 → 437). Setup fails later at `ExactDraftUnavailable`, so this is failed-setup cleanup proof, not browser execution.

All 14 commercial database cases are **environment-blocked: browser**, with `ExactDraftUnavailable`; setup reports PostgreSQL ready and browser unavailable. The ordered commercial/shared desktop and mobile browser runs are **not run here; left to GitHub CI**. [Exact CI jobs, accepted capture, test names, errors and evidence](../testing/evidence/project-commercial/README.md#pr-803-browser-ci-fixes--3-november-2026). Claude is asked to confirm only the cleanup, accepted-design placement and unchanged assertions/timeouts. CI and that confirmation remain open. Dean merges; no merge or deployment is performed.
