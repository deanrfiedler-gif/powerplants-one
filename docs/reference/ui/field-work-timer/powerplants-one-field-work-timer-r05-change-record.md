# PPO FI-01 Field work timer — design r05 change record

**Deliverable:** `powerplants-one-field-work-timer-r05.html` · 509,938 bytes · SHA-256 `baa89ad975cdcbcba005a5a7f487279bb6c9e5ef89df9a3dece3286b21603d29`
**Predecessor:** r04 · 477,148 bytes · SHA-256 `dcf4c64629048e48a13f46a5a1692a64aa42ceb064ff105686e7a6b6fbd5db05`. r04 is retained unchanged beside this file with its own change record. It was issued for review and never accepted.
**Date:** 23 September 2026
**Basis:** Dean's review of r04 and the concept canvas that followed it. He selected the record-page layout ("Option 5", renamed Option 1 on the canvas) on 23 September 2026 and then said: "I am now happy with the designs." See [the decision](../../../decisions/field-work-timer-design.md).
**Status:** Accepted design baseline for presentation. **Not implemented.** The application has no timer yet.

---

## 1. What changed

r05 keeps r04's behaviour and state engine: its 21 preview states, clock, Undo rules, the finish-time sheet, job switching, keep-screen-on and offline handling. The table below lists what the presentation changes.

| Area | r04 | r05 |
|---|---|---|
| Page structure | Card column with the timer panel in a right rail | **Record page.** A record header holds the title, the state tag and the timer controls. The job menu sits on the left from 1200 px. The live timer is below the header, then edge-to-edge Time recorded and Activity lists |
| Controls | In the timer panel, primary action first | In the **record header**. In a row the main action sits on the right; in a stack it sits on top (E2). The phone keeps a bottom dock |
| State | Capsule (dot and word) in the panel heading | **State tag** in the header: tint, status text and a 1.5 px accent edge, with an icon for every state except Working, which has a live dot. Words, never colour alone |
| Figure | 60–84 px in a tinted display window | **96 px** figure on white (64 px on the phone). It is grey while paused, stopped or closed, and light grey before the start |
| Supporting numbers | One meta line | **Three readouts**: this stretch, booking, and time not counted as labour. A multi-visit job adds a fourth, **Job allowance** |
| Time shown | Booking scale in the display plus a separate day timeline | **One visit track.** The plan sits above the rail (booked bracket, hatched overrun). The recorded stretches are on the rail, with a "now" pointer through both. Ticks every 5 min, heavier at 15 and 60; labels spaced by width |
| Time recorded | Card list | **Edge-to-edge table**: Kind, Time (AEST) and note, Duration, Status and Action. Running, held and needs-attention rows are tinted. Totals bar underneath. Phone: stacked rows |
| Correct | Always link colour | Grey until the row is hovered or focused; link colour on touch screens |
| Activity | Not present | **Activity list**, newest first, derived from the recorded stretches. The second line reads "what · who" |
| Notices | Boxed notice with a 3 px coloured left stripe | **Full-width banner rows**: tint and rule, no stripe. See [the notice accent decision](../../../decisions/notice-accent-rule-departure.md) |
| Job context | "Job sections — unchanged" card | **Job menu**, matching the shared secondary menu (`.mw-menu`). Title "Job" with the appointment reference, seven sections, completion status on its item, and a Job details list. It docks from 1200 px and is an overlay below that, as `src/shell/secondary-menu.tsx` does |
| Scrolling | Phone dock only | On desktop the header **condenses** once the figure scrolls under it, keeping the figure, the booking position and the controls. The phone dock is unchanged |
| Undo bar | Centred, with a draining bar | Bottom-left of the work column, with an **8 s countdown ring** on the Undo button. The same hold rules apply |
| Pause reasons | Break, Travel during the job, Waiting for parts, Waiting for access or the customer, Something else | **Pause now:** Break and Travel ("Collecting parts"). **Needs a short note:** parts, access or the customer, **Waiting for approval** and **Unsafe to continue** (both new, recorded as Waiting), and Something else |
| Can't start yet | "Acknowledge job pack r01" | Job pack **r02 reissued** with a changed scope, and Start work shown disabled with the reason |
| Multi-day jobs | Not present | New state **"Multi-day job — day 3 of 4 with the allowance"**. It adds the Job allowance readout and a job labour allowance bar under the track (earlier days, today live, forecast, quoted bracket). Stopping opens **"How much work is left?"** once Undo has passed; it can be skipped and never changes recorded time |
| Wording | "this phone" | **"this device"**, because the same page serves a laptop, a tablet and a phone |

## 2. Unchanged from r04

- **Timer rules:** every behaviour rule, time limit and scenario rule; r04's 21 scenarios, with the same keys and labels.
- **Scope and tokens:** the single `#ppo-work-timer` scope container, the local reset and the 43 tokens (the 41-token shared core plus `--progress` and `--progress-surface`). The values are unchanged, including the Field Technicians r05 values for the three recorded shared-core divergences. No new token is introduced.
- **Accessibility and preview:** increased contrast (the operating-system setting or the preview switch), forced colours, reduced motion and the embedded Roboto. The preview bar is marked as not part of the product.
- **Start sheet:** a one-time start with a confirmation sheet ("can't be removed"). The finish-time sheet's options, reasons and 48-hour cap are also unchanged.
- **My jobs view:** the running-timer banner and job cards.

## 3. Verification performed (23 September 2026)

**Environment:** Playwright with Chromium 1194 (headless), in the session container.

| Check | Result |
|---|---|
| `node scripts/design-baseline-check.mjs`, run from a temporary copy that launches the installed Chromium because Google Chrome isn't installed here. It checks integrity, one scope container, 43 tokens, overflow at 1440, 1024, 820 and 390 px, and console errors | Pass. The five existing baselines also pass. Shared-core agreement: 41 names across 6 baselines, 3 recorded divergences |
| Console and page errors, and horizontal overflow: 22 states × 2 views × 5 widths (1440, 1024, 820, 390 and 320 px), 220 combinations | 0 errors, 0 overflow |
| **Pausing:** Break pauses in two taps, and Undo restores Working. A noted reason refuses an empty note, then records "Unsafe to continue: …" on the running row | Pass at 1440 and 390 px |
| **Stopping:** Stop needs no confirmation. The held row shows while Undo is up, and the Undo bar clears at 8 s and releases the time | Pass at 1440 and 390 px |
| **Starting:** the start confirmation opens and starts the timer; Start stays unavailable while the job can't start | Pass at 1440 and 390 px |
| **Finishing and switching:** the forgotten-timer finish sheet stops the timer and flags "Finish time set by you"; switching jobs works | Pass at 1440 and 390 px |
| **Multi-day:** the work-left sheet opens after the Undo window and saves; no stray sheet opens when the state changes during Undo | Pass at 1440 and 390 px |
| Job menu: not docked at 1024 px, opens as an overlay, and Escape closes it | Pass |
| Header condenses and carries the figure once the timer scrolls under it (1440 px) | Pass |
| Screenshots inspected by eye | Working, booked visit ended, paused, overnight, other job, multi-day, loading, no access, Can't start yet at 1024 px, paused at 820 px and 390 px, and the condensed header |

**Not done:** screen reader, browsers other than Chromium, physical devices, print, and a comparison with the application. The application has no timer to compare against.

## 4. Decisions still open for Dean

1. **Notice stripe.** r05 uses stripe-free banner rows. The [notice accent decision](../../../decisions/notice-accent-rule-departure.md), which covers theme board r22 and Job Pack r03, is still proposed. Accepting r05 does not decide it for those other designs.
2. **Safety stops and approvals are recorded as Waiting, not labour.** Whether any of that time is billable is a business rule.
3. **The finish action has two labels:** "Set finish time" in the desktop header, where space is short, and "Set when I finished" on the phone. They can be aligned.
4. **The job labour allowance needs a data source.** Quoted crew labour, other technicians' synced time and the remaining-work estimate do not exist as an application contract. The figures are illustrative; see §7.2 of the UI style specification.
5. **The technician test script** (revision r02, written for r04) needs a revision for r05's controls and wording before it is used.
6. **The three shared-core token divergences** remain open as recorded in the register; r05 keeps r04's values.
