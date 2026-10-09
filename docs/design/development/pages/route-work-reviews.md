# Reviews and handovers — design reference

Stable entry: `route:/work/reviews`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline and existing issued references remain recorded in the register. SH implementation is synthetic and bounded; guide, visual and owner acceptance remain separate.

## Purpose and task

Coordinate current review work without creating another approval authority. My reviews, All permitted, Returned to me, Handovers, Sent by me and History use real source records.

1. Choose the perspective that matches your work.
2. Filter by source and owner, then inspect the current task detail.
3. Use Open source to review or correct the source record; return to refresh the queue.

## Desktop

Use a bounded worklist with six perspectives and source/owner filters. Keep source-state notices and qualified counts visible. Reuse WorkDialog for detail and hand off through the source link. Retain the existing 1440/1280/1024 layout and test the intermediate 768 width. The merged global design-workspace and information controls remain available.

## Mobile

Wrap all six perspectives and filters, stack long source/owner details at 390 and 320 CSS px, and keep Open source and dialog close reachable. Keyboard focus returns on Escape. Review decisions require the online source workflow. Verification covered widths 430, 390 and 320; physical-device and owner acceptance remain pending.

## Shared components and states

Use existing My Work styles, semantic tokens, WorkDialog and platform resource lifecycle controls. The scoped native SH button/input styles are retained as the My Work compatibility exception; this change does not replace the shared control system.

All-source failure/denial does not show zero workload. A partial source slice remains qualified. History is distinct from current actionability, and missing owner/due facts are not invented.

## Visual references

- [reviews-all-permitted.png](../../../testing/evidence/sh-platform/captures/reviews-all-permitted.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [returned-detail-phone.png](../../../testing/evidence/sh-platform/captures/returned-detail-phone.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [receiver-desktop.png](../../../testing/evidence/sh-platform/captures/receiver-desktop.png) — synthetic implementation capture, pre-PR #283 shell integration; not an approved mockup.
- [PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html](../../../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) — retained design reference.

## Behaviour, handovers and verification

Only the source command records the business decision. The coordination queue re-resolves source access/version before opening and requires refresh after a stale result.

A missing due date says Date needed. Source slices are explicitly bounded: Service 200, Finance 500 and Engineering 200 packages; queue pages show 30 rows. Counts describe the available slice, not all business work.

[SH verification](../../../testing/evidence/sh-platform/README.md) records actual checks, inspected captures and CI repairs; [handover](../../../delivery/sh-platform-handover.md) records scope and dependencies. Images above predate the merged development-workspace shell controls and require a fresh paired review for that integration. No review fingerprint or owner acceptance is claimed. The article `guide.page.work.reviews` remains Draft.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** The header says 'Approvals & handovers'; the page and navigation say 'Reviews & handovers'. Heading size, breadcrumb and filter control sizes differ from the other My Work pages. Tab counts read '(0+)'. Phone: tabs wrap over three rows. S5 and S6 in the footer note.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Refinement batch 2 — 9 October 2026

Built from the accepted canvas proposal ([decision](../../../decisions/ui-build-sequence.md#owner-decisions-9-october-2026)).

- **One name:** the header, browser title, side menu and heading all read "Reviews & handovers" (`approvals` destination label in `src/shell/navigation.ts`).
- **Same frame as the other My Work pages:** the shared page heading and plain intro, the My actions filter bar and panel, and the shared footer ("Synthetic demo data · Updated 9 Oct 2026, 17:19 AEST").
- **Plain labels (S5):** the tabs read My reviews, All I can see, Returned to me, Handovers, Sent by me and History. The filters read Find, Area, Type and Owner. Each row says "Submitted 9 Oct 2026 · 3 days ago".
- **Counts:** a tab shows its exact count in the shared count badge. A "+" appears only when a source window is full and the count is above zero. A partial read shows no counts and an alert. The Service source now reports a bounded window only when its 200-report window is full (`listReports` completeness).
- **Notes:** the protective note stays visible in plain words ("Seeing a review here does not mean you can approve it…"). The source coverage moves behind "About these sources" in the footer.
- **Empty state:** "Nothing is waiting for your review", with a link to All I can see.
- **Phone:** the tabs stay on one row and scroll sideways.
- **Review state:** the 9 October review is stale until Dean looks at the built page again.
