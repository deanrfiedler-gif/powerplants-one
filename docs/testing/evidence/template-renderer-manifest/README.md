# DK-06 rendering-only template manifest evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Local synthetic verification on 15 October 2026. CI, independent review, owner acceptance and deployment remain separate.

Base: main `d070a61` (after PR #498). The [decision](../../../decisions/template-renderer-manifest.md) records Dean's choice of option A for gap G5; the [contract](../../../contracts/template-publication.md) describes DK06-OUT09-2. [Execution summary](execution.json) pins source hashes and outcomes.

Environment: isolated loopback PostgreSQL 16.15 cluster, `ppo_synthetic_test`, Chrome 155 (reviewed channel), Windows 11. Node was 24.21.0 until 19:57 AEST, when an MSI installer outside this work replaced it with 24.22.0 and stopped running processes; every check below that ran across that window was re-run. The repository still pins 24.21.0.

## Reproduction before the change

`tests/database/template-manifest-drift.test.ts` at commit `0744de4` (unchanged main runtime) published and assigned a managed DK06-OUT09-1 definition. It then changed one byte of `package-lock.json`, `src/platform/operations.ts`, `src/shared/validation.ts` or `src/platform/browser.ts` in a disposable copy of the manifest files. Each change made the publication read `DefinitionChanged` and refused Job pack preparation with `TemplateUnavailable`; restoring the bytes prepared again. Result: 1/1 pass, confirming the defect. A unit-level check showed the legacy v2 P11 definition unaffected by the same edits.

## Checks after the change

| Check | Result |
|---|---|
| New units (`template-renderer-contract`) and retained R3 unit | 4/4 pass. DK06-OUT09-2 lists exactly six rendering sources and the lockfile's playwright and playwright-core versions; dispatcher returns legacy v1/v2 and DK06-OUT09-1 unchanged. Six unrelated edits keep DK06-OUT09-2 supported while DK06-OUT09-1 still refuses them; six rendering/branding edits and either Playwright version change withdraw DK06-OUT09-2. |
| G5 database proof | Pass. With all six unrelated edits applied, an assigned DK06-OUT09-2 site prepares, checks, issues and renders (PDF carries `DK06-OUT09-2`); a `src/documents/render.ts` edit still reports `DefinitionChanged` and refuses preparation. |
| 0103 guard | Pass. The same reviewed revision inserted as DK06-OUT09-1 is refused (23514); as DK06-OUT09-2 it passes the guard (rolled back). |
| Populated 0102 upgrade | Pass. An assigned DK06-OUT09-1 publication and queued pack survive byte for byte; only 0103 is added; repeat migration and seeding are inert; the retained definition stays supported and issues; a reviewed successor publishes as DK06-OUT09-2 and keeps issuing through unrelated edits while DK06-OUT09-1 fails closed. |
| R3 and R4 regression | R3: six cases and the populated 0092 upgrade pass, now exercising DK06-OUT09-2 rendering, escaping and stale-definition refusal. R4: six cases and the populated 0093 upgrade pass. Two R4 cases first failed with pool connection timeouts while the production build saturated the CPU; the file passed 6/6 on re-run. One earlier run was killed by the Node reinstall and re-run. |
| Full unit suite | 851/858. The three Windows filesystem failures (document-store ×2, recovery) also fail on an unmodified-main control worktree. Four timing cases (azure-demo, cpq-packages workload, foundation ×2) timed out under load; they pass on two consecutive re-runs in both the branch and the main control. |
| TypeScript, changed-source ESLint, Prettier | Pass. |
| Production build | Pass (before the 16 October merges below). |
| Compiled HTTP (DK-06 lane) | 5/5 pass against the compiled build on a task-owned port, each after a fresh reset: catalogue, drafts, copied-base authority, publication, and use assignment with succession and recovery. |
| Edited ledger suites (spot check) | 8/8 pass: Products upgrade from 25, 101, 102 and the new 103 starting point; Project commercial from 25 and 100; CPQ populated 0101; R2 populated 0090. |

## Integration with main, 16 October

Main moved to `1552cfb` with the 15 October audit fixes. Two of them edit DK06-OUT09-1 manifest files: #506 (`publication/render.ts`, literal insertion of published text) and #515 (`operations.ts`, English canonical key order). They withdraw DK06-OUT09-1 definitions published before them, as G5 describes. The DK06-OUT09-2 renderer was copied before #506, so the same fix was ported and a test added first. On the copied renderer, a title, label and site name carrying `$&`, `` $` ``, `$'` and `$$` produced seven `<h1>` elements; after the fix there is one, with the text verbatim.

After the merge, the eight template units pass, including #506's and #515's own tests. TypeScript and changed-source ESLint pass. On the merged tree the database re-run passes the G5 proof, the 0103 guard and the six R3 cases, which cover rendering, escaping and worker recovery through the dispatcher. The populated 0102 upgrade first hit a 3 s pool connection timeout while its snapshot opened about 18 connections on a machine at 100% CPU; run alone, it passes. Foundation and naming checks pass.

## Local limits

Under this machine's load, a new PostgreSQL backend took 20–30 s to load `pg_timezone_names`, exceeding the app's 10 s statement timeout inside the seed's site trigger. Database and HTTP runs therefore used an uncommitted preload that queues one warm-up query per new connection with the timeout lifted and then reset; application timeouts, assertions and deadlines are unchanged. The task's disposable cluster also stopped once without a shutdown record and was restarted.

Migration ledgers were moved to 0103 in every suite that pins them (53 files: every suite 0102 touched, plus the CPQ packages upgrade that #498 added). Only the suites listed above ran locally; the remaining ledger suites, the hosted-demo upgrade suite and the full HTTP lane are left to CI. No restart proof was run: the change adds no durable record type. No access-review, studio or UI change is involved.
