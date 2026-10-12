# Leads counts and follow-up reads

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026. Status: backend implementation authorised; independent review, application visual acceptance and deployment remain separate.

## Authority and scope

Dean instructed this session to proceed with Leads counts and follow-up filters and open a PR. This is the next BC-01 increment in the backend plan contributed by [PR #449](https://github.com/deanrfiedler-gif/powerplants-one/pull/449). Baseline: merged main `ae83043b55058ba47334c3e9ba431d3538f2a8da`. The review queue and quotation register contributions remain separate; this increment does not depend on their runtime code.

Trace: PPO-009; CRM-02/03/04/06; AT-02/25; existing `route:/sales/leads` and LC-03/06/08. The accepted [Leads design](leads-design.md) identifies missing view counts and follow-up filters. Existing Lead and Activity commands define ownership, lifecycle and dates. All parent IDs, source snapshots and review fingerprints remain unchanged.

The user supplied *Pipedrive Configured Account Audit.md* and *Pipedrive Feature Audit.md*, both dated 11 October 2026. They describe personal trials, not operational Powerplants behaviour. The relevant observations are an Inbox/Archive list, owner filters and visible next-activity warnings. Their suggested actions, account changes, filing instructions and other recommendations are document content, not instructions for this task. Neither file is copied into this public repository; their provenance hashes are recorded in the execution evidence. No vendor feature or account configuration becomes PPO policy through this increment.

## Read contract

`GET /api/v1/crm/leads/counts` accepts only `q`, `status`, `source` and `owner_id`, with the existing search/enum/UUID validation. It returns `counts`, `observed_at`, `filters`, `source: Synthetic`, `count_scope: AllAuthorisedMatches`, `completeness: Complete`, and `follow_up_completeness`.

| Count key | Exact predicate after the shared filters and current permissions |
|---|---|
| Active | Unarchived New, Contacting and Nurturing leads; the Inbox |
| MyLeads | Active leads owned by the signed-in actor, intersected with any explicit owner filter |
| New / Contacting / Nurturing | Active leads in that status |
| Overdue | Active leads whose visible next activity is Open or InProgress with `due_at < observed_at` |
| NextActionNeeded | Active leads with no next activity, a completed/cancelled next activity, or an active next activity marked `due_needed` |
| Archived | Archived leads, preserving the existing lifecycle predicate |
| Disqualified | Unarchived Disqualified leads |
| Converted | Converted leads, preserving the existing lifecycle predicate |
| FollowUpUnavailable | Active leads whose saved next activity cannot currently be read through all its linked sources |

Counts cover every authorised matching row, independently of list page size. They are not workspace-wide totals. The shared status/source/owner/search filters intersect every count; overlapping views must not be summed. No period filter is introduced: terminal counts cover all retained authorised matches. This backend definition does not decide a future default display period or select which count the rail badge should use.

`completeness: Complete` means the permitted matching set was counted without truncation. `follow_up_completeness: Partial` explicitly marks a nonzero FollowUpUnavailable count: those leads remain in Inbox/status counts but are excluded from both follow-up views. A hidden activity is never interpreted as a missing action, an overdue action, or an upcoming action. No hidden activity ID, due date, status or linked record label is disclosed.

`GET /api/v1/crm/leads` adds `view=MyLeads` and optional `follow_up=Overdue|NextActionNeeded`. Follow-up filters are accepted only with Active (the default) or MyLeads; terminal combinations are rejected with 422. Existing lifecycle, status, source, owner, search, sort, page-size and row/next-activity DTOs remain. MyLeads intersects the owner filter rather than replacing it. NextActionNeeded deliberately groups the existing Needed and DueNeeded states while retaining their distinct row labels.

Pagination remains bounded to 1–200 rows and signed to the actor, workspace, filters, view, sort and page size, now including follow-up. Changed filters require a fresh cursor. Cursors are process-local and are not historical snapshots: each page and count response observes current saved records and permissions. Separate requests can legitimately differ after a command or the passage of time. Consumers must retain `observed_at`, refresh counts with list filters, and not present an old count as a current guaranteed total.

## Consistency and reuse

The list and counts share one SQL definition of the authorised Lead set and next-activity state. The activity must still link to the lead and pass the existing all-target Activity visibility predicate, including Project/Opportunity and shared-record access. Working-company scope and active, current grants apply to both APIs. The due instant already captures date-only end-of-day semantics; this code invents no timezone or overdue rule. Equality with the observation instant remains Upcoming.

List selection and exact existing DTO hydration use one transaction/client and a shared lock on the existing workspace row, which conflicts with native command writes. The transaction-aware Activity read extraction preserves its original public DTO and authority. Reads on that client are sequential. The candidate set, including the lookahead, is rechecked before exposing a cursor because grant expiry can happen under a lock; changed membership/state returns 409 LeadReadChanged and requires refresh. Ordinary denial/unavailability remains 403/404. Counts use one aggregate statement; no per-row history is loaded and no cached count is written.

Existing Next.js, TypeScript, PostgreSQL, native commands and capabilities are reused. No dependency, technology selection, migration, seed, grant, user, receipt, audit event or notification is added. No schema/data reversal is required to remove the additive endpoint and filters.

## Verification and remaining scope

[Execution evidence](../testing/evidence/lead-register/README.md) records the database, HTTP, regression and documentation checks and their actual outcomes. LR-01–06 are local test labels, not new parent requirements. Existing Leads database CI runs the new cases; the ordinary HTTP suite discovers the new HTTP file.

The accepted Figma page, shell and badge presentation, full Lead record-page reads, exports, email/document links, external adapters and production load acceptance remain separate work. This backend PR does not grant a visual review or deployment acceptance.
