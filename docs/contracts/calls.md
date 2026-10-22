# Calling core contract (stage 1b)

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler.

**Sources:**
- [Calling, caller ID and call logging](../decisions/calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP, stage 1b, rules R1–R9, Q1–Q9);
- [ADR-0064](../decisions/ADR-0064-phone-number-library.md) (reading numbers);
- migration `0118-calling-core.sql`;
- requirements CRM-02, CRM-03, NFR-01, NFR-02 and NFR-09.

Everything here is synthetic prototype behaviour:
- there is no web UI yet (stage 1c builds it after the stage 1a design is accepted);
- no phone app or phone-system connector exists (stages 2 and 3);
- owner acceptance and deployment are separate.

## Numbers

Each person and organisation holds 0–10 numbers in `ppo.contact_numbers`.

- **Fields:** a label (`Mobile`, `Work`, `Home` or `Other`), exactly one primary when there are any, an order, the entered text (1–200 characters, trimmed) and the region it was read in.
- **Reading:** a number has an E.164 value only when libphonenumber-js reports it valid for that region. Otherwise `needs_checking` is true and the text is kept as typed (R6). A readable number can also be flagged on purpose.
- **Region:** a local number is read in its company's region from `ppo.company_phone_settings`, or `AU` when the company has no row (Q9). A Person in several companies uses its first company context by id.

| Method and path | Meaning |
|---|---|
| `GET /api/v1/people/[id]/numbers`, `GET /api/v1/customers/[id]/numbers` | `{party_version, numbers[]}` for a party the caller may read. A site-only identity can read its site contact's numbers. |
| `POST` on the same paths | `{operation_id, schema_version: 1, reason, expected_version, numbers: [{label, entered, is_primary, needs_checking?}]}`. Replaces the whole list and bumps the party's version. |

**Authority for the POST:**
- a Person needs `shared.edit` in every company context it has, the same as `RevisePerson`;
- an Organisation needs `shared.edit` in its own company.

**Refusals:**
- `InvalidData`: no primary or two primaries, a repeated E.164 number, an unknown label, or more than 10 numbers;
- `VersionConflict`: a stale party version;
- `OperationConflict`: changed content under a used operation ID;
- `RecordUnavailable`: a party the caller may not see or edit.

**Mirroring:** for a Person, `people.phone` always holds the primary number's entered text, or NULL, so existing screens keep working.

**The legacy single phone field.** `createPerson` and `revisePerson` still accept `phone`:
- with no numbers, a phone creates a primary `Other` number;
- with one number, a changed phone edits that number, and `null` removes it;
- with two or more numbers, a changed phone is refused with `409 UseNumbersEditor`, rather than guessing which number was meant.

**Legacy data.** Migration 0118 copies every non-blank `people.phone` of 1–200 characters, unread, into one primary `Other` number that needs checking, because SQL cannot read numbers. Saving the person's numbers again reads them. A longer value stays only in `people.phone`.

## Number lookup

`GET /api/v1/calls/lookup?number=…[&company_id=…]` reads only and writes nothing.

- A number starting with `+` is read as international. A local number needs `company_id`, whose region is used and which the caller must be able to read.
- An unreadable number returns `{number_e164: null, matches: []}`.
- Each match is a person or organisation that holds the number and that the caller may read (R4), ordered by name. Every permitted match is returned and none is chosen (R5).
- Each match carries:
  - the number's label and checking flag;
  - the person's current organisations;
  - up to 10 open deals, leads and active projects linked to those organisations or to the person, each through its own visibility rule;
  - the last completed and the next open activity among activities linked to those records, or calls logged with the person.

A hidden party behaves exactly as no match. Lookup is the read that the stage 2 phone app and the stage 3 connectors will use.

## Call events and Calls to log

A call event is the fact that a call happened, reported by a source: `ClickToCall` now, and `PhoneApp` or `Teams` later. It is a business identity, so its commands carry ordinary receipts.

- **Stored only on a match (R3).** An event is stored only when its number matches a party the user may read. A number nobody visible holds is discarded, and nothing is written.
- **Once per source reference (R8).** A repeated `(source, source_reference)` returns the event already recorded.
- **No guessing (R5).** The party is recorded only when it is unambiguous.
- **Internal entry point.** `ingestCallEvent(client, principal, call)` is the single entry point every source must use.

| Method and path | Meaning |
|---|---|
| `POST /api/v1/calls/click-to-call` | `{operation_id, schema_version: 1, reason, id, number_id}`. Records that the user started an Outgoing call to that number's party. The party must be readable, and the number must have an E.164 value and must not need checking (`422 NumberNeedsChecking`). It completes nothing (R1). Reusing `id` under a new operation is `409 RelationshipConflict`. |
| `GET /api/v1/calls/to-log` | `{items, count}`: the caller's own To log events, newest first. A party the caller can no longer read shows as `party: null`, and `match_count` says how many people or organisations the caller can see holding that number. |
| `POST /api/v1/calls/events/[id]/skip` | `{operation_id, schema_version: 1, reason, expected_version, skip_reason?}`, where `skip_reason` is `Personal`, `NotBusiness` or `AlreadyLogged`. Own events only (`RecordUnavailable` otherwise). Stale versions are `VersionConflict`, and an event already Logged or Skipped is `409 CallAlreadyResolved`. |

**Retention (Q5).** Skipped events are deleted 30 days after they were skipped. The purge runs inside click-to-call and skip commands for the same workspace. The append-only identity keeps only the id and type. A purged event's receipt is no longer disclosed. To log events are never purged. A Logged event stays with the activity it became and follows activity retention (D-012).

## Log call

`POST /api/v1/calls/log` creates one completed Call activity and its call details in one command. This is the only way a call becomes completed (R1, R2).

**Fields:**
- `operation_id`, `schema_version: 1`, `reason`, `activity_id`;
- `call_event_id?`, `company_id`, `site_id?`, `person_id?`, `number_entered?`;
- `direction` (`Outgoing` or `Incoming`);
- `result` (`Connected`, `NoAnswer`, `LeftVoicemail`, `Busy` or `WrongNumber`);
- `started_at` (UTC), `duration_seconds?` (0–86,400);
- `summary`, `outcome`;
- `links`: 1–10 activity links, as for activities;
- `access_class`.

**The activity created:**
- kind `CustomerContact`, type `Call`, owner the caller;
- created Completed, with the outcome;
- `due_at` set to the call's start.

**Authority:** the same as creating an activity (`activity.edit` and the link rules, including the site rule for deals and leads). A given person must be readable and in the activity's company.

**With an event:** it must be the caller's own and still To log, and the direction must match. The event becomes Logged with the activity's id.

**Without an event:** the entered number, if any, is read in the company's region and kept as typed.

Call details (`ppo.call_details`) are immutable. Planning the next activity is a separate existing command (an activity create, or a deal's or lead's next action), as Record outcome does. A failure there leaves the logged call in place.

**Refusals:** `InvalidData`, `RecordUnavailable`, `CallAlreadyResolved` and `OperationConflict`, and the activity link refusals.

## What is not built

- Any page, sheet or control. That is stage 1c, after the Figma proposal (stage 1a) is accepted.
- A manager view of other people's calls (Q4).
- Company phone settings editing. There is no command yet, so every company reads as `AU`.
- Bulk re-reading of legacy numbers.
- Deduplication of one call reported by two different sources. That belongs to stage 3 and needs the connector's own reference rules.
- The phone app, caller ID, call recording and transcription.
