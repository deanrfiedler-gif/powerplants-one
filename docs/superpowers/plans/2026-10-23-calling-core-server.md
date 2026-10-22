# Calling core server (stage 1b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the server half of PPO's call core: phone numbers read into a standard form, number lookup, call events and Calls to log, and a Log call command. There is no UI in this stage.

**Architecture:**
- A new `src/calls/` module holds pure number reading, party numbers, lookup, call events and call logging.
- Writes go through `sharedOperation` (receipts, audit, outbox). Reads reuse the existing visibility SQL.
- Migration 0118 adds the tables (including `ppo.company_phone_settings` for the region) and extends the audit, outbox and identity-type constraints. `people.phone` is kept as a mirror of the primary number, so existing screens keep working until stage 1c.

**Tech Stack:** TypeScript, PostgreSQL 16, Next.js route handlers, `node:test`, and libphonenumber-js 1.13.15 (exact pin, `max` metadata).

**Spec:** `docs/decisions/calling-and-caller-id-design.md` (PPO-CALLS-CALLER-ID-PROP, PR #672), sections 4 and 5, Q1–Q9 accepted 23 October 2026.

## Global Constraints

- **R1:** opening a phone link never completes anything. Only `logCall` creates a completed Call activity.
- **R2:** an event leaves To log only by Log or Skip.
- **R3:** a number that matches no record the user may read is never stored. The command refuses, and no row is written.
- **R4:** every read and command checks access on the server. A hidden match behaves as no match (`unavailable()`).
- **R5:** every permitted match is returned; the system never picks one.
- **R6:** entered text is kept exactly. E.164 is stored only when the library reports the number valid. Otherwise the number is flagged as needing checking, never discarded.
- **R8:** `(workspace_id, source, source_reference)` is unique, and replays return the same receipt.
- **Labels:** `Mobile`, `Work`, `Home`, `Other`. **Results:** `Connected`, `NoAnswer`, `LeftVoicemail`, `Busy`, `WrongNumber`. **Skip reasons:** `Personal`, `NotBusiness`, `AlreadyLogged`. **Sources:** `ClickToCall`, `PhoneApp`, `Teams`.
- **Retention:** skipped events are deleted 30 days after they were skipped (Q5). A logged event keeps only its activity link.
- **Click-to-call prompt window:** two hours (Q8). This is client behaviour in stage 1c; the server exposes `started_at` so the client can apply it.
- **Region:** `ppo.company_phone_settings.default_phone_region`, or `AU` when a company has no row (Q9). A new column on `ppo.companies` was rejected during the build because it would change rows that several upgrade suites snapshot.
- **Scope:** no new capability, grant, seed, route page or UI. No change to `src/platform/operations.ts`, `src/shared/validation.ts` or any other DK06-OUT09-1 fingerprinted source file. The lockfile change does alter that fingerprint: record this in the ADR.
- **Migration test duties:** follow every rule in `AGENTS.md`.

## Review Focus

1. **Two people share one number** (a reception line). Lookup must return both, and Log call must accept either. Covered in Task 4.
2. **Legacy free-text phones** such as "SYN phone", "ext 23" or "0412 345 678 (mobile)" must survive the migration and person edits unchanged and be flagged as needing checking. Covered in Tasks 2 and 3.
3. **Access withdrawn after an event was recorded.** Calls to log still lists the event, without the party's details, and Skip still works. Covered in Task 5.
4. **A retried click-to-call or Log call request** must not create a second event or activity. Covered in Tasks 5 and 6.
5. **The legacy single-phone editor on a person with several numbers** must refuse to change the phone rather than guess which number. Covered in Task 3.

---

### Task 1: Number reading and its ADR

**Files:**
- Create: `docs/decisions/ADR-0064-phone-number-library.md`, `src/calls/numbers.ts`, `tests/unit/calls-numbers.test.ts`
- Modify: `package.json` and `package-lock.json` (libphonenumber-js 1.13.15, already installed)

**Interfaces:**
- Produces: `readPhoneNumber(entered: string, region: string): { entered: string; e164: string | null; region: string }`
- Produces: `numberLabels`, `callResults`, `skipReasons`, `callSources`, `callDirections` as `const` tuples.

- [ ] Test `reads Australian numbers in E.164`:
  - `0412 345 678` gives `+61412345678`;
  - `(07) 3123 4567` gives `+61731234567`;
  - `1300 123 456` gives `+611300123456`;
  - `+64 21 123 4567` with region AU gives `+64211234567`.
- [ ] Test `keeps unreadable text exactly and returns no E.164`: `SYN phone`, `000`, `ext 23`, and a 51-character string after the length check.
- [ ] Test `trims nothing from entered text except surrounding spaces`.
- [ ] Run `node --import tsx --test tests/unit/calls-numbers.test.ts`. It must FAIL.
- [ ] Implement with `parsePhoneNumberFromString` from `libphonenumber-js/max`. Return E.164 only when `isValid()`. A region must match `/^[A-Z]{2}$/` or the function throws `invalid("region", …)`.
- [ ] Write ADR-0064, covering:
  - why a library rather than PPO's own rules (Q7);
  - the MIT licence, the absence of runtime dependencies and the exact pin;
  - the alternatives: own rules, and Google's Java-port packages;
  - the DK06-OUT09-1 lockfile fingerprint consequence;
  - the audit gates passing.
- [ ] Run the unit test. It must PASS. Commit.

### Task 2: Migration 0118

**Files:**
- Create: `db/migrations/0118-calling-core.sql`, `tests/database/calls-migration.test.ts`
- Modify: `scripts/migration-registry.ts` (append the file; `latestMigrationVersion = 118`), `scripts/demo-upgrade.ts` (gate 118 with a comment)
- Delete: `db/reservations/0118.md`
- Modify: every file under `tests/` that the `AGENTS.md` search finds (`git grep -lwE '0?116' tests/`), plus `tests/demo/upgrade.test.ts` (+1)

**Interfaces:**
- Produces these tables:
  - `ppo.contact_numbers(id, workspace_id, person_id?, organisation_id?, label, entered, e164?, region, needs_checking, is_primary, position, created_at/by, updated_at/by, synthetic)`. Exactly one party is set. `needs_checking` is true whenever `e164` is NULL. A partial unique index allows one primary per party. Index `(workspace_id, e164)`.
  - `ppo.call_events(id, workspace_id, user_id, source, source_reference, direction, number_e164, person_id?, organisation_id?, started_at, answered?, duration_seconds?, state, activity_id?, skip_reason?, resolved_at?, resolved_by?, version, created_at, synthetic)`. `UNIQUE(workspace_id, source, source_reference)`. The state CHECK ties `activity_id` to Logged and `resolved_*` to Logged or Skipped.
  - `ppo.call_details(activity_id PK, workspace_id, direction, result, number_entered?, number_e164?, person_id?, started_at, duration_seconds?, call_event_id? UNIQUE, created_at, created_by)`. Immutable through `ppo.immutable_evidence()` on UPDATE or DELETE.
  - `ppo.company_phone_settings(workspace_id, company_id, default_phone_region)`.
  - `CallEvent` becomes a business identity type, so receipts can reference events. This follows the `identity_target` rule; a purged event leaves only its id and type.
- The constraints extend in the 0110 idiom:
  - `ck_audit_object_type` gains `CallEvent`;
  - `ck_outbox_kind` gains `CallEventRecorded`, `CallEventSkipped` and `CallLogged`.
- Backfill: each person with a non-blank `phone` gets one primary `Other` row with entered text equal to `phone`, `e164` NULL and `needs_checking` true. SQL cannot read numbers; the next save re-reads them (contract note).

- [ ] Test `0118 upgrade from 0116 keeps every person phone byte-for-byte as one primary Other number needing checking`. Seed two people with `0412 345 678` and `SYN phone` at version 116, upgrade, and assert the rows, `people.phone` unchanged and the new tables empty.
- [ ] Test `0118 constraints refuse two primaries, both parties, a Logged event without an activity, and any change to call_details`.
- [ ] Test `0118 re-run is a no-op and the ledger is exact`.
- [ ] Write the migration, registry entry and demo gate. Delete the reservation.
- [ ] Extend the version lists. For each hit, read the whole assertion, and follow the 0116 commit `f424746a` as the pattern.
- [ ] Run `calls-migration`, `field`, `project-commercial-upgrade` and `tests/demo/upgrade.test.ts`. All must PASS. Commit.

### Task 3: Party numbers

**Files:**
- Create: `src/calls/party-numbers.ts`, `tests/database/calls-numbers.test.ts`
- Modify: `src/shared/commands.ts` (`createPerson`), `src/shared/contacts/commands.ts` (`revisePerson`)

**Interfaces:**
- Produces `readPartyNumbers(p: Principal, party: "Person" | "Organisation", id: string)`. It returns `{ party_version, numbers: { id, label, entered, e164, needs_checking, is_primary, position }[] }`.
- Produces `setPartyNumbers(p, party, id, input)`, where input is `{ operation_id, schema_version, reason, expected_version, numbers: { label, entered, is_primary }[] }`.
  - At most 10 numbers.
  - Exactly one primary when the list is not empty.
  - Entered text 1–200 characters, matching the legacy field.
  - A number can be flagged by setting `needs_checking: true` on that entry, which stays true even when it reads.
  - The command replaces the whole list and bumps the party version.
  - For a Person, it sets `people.phone` to the primary's entered text, or NULL.
  - Audit: Person or Organisation `SharedRecordUpdated`, with before and after lists.
  - Authority: a Person uses `personEditAuthority`. An Organisation uses `visible` plus `companyContext(..., "shared.edit")`.
  - Region: from the party's company. For a Person in several companies, use the first company by id.
- Produces `syncLegacyPhone(c, p, personId, phone: string | null)`, used by `createPerson` and `revisePerson`.
  - No numbers and a phone given: insert a primary `Other` number.
  - One number: replace its entered text and re-read it.
  - NULL: delete the only number.
  - Two or more numbers with a changed phone: throw `AppError(409, "UseNumbersEditor", "This person has several numbers. Change them in the numbers editor.")`.

- [ ] Tests:
  - `set numbers reads, orders and mirrors the primary into people.phone`;
  - `exact replay returns the receipt; a stale version conflicts`;
  - `a site-only or other-company identity cannot read or set numbers`;
  - `organisation numbers need shared.edit in its company`;
  - `revisePerson phone edits the single number and refuses with UseNumbersEditor when there are several`;
  - `createPerson with "SYN phone" stores one primary flagged number`;
  - `existing contacts-native and people-register suites still pass`.
- [ ] Implement, run, and commit.

### Task 4: Number lookup

**Files:**
- Create: `src/calls/lookup.ts`, `tests/database/calls-lookup.test.ts`

**Interfaces:**
- Produces `lookupNumber(p: Principal, input: { number: string; company_id?: string })`.
  - The number must start with `+`. Otherwise `company_id` gives the region, and without it the call is refused with `invalid("number", …)`.
  - An unreadable number returns `{ number_e164: null, matches: [] }`.
- Each match has this shape: `{ party_type, party: { id, display_name }, number: { id, label, needs_checking }, organisations: { id, display_name }[], open_opportunities: { id, title, stage_id }[], open_leads: { id, title, status }[], open_projects: { id, title, status }[], last_activity: { id, summary, updated_at } | null, next_activity: { id, summary, due_at } | null }`.
- Visibility uses `visibility("Person"|"Organisation")`, `opportunityVisibility`, `leadVisibility`, `projectVisibility` and `activityVisibility`, each guarded by its `*Available` check.
- A Person's organisations come from current relationships (`valid_to IS NULL OR valid_to > current_date`). Deals, leads and projects are those whose `organisation_id` is one of those organisations, or whose `primary_person_id` is the person.
  - Open deals have `close_outcome='Open'`.
  - Open leads have status `New`, `Contacting` or `Nurturing`.
  - Open projects have any status other than `Complete`.
- Last and next activity are taken across activities linked to the match's organisations, deals, leads and projects.

- [ ] Tests:
  - `one number on two people returns both, ordered by display name`;
  - `a hidden person or a hidden deal is omitted, not counted`;
  - `a local number needs company_id; unreadable returns no matches`;
  - `lookup writes nothing (row counts before and after)`.
- [ ] Implement, run, and commit.

### Task 5: Call events and Calls to log

**Files:**
- Create: `src/calls/events.ts`, `tests/database/calls-events.test.ts`

**Interfaces:**
- Produces `ingestCallEvent(c: PoolClient, p: Principal, e: { id; source; source_reference; direction; number_e164; person_id?; organisation_id?; started_at; answered: boolean | null; duration_seconds: number | null })`.
  - Internal; stage 2 and 3 connectors reuse it.
  - With no permitted match it returns `null` and writes nothing (R3).
  - A retried `(source, source_reference)` returns the existing row.
- Produces `recordClickToCall(p, input)`, where input is `{ operation_id, schema_version, reason, id, number_id }`.
  - The server reads the number row and checks the party is visible.
  - It refuses a number needing checking with `AppError(422, "NumberNeedsChecking", …)`.
  - Source `ClickToCall`, reference `id`, direction `Outgoing`, answered `null`, `started_at = now`.
  - Audit `CallEvent` / `CallEventRecorded`.
- Produces `listCallsToLog(p)`.
  - Returns the actor's own To log events, newest first.
  - The party appears only while still visible; otherwise `party: null`.
  - Returns `{ items, count }`.
- Produces `skipCallEvent(p, id, input)`, where input is `{ operation_id, schema_version, reason, expected_version, skip_reason? }`.
  - Own event only, and To log only.
  - Audit `CallEvent` / `CallEventSkipped`.
- Produces `purgeSkippedCallEvents(c, p)`. It deletes the workspace's events skipped more than 30 days ago. It is called at the start of `recordClickToCall` and `skipCallEvent`.

- [ ] Tests:
  - `click to call stores one Outgoing event and replays exactly`;
  - `a number needing checking, a hidden party or another workspace's number is refused and stores nothing`;
  - `ingest with an unmatched number stores nothing`;
  - `another user's event is not listed and cannot be skipped`;
  - `skip records the reason; skipping twice conflicts`;
  - `events skipped 31 days ago are purged, 29 days kept, To log never purged`;
  - `an event whose party became hidden lists with party null and can still be skipped`.
- [ ] Implement, run, and commit.

### Task 6: Log call

**Files:**
- Create: `src/calls/log-call.ts`, `tests/database/calls-log.test.ts`

**Interfaces:**
- Consumes `authoriseActivityInput` and `insertActivity` from `src/activities/activities.ts`, and `ingestCallEvent` and `readPhoneNumber` from earlier tasks.
- Produces `logCall(p, input)`. Input fields:
  - `operation_id`, `schema_version`, `reason`;
  - `activity_id`, `call_event_id?`, `company_id`, `site_id?`, `person_id?`;
  - `number_entered?`, `direction`, `result`, `started_at`, `duration_seconds?`;
  - `summary`, `outcome`, `links`, `access_class`.
- What it does:
  - Inserts one Completed activity: kind `CustomerContact`, `activity_type` `Call`, owner the actor, `due_at = started_at`, `due_needed` false, and the given links (1–10, as `parseLinks`).
  - Adds one `call_details` row.
  - Moves the event to Logged when one is given. It must be the actor's own and To log.
  - The person must be visible and in the company context.
  - Audit `Activity` / `CallLogged`, with the event id in the details.
- Next activity is not part of this command. The client uses the existing next-action commands, as Record outcome does.

- [ ] Tests:
  - `log from an event completes one Call activity with details and marks the event Logged`;
  - `exact replay returns the receipt; a second log of the same event conflicts`;
  - `manual log with an unknown number keeps the entered text and no event`;
  - `another user's event, a hidden link or a person outside the company is refused and writes nothing`;
  - `the logged activity appears in listActivities with activity_type Call`.
- [ ] Implement, run, and commit.

### Task 7: Routes, contract and status

**Files:**
- Create the route handlers:
  - `src/app/api/v1/calls/lookup/route.ts` (GET);
  - `src/app/api/v1/calls/to-log/route.ts` (GET);
  - `src/app/api/v1/calls/click-to-call/route.ts` (POST);
  - `src/app/api/v1/calls/events/[id]/skip/route.ts` (POST);
  - `src/app/api/v1/calls/log/route.ts` (POST);
  - `src/app/api/v1/people/[id]/numbers/route.ts` (GET, POST);
  - `src/app/api/v1/organisations/[id]/numbers/route.ts` (GET, POST). Check the organisations route folder name first.
- Create: `docs/contracts/calls.md`, `docs/status/2026-10-23-calling-core-server.md`, and `docs/standards/document-register-entries/2026-10-23-calling-core-server.csv`.

Route handlers follow `readRoute` and `commandRoute` exactly as `src/app/api/v1/activities/route.ts` does.

- [ ] Search `tests/` for any route inventory or route-coverage test, and register the new routes where one exists.
- [ ] Write the contract, covering:
  - the endpoints and payloads;
  - every refusal code;
  - the R1–R9 mapping;
  - the legacy-phone backfill note;
  - the purge rule;
  - what stage 2 and 3 connectors call;
  - what is not built.
- [ ] Run these and confirm they pass:
  - `node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/calls-*.test.ts`;
  - `npm run test:unit`;
  - `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`;
  - `npx eslint src scripts tests`;
  - `python3 scripts/build_status.py --check`;
  - `python3 scripts/check_naming.py`;
  - `python3 scripts/check_foundation.py`.
- [ ] Commit, merge `origin/main`, push, and update the PR body with the actual results.
