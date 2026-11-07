---
title: Browser installation attempts have bounded retry and recovery
date: 2026-11-07
---

[Draft PR #868](https://github.com/deanrfiedler-gif/powerplants-one/pull/868)
resumes Prompt W on `codex/browser-install-timeout`, integrating current main
`5a1c09fd`. The [runtime maintenance handover](../delivery/runtime-maintenance.md#bounded-browser-installation--7-november-2026)
records the 120-second installer/recovery deadline, 30-second browser/PDF guard,
native Playwright stale-lock recovery and unchanged three attempts with
ten-second retry pauses. Package-manager locks are never deleted, and cached
FFmpeg assets remain available for video capture. The
official Chrome stable installation and version/PDF guard remain; removing
`--with-deps` alone would still leave Chrome's apt calls.

All 1,435 unit tests pass, including eight PATH-shim regression cases and a
pinned Playwright lock-recovery case. These cover a real process-group timeout that releases a descendant's synthetic lock
and succeeds on retry, and Playwright's own stale-lock reclamation. A first
TERM/grace candidate failed that test and was corrected to kill the complete
group at its deadline. Historical logs confirm the 780-second P11 renderer
installation on `3f07b702` and apt mirror delays. Main's installation baselines
are recorded by exact run/job in the handover for the later ready-head comparison.

Type checking, focused test lint, shell syntax, foundation, naming, status-source
validation and whitespace checks pass. Cloud setup completed with Node
24.21.0/npm 11.19.0 and PostgreSQL 16.15 ready; the setup reports browser
unavailable, and `browser:check` confirms Chrome is absent at
`/opt/google/chrome/chrome`. Real browser suites and real package
installation/recovery are not claimed locally. Claude's one review, ready-head
full-suite results and install timing comparison remain pending under the
[agreed order](https://github.com/deanrfiedler-gif/powerplants-one/pull/868#issuecomment-6690362807).
No workflow, application, dependency, migration or hosted-demo change is included.
