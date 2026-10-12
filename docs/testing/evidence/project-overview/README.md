---
document_id: PPO-PJ-OVERVIEW-BACKEND-EVIDENCE
date: 2026-10-13
owner: Dean Fiedler
status: Verification in progress; independent review and acceptance separate
versioning: git
---

# Projects receiving and overview backend execution evidence

Authority and definitions: [PJ-01/PJ-02 contract](../../../decisions/project-overview-backend.md). Source branch `codex/projects-overview-backend`, based on PR #458 head `9b87786ff27b19a1c007876beea5a50b783889f4`. Updated parent #458 head `0213e8d` was merged at `56c7c0e`, preserving all combined backend contributions. This is a dependent backend contribution; no merge or deployment is performed. Issued references, parent IDs, source snapshots, grants and migrations are preserved.

Local synthetic environment: Windows, Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15; private loopback cluster on port 56417 and disposable `ppo_synthetic_test`. Credentials and command logs remain outside Git. No operational data or external system is used.

## Actual verification

Execution is in progress. Results below are updated only after commands complete. UI, independent review, owner acceptance and deployment are not inferred from API results.

| Check | Result |
|---|---|
| Date, timezone and transitive-successor units | 2 passed |
| Database receiving, overview, scope and exact-source preservation | In progress |
| Existing native Sales receiving and PJ-09 closeout regressions | Pending |
| Compiled HTTP | Pending |
| PostgreSQL and application process restart | Pending |
| Type, lint and production build | Pending final source |
| Foundation, naming and design register | Pending final source |

## Failures and limits

The first five-case run passed three cases and failed two: the new all-table preservation helper opened 16 connections concurrently and hit the existing 3-second connection timeout; the new receiving fixture omitted the dated follow-up which native Sales submission requires. The helper now compares the same full rows sequentially on one connection, and the fixture supplies a dated native Activity. No assertion, timeout or business rule was relaxed.

The next run hit the same cold connection timeout in its first reset hook. A separate source export of unmodified main `c3ff5b90d0730f55583b6ee73f9d1af4a449695e` reproduced `Connection terminated due to connection timeout` after 3,014 ms on a read-only `SELECT 1` using the same private environment; `src/platform/database.ts`, config and demo config are identical to main. This is environment evidence, not a Project regression. The failed diagnostic read during a schema reset is not counted as application verification. Passing final runs/replays and Linux CI remain separately recorded.

TypeScript and lint passed before the final integration/date-variance additions; final-source build and assurance remain separate. No grant or business rule has been relaxed.

No page, shell or shared component changes are made. Accepted Figma implementation, related-domain summaries, full merged history/record position, operational calendars/actuals, owner/device review and deployment remain open. Source presence and synthetic functional proof do not establish business acceptance or full PRJ-01–08 completion.
