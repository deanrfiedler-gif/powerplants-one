---
title: PJ-07 implementation authorised for publication and full CI
date: 2026-11-13
---

Dean authorised the requested three-build-limit exception for the completed PJ-07 readiness API: “Yes. Proceed however you believe is the most professional.” The [decision](../decisions/project-readiness-api.md) records the scope. This supersedes the publication hold in the earlier local-only checkpoint for this contribution; it does not change the standing concurrency or Dean-only merge rules.

Implementation commit `3831f8235174708629d8fc8dd045fb0e6a0c0ee6` and its [execution evidence](../testing/evidence/project-readiness/README.md) are ready to publish through [PR #948](https://github.com/deanrfiedler-gif/powerplants-one/pull/948). Main was fetched explicitly and remains `bdcdd347fcb29c3806cd23d1e85be03f972b6628`; merging it required no changes. This follow-up changes documentation only and retains the tested source hashes. The PR is to be marked ready after the push so full CI runs; its current-head handover records actual CI progress.

Local validation remains 1,451 standard units and production build, six unmocked DB cases across two runs, the separately labelled six-case command-only renderer run, compiled HTTP, real PostgreSQL restart and documentation assurance. Full CI with the real renderer and one independent Claude review are still required. No merge, deployment, visual acceptance or operational release is claimed.
