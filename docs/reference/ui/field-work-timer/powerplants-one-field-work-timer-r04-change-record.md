# PPO FI-01 Field work timer — design r04 change record

**Deliverable:** `powerplants-one-field-work-timer-r04.html` · 477,148 bytes · SHA-256 `dcf4c64629048e48a13f46a5a1692a64aa42ceb064ff105686e7a6b6fbd5db05`
**Predecessor:** r03 · 473,075 bytes · SHA-256 `b7ddc730ce3b1a8d09bdedea258e3e6b6b70a0c2022f15df830aaceb0991697d`. r03 is retained unchanged; r04 supersedes it as the candidate.
**Companion:** `field-work-timer-test-script.md`, revision r02, now pointing at r04.
**Date:** 23 September 2026
**Basis:** Dean's review of r03: the 4 px coloured top border on the timer panel reads as a generated-interface convention, and he asked for a more original, professional treatment. Behaviour, states, data and all other r03 content are unchanged (r03 record §1–§5).
**Status:** Issued for Dean's design review. **Not accepted.**

---

## 1. What changed

| Area | r03 | r04 |
|---|---|---|
| Panel frame | 4 px state-coloured top border | **Plain frame**: an even 1 px `--line-strong` border, no accent. The state stripe is gone in every state, including the overnight alert |
| State in words | Heading in ink with a dot, e.g. "Working" or "Paused · Waiting for parts" | Heading **Work timer** plus a **state capsule** (dot + word) on the right. The pause reason moves to the line under the display: "Waiting for parts · 12 min since 11:25 AEST · …" |
| The figure | On the panel background | Inside a **display window**: a flat inset area (8 px radius, no border) whose tint follows state, as a controller's backlight does |
| Booking position | Text on the right of the header ("35 min left of booking") | Text at the top of the display, plus a **booking scale** along its bottom (§2) |
| Finish-time result box | 3 px navy left rule | Plain 1 px border |

## 2. The booking scale

A gauge along the bottom of the display, drawn from the vocabulary of the controllers the technicians service:

- **Graduations** every 15 minutes, with heavier marks on the hour.
- **Booked visit:** the calibrated band (3 px, `--neutral`) on a hairline baseline, labelled with its start and end times; other hours are labelled when there is room.
- **Pointer:** "now", as an ink line with an upward triangle. It shows while timing and before the start (Ready to start, Another job is timing), and is omitted once stopped or closed.
- **Overrun:** hatched amber beyond the booked end. Once overrun passes 90 minutes, the scale shows one hour past the end, fades the hatch, and labels the right end **now**.
- **Accessibility:** decorative (`aria-hidden`). The same information is in the text above it ("35 min left of booking", "21 min past booking", "Booking starts in 10 min", "Booked 10:00–12:00").

It answers the question the day timeline doesn't: *where am I within the booked visit?* The timeline stays in Time recorded for the record of how the time was spent.

## 3. Display tints

All tints use existing tokens; no new colour tokens are introduced.

| State | Tint |
|---|---|
| Ready to start, Can't start yet, Another job is timing | `--surface-2` |
| Working | `--progress-surface` |
| Paused | `--warning-tint` (digits in `--text-secondary`) |
| Timer still running (overnight) | `--warning-surface` |
| Stopped | `--neutral-surface` |
| Timer closed | `--success-tint` |

**Contrast on every tint:**

| Element | Range | Minimum needed |
|---|---|---|
| Labels and booking text | 5.01–5.46:1 | 4.5:1 (text) |
| Ink digits | 12.5–13.6:1 | 4.5:1 (text) |
| Band | 5.5–6.0:1 | 3:1 (graphics) |
| Pointer | 12.5–13.6:1 | 3:1 (graphics) |
| "Past booking" text | 5.78:1 on working, 6.0:1 on alert | 4.5:1 (text) |
| Idle digits | 3.13:1, on `--surface-2` only | 3:1 (large text) |

**Forced colours:** the display gains a 1 px system-colour outline, and the scale draws in system text colour.

## 4. Decisions for Dean

1. **Accept, or ask for changes to, r04** in place of r03.
2. **Notices keep Job Pack r03's 3 px left stripe**, because that is the accepted pattern. Changing it only here would make the timer inconsistent with Job Pack. If you'd like the stripe removed, it should be done across both designs together; that is a **system-level decision**.
3. The r03 decisions carry forward unchanged (r03 record §7).

## 5. Verification performed (23 September 2026)

**Environment:** Playwright 1.56.0 with Chromium 141.0.7390.37 (headless).

| Check | Result |
|---|---|
| Console and page errors, 6 viewports × 2 views × 21 states (252 combinations) | 0 |
| Horizontal overflow in the same 252 combinations | 0 |
| Panel inspected by eye in 8 states (ready, working, paused, overrun, overnight, stopped, closed, other job), the full desktop page, and the phone | Pass |
| Overnight scale labels: 10:00, 11:00, 12:00 and "now" (was a misleading "13:00", fixed in review) | Pass |
| Behaviour regression: two-tap pause sets capsule Paused and display tint paused, with the reason in the line beneath; Undo restores Working | Pass |
| Forced colours: display outline present; primary button emphasis retained | Pass |
| No `border-top:4px` rule remains in the file | Pass |

**Not done:** as in r03 (screen reader, other browsers, physical devices). These are covered by the test script.
