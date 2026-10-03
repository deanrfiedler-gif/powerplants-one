# Personal field work timer

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: native host adaptations awaiting owner/device acceptance.

`WorkTimer` and `RunningTimerBanner` are host components for FI-01, `/my-jobs/[id]` and `/my-jobs`. Reuse Button, ReadState, ErrorNotice, Stamp, LocalDateTimeField and original-command recovery. The accepted r05 reference remains `docs/reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html`, scope `#ppo-work-timer`. It is rendered independently in the maintained browser proof.

The Record detail keeps original arrival distinct from timer Start. Running and Paused remain open; Stop creates only positive ordinary P07 Time intervals. Stopped permits current-authority Resume; a frozen report does not. Unknown commands retain the original. The My Jobs banner never discloses inaccessible job details.

The one-second elapsed display does not restart the 15-second server refresh subscription. Refresh reads the current dialog and unresolved-command state and pauses while either prevents it; closing a dialog restores the existing refresh cadence. The native browser fixture waits for an unsolicited server read while the clock is running. The integrated service fixture waits for both independent job/timer reads before using the arrival and pack controls.

Saving actual arrival in the FI-01 host immediately refreshes the timer authority read. The `quality-return.ts` host fixture asserts Start is enabled within the ordinary five-second browser assertion budget, before the 15-second polling cadence. This affects only `/my-jobs/[id]`; the My Jobs banner binding is unchanged. Review status remains pending.

The outgoing Service review handover uses the shared desktop Service operations rail or the phone More menu. It retains the current actor and server-side report permissions.

## Desktop

At 1440/1024/820 px use one document scroll and r05 header/clock/readouts/track/lists. The local proof includes actual 200% browser zoom rather than treating a smaller viewport as zoom.

## Mobile

At 390/320 px retain the 64 px clock and timer dock above global navigation. Dialogs use a labelled native modal with focus, Escape and return; unresolved commands prevent accidental discard.

Host state fixtures are in `tests/browser/field-timer.spec.ts`; restart/zoom procedures are in `scripts/field-timer-restart-proof.ts` and `scripts/field-timer-zoom-proof.ts`. The dedicated offline controls use the same timer model and existing owned queue, not the React catalogue renderer. Failed/missing predecessors block further local intent. Server acceptance is explicit.

See [native rules and proposed adaptations](../../../decisions/field-timer-native.md) and [the programme evidence](../../../delivery/field-quality-native-handover.md). Missing allowance, explicit arrival, host navigation and immutable Undo evidence are declared adaptations; none grants owner approval. No isolated runnable example or physical-device/screen-reader acceptance is claimed.


## Closed-visit consumer bindings

The FI-01/FI-02/FI-05 and My Jobs hosts reuse these controls for truthful personal history; Service work-order/appointment hosts provide the existing receiving path. Reproducible host states: `tests/helpers/service-journey.ts` (closed original without own attendance and completed separate return), `tests/browser/field-closed-visit.spec.ts` (validation, stale refusal, interrupted response/reload and original continuation), and `tests/database/field-closed-visit.test.ts` (scoped/unavailable navigation and delayed cached originals). These are persisted host examples, not an isolated gallery acceptance.

Inspect readable identifiers/history, one content scroll, 1440/1024/390/320 widths, keyboard links/focus recovery and actual 200% zoom. Pending read removes current receiving actions; saved history survives. No accepted native mockup exists for this addition; timer r05 bytes remain unchanged. Review/fingerprints remain unassigned. See `docs/decisions/field-closed-visit-guidance.md` and the corresponding execution ledger.
