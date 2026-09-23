# SC-06 I3 — Preparation view, change record and first save: visual review evidence

Scope `SC-06` · design register `scope:SV-05` · routes `/service/packs/[id]` and `/service/packs/new`.
Prepared by Claude for Dean Fiedler's review. **Not a review record.** An owner's visual acceptance is recorded separately.

## What produced these captures

| Field | Value |
|---|---|
| Branch | `feat/job-pack-i3-preparation` |
| Base | `main` at `4c8fd6d` (PR #285; `origin/main` moved from `743d58f` during the session and this branch was rebased onto it) |
| Application | The **compiled** build (`npm run build`, then `npm run serve:compiled`), loopback `http://127.0.0.1:3000` |
| Browser | Chromium bundled with the repository's Playwright, headless, device pixel ratio 1 |
| Data | Synthetic only. Every state was created **through the application** — the planner and pack commands — not by editing the database |
| Date of capture | 23 September 2026 |
| Visit used | 2 December 2031, inside the synthetic scheduling policy period |

## Environment note — this is not the usual local database

The synthetic development database that every `.env.local` in this checkout points at (`127.0.0.1:55438`) **no longer exists**: it belonged to the EN-08 worktree's task-owned PostgreSQL cluster, and both the cluster and its data directory were removed when that worktree was cleaned up. The only PostgreSQL service running on this machine is the system one on 5432, for which this task holds no credentials.

These captures therefore come from a **task-owned cluster created for this increment**: PostgreSQL 16 in `tmp/pg16` on port 55446 (`ppo_i3`), with `ppo_synthetic` and `ppo_synthetic_test` built from the repository's own `db:migrate` (41 migrations) and `db:seed`. It is disposable, loopback-only and synthetic, it lives under the git-ignored `tmp/`, and nothing in it is committed. `fsync`, `synchronous_commit` and `full_page_writes` are off on that cluster so the seed completes inside the application's 10-second statement timeout; that is a property of the disposable cluster, not of the application.

The consequence for review: these are **first-run** states on freshly seeded data, not the accumulated records of the owner's development database.

## Viewports

1440 × 960 · 1024 × 768 · 820 × 800 · 770 × 900 · 390 × 844 · 320 × 800.

770 px is included deliberately: the shell switches to its phone layout at ≤ 780 px while this page's own phone rules start at ≤ 760 px, so between 761 and 780 px the page runs its tablet layout inside the phone shell (build report O-05, R-27).

## What was checked on every capture, automatically

- **No horizontal page scroll** — `document.documentElement.scrollWidth <= innerWidth` at each viewport.
- **The preparation action bar clears the shell's fixed phone bar** at ≤ 780 px, measured as a rectangle comparison, not read off a screenshot.

Both passed on the final pass for all 51 captures.

## What was checked by reading the captures

Alignment and the shared left edge of label/value pairs; spacing rhythm; wrapping of long frozen text and long entries; colour used only with words; visible focus; the r03 three-column preparation geometry; the contents rail flag on section 07; the reference line, badges and tab-trailing save state; dialog composition at desktop and phone.

## States captured

| Prefix | State |
|---|---|
| `new-empty-*` | `/service/packs/new` first preparation, nothing entered, save disabled |
| `new-dirty-*` | The same view with all nine entries and a source selected |
| `new-dialog-*`, `new-dialog-reason-required-*` | "Record the first preparation", and the refusal in place when no reason is given |
| `new-redirect-*` | `/service/packs/new` for an appointment that already has a pack — redirected, with the status message |
| `draft-pack-*` | Staff Draft with blocked readiness criteria, Job pack view |
| `draft-prepare-*` | Staff Draft, Preparation view |
| `draft-prepare-dirty-*` | Unsaved entries: badge, tab-trailing state and the action bar |
| `draft-pack-unsaved-badge-*` | The unsaved badge as seen from the Job pack view after switching tabs |
| `draft-discard-dialog-*` | "Discard unsaved preparation?" |
| `draft-change-dialog-*` | "Record preparation change" with the field delta |
| `draft-after-save-*` | The page after a successful save |
| `long-content-counter-*` | A 5,600-character entry with the remaining-character counter |
| `checked-pack-*`, `checked-prepare-*` | Checked revision |
| `assigned-technician-*` | The recipient technician's view — no Preparation tab |
| `observer-*` | An identity without pack permission — the same 404 treatment |
| `prepare-selections-*`, `prepare-source-details-open-*` | Sections 06 and 07: selections, the read-only readiness note, and the linked context opened |
| `dialog-layering-390x844-viewport.png` | Viewport-only capture proving the action bar no longer paints over the modal backdrop |

## Defects found in this loop and fixed

1. **The preparation action bar fell behind the shell's phone navigation bar** at 390 px (26 px) and 320 px (145 px), at the top of the Preparation view. A sticky box may not be displaced above its containing block; on a phone the form begins near the foot of the scrollport, so the bar was clamped to the form's own top and landed under the fixed bar. Fixed by fixing the bar to the viewport above the shell bar at ≤ 760 px, keeping the r03 box unchanged. Re-measured: clear at every viewport and scroll position.
2. **The action bar painted above the modal backdrop**, showing an undimmed second save control beside the dialog's own confirm. Fixed with a scoped `:has(dialog[open])` rule that hides it without moving anything.
3. **The linked context made the form 8,702 px tall on a phone**, burying the nine entries. The frozen context for sections 02–09 now sits behind the r03 "View source details" disclosure; section 01's grid stays in view. Phone form height 8,702 → 5,405 px.
4. **Focus did not return when a dialog closed** — it fell to `BODY`. `PackDialog` now restores focus to the opener, or to the selected tab if the opener has gone. This fixes the existing decision dialogs too.

## Limits of this evidence

- **Not an owner's visual review.** No reviewer, date or fingerprint is recorded anywhere in the design register for this work.
- **No paired reference/application captures.** The r03 reference is not captured beside the application here; `node scripts/design-baseline-check.mjs` and the paired declared-viewport captures belong to I5.
- **No screen-reader, Safari, Firefox or physical-device testing**, and no PT-27 performance measurement.
- **The ADR-0029 hosted Pack Reviewer was not exercised**: that profile is not in the local identity list, so the header matrix by identity remains an I4 check.
- Keyboard checks here cover the contents-rail jump, dialog focus and focus return only; the full keyboard pass of build report §5.12 belongs to I5.
- The shell's own phone top bar overlaps its icon row at ≤ 390 px in these captures. That is outside `#ppo-job-pack` and outside SC-06 scope; it is present on the unchanged Job pack view too.

## Captures

All PNG files in this directory. Nothing here was edited, re-rendered or replaced to make a comparison pass.
