# Agreement charge successor form boundary

The existing `maintenance-form` consumer at `route:/maintenance/agreements/[id]` cannot carry a charge schedule. C1-2 therefore withholds successor preparation for any charged revision history and renders a plain unavailable notice. Uncharged agreements retain the existing form; independent approval and withdrawal remain governed by server duties. No shared control, token, charge editor or issued design is changed.

Fixture: an ordinary agreement first shows the successor form; after an explicit charge-bearing revision, the same record shows the notice, no successor form and unchanged exact scheduled charges. `tests/browser/maintenance.spec.ts` covers this transition on existing desktop/mobile projects. Browser execution and visual/owner acceptance remain pending; local test discovery is not execution. The server separately refuses omitted schedules and preserves Finance duties through legacy omission chains.
