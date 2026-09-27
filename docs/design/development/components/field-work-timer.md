# Personal field work timer

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: native host adaptations awaiting owner/device acceptance.

`WorkTimer` and `RunningTimerBanner` are host components for FI-01, `/my-jobs/[id]` and `/my-jobs`. Reuse Button, ReadState, ErrorNotice, Stamp, LocalDateTimeField and original-command recovery. The accepted r05 reference remains `docs/reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html`, scope `#ppo-work-timer`. It is rendered independently in the maintained browser proof.

The Record detail keeps original arrival distinct from timer Start. Running and Paused remain open; Stop creates only positive ordinary P07 Time intervals. Stopped permits current-authority Resume; a frozen report does not. Unknown commands retain the original. The My Jobs banner never discloses inaccessible job details.

## Desktop

At 1440/1024/820 px use one document scroll and r05 header/clock/readouts/track/lists. The local proof includes actual 200% browser zoom rather than treating a smaller viewport as zoom.

## Mobile

At 390/320 px retain the 64 px clock and timer dock above global navigation. Dialogs use a labelled native modal with focus, Escape and return; unresolved commands prevent accidental discard.

Host state fixtures are in `tests/browser/field-timer.spec.ts`; restart/zoom procedures are in `scripts/field-timer-restart-proof.ts` and `scripts/field-timer-zoom-proof.ts`. The dedicated offline controls use the same timer model and existing owned queue, not the React catalogue renderer. Failed/missing predecessors block further local intent. Server acceptance is explicit.

See [native rules and proposed adaptations](../../../decisions/field-timer-native.md) and [the programme evidence](../../../delivery/field-quality-native-handover.md). Missing allowance, explicit arrival, host navigation and immutable Undo evidence are declared adaptations; none grants owner approval. No isolated runnable example or physical-device/screen-reader acceptance is claimed.
