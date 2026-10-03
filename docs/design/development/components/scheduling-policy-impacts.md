# Published scheduling impacts and resolution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `scheduling-policy-impacts`. Review: pending.

Host components `PolicyHolds` and `PolicyResolution` reuse shared Button, Field, SelectField, ReadState and ErrorNotice, within existing PL-04, appointment and My Work surfaces. Incoming handovers are immutable publication impacts and exact current appointment evidence. Outgoing handovers are the unchanged appointment, controlled resolution receipt and refreshed independent readiness. No issued Step 4 mockup exists; the retained r22 states reference informs the composition. This proposed additional content does not amend an accepted visual baseline.

## Desktop

Desktop shows each impact's reason, responsible owner, source publication and permitted next action together. My Work completion never implies resolution. Appointment details expose a native disclosure for the permitted scheduler, with controlled outcome, optional exact replacement appointment and reason. Evaluate current booking reads the exact version/hash/dependencies. Save rechecks those facts. An uncertain result freezes evidence choices and retries the unchanged original.

## Mobile

Phone: stack labels, fields and buttons, wrap identifiers at 390/320 px and retain visible errors, owner and next action. Native details and labelled controls support keyboard use; no hover/drag requirement. Policy commands require online authority. Read failure is unknown, never a cleared hold. Current resolution leaves independent customer/preparation/pack controls in force. A later change restores a stale hold; already started/completed work retains its history.

Host states are Unresolved, Stale, Current and uncertain response; the companion appointment-card `policy-hold` fixture is synthetic presentation only. Functional desktop/phone evidence is recorded in the Step 4 evidence directory. Owner visual, screen-reader and physical-device acceptance remain pending; no accepted fingerprint is recorded.

## Step 5 native policy evidence host

The existing PL-04 policy-impact route adds `PolicyPublicationWorkspace` for immutable proposal/successor, complete server review, exact publication, stable reopening and original-operation recovery. It retains the Review / comparison classification described in the policy-impact page contract. `PolicyHolds` and the existing appointment `PolicyResolution` retain their roles. No second resolution mechanism is added.

Host state fixtures are exercised against task-owned synthetic PostgreSQL by `tests/scheduling-browser/publication.spec.ts`: proposal, successor/original, complete empty/compliant/affected review, over-limit refusal, stale publication, accepted publication, uncertain response/reload, revoked/switching identity and typed owned handovers. These are host integration examples, not an isolated runnable gallery or accepted mockup. Desktop and phone requirements and exact evidence are in `docs/testing/evidence/scheduling-policy-interface/README.md`.

Reuse the shared online journal with an opt-in receipt check for server-allocated publication IDs; all other consumers retain their exact record-ID check. The journal never defines saved evidence, automatically posts on reload or clears an appointment hold. Owner/visual/device review and the component alignment item remain pending.

An unavailable original receipt keeps the retained operation and explicit unchanged retry available. It establishes neither success nor failure. Actual authority denial hides protected evidence. The host fixture includes a request lost before server acceptance, a 404 lookup after reload, and one exact original retry producing one publication/impact set.

## Successor focus while the head loads

Only the `PolicyPublicationWorkspace` consumer at `/schedule/policy-impact` changes. An explicit Edit request retains focus intent until its permitted successor form mounts, even when the separate current-head read arrives later than the saved proposal. Repeated Edit focuses the existing heading; ordinary field updates do not steal focus. Appointment hold/resolution consumers retain their existing bindings and behaviour.

The real-host `tests/scheduling-browser/successor-focus.spec.ts` fixture holds the actual current-head response across browser paints, releases its unchanged contents, and checks heading focus, typing focus and repeated Edit on desktop and phone. [Original failure, unchanged-main comparison and repair proof](../../../testing/evidence/scheduling-successor-focus/README.md) remain separate from owner/device/visual acceptance. No review fingerprint is adopted.
