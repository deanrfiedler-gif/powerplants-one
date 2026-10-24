---
title: ES-08 Working activation during calculation refresh
date: 2026-10-24
---

Owner: Codex for Dean. Status: root cause reproduced; approved fix under validation in [draft PR 693](https://github.com/deanrfiedler-gif/powerplants-one/pull/693).

The 10-24 October CI survey, including earlier attempts of rerun workflows, found the same phone working-panel timeout in 15 distinct runs across 11 branches, including four runs on main. It affects Application assurance, Compiled application browser assurance and Estimating E1 assurance. A separate earlier ES-08 layout failure on its implementation branch is excluded.

Two retained main occurrences are [run 39200962124](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39200962124) and [run 39204537439](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39204537439). Their error contexts and screenshots show the Parts page with no working dialog after activating Working for CE-LINE-223. Both time out waiting for the exact Standard screen cloth dialog before checking its 390 px phone width. Artifact archives were downloaded outside the repository and their SHA-256 digests verified; neither archive retains traces.

The cause is an enabled Working button moving during a pointer click. A saved preview refresh removes the stale-calculation notice above the Parts table. On unchanged compiled main `79bef1d32f42cd2dcdbf04ce0f30a4374199db2e`, releasing the real held preview between pointer-down and pointer-up reproduces the missing dialog; the trace records no completed click on the button. That run also reached its overall deadline under machine load. Releasing the response before the click passes (1/1, 33.0 seconds). The permanent held-response regression body fails cleanly on main (26.3 seconds): Working is enabled while the saved preview is held. The same body passes with the fix (1/1, 20.6 seconds), including the exact 390 px panel and Escape focus return. The temporary probe resets its fixture separately and waits for the initial record read to isolate the forced ordering from setup load.

Dean approved temporarily disabling Working during that refresh on 24 October 2026. The application uses the existing calculation-readiness state; the held-response regression preserves the exact dialog, 390 px width and Escape focus-return checks. The component state/implementation binding, existing consumer records and owner view specification describe the approved state. No calculation, saved snapshot, permission or migration changes.

Validation at the local implementation checkpoint: fixed compiled build, lint, explicit 8 GB typecheck, studio, foundation, naming and status checks passed. The full unit suite ran sequentially: 1,080 passed, with the two documented Windows document-store failures and the documented recovery failure; no other failures, skips or cancellations. The original browser journey was attempted alone but exceeded the unchanged deadline while creating its browser context, before application assertions. A prior database reset hit the unchanged migration statement timeout; the reset succeeded with the task server stopped.

The successful forced after-proof ran at 68–100% CPU with roughly 1.5–1.8 GiB free memory. Earlier local work reached approximately 0.1 GiB free memory. These local passes are causal proof, not quiet-machine repeat reliability. The 20-repeat window, integration against the newer calling-core main and final-head CI remain pending; their results are tracked in PR 693. Node 24.22.1 differs from the 24.21.0 pin; the task-owned install used engine-strict=false and left package-lock.json unchanged. Backend draft 690's 103-file list was checked before editing and has no overlap with these changes.

No acceptance scenario, visual review or deployment is claimed. Existing scope ES-08, reference bytes and calculation rules remain authoritative.
