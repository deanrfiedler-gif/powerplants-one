---
document_id: PPO-PJ-CALENDAR-ACTUALS-DEC
date: 2026-10-13
owner: Dean Fiedler
status: Authorised backend implementation; verification and owner acceptance separate
versioning: git
---

# Project working calendars and actual dates

Dean authorised the next PJ-03 backend increment after PJ-01/PJ-02: configurable working calendars, actual task dates and schedule comparisons. This continues BC-02 and PRJ-02/04/07 from PR #461 (`1bb0cc2`), retaining its #458 dependency. Historical blueprint proposals and the supplied Wrike audit do not supply operational calendar rules or production approval.

## Architecture and boundaries

Reuse PostgreSQL, native Project scope, workspace mutation locks, immutable evidence, operation receipts and the existing Next API. Migration 0088 adds empty Project calendar/actual-date revision tables and a baseline calendar companion, with no seed, grant, capability or identity type. A separate scheduling engine is unnecessary for bounded date-only checks; editing earlier baseline rows would destroy the original basis. Existing baselines and task rows are preserved.

The calendar belongs to one Project. Only its current coordinator with current Project read/edit and linked customer/site authority may change it. Existing Project editors may record actual task dates. Closed Projects remain readable and original operations recoverable under current authority, but refuse new calendar/actual-date writes. New commands require observed Project version and their own latest revision; actuals also bind the observed task version. Each accepted change advances Project version and retains an immutable schedule event, audit and original receipt, invalidating stale forecast reviews without changing their dates.

## Calendar contract PPO-PJ-CALENDAR-02

A revision records its name, nonempty unique working weekdays (ISO Monday=1 through Sunday=7), the site's timezone and up to 366 unique date exceptions. Each exception explicitly makes a date working or nonworking and names the reason; it overrides the normal week. Holidays are entered explicitly, never inferred from geography or downloaded. A reason and explicit review acknowledgement are required for every revision. Prior revisions remain selectable and immutable.

An unconfigured Project retains PPO-PJ-CALENDAR-01: synthetic Monday-Friday, no exceptions. A calendar edit changes review calculations only. Forecast dates, progress, actual dates, dependency graph, Activities, Service bookings and reservations do not move automatically. Existing FS links require the next working date strictly after predecessor finish; SS links require no earlier than predecessor start. Nonworking endpoints are warnings, not rejected forecasts. Dates and comparisons are date-only in the recorded site zone. No working hours, effort, signed lag, resource levelling or critical path is inferred. The existing material-withdrawal contract retains its stricter no-weekend retained-predecessor guard alongside new calendar warnings; this increment does not relax that separately accepted SQL boundary.

Working duration counts working dates inclusively. Working-day variance is signed: count working dates in (earlier,later], reversing the sign when needed; equal dates are zero. Calendar-day variances remain separately labelled and unchanged. Unknown endpoints produce null. Calculations are bounded to the existing accepted task-date range. Each read names its calendar revision and basis.

New baselines retain the exact active calendar revision through an immutable companion row. Earlier baselines remain byte-for-byte unchanged and retain their original fixed calendar. Current and selected-baseline calculations identify their different calendar bases explicitly; changing a calendar never reinterprets a historical baseline silently.

## Actual-date contract

Record an actual start, or start and finish, using explicit local dates no later than today in the site's timezone. Finish requires start and cannot precede it. Null start and finish is an explicit reasoned withdrawal of the current actual-date statement; earlier revisions remain retained. Nonworking actual dates are allowed because observed work may differ from the plan. Actual dates do not imply task completion, progress, acceptance, payroll, effort or booking changes. Existing task status/progress remains a separate native statement; the read exposes disagreements for review.

Every revision retains the observed task version and forecast dates, author, reason and time. Subsequent forecast edits leave that evidence intact. Current projections compare actual versus current forecast and an explicitly selected immutable baseline, with completeness and calendar units stated. Permission checks govern reads, history, commands and original-operation recovery.

## Delivery and verification

GET/POST `/api/v1/projects/:id/calendar` and `/api/v1/projects/:id/tasks/:taskId/actuals` provide reads, bounded revision history and native commands. The existing Project overview and programme reads consume the same calendar/actuals source. Frontend editing controls, accepted Figma implementation, business-calendar approval and deployment remain separate.

Verification must cover weekend/holiday/working-day exceptions, signed independent expected calculations, site-local future-date refusal, strict input, missing dates, corrections and retained originals, current scoped denial, stale/racing saves, rollback without detached evidence, closed-project recovery, populated upgrade and repeated migration/seeding. Preserve every historical ledger and grant; exercise reserved Products 0052 after integrated history. The hosted upgrade gate is reviewed against the additive schema and unchanged authority. No production migration, business transaction, merge or deployment is authorised by this implementation.
