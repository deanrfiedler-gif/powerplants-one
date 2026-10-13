# Projects register execution record

Owner: Dean Fiedler. Implementation requested 13 October 2026. Branch `codex/projects-figma-ui`; PR #463. Started from main `c3ff5b9`, reconciled with main `d195e67` in `c7fd5b3`. The [decision](../../../decisions/projects-register-native.md) records source frames, semantics and adaptations.

## Implemented boundary

The native register adds no migration, seed, permission or business command. Existing creation, schedule, Programme, Sales receiving and closeout remain authoritative. The combined branch preserves the separate Project RAID migration 0087 and all other contributions from main. That migration belongs to #458, not this UI increment.

The exact Projects Figma frames and high-fidelity contexts were inspected. Source-bound browser assertions check desktop 40 px table rows/header, 60 px toolbar, 240 px secondary menu, 360 px selection panel, 960/440 px snapshot and 80 px phone rows. Smaller 1024/768 and 320/740 layouts keep snapshot actions within the viewport. The shared global search, company context, guide and development controls remain available; the supplied design does not depict all these application controls. Local captures use the established unconfigured/offline glyphs. Licensed Kit artwork and private Figma renders remain outside Git; exact public icon-free source captures are still missing.

## Executed checks

- Two focused unit tests passed: CSV quoting/formula protection and the site's local date boundary. Eight navigation-context/safety unit tests passed.
- The initial database scenario passed (610.6 seconds). The stronger scenario passed before integration (209.0 seconds) and against merged main including 0087 (239.3 seconds), each with one pass and zero failures including clean reset hooks. It verifies native saved facts, completed/incomplete/undated milestones, distinct task risk, full-match counts, filters, deterministic paging, bound/invalid cursors, loss of a cursor anchor after a native task update, permissions, reconnect and unchanged history for reads.
- The compiled register replay on `3affea6` passed all four desktop/phone cases in 57.6 seconds. The final replay on integrated runtime `7a11509` passes all four cases in 88.6 seconds, including readable breadcrumb/search separation, native creation, saved snapshots, CSV, sequence, restored filters, press-and-hold selection, Gantt handover, source geometry, smaller screens, failed refresh with disabled retained rows and permission refusal clearing rows.
- TypeScript, focused lint, contribution and integrated builds, studio integrity, naming and `git diff --check` passed. The final compiled build is `UHmSbq2JorZIyiqazJBuJ` from runtime `7a11509`. After integrating main, studio reports 358 entries, 204 routes, 43 component reviews pending, 330 unreviewed and 28 stale; naming passes at 7,998 instruction characters. Review fingerprints were not promoted.
- Foundation assurance before integration passed: 22 issued sources, all 78 parent IDs, 9,164 local links and 5,751 files, zero errors. This is documentation assurance, not business acceptance.
- Contacts deterministic HTML check and all 103 model groups pass after the reviewed contract-pin correction below.

## Retained failures and corrections

Local attempts remain in separate `test-results/projects-register-*` directories. The first reset reported PostgreSQL `out of shared memory`; the isolated cluster's lock capacity was corrected to 512, matching CI. Early static checks caught an invalid fallback icon, exact Desktop/Mobile heading spelling, an indirect component binding and the project-instruction size limit; each was corrected. No check or deadline was weakened.

Native browser review caught inherited table-title wrapping (61 px rows), snapshot reset interference, phone rows measuring 83 rather than 80 px and a cramped breadcrumb/More alignment. Scoped layout fixes address these. Cold compilation and a later combined development-server run exceeded existing deadlines; that later run also returned session-creation `DatabaseConnectTimeout` errors. Those timings were not attributed to a code regression or declared an unchanged-main result. The first compiled attempt started before the external server was ready (two desktop connection refusals, two phone passes). After the server reported ready, the unchanged four-case compiled replay passed. Initial denied-read selectors were scoped to the Projects alert to exclude Next's route announcer.

Initial CI correctly stopped on the exact page-heading contract. A later Contacts job correctly detected the newly exported `projectVisibility` source. Review against `c3ff5b9` confirms adding `export` is the only change to `src/projects/service.ts`: predicate SQL, task owners, contact visibility and every command are unchanged. The new register reuses that predicate and passes scoped-access tests. Its working contract pin was updated following review. The issued Contacts HTML stays byte-identical: SHA-256 `aa97680dadf459aa6fbeaf39c761df124adf6737fb68c62b106589c38eac9a52`, 254,547 bytes. The historical build manifest remains intact.

## Environment and review limits

The [execution manifest](execution.json) pins six unmodified native screenshots to the exact runtime, compiled build and SHA-256 values. Visual inspection covered the [desktop register](captures/desktop-project-register.png), [desktop snapshot](captures/desktop-project-snapshot.png), [phone register](captures/phone-project-register.png), [phone snapshot](captures/phone-project-snapshot.png), [1024 px snapshot](captures/desktop-project-snapshot-responsive.png) and [320 px snapshot](captures/phone-project-snapshot-responsive.png). These are application captures with synthetic records, not Figma reference images or owner acceptance.

Windows, Node 24.21.0, Chrome, isolated PostgreSQL 16 on a task-specific loopback port and database `ppo_synthetic_test`. The app uses its own loopback port. No other app or database was reset. Several checks ran under heavy local memory pressure.

Owner acceptance, physical-device and screen-reader review remain open. The guide remains Draft. Full final-head CI, PR merge and hosted deployment must be verified separately; source delivery and local captures are not evidence of a live release.
