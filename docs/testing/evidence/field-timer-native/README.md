# Native field timer and offline evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 27 September 2026. Synthetic implementation evidence; owner, physical-device and assistive-technology acceptance remain pending. No deployment was attempted.

## Source and environment

Base main is `80b2f418b90a69d267ac2e65682a5b560a8b4356`. The implementation was executed uncommitted in the preserved FI worktree above consolidation merge `c91119b`; [the manifest](capture-manifest.json) identifies the compiled build, exact reference hash, selected source hashes and all 16 retained captures. The PR publication commit is the delivery identity; the local captures are not mislabelled as a clean committed build. Node 24.21.0, PostgreSQL 16.15, Chrome 154.0.8037.58 and Playwright 1.63.0 ran on Windows against the guarded disposable `ppo_synthetic_test`.

## Executed checks

- Nine database cases passed in one sequential run (349.9 seconds): original retry and altered-operation refusal, competing tabs/personal jobs, required pause notes, zero-duration events, ordered time/overlap, Undo expiry/lineage, source drift, revocation/private receipts, report freeze, exact cached readiness and restricted recovery. The 0049-to-0050 upgrade preserved existing arrivals, time, receipts, Supply records and revoked grants; repeated migration/seed was idempotent.
- Twelve focused unit cases passed: timer precision/projection and existing field, readiness and report validation. Millisecond arrival and rapid actions cannot round the next timer event backwards.
- Final new compiled browser run: four of four passed in 59.6 seconds, desktop and touch-enabled phone. It covers the real timer, keyboard focus/Escape/return, a lost accepted response, exact original retry, saved Labour/Waiting, reload, offline Start/Pause/Stop and repeat sync. Fixture dates 27–30 October 2031 were checked against other test literals and remain within the explicit synthetic policy period.
- Eight affected existing desktop/phone browser cases passed (1.8 minutes): unavailable storage/eviction, persistent-browser originals, time-conflict recovery and exact offline report submission. Their first local attempt used the wrong origin; rerun on the existing tests' expected loopback port passed without changing business assertions.
- [Real restart proof](verified.json) passed across distinct application PIDs and PostgreSQL start times, with a fresh persistent browser process. Exact timer/arrival/event/Time/receipt rows and the unsent owned IndexedDB Pause survived. The same Start returned its original receipt; Pause was accepted once and retry did not duplicate it.
- [Actual 200% Chrome zoom](zoom.json) passed at a 1440×1200 physical viewport / 720×600 CSS viewport, DPR 2. No page overflow; Enter opened the labelled dialog, focus was inside it, and Escape restored the opener. This is not physical-device or screen-reader acceptance.
- Full lint, TypeScript and compiled build passed after the runtime fixes; focused proof lint also passed. Design-side baseline assurance passed all six retained sources / 24 captures with the three already recorded token divergences. Register integrity passes 320 entries, 166 routes and 29 components (19 runnable); 320 page and 29 component reviews remain pending. Foundation/prototype/naming assurance retains all 78 parents.

## Presentation observations and proposed adaptations

The issued r05 file remains byte-identical. The browser proof independently loads it at 1440/1024/820/390/320 px and compares navy, green and elapsed typography; it also checks horizontal containment and 44 px timer controls. Paired source/native captures were visually inspected across these widths, including long titles, narrow-phone wrapping and the 200% dialog. These comparisons do not establish pixel equivalence or owner acceptance.

The native host contributes its global shell and existing synthetic notice, so the first viewport contains less timer content than the standalone reference. It uses a labelled job-menu button, real selected task/equipment and persisted current intervals. Booking is shown as its scheduled duration; an authoritative labour allowance is Not established. Undo retains accepted intervals and appends a compensating transition. The phone dock clears existing global navigation. These deliberate adaptations are recorded in [the decision](../../../decisions/field-timer-native.md), not silently promoted to a new baseline. The synthetic booking dates deliberately differ from actual capture time; track labels are not evidence of work performed on those future dates.

## Earlier findings retained

Initial database failures were a stopped disposable server, an occupied test slot and an assertion expecting a return value from a void migration runner. Initial browser attempts exposed a 403/404 expectation mismatch, colliding dates, dates outside the fixture policy, a Windows text-encoding error in a selector and a test started before the local server was ready. These were repaired in the test/setup; the final passing runs are identified above. Two new test type errors were corrected before the final type/build pass. Existing offline/report visible-status assertions were updated to the new plain-English labels without changing protocol-state or original-receipt assertions.

Physical devices, screen readers, independent owner review, hosted release, the wider FI-03/FI-04/FI-06 programme and full PT-28/PT-30 remain open. The new process-restart proof is not a backup/restore claim. Raw browser profiles, traces, recovery tokens and local environment files are excluded from this retained package.
