# PR #239 — Deals design verification repair

**Date:** 18 September 2026. **Scope:** PPO-009 / CR-01; repair the failed checks on [PR #239](https://github.com/deanrfiedler-gif/powerplants-one/pull/239). Base inspected: `f3b46c4abdd2bb61b118d50bdedde505f312d9cc`.

## Failure evidence and correction

The original `a5bb80d` checks expected CRM page routes and the previous search/sort controls. The subsequent `f3b46c4` checkpoint updates those assertions to canonical Sales routes and the current controls. [CRM layout run 35294061541](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35294061541) then exposed three remaining failed cases: one reference comparison and the two phone layouts.

| Cause | Repair |
|---|---|
| Phone geometry selected the hidden desktop global-search element, whose bounds are zero. The old heading check also required an arbitrary 100px width. | Measure the visible search control and the actual title text bounds. Retain page fit, account placement, non-overlap and card-size assertions. |
| The reference switches to List below 1024px, so waiting for a visible reference card times out. Its resize handler can also replace a card between locating and measuring it. | Compare desktop card styles against the reference using an atomic DOM lookup; at compact widths assert the reference List and the explicitly adapted app Board/stage population. Keep all seven viewport checks and paired screenshots. |
| A denied search can remove its filter drawer between checking visibility and clicking Close. Local browser verification reproduced this additional race. | Move keyboard focus out of the search input, dismiss any remaining drawer with Escape, and assert it is hidden. Search inputs consume Escape themselves, so moving focus is necessary. |

These changes repair test interactions and measurements. No runtime UI, permissions, data, API, dependency or workflow changes are introduced by this follow-up. Negative controls for the original framing/menu defects remain enabled.

## Verification and limits

- Local lint, TypeScript and all 115 unit tests passed for the route/control correction. The final changed test files are linted and type-checked again.
- Focused native browser verification exercises the desktop, 390px and 320px worklist, including search, sorting, snapshots, empty results and denied responses. The design comparison checks 1920, 1440, 1280, 1024, 820, 390 and 320px.
- Local browser checks use Node 24.19.0 and Chromium 153.0.8010.0, with one fresh browser process per case. These are diagnostic results, not the repository's pinned Node 24.21.0 / supported stable Chrome result. The unchanged GitHub workflows provide that verification, plus PostgreSQL and compiled-application coverage.
- A local production build was blocked by Turbopack's refusal of the shared dependency symlink. The pinned CI static/unit/build step on `f3b46c4` passed; this follow-up changes only tests and documentation.
- Exact r22 source remains unchanged: SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`. The r38 reference is also unchanged.

Fresh CI results belong to the repair commit on the linked PR. Merge, hosted deployment and owner acceptance remain separate from this check repair.
