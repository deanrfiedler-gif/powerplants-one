# Offline workspace — design reference

Stable entry: `route:/offline/index.html`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/offline/index.html`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The dedicated local offline workspace exists. Its hosted availability and device acceptance remain separate.

1. Download permitted job context before leaving coverage
2. Capture evidence and check its local-save state
3. Reconnect and review each queued operation's receipt or conflict

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No exact image or HTML reference is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.page.offline.index.html` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current native field contract

FI-02 is the dedicated offline workspace, using its existing standalone shell and IndexedDB owner boundary. It is a Work queue + persistent detail page. Download current permitted job context explicitly; the saved timer and selected site-readiness source remain labelled cached. Start, Pause, Resume and Stop retain original operation IDs, versions and dependency order. A failed or conflicting predecessor blocks later intent. Send queued originals and redownload the resulting Time entry manifest before completion. Undo and forgotten finish require the current online timer. Readiness acknowledgement records the exact downloaded source and selected context, including before actual arrival; changed authority is not silently accepted.

Keep download, cached verification, locally saved, queued, server saved, failed, conflict and retained-for-review states distinct. On 390/320 px phones, preserve visible state, labelled controls, queue totals and retry access; do not imply that a network icon proves server acceptance. No exact standalone offline mockup is available; this remains an explicit visual-reference gap.

Incoming and outgoing handovers, source hashes and exact limitations are in [the native decision](../../../decisions/field-timer-native.md). Current evidence is in [the field programme handover](../../../delivery/field-quality-native-handover.md). Retained r05 bytes and review fingerprints are unchanged.

Current paired captures and actual 200% Chrome zoom/keyboard results are in [the timer evidence record](../../../testing/evidence/field-timer-native/README.md). Source/application evidence is separate from owner approval.


## Closed cached visit

FI-02 retains its r20 Document & evidence workspace adaptation and original owner-bound queue. Cached closed/non-startable visits show state-specific personal facts and hide new arrival/acknowledgement intent. Previously retained operations are never deleted or moved to a later visit. Current return preparation/scheduling stays online through My Jobs and existing Service destinations. No protocol/schema version, journal payload, background sender or new route. Inspect 1440/1024/390/320 and actual 200% zoom, keyboard labels and retained failure/recovery alongside the existing offline proof. Native closed-visit mockups and human acceptance remain unavailable. See the closed-visit decision and evidence ledger.

## Large evidence-set completion

The completion section includes **Continue completion online**, using this standalone workspace's existing native secondary button style. On desktop and phone it remains beside its explanatory text in the normal document flow. Send/resolve every retained original first. Pending, uncertain, failed, conflicting or restricted-recovery originals block this continuation. It verifies the same owner, current scoped job access, accepted attendance and the presence of retained capture IDs before opening that appointment's normal My Jobs screen. Existing unsaved-input navigation protection remains active.

The offline draft still has at most 30 causal dependencies. The error gives the real online continuation instead of repeatedly asking for a download that cannot remove retained originals. Nothing deletes, rewrites or moves the local queue or photo bytes. The online completion screen uses fresh evidence, current versions and ordinary server authority. Draft save, submission for review and approval remain distinct. Current evidence: [quality increment](../../../testing/evidence/product-quality-next/README.md). Independent visual, physical-device and screen-reader acceptance remain pending.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** See system:offline. Deliberately standalone so it works without the network, but it should still use the PPO tokens.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
