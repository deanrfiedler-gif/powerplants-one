# Discovery costing implementation evidence

Scope: ES-02, `/estimating/discovery/[id]/costing`. Source: **PPO - Design**, page `1431:809`, **Discovery costing — accepted**. The [page contract](../../../design/development/pages/route-estimating-discovery-id-costing.md) lists every frame and departure. Owner implementation visual review remains **pending**.

The implementation started from `971ac3502f87d5ba7e093bbe37abc83e75d4fb99` in a dedicated worktree. [PR #631](https://github.com/deanrfiedler-gif/powerplants-one/pull/631) contains the delivered source, guide, register and status. No native command, validation, arithmetic, schema, grant or dependency is changed. The original first-estimate screen was compared with its original source and differs only in its exported component name.

## Proof boundary

The focused browser spec mounts the real route, shell and components with synthetic API responses. It exercises manual edits, exact source handovers, native adoption fields, accepted navigation, stale discovery, pending/uncertain/denied outcomes, loading, source revocation, keyboard focus and 1440/1024/390/320 px layouts. It does not prove database persistence or grant authority. The existing native database browser journey was updated for the successor-version UI; its first-estimate path and original-version/quotation assertions remain intact.

Private kit hosts are blocked during captures; only existing local fallback icons appear. The original icon-free references in `docs/reference/` are unchanged. Captures in this evidence directory are synthetic implementation observations, never replacement references or owner approval.

## Checks on 20 October 2026

| Check | Observed result |
|---|---|
| `npm ci` | Installed the pinned dependencies in this worktree. |
| `npm run studio:check` | Passed: 366 entries, 48 component entries, no errors. Review states remain visible. |
| `npm run typecheck` | Passed, including the final native readiness-follow-up display. |
| `npm run lint` | Passed on the clean final repeat. An intermediate run encountered a removed temporary root-level comparison file; that interrupted run is not counted as a pass. |
| Focused costing unit spec | 3/3 passed: stable-ID differences, exact base-10 totals/unknowns and reviewed-source inheritance. |
| Focused costing browser spec | 9/9 passed across all four widths. The two recovery/dialog tests passed again after copy refinement; the incomplete/legacy/denied/error scenario passed again after the native follow-up fixture improvement; the final stale-state rerun passed 1/1. |
| Shell host-contract regression | 1/1 passed after adding the costing entry to `ui-baselines.json`; the earlier CI failure was a missing costing contract. The same contract assertions passed against unmodified origin/main source (56 existing entries). |
| `npm run test:unit` | Not passed. The ordinary run hit worker/process limits. A bounded-concurrency repeat recorded CLI deadline, performance-budget and P06 private-adapter failures and was stopped before completion. These failures have not been reproduced on an unmodified main checkout and are not labelled non-regressions. |
| `npm run build` | Not passed locally: Windows OS error 1450 (insufficient system resources) while Turbopack read `detect-libc`. No successful local production build is claimed. |
| `python scripts/check_naming.py` | Passed: 741 document records; no errors. |
| `python scripts/check_foundation.py` | Two local attempts did not complete; the first ran for more than 40 minutes without a result. No local pass is claimed. The CI foundation check passed on code commit `123b2dab`; the final PR commit still needs its own CI result. |
| Status / build-sequence generators | Ran `python scripts/build_status.py` and `python scripts/build-ui-sequence.py`; sequence output is untracked `tmp/` output under the current repository workflow. |
| `git diff --check` | Passed during preparation. |
| Native database / HTTP suites | Not run locally for this change. The existing ES-02 CI suite includes the native costing journey and now selects the focused presentation spec. CI results are separate from the fixture proof above. |

The bounded full-unit attempt included failures in the operator CLI upgrade/verify startup tests, measured workload/CPQ performance tests, and the P06 private adapter tests. No baseline conclusion is inferred from a Windows failure. An early browser retry also hit browser shutdown and another resumed run hit connection refusal after the local server stopped; the server was restarted before the state rerun.

CI subsequently completed on `5a291aaa35a0e0e1fffd1a70dcced802c725e7cd`: **68 checks passed, one skipped, none failed**. This includes [E1 quality](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39369749876/job/118463330669), [compiled E1/ES-02 browser proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39369749876/job/118463330965), [E1 database proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39369749876/job/118463330668) and [documentation foundation](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39369750103/job/118454713721). These CI results do not turn the unsuccessful local attempts into passes. The later merge of main `5ebb5c0a` resolves overlapping People/costing consumer documentation and regenerates status; its resulting commit requires fresh CI.

## Retained synthetic captures

[Capture dimensions, hashes and run context](captures.json). Top views: [desktop](captures/costing-1440.png), [tablet](captures/costing-1024.png), [390 px](captures/costing-390.png), [320 px](captures/costing-320.png). Lower content: [desktop totals](captures/totals-1440.png), [phone lines](captures/lines-390.png), [320 px totals](captures/totals-320.png). States: [review](captures/review.png), [adopting](captures/adopting.png), [uncertain](captures/uncertain.png), [incomplete](captures/incomplete.png), [legacy](captures/legacy.png), [denied](captures/denied.png), [loading](captures/loading.png), [stale discovery](captures/stale.png), [read error](captures/error.png), [phone validation](captures/validation-390.png).

## Visual comparison and retained departures

The live frames were inspected for desktop, tablet, phone, dialogs, loading, not-ready, stale and notes. The retained desktop reference was cross-checked against the live frame. Implementation checks cover the initial viewport, cost lines, lower totals and keyboard/validation editor at each width. Scrolling remains owned by the page content; a full-height reference is represented by separate top/lines/totals captures.

| Accepted source | Comparison / deliberate difference |
|---|---|
| Desktop `1431:846`, tablet `1431:1610` | Shared shell, ruled content, bounded grid, navy Pricing/action, equal total tiles and summary treatment. Native saved narratives, five-line fixture, counters and totals replace the illustrative six-line proposal; no quantities or prices are inferred. |
| Phone `1433:2403`, `1431:1921`, `1433:2492` | Current shared compact header, cards, two total rows, sticky actions and full-screen editor. Header treatment follows the requested shared-header amendment. Estimate title, arithmetic explanation and manual line controls remain available. |
| Review `1432:375662`, adopting `1433:376501` | Exact saved basis and proposed successor version, reason, confirmation and frozen submission. Native validation retains its existing policy. |
| Stale `1432:376321`, not ready `1432:377502` | Proposal kept and adoption blocked; current saved revision must be explicitly reviewed. Native unresolved questions and configuration readiness findings provide the return links. |
| Uncertain `1431:2114` | Original save is reconciled; no replacement operation. Copy accurately allows the unchanged native retry of the same request when its receipt is missing. No request-sent time is fabricated. |
| Legacy `1431:2129`, denied `1431:2143`, loading `1431:2157` | Separate blocked/recovery/loading states; protected details disappear on source revocation, and missing totals are not zero. |

Remaining decisions for Dean: the authorised but undrawn phone editor and its desktop counterpart; the unavailable Cost types view; direct Alternatives/Revisions and option navigation in the owning wizard. These views currently hand back to the existing workspace. The inherited wizard button opt-in classes and compact-header override are bounded compatibility adaptations. Private Pro kit appearance, physical devices and assistive technology have not been visually accepted here.

Code delivery, source acceptance, functional proof, owner visual review and deployment remain separate. No hosted deployment or business acceptance is claimed.
