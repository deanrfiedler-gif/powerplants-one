# Lead record readiness and summary reads

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: backend implementation authorised; independent review, visual acceptance and deployment remain separate.

## Scope and authority

Dean authorised conversion readiness and record-summary backend reads and PR publication. This contribution follows [PR #451](https://github.com/deanrfiedler-gif/powerplants-one/pull/451) at `d02b2583cd6784d596b5a5bb69ff0a8db21c38d4`; it is a dependent BC-01 increment, not a claim that #451 is merged. Trace: PPO-009, CRM-02/03/04/06, AT-02/25, LC-01/02/06/08/11/12, existing `route:/sales/leads/[id]`, and R3/R5 of the accepted [record-page design](lead-record-page-design.md).

The native Lead conversion parser, ownership/permission guards, customer relationships, Activity authority and LC-11 source comparison govern this read. Captured enquiry and current resolution remain separate. Competitor account observations grant no operating authority. No migration, seed, capability, dependency, external connection or UI change is introduced.

## Detail contract

`GET /api/v1/crm/leads/{id}` retains existing fields and adds `conversion_readiness` and `record_summary`. The existing list DTO is unchanged and does not compute these additions. The response stays private/no-store and requires the existing Lead visibility in the selected workspace/company. Existing `can_convert` retains its legacy action-visibility meaning; clients must not interpret it as field completeness or a promise of command success.

The read uses one client and a workspace shared lock, matching native command write locking. Data observation is taken after acquiring that lock. Exposed activities and Lead visibility are checked again before returning, including time-limited grants. No receipt, audit event, outbox job or business record is created. A read failure returns no partial successful response. The next request recomputes readiness; no cached eligibility token is issued.

## Conversion readiness

The preview uses the latest saved customer resolution when present, otherwise captured identities. Text-only enquiry names do not become shared identities. A restricted resolution produces unavailable checks without its IDs or labels.

| Field | Meaning |
|---|---|
| `state` | `ReadyForReview`, `NeedsAttention`, `Unavailable` or `NotApplicable` |
| `lifecycle` | `Active`, `Archived`, `Disqualified` or `Converted` |
| `authority` | `Allowed` means current-owner Lead conversion authority and Deal creation scope pass; customer/Activity eligibility has separate checks. Otherwise `Unavailable`, or `NotApplicable` for terminal/archived records |
| `context_source` | `Captured` or `Resolved`; null when readiness does not apply |
| `checks` | Stable keys with a state and an explanatory message; empty when readiness does not apply |

Checks are `organisation`, `site`, `contact`, `requirement`, `qualification_note`, `customer_context`, `next_activity` and `source_activities`. Check states are `Complete`, `Missing`, `AskedOnConversion`, `ReviewRequired` and `Unavailable`.

- Saved organisation/site/contact selections are shown separately from their current relationship validity. Missing site/contact is not a mandatory creation gate: conversion can instead collect the native unknown reason. An unknown contact also requires the existing active contact-identification action owned by the Lead owner.
- The requirement must be present. Qualification note is always `AskedOnConversion` for an active Lead; this read never invents one.
- `customer_context` reuses native relationship and eligible Deal-owner checks, including current site-party/contact affiliations and pipeline availability.
- `next_activity` requires an accessible active saved next Activity and its native input authority. Completed/cancelled means `Missing`; hidden or unauthorised means `Unavailable`. An undated active action is sufficient under native conversion rules even though its follow-up summary says `DueNeeded`. Conversion may select/create a different next action.
- Every linked source Activity, including completed history, is checked. The future-carry guard is shared with the conversion command. Different site/access context yields `ReviewRequired`; inaccessible sources or invalid Activity-owner authority yield `Unavailable`. No hidden Activity IDs, titles or counts appear in these checks. The existing LC-11 form remains responsible for exact comparisons, retention reasons and a new dated owned review action where required.

`ReadyForReview` means the currently saved facts and authority checks pass apart from the explicitly deferred qualification note. It does **not** claim conversion is executable without a payload. The command still checks current permissions, expected Lead version, every supplied Activity version, chosen context, qualification note, unknown reasons and identification/follow-up actions atomically. Archived, disqualified and converted records return `NotApplicable`; reopening recomputes from current facts. This wording is a backend distinction for the eventual readiness-bar implementation; no Figma capture or accepted visual baseline is rewritten.

## Summary definitions

- `observed_at`: UTC read observation, after acquiring the workspace lock.
- `lead_version`, `created_at`, `updated_at`: current saved Lead values; Activity changes do not imply a Lead version change.
- `age_days`: completed elapsed 24-hour periods since Lead capture, clamped to zero for clock skew. Basis `Elapsed24HourDaysSinceCapture`. It remains record age for converted/archived/disqualified records, not conversion duration or a calendar-day difference.
- `last_activity`: the visible linked Activity with greatest `updated_at`, ties by ascending stable ID; returns only its ID, version, summary, status and updated time. Basis `LatestActivityUpdate`. Creation, rescheduling, completion and cancellation can change this value. Lead notes/edits do not. This is not the time of the most recent customer contact or the last completed Activity.
- `activity_scope`: always `VisibleLinkedActivities`. A null last activity means no linked Activity is visible; it makes no claim that none exists. Hidden history is never replaced with a fabricated date or exposed through a count.
- `next_action_state`: the existing detail follow-up result, using the same observation instant and existing due/date-only rules: `Needed`, `DueNeeded`, `Overdue`, `Upcoming` or `Unavailable`.

## Verification and remaining scope

[Execution evidence](../testing/evidence/lead-record/README.md) records actual checks and limitations. Tests exercise the native receiving commands, saved versus resolved facts, completed/cancelled actions, missing and hidden evidence, relationship/permission movement, authority isolation, lifecycle changes, time boundaries, stale versions and no read-created effects. Historical upgrade comparisons preserve every original persisted field while treating observation time and schema-dependent eligibility as derived data.

Grouped history/counts, other customer work, record-position navigation, email/file links, Microsoft/SharePoint integration and Figma page implementation remain separate increments. Business acceptance, device/visual review, deployment and operational authority are not inferred from these backend reads.
