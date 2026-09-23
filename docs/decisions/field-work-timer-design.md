# Field work timer — accepted design

**Status:** Accepted design baseline r05 (presentation only). Not implemented; the application has no timer yet.
**Design revision:** r05, accepted 23 September 2026. r04 is retained as the unaccepted predecessor.
**Owner approval:** Dean Fiedler, 23 September 2026
**Scope:** FI-01 Technician Today and job execution (`scope:FI-01`): the work timer on the technician job page (`/my-jobs/[id]`) and the running-timer banner in My Jobs (`/my-jobs`).

## Decision and exact baseline

Dean reviewed r04 and a concept canvas of alternative layouts in the design session of 23 September 2026. He chose the record-page layout: "I am happy with Option 5. To avoid any confusion, you can delete Options 1 to 4, the rename Option 5 to Option 1." He then approved the full set of states and screen widths: "I am now happy with the designs. You can push that to the Github repository now so we can deploy it on the Powerplants One app."

This records acceptance of the presentation. The baseline is [r05](../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html): 509,938 bytes, SHA-256 `baa89ad975cdcbcba005a5a7f487279bb6c9e5ef89df9a3dece3286b21603d29`. It is registered as `field-work-timer-r05` in [`ui-baselines.json`](../standards/ui-baselines.json). The [change record](../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05-change-record.md) lists what changed from r04, what was verified and what was left unchanged. The canvas was a design workspace, not a baseline; r05 is the only accepted artefact.

## Accepted presentation

- **Record page.** A record header holds the title, the state tag and the timer controls; in a row the main action is on the right (E2). The job menu, which matches the shared secondary menu, is on the left from 1200 px and becomes an overlay below that. Then comes the live timer (96 px figure, three readouts, one visit track), followed by edge-to-edge Time recorded and Activity lists.
- **State tags.** Each tag has a tint, status text and an accent edge; words, never colour alone.
- **Pause reasons.** Break and Travel pause at once. Waiting for parts, access or the customer, approval, unsafe to continue, and something else each need a short note.
- **Multi-visit jobs** add a Job allowance readout and a crew labour allowance bar. At the end of a day they ask, optionally, how much work is left.
- **Phone.** 390 px with a bottom control dock. The declared baseline viewports are 1440, 1024, 820 and 390 px.

## What this decision does not establish

This decision accepts the presentation only (UI style specification §7.2). It does not establish:

- **Implementation, deployment or verification:** implementation, browser, accessibility, print or business acceptance; nothing is deployed.
- **New data contracts:** no time-entry model, API, migration or permission, and no data contract for the job labour allowance, crew totals or remaining-work estimates.
- **Commercial or scheduling outcomes:** billing, payroll or attendance. The timer is for job costing, not attendance or pay.
- **Other designs:** a change to the [notice accent decision](notice-accent-rule-departure.md), which stays proposed for theme board r22 and Job Pack r03.

The preview's simulated behaviour must become real or be explicitly excluded when the baseline is implemented. That covers the clock, the "Add 15 minutes" control, the links that announce rather than navigate, and the notes held only in memory.

## Implementation (not started)

Deploying the timer is a separate, bounded change. It needs:

- a capture model for time entries (stretches, kinds, notes, holds and corrections) with an architecture decision record;
- the API and any migration, following the migration-registry rules in `AGENTS.md`;
- permission checks, and offline and conflict handling that match the states in the baseline;
- the screen built under a `#ppo-work-timer` scope container, compared with this baseline using `node scripts/design-baseline-check.mjs --app`.

## Open points

The open points are in §4 of the change record: the notice stripe across the design system, billing treatment of safety and approval waits, the two finish-action labels, the allowance data source, the test script revision, and the three shared-core token divergences.
