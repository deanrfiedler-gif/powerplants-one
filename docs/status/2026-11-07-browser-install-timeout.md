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

The original 1,435 unit tests passed, including eight PATH-shim regression cases and a
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
installation/recovery are not claimed locally. Claude's
[one review of head 4402d3adc](https://github.com/deanrfiedler-gif/powerplants-one/pull/868#pullrequestreview-5811095877)
identified F1: local installs must retain interactive privilege prompts and work
without GNU timeout. The fix retains the bounded path when timeout and the
required noninteractive privileges are available; otherwise it warns and uses
the original unbounded attempt loop. Two added PATH-shim cases cover missing
timeout and password-required sudo, including retry success, exhausted install
failures and guard refusal. Confirmation of F1, ready-head full-suite results
and install timing comparison remain pending under the
[agreed order](https://github.com/deanrfiedler-gif/powerplants-one/pull/868#issuecomment-6690362807).
After F1, all 1,437 unit tests pass, including all eleven installer/lock cases;
typecheck, focused lint, shell syntax and documentation checks pass. The full
unit run uses `TMPDIR=/var/tmp`: the first run's unrelated recovery test rejected
the default temporary path as inside Git (1,436 passed, one failed). That test
passed in isolation on unmodified main, and the complete suite passed with the
explicit temporary directory. No application code or assertion was changed.
No workflow, application, dependency, migration or hosted-demo change is included.
