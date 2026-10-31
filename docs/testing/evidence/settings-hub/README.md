# AD-02 implementation evidence

Owner: Codex for Dean. Branch: `codex/settings-hub`; [draft PR #802](https://github.com/deanrfiedler-gif/powerplants-one/pull/802). All policy values and proof data are synthetic; none is an operating rule.

## Separate delivery statuses

- Implementation: Settings hub, Business policies register and policy record implemented, using the native policy commands and receipt journal. No migration, capability, grant or dependency added.
- Functional proof: focused unit, database and direct HTTP proof passed; browser results and remaining limits are detailed below. Repository CI and independent exact-head review remain merge gates.
- Visual comparison: Codex inspected retained application captures against the thirteen accepted reference images. Differences below remain explicit; this is not visual acceptance.
- Owner acceptance: accepted design only. Application acceptance is not claimed.
- Deployment: not performed.

[Accepted frames](../../../reference/ui/settings/settings-hub-design-r01/README.md) remain unchanged. Application PNGs and their SHA-256/source manifest are retained in this evidence folder. No trace, session cookie, Figma file identifier or licensed icon artwork is included.

## Executed verification

- Real `npm ci` passed on Node 24.22.2 / npm 11.19.0, without an engine override or node_modules junction.
- Typecheck (`NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`), full lint, studio check, foundation, naming and status checks passed. Final focused lint/typecheck cover the later phone and proposal-version corrections. Python checks used `C:/Python314/python.exe`, because `python3` is unavailable in the tool shell.
- Two focused unit tests passed.
- Three AD-02 database tests passed: per-area visibility/direct denial, read-only seed families, atomic proposer refusal, publisher proposal authority without a new reviewer grant, stale publication refusal, exact receipt recovery, future publication versus the version actually in force, and an old proposal retaining its intended version after the head advances.
- The combined policy database/HTTP run had 15 passes and two failures. The HTTP exact-retry fixture incorrectly used the reviewer instead of the original publisher; corrected direct HTTP handler proof then passed. The isolated authority test passed after its earlier seed timeout; the same authority test passed on unmodified main. The outer HTTP wrapper with its 110-second allowance was not rerun; the direct harness took about 182 seconds.
- AD-02 browser cases for failed/pending reads, independently reviewed successor and stale publication refusal, lost committed response/exact receipt recovery, and phone loading/filtered-empty/stale/failed/empty-area/denied states passed on the final UI. The final four-width tour and repeated phone read-state test also passed (two tests, 5.3 minutes), including phone More → Propose change, Escape and focus return. All five AD-02 cases passed across these final runs. The earlier complete four-case run also passed, before later phone refinements.
- Native PL-04 successor-edit focus regression passed. The longer native publication regression reached accepted publication, identical replay/recovery, saved-record discovery and the owned Activity link, but exceeded its 600-second overall allowance at appointment handover. This is not a passing complete journey and has not been classified as unrelated.
- Capture-tour attempts encountered local-session connection timeouts and one prolonged policy loading state. A bounded comparison using the actual unmodified-main local-session handler at `1402c87b` reproduced a cold GET 503 (`DependencyUnavailable`, server category `DatabaseConnectTimeout`); seven other cold POST/GET calls passed. The initial comparison without the local-gateway header returned LocalOnly and was discarded. Native connection/query limits are unchanged. The capture test records any recovery through the native identity chooser; it does not substitute policy responses.

The five AD-02 cases are registered in the existing isolated scheduling browser suite, with one synthetic reset per project and serial execution. This avoids publishing into the general browser suite’s shared fixture. The captured runs used the same private seeded database and actions before this registration move; final registration is checked separately.

The complete repository database/browser suites and production build were not run locally. CI, cross-model review, owner acceptance and deployment are separate outstanding statuses.

## Design differences

- Dean chose to hide unavailable areas on 31 October. All nine catalogue entries remain, but only real permitted destinations appear. Templates has native backend support on the starting main; its management page belongs to open PR #704. There is no fabricated health result, access request or unavailable destination.
- Source rows, names, timestamps, counts and proposal branches replace the 22 October story. Readiness is actually version 3. The publication-recovery fixture has one affected booking; the separate future 420-minute fixture has none. These are synthetic test outcomes, not copied frame values.
- The current shared shell supplies its navigation, local foundation link, header and phone bottom navigation. Tablet retains the current expanded primary rail/collapsed secondary menu; hub cards use two columns there. The local runtime has no Font Awesome kit and uses the repository fallback icons.
- Register search covers name, area, scope and state, with policy-name sorting and a Waiting to publish view. The desktop shared table scrolls horizontally for later columns; phone rows retain name, area, in-force version, scope and proposal state, while the record supplies full dates and revision context. Separate Area/State dropdowns, bulk selection, column customisation and list-position previous/next controls are not implemented. The record links to All policies instead of showing a numeric list position.
- Only Terms and proposal tabs exist. Used by is record facts. There is no History, Affected work, field-readiness amendment or amendment phone sheet.
- Phone terms stack in the shared register table. More exposes Propose change, View proposal/terms and Refresh; Compare/Back and one sticky primary action retain the task. Shared native modals replace the unaccepted phone sheets, and the current bottom navigation remains.
- Propose change uses read-only fixed-term definitions, stacked fields and native date-time inputs rather than the frame's faux inputs/grid. Checks are explicitly server checks; the UI does not invent a green preflight result before the native command.
- The optional publication note falls back to explicit confirmation text for the native required reason. Proposal/review reasons remain required. This is a recorded Codex decision, not Dean's acceptance.
- Review comparison uses plain native counts and owned booking links rather than the complete designed metric/booking grid; native impact reason codes remain visible. No new duration-overage rule is invented. The latest open branch is shown with a branch count and a link to the original PL-04 workspace.
- Publication refusal uses native error/support-reference presentation. After refresh, an earlier review is explicitly reference only; the UI does not copy the frame's story-specific red banner. Exact uncertain-save recovery retains the original request and expected versions.
- Readiness and working-hours policies are read-only records. Record references use a Format rules/Terms workspace with eight synthetic format examples, not allocated identities or an editor. Policies and proposals receive no readable reference.
- Native date/time formatting, current read timestamps, actual synthetic profile names and additional branch context change text wrapping and vertical scroll. Supplemental uncertain/recovered states have no accepted-frame counterpart.

## Reproduction and boundaries

Private PostgreSQL 16 clusters use loopback 55482 and 55483, both named `ppo_synthetic_test`. The dedicated dev server uses `PPO_PORT=3182`; port 3000 and other contributors' services are untouched. Chrome 156.0.8078.80 / Playwright 1.64.1 captured 1440, 1024, 390 and 320 CSS-pixel widths. Test data is seeded locally; source records and accepted captures are unchanged.

Capture provenance, source hashes and exact image dimensions are recorded in `capture-manifest.json`. Only curated synthetic PNGs are committed. No application review fingerprint is marked accepted.
