---
title: System pages design accepted
date: 2026-11-01
---

Dean accepted the Figma design for PPO's system pages: "Accept recommendations". The [design decision](../decisions/system-pages-figma-design.md) (PPO-SYSTEM-PAGES-FIGMA-DEC) records D1–D13 and answers Q1–Q13:
- sign-in is redrawn from the accepted r02 source and not redesigned;
- the not-found wording stays and still doesn't separate missing from no access;
- a workspace denial names who to ask, with no Request access button, because AD-01 doesn't support self-service requests;
- one "Outcome unknown" banner and dialog replace seven headings, and external sends keep their own wording;
- no maintenance page or synthetic banner is added.

Twenty-eight icon-free captures with hashes are retained in [system-pages-design-r01](../reference/ui/application-shell/system-pages-design-r01/README.md), and the design register entries for `route:/login` and `system:shell` cite them. In Figma the page is `3031:776966`, the File index row is `3098:5075`, the parts moved to Components section `3098:532053`, and the capture copies sit on the Captures page from y = 1,460,000.

Not done:
- Dean hasn't saved the named version "System pages — accepted" yet.
- The prototype flows have not been played in Present mode.
- Real 200% browser zoom, screen readers, physical devices and live Microsoft sign-in remain open.
- Request access (D4) and ideas I1–I6 are outside the accepted baseline.
- The pages aren't built, and the application keeps its built wording until a build is requested.

`Powerplants-One-Login-r02.html` isn't in the repository, only its hash, so `src/login/` is the source that was redrawn. The login register page said "Return to the requested page" after sign-in; this change corrects it to the fixed destination the login decision records.

No application code, route, migration, permission, grant or parent ID changes. All people, references and operations in the frames are synthetic.

<!-- decision-index -->
[System pages design](../decisions/system-pages-figma-design.md) (PPO-SYSTEM-PAGES-FIGMA-DEC) records Dean's 1 November 2026 acceptance of sign-in, page unavailable, workspace access denied, error and the shared uncertain-outcome and offline patterns. Building the pages is not decided.
