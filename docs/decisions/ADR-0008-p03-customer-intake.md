# ADR-0008 — P03 customer context, intake and owned follow-up

**Date:** 5 September 2026 · **Status:** Selected for authorised P03; execution evidence is recorded in the [handover](../delivery/p03-handover.md). **Related:** issue #24; P03, SC-01–SC-04, TR-01, DAT-01–DAT-04/Activity/ActivityLink, API-R01–03/R09/C01/C02/C24, PT-01–04/PT-25 components.

## Decision and alternatives

Extend the existing TypeScript/Next.js/PostgreSQL application, server identity, scope checks, reference allocator and transactional operation/audit/outbox system. Retain every dependency pin and the lockfile. A second identity or operation framework, ORM or external service is unnecessary.

P03 adds real customer/contact/site/equipment/history views, intake and owned follow-up. It does not create work orders, appointments, issued documents, Finance processing or offline queues. Systems and the unassigned Technician retain no business authority. Existing source mappings remain Proposed and configurations remain ReviewRequired.

## Intake mapping and compatibility

Migration 0003 expands the existing Ticket table without updating any old column, ID, reference, version, timestamp, audit, receipt or outbox row. Existing records receive additive `intake_schema_version=1` and `received_time_basis=LegacyUnverified`; new records explicitly use version 2 and UserReported. This is a physical intake mapping version, distinct from API command schema versions. Unknown requester, site, asset, impact, rationale and next action remain null or the exact original clarification text. The old received timestamp is retained and labelled unverified, not promoted into verified source evidence.

P01 `SaveTicketDraft` remains schema 1 with the exact normalised field order and SHA-256 input; old accepted receipts replay unchanged. Its New-only summary edit remains available. Rich input uses separate `CreateTicket` and `SaveTicketIntake` commands with explicit allowlists and version checks. SaveIntake exposes New/NeedsInformation draft editing without changing status. It records user-reported received time separately from server capture/audit time.

New intake requires an owner, next action, received time/channel, summary/symptoms, priority, and either requester identity or explicit requester clarification; absent site is explicitly identification-needed. Incomplete impact and rationale can be saved. New → NeedsInformation creates questions, next action, an Activity and typed link in the same transaction, audit, receipt and outbox. Repeated requests update the existing activity rather than creating another transition; only New exposes RequestInformation. The original question text stays on the ticket; the activity summary is the bounded next action.

**P03 triage gates:** known permitted requester and site, symptoms, impact, priority rationale, next action, valid triage owner and confirmed user-reported received time. NeedsInformation also requires its owned clarification activity Completed with an outcome, plus a recorded clarification resolution. The narrower known-requester/site gate deliberately defers the blueprint's alternative approved identification scope to P04; P03 cannot approve that scope. New → Triaged and NeedsInformation → Triaged are the only triage transitions. Urgent priority bypasses nothing. Triaged is terminal for P03 commands, not a complete service journey.

A ticket can gain its identified site while a clarification activity remains company-scoped. Once a site-scoped activity links the ticket, changing the ticket site is refused to retain original context. Cross-site correction requires a later impact-aware command. Existing and new company visibility contexts are permanent.

## Activities, links and access

Activity categories and states preserve the dictionary. Create starts Open; Update changes active purpose/owner/due; Start permits Open → InProgress; Complete/Cancel permit Open/InProgress → Completed/Cancelled. Completion requires an outcome; cancellation requires a reason. Terminal records and link/access context are retained. Only the current owner with activity.edit can start, complete or cancel; scoped coordinators with activity.edit can update/reassign active activities to validated owners. Due is either a UTC instant or explicitly due-needed, never an invented deadline. My Work groups active overdue/upcoming/unknown dates and terminal records separately.

Activity uses UUID identity in the existing permanent registry; no invented readable-reference type is introduced. ActivityLink uses generated target-specific UUID columns with real composite foreign keys into Organisation/Site/Asset/Ticket, and a nonempty-link deferred invariant. Unsupported future target types are rejected. Links are immutable within P03; correcting links requires a separately designed successor action. An activity's original company/site/access class remains fixed. FinanceQuery always requires RestrictedFinance.

Every activity read, list/search/filter/page, owner lookup and command independently checks its own capability/context/content class **and every linked target**. An inaccessible target suppresses the entire activity, preventing its summary/outcome from disclosing that context. Ownership itself grants nothing. Both the acting user and proposed owner must have the required scope; owner candidates do not include Systems/unassigned technicians. Clarification details in a ticket are withheld when its activity is not readable. Read/receipt errors never become empty counts.

P03 adds activity.read/edit and extends existing service.ticket.read/edit to the already implemented Workspace/Company/Site scopes. Assignment is still disabled. New seed capabilities derive from still-active source grants and run once under seed receipt 3. No permission administration UI exists. Customer general views expose mapping state and dates only; the retained separately authorised source-mapping endpoint owns exact keys. Owner selectors expose names/UUIDs only, not grants or source keys.

## Transactions, reads and UI recovery

Existing sharedOperation serialises graph changes within a workspace and rechecks current authority before prior receipts and expected versions. P01 retains its original row-lock operation path. Each required domain/link/audit/receipt/outbox write commits atomically. No worker or external effect is claimed by receipt task IDs. Links use typed FKs rather than trusting arbitrary UUIDs.

Narrow reads use existing scoped envelopes, bounded pagination and signed actor/filter-bound cursors. New reads include activities/work, ticket lists, company/owner selectors, person affiliations and site history. Equipment search extends literal matching to reference/model/serial without normalising exact identifiers. UI selectors are bounded; commands recheck all submitted relationships.

Business session switching invokes the existing server session endpoint, clears the previous visible context and remounts forms. Forms retain proposed input after validation, stale-version and retryable failures. Comparing a newer saved record does not silently replace the proposal; a distinct user action adopts the new expected version. A successful receipt is the only source of a saved claim. The online form is not an offline queue.

Multiline narrative validation permits line breaks/tabs and rejects other control characters, preserving the same trimming for previously accepted single-line history. P03/P02 shared command routes accept at most 64 KiB; the P01 draft route retains its 16 KiB limit. No unlisted actor/state/audit/authority fields are accepted.

## Fixtures, history and evidence limits

Seed receipt 3 adds complete/incomplete intake and overdue/unknown/upcoming/completed/cancelled follow-up. The original unsuccessful cable replacement and unresolved OEM note are never rewritten. A real owned OEM activity now links the same Asset/Site, with the UI explaining the historical P02 wording. New capture distinguishes original author/occurrence/source from server actor/time and accepts Reported/Suspected only; no invented verified finding or IdentificationPlan approval.

P02 upgrade and fresh full migration/seed paths are separate test obligations. Repeat seed never rewrites edited records, resurrects revoked grants or resets counters; explicit disposal destroys the whole allowlisted synthetic universe. No operational backup/restore or real-device acceptance is implied. Full PT-02/03/04/25 procedures require later prerequisites and remain Not run; all 78 parent requirements and issued source bytes remain intact.

Primary sources checked 5 September 2026: [PostgreSQL 16 constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html), [Next.js data security](https://nextjs.org/docs/app/guides/data-security), [Playwright assertions](https://playwright.dev/docs/test-assertions). The particular scope/lifecycle choices above are PPO implementation decisions, tested separately from vendor capability.
