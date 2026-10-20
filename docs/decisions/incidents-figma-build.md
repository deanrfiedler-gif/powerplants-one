# Incidents and corrective actions — implementation decisions

<!-- versioning: git; committed history is authoritative -->

Date: 21 October 2026. Scope: FI-06. Owner: Dean Fiedler. Implementation choices within the requested build; owner visual review pending.

## Authority

Dean accepted D1–D7 and Q1–Q4 in [the design decision](incidents-figma-design.md). This change implements that design on the existing three routes and existing incident commands. The source is "PPO - Design", page `1348:2972`, named version **Incidents and corrective actions — accepted**; notes `1355:2930`. No migration, new capability, dependency or closure authority is introduced. Conversations remains outside this change.

## Build choices

- **Source reference is retained.** It is required by the existing factual-report command and preserves provenance separately from sensitive details. The labelled field explains that permitted readers can see it. Removing it or silently inventing its content would change the existing contract. This is the explicit Source reference decision requested for this build.
- **Counts describe the permitted result window.** Reporter, Site, Actions and reported time come from existing permission-checked incident reads. All views and their counts use the same latest-200-candidate window and filters, with an as-at time. Holding work uses the actual current hold. Actions open includes incomplete work, unaccepted evidence or changed assignment. Ready to close requires Accepted, current sources and no outstanding action in that read; it is never closure permission. The close command still rechecks exact originals, independent authority and every prerequisite.
- **Site time is displayed; UTC is submitted.** Existing `LocalDateTimeField` handles occurrence and due times using the appointment's site timezone. No new date parser or storage field is added.
- **Visit entry uses the More menu.** My jobs, Field Job and Appointment detail obtain current permitted incident context and offer an exact task/equipment link. Multiple targets remain explicit choices, with no guessed scope.
- **Evidence acceptance still selects one exact file per action.** The drawing shows multiple files together; the existing command records one evidence identity. All permitted originals remain visible with size and SHA-256. Return for correction uses the existing incident-level review decision and says so. No new per-file return authority is implied.
- **The closure preview is an unissued content summary.** Existing closure creates and retains HTML/PDF only when close succeeds. The page explains what the outcome keeps and excludes, its scope and the receiving checks still required; it does not manufacture a pre-issued PDF or promise no remaining work. Actual issued links remain available after success.
- **New reports save before files are appended.** An unsaved report has no persisted incident to attach files to. Save draft opens the existing record, whose Evidence tab retains originals. The accepted saved-draft composition uses that record route. New-report context shows only the visit/site/work-order/equipment information returned by current authorised reads; crew and job-pack details are not fabricated.
- **Existing identities remain exact.** Reads use an allocated incident display number if present, otherwise the stable incident ID. This build does not allocate the illustrated `INC` numbering through a migration.
- **Shared presentation is reused.** `SecondaryMenuFrame`, `RegisterTable`, `SharedRecord`, `RecordTabs`, `WorklistMenu`, `WorklistPanel`, buttons, fields, read/error states, phone header and original-command recovery compose FI-06. Scoped styling uses shared tokens. The current shell/phone header is retained under the user's explicit direction; the old drawn Conversations action is omitted.

## Review limits

The page contracts and [build evidence](../testing/evidence/fi06-figma-build/README.md) separate source inspection, implementation checks, visual comparison and deployment. Missing accepted images for the phone register, full Evidence/History, returned correction, rebinding, reassignment, reopening, denied/empty/loading and tablet record remain explicit. Their existing behaviour is retained and styled with the shared controls. Owner visual/device/screen-reader review remains pending; no fingerprint or acceptance is assigned by this implementation.
