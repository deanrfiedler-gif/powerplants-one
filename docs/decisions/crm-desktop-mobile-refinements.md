# CRM desktop and mobile refinements

**Revision:** r01 · **Date:** 9 September 2026 · **Owner:** Dean Fiedler · **Parent:** PPO-009 / issue #9.

Dean approved desktop r11 and mobile r07 and explicitly authorised their implementation in Powerplants One. This supersedes the earlier r08/r05.1 presentation boundaries where stated below. The application remains a synthetic, loopback prototype; these changes do not authorise live imports, customer communication or production transactions.

## Implemented direction

| Surface | Behaviour and authority |
| --- | --- |
| Desktop Board | The entire card above the activity band opens a focus-contained snapshot. Contact and organisation are plain card text. Modifier-click retains the canonical deal link. The activity band opens its own activity. |
| Snapshot | Core facts, distinct customer contact/deal owner/activity owner, current site, requirements summary and next activity. Related record links and **Open full deal** remain explicit. Escape restores focus. |
| Stage movement | Desktop drag/drop opens the stage command with the destination selected. Qualification requires its evidence before Save; no three-dot stage menu. The snapshot/full page offers the same keyboard-accessible command. Mobile cards do not drag; stage changes occur inside the deal. A version-bound undo proposal retains qualification history and cannot overwrite intervening changes. |
| Full deal | Shared Timeline / Details / Commercial / Files hierarchy, desktop summary and stage bar, phone layout. Top edit action opens core deal information. Requirements and scope have their own labelled editor. |
| Core editing | Dedicated strict command for title, eligible primary contact or explicit unknown, optional AUD value excluding GST, optional expected close date. Unknown amount and zero differ. Existing company, organisation, site and owner are retained; changing them requires the impact-aware handover/reassociation increment. |
| Requirements | Dedicated command for customer need, inclusions, exclusions, assumptions, constraints, acceptance requirements, timing and delivery. This is bounded structured data, not unrestricted custom fields. Existing commercial revisions are never overwritten by editing CRM requirements. |
| Organisations and People | Permission-filtered server search, allowed sorts, total/count projection, pagination, comprehensive desktop columns and compact mobile contact lists. Organisation roles, sites, facilities and deal counts are scoped independently. No invented person record owner, raw ERP key, bulk import or copied Pipedrive contacts. |
| Personal views | Named query/column preferences persisted per workspace, user and directory. Optimistic version prevents conflicting preference updates. Preferences contain no copied business records and grant no access. |
| Files | Actual permitted draft quotation records, linked to their canonical generation/status/download page. No decorative upload control or invented document output. |

## Domain and implementation boundary

The current immutable pipeline definition still contains **Enquiry and Qualified**, with **Open** sales outcome. The reference design's six stages are not a substitute for an authorised sales close/handover runtime. This increment adds a deliberate reversible transition between the two supported stages, retaining historical qualification. It does not invent Won/Lost, order placement, estimate acceptance, Projects, new facility taxonomy or equipment fields.

Migration **0017** adds optional deal amount/date, structured scope, attributed event snapshots, and personal directory preferences. Numbers 0015 and 0016 remain reserved for concurrent Email/Calendar and Assistant branches. Their migrations must be reconciled in source order before integration; this branch does not modify their work. Original migration checksums and issued reference bytes remain intact.

New business commands use existing `sharedOperation` locking, current-owner permission and relationship checks, expected version, original operation receipt, audit event and outbox. Database constraints require exact events/snapshots, keep next activity intact, and reject non-finite money. Failed/uncertain saves retain the proposal and reconcile the original operation. Contact, deal owner, activity owner and affiliation role remain separate concepts.

No new dependency, framework, host or live source service is introduced. The existing React/Next.js, native dialog and PostgreSQL architecture is reused. A broad PATCH and client-only saves were rejected because they would bypass the established authority and durable history contracts.

## Verification and traceability

New unit, database and browser cases cover money/date/strict validation, separate core/scope persistence, replay and stale versions, qualification/reversal, raw SQL guards, scoped directory projections, saved-view isolation, card hit areas, activity independence, desktop drag, mobile stage editing and responsive directories. Existing full application assurance remains required; no retained deadline or permission assertion is relaxed.

CRM-01–04/08, PAR-03–05/15 and CA-01–07/10/13 remain the parent traceability. This does not close full AT-25, all 78 parent requirements, performance candidates, real-device/screen-reader acceptance or production readiness. Publication and exact validation outcomes belong in the [handover](../delivery/crm-refinements-handover.md).
