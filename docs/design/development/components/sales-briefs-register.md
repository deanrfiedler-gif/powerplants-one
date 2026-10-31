# Sales briefs register and snapshot

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. CR-02 host composition; application acceptance pending.

## Contract

`SalesBriefsRegister` and `SalesBriefSnapshot` implement the [receiving page contract](../pages/route-estimating-intake.md) using the shared shell, register table, buttons, menu choices, dialog panels and record tabs. The [accepted reference](../../../reference/ui/estimating/sales-briefs-design-r01/README.md) supplies geometry; the phone amendment supplies the current header.

Rows, facets, counts and pagination share the server's complete permitted submitted-revision population. A partial response is visibly a lower bound. Selection is current-page only and is discarded with its population basis. Sequence is oldest receiving update first. CSV rechecks each row token and current visibility. No bulk receiving command exists.

## States and fixtures

`tests/helpers/sales-briefs.ts` supplies synthetic examples of all five states, source change, other receivers, missing dates, long labels, terminal revisions and answered clarification. `tests/browser/sales-briefs.spec.ts` exercises the host's loading, empty, partial, stale, denied, failed/retry, selected, snapshot, phone and 320 px states, including completion of a read slower than the polling interval without overlapping timer/focus reads. Native database and HTTP journeys in `tests/database/sales-briefs.test.ts` and `tests/http/sales-briefs.test.ts` prove that submitted revisions and access determine the population. `tests/browser/sales-briefs-native.spec.ts` follows native submission, return and draft succession through the queue, snapshot and exact record link.

## Desktop

The full-width grid uses 40 px rows and fixed checkbox/action ends. The large snapshot overlaps, with a 440 px brief column at 1440 px and stacked phone content. The selection panel is 360 px. At 320 px state/date lines wrap and record navigation moves into More. Controls have accessible names; native dialogs restore focus and Escape closes; shared tabs retain keyboard behavior.

## Mobile

The shared compact phone header provides views and filters. At 390 px the list has 80 px rows; at 320 px state and date wrap. Full-screen snapshots keep a sticky footer and More navigation. Selection has explicit labelled checkboxes as well as press-and-hold.

## Review and limits

[Evidence and differences](../../../testing/evidence/sales-briefs-queue/README.md) are separate from owner visual acceptance. Full register reads favor native authorization correctness over a new cache or denormalized store; very large synthetic populations are not performance-qualified. No migration, grant, dependency or external adapter is introduced. The native record redesign belongs to its separate claim.
