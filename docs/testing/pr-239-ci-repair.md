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

### Retained restart journey, run 35327559113

[Run 35327559113](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35327559113) left one failed job: the retained CRM journey across application and database restarts. `locator.fill` on **Search opportunities** waited 30 seconds and reported the field detached from the DOM.

| Cause | Repair |
|---|---|
| `scripts/crm-restart-proof.ts` takes the search field directly at 1440x1000. Under r38 the desktop field belongs to the Filters drawer, and `useDesktopCRM()` starts `false`, so the compact shell portal mounts the field for one client render and unmounts it when the media query resolves. The script resolved that node and then waited for a field this viewport no longer has. | Wait for the client-rendered worklist, then call the shared `fillOpportunitySearch` helper, which asks the page the same media query the component asks and opens the drawer on desktop. |

Reproduced and corrected locally against real PostgreSQL 16 and the launched application: the `write` phase failed identically before the change, and `write`, an actual PostgreSQL restart and `verify` all passed after it. That run used Chromium 141 rather than the reviewed stable Chrome 153, with the version guard bypassed for the run only and unchanged in the tree; CI remains the authority for the supported browser.

## Verification and limits

- Local lint, TypeScript and all 115 unit tests passed for the route/control correction. The final changed test files are linted and type-checked again.
- Focused native browser verification exercises the desktop, 390px and 320px worklist, including search, sorting, snapshots, empty results and denied responses. The design comparison checks 1920, 1440, 1280, 1024, 820, 390 and 320px.
- Local browser checks use Node 24.19.0 and Chromium 153.0.8010.0, with one fresh browser process per case. These are diagnostic results, not the repository's pinned Node 24.21.0 / supported stable Chrome result. The unchanged GitHub workflows provide that verification, plus PostgreSQL and compiled-application coverage.
- A local production build was blocked by Turbopack's refusal of the shared dependency symlink. The pinned CI static/unit/build step on `f3b46c4` passed; this follow-up changes only tests and documentation.
- Exact r22 source remains unchanged: SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`. The r38 reference is also unchanged.

Fresh CI results belong to the repair commit on the linked PR. Merge, hosted deployment and owner acceptance remain separate from this check repair.
