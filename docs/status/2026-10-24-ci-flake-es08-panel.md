---
title: ES-08 working-panel intermittent CI failure investigation
date: 2026-10-24
---

Owner: Codex for Dean. Status: investigation claimed; no fix or validation completion yet.

The 10-24 October CI survey, including earlier attempts of rerun workflows, found the same phone working-panel timeout in 15 distinct runs across 11 branches, including four runs on main. It affects Application assurance, Compiled application browser assurance and Estimating E1 assurance. A separate earlier ES-08 layout failure on its implementation branch is excluded.

Two retained main occurrences are [run 39200962124](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39200962124) and [run 39204537439](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39204537439). Their error contexts and screenshots show the Parts page with no working dialog after activating Working for CE-LINE-223. Both time out waiting for the exact Standard screen cloth dialog before checking its 390 px phone width. Artifact archives were downloaded outside the repository and their SHA-256 digests verified; neither archive retains traces.

The next proof will force the save/navigation/preview ordering on unchanged main and compare the same order with the fix. Timing hypotheses are not established causes. No acceptance scenario, visual review, deployment or business approval is claimed. Existing scope ES-08, reference bytes and calculation rules remain authoritative.
