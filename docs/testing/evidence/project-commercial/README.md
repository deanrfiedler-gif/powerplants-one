# Project commercial controls execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 14 October 2026 on Windows, Node 24.21.0/npm 11.19.0 and PostgreSQL 16, using synthetic fixtures. [Contract](../../../contracts/project-commercial-controls.md), [Finance definitions](../../../contracts/project-commercial-finance-definitions.md), [handover](../../../delivery/project-commercial-controls-handover.md). Local verification, PR CI, independent review, business acceptance and deployment remain separate.

## Integration and isolation

The managed `codex/pj05-commercial-controls` worktree starts at main `886c9c482c15277b7ab5f997b9567bf272b63070` after the current CPQ turn completed and handed over PR #492. Main was refreshed before publication and remained unchanged. Open CPQ #491/#492 are separate contributions with no new migration or capability. The primary checkout and their worktrees were not changed.

A task-owned PostgreSQL instance on loopback port 55447 runs only `ppo_synthetic_test`; the compiled application listens on 3165. Its lock capacity is 1024, matching repository test provisioning. No shared service was reset/restarted. Credentials and the restart checkpoint (including two local synthetic session cookies) remain outside Git. Migration 0101 was designed from the live amended schema through 0100. No seed, grant, dependency or production service is added. The [source manifest](source-manifest.json) records implementation/test bytes and the compiled build ID; it does not imply that every changed historical-assertion suite ran locally.

## Original implementation verification ledger — 14 October 2026

| Check | Actual result |
|---|---|
| Focused units | 21/21 pass: commercial, Project baseline/calendar/overview/RAID, Finance, quotation release and response |
| New commercial database and upgrade suites | 10/10 pass, including populated starts at 0025 and 0100, original ledgers/grants/identities/receipts, repeated migration/seeding, exact quote selection, decisions, exposure, concurrency, rollback, drift and access refusal |
| Final pagination privacy and connected native regressions | 12/12 pass: hidden-cursor refusal; Project receiving/overview/Activity; populated Sales 0075, quotation 0058/0059/0060 and Field 0049/0056 upgrades |
| Additional historical controls | Estimating migration-24 populated upgrade and reserved Products upgrade cases from 25 and 101 pass. The latter installs reserved 0052 after integrated history through 0101 |
| Hosted-demo upgrade | 6/6 pass, including preserved revoked grants, runtime privileges, CRLF historical checksums, conflicting ledger refusal, repeat execution and late-failure rollback |
| Compiled HTTP | 8/8 pass: two commercial cases and six existing Project receiving, overview, programme and RAID/Activity cases, in separate fresh database groups |
| Actual application/PostgreSQL restart | Pass: [retained result](restart.json). Both real process IDs changed; the script checks a changed PostgreSQL postmaster start time. All 17 tables remain exact, two original sessions/receipts recover, replay adds no effects and adjusted control value remains 350.10 |
| Build/type/lint | Final production build passes, including TypeScript. Full lint passes; changed final files pass targeted lint. Final standalone typecheck also passes, including the updated restart script |
| AD-01 access catalogue | 107 model groups and 40 browser groups pass; browser errors zero, Chrome 155.0.8059.80. All 153 application capabilities have labels and matching generated hashes |
| Development register | Pass: 362 entries, 47 components, 208 routes, no errors. Existing 334 unreviewed and 28 stale entries remain visible; no visual acceptance inferred |
| Foundation/naming/prototype | Pass: 22 retained issued sources, all 78 parent IDs, 628 registered documents and no errors. Prototype package check also passes |

The new connected fixture deliberately creates a 720.00 estimate but issues only 350.00 of selected quotation scope. Commercial original value must be 350.00. Fixed expected variation values include approved +12000.00, approved adjustment -2000.00, pending requested 7000.00 versus priced 6500.00, disputed 3000.00 later revised to 2800.00, and unknown versus explicit zero. Approved changes total 10000.00 and the adjusted synthetic control value is 10350.00. Proposed date impact leaves the saved Project schedule unchanged.

The database tests also prove independently reviewed sources and decisions, immutable approved originals, same-operation recovery, changed-payload conflict, competing originals, current source/root/Finance duties, cross-company refusal, retained Activity links and terminal action requirements, independently waived obligations, future notice refusal and notice correction chains. A late injected audit failure rolls back the complete commercial identity/event/receipt graph. Current source change holds new approval and adjusted totals while permitted original receipts remain exact. Losing quote authority hides the breakdown and record identifiers.

## Reproduction

Use the repository-pinned Node/npm and a disposable local configuration targeting `ppo_synthetic_test`. Never use shared or operational resources. Tests requiring PDF output use the existing supported document renderer/browser.

```powershell
node --import tsx --test tests/unit/project-commercial.test.ts tests/unit/project-baselines.test.ts tests/unit/project-calendars.test.ts tests/unit/project-overview.test.ts tests/unit/project-raid.test.ts tests/unit/finance.test.ts tests/unit/quotation-release.test.ts tests/unit/quotation-response.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/project-commercial.test.ts tests/database/project-commercial-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='PJ05-05|^PJ02-|^PJ01-|populated.*upgrade|additive.*upgrade' tests/database/project-commercial.test.ts tests/database/project-overview.test.ts tests/database/sales-delivery-binding.test.ts tests/database/quotation-release.test.ts tests/database/quotation-response.test.ts tests/database/quotation-conversion.test.ts tests/database/field-timer-boundaries.test.ts tests/database/field-customer-response.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/demo/upgrade.test.ts
```

The compiled HTTP groups each start with a fresh disposable reset. The restart script takes `write` or `verify` plus an absolute checkpoint path outside Git; between phases stop/start both the actual compiled application and PostgreSQL. Verification requires a changed postmaster start time, unchanged retained SQL graph and original receipt recovery/replay. The Projects workflow performs this sequence and uploads only the compact result.

## Corrections, limits and outstanding acceptance

Initial migration/test iterations corrected a JSON containment expression, fixture command placement and a declined-source test's expected denial code. A declined quotation is unavailable (404); the test now asserts that exact refusal. Final review found that native signed page tokens are encoded rather than encrypted: the commercial list now scans permitted records before choosing a visible cursor anchor, and a revoked-source regression proves no hidden ID appears in a token. This final read change was rebuilt and retested. Initial default PostgreSQL lock capacity was raised only on the task-owned instance to the repository's configured value before upgrade proof.

The first restart verification correctly detected two new login audit events created by the proof helper. The corrected proof retains the original private synthetic sessions and passed a repeated actual restart without new sign-ins; the complete audit table remains in the comparison. An initial readiness probe ran before the compiled server finished starting. The combined restart shell command was blocked by automatic review; explicit verified task-process and PostgreSQL-path commands were allowed.

No unresolved environment failure has been classified as a regression or waived in this ledger. The whole repository unit/database/browser matrix was not run locally; relevant suites and CI coverage are identified explicitly. Unchanged-main comparison is required if a suspected environment failure occurs; none remains in the recorded passing checks.

Native PJ-05/FN-06 pages remain unbuilt and their visual references/reviews remain open. This delivers only the exact accepted-quotation/Sales-receiving/document-based commercial backend and synthetic Finance definitions. Independent-order and multiple-contract bases, owner transfer, reconciliation of a changed original basis, separate notice attachments/links, accounting measures, live integrations and operational/legal decisions remain outside this increment. No customer notice, transaction, merge or deployment was performed.

## Independent review and correction — 15 October 2026

A fresh automated reviewer inspected original PR #493 head `b3de1553306d6ff0ee5a5952f4966a5eaf01e08b` and reported two P2 findings: a closed finding added after a document review could restore commercial eligibility, and a proposed owner could grant themselves creation authority. Both new negative database regressions failed against that original implementation with **Missing expected rejection**. The source correction checks findings against the retained review snapshot in TypeScript and SQL. Creation now requires the Project coordinator or an already recorded basis owner; existing records retain their own owner. The contract states these creation and continuation rules explicitly.

The reviewer rechecked integrated head `5e4d4046080591d3811df007047923f02b7ebed0` and reported no further actionable findings. That pass examined the source and ownership guards, original receipt authority, negative service and SQL regressions, positive basis-owner delegation, compiled HTTP coverage and the merge of main `cfd465f` (CPQ #491). The reviewer made no database/service changes. Its initial focused unit check passed 3/3; integrated runtime proof is recorded separately below. A later test-only correction casts the direct SQL probe's actor parameter to UUID so it reaches the intended ownership guard.

The original source manifest and restart result above remain historical evidence for the 14 October implementation. Follow-up source bytes and results are recorded separately; the original ledger does not imply that all earlier suites were repeated after these corrections. Independent automated review is separate from owner acceptance, merge approval and deployment.


The [follow-up source manifest](review-source-manifest.json) binds 76 committed implementation/test files at `2344d93`, integrated main `cfd465f` and compiled build `JZPvsABgqHP8cRUvqQxIe`. The renewed build (including TypeScript), full lint, 11 focused commercial/CPQ units, foundation (all 78 parent IDs), naming (630 records) and development-register checks passed. The register still exposes 334 unreviewed and 28 stale entries. The populated upgrades from 25 and 100 passed with the corrected migration. Final integrated database/API/restart outcomes and exact-head CI are reported in [PR #493](https://github.com/deanrfiedler-gif/powerplants-one/pull/493); no pending check is claimed passed by this commit. The Projects CI workflow retains its own restart result as a downloadable artifact.

Reproduction of the correction regression and integrated suites:

```powershell
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/project-commercial.test.ts tests/database/project-commercial-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='DK-B01|DK-B02' tests/database/document-library.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/http/project-commercial.test.ts
```

Compiled HTTP and restart verification require their own fresh disposable reset after the database suites, with no concurrent writer. Repeat the documented real stop/start sequence using the corrected build; keep its checkpoint and original synthetic sessions outside Git. No shared service, production data or external transaction is involved.

---

## PJ-05 commercial UI evidence — 31 October 2026

Builder: Codex for Dean, PR #803. Synthetic data only. This section supersedes the earlier statement that PJ-05 pages are unbuilt; the historical backend evidence above is retained unchanged. The accepted source design, functional proof, builder visual comparison, independent review, owner acceptance and deployment are separate statuses.

### Functional proof

| Check | Result for this UI increment |
|---|---|
| Focused commercial and UI units | 8/8 passed |
| Fresh focused database suite | 2/2 passed; names/reasons, counts/order/paging privacy, native pickers, independent duties, Finance restrictions, notice correction visibility, blocked satisfaction and original-operation replay |
| HTTP | All four cases passed across the final run and one targeted rerun; the first run was 3/4 because sign-in returned 503 on a database connection timeout |
| Browser | Final complete focused run passed 4/4, including the completed basis Overview and protected-value refresh; the final capture-readiness refinement also passed its targeted case 1/1 |
| Typecheck | Passed on the final source with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` |
| Lint | Full repository lint passed; final targeted lint passed for subsequent source/test changes |
| Documentation assurance | Passed: `npm run studio:check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `python3 scripts/build_status.py --check`; no assurance errors |

The isolated PostgreSQL 16 database `ppo_synthetic_test` used task-owned loopback port 55405. The application used task-owned port 3215. Both task-owned services were stopped after proof. Credentials remain outside Git. Real `npm ci` completed on Node 24.22.2/npm 11.19.0 within the repository engine range, with no override or node_modules junction. No shared database or service was modified.

The Finance fixture proves original value 350.00, approved signed changes 10850.00, adjusted value 11200.00, pending priced 6920.00, incomplete pending requested with known subtotal 7400.00, disputed 3260.00 and eight breakdown rows. These are synthetic calculations checked against the Finance definitions contract, not verified operating rules. Removing either required Finance capability denies values. A separate source-scoped negative test hides a corrected notice's successor without leaking its identifier.

Corrections during proof included a render-time ref lint error, a negative fixture that initially removed broader source authority than intended, and a lost-response browser interception race. The committed fixture now uses a restricted linked Activity; the browser waits until the native commit's response has actually been dropped. Earlier database/browser setup connection timeouts and interrupted runs are not counted as passes or classified as unrelated. Later browser assertions also expired while reads still showed Loading; successful native responses took 35–38 seconds. The focused functional suite now waits up to 90 seconds per assertion, with longer whole-case/setup bounds. Product timeouts and assertions are unchanged; this is not performance proof. The final results above supersede those attempts.

The full legacy commercial database suite was interrupted after its first case passed; its whole suite is not claimed. Populated upgrades, process restart, a production build and the full repository test matrix were not rerun for this UI increment. Existing historical evidence above does not substitute for those runs. Exact-head CI and Claude review remain merge gates.

### Visual comparison

Application captures are generated by the focused browser suite at widths 1440, 1024, 390 and 320. Desktop/tablet test viewports are 960 px high; phone viewports are 844 px high, with full-page captures where needed. The accepted desktop/tablet compositions are 900/768 px high. The 1024 comparison selects the shared shell's existing collapsed navigation preference; the 1440 comparison expands it. No global shell default is changed. Licensed icon artwork is hidden in the capture browser while preserving its occupied space.

Builder inspection completed on the 24 captures listed below at the four requested widths. These are comparison evidence, not visual acceptance. The full S1–S14 state-board composition is not reproduced as an application image; stale, denied and uncertain-save states are covered by browser assertions. The [retained accepted source captures](../../../reference/ui/projects/project-commercial-design-r01/README.md) remain unchanged. A builder's comparison does not grant application visual acceptance or a design-register review fingerprint.

| Accepted frame | Application capture | Builder comparison |
|---|---|---|
| [01](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-01-Desktop-Variations-r01.png) | [1440-variations.png](captures/1440-variations.png) | Desktop register: six values and grouped native rows; density, annotations and fixture data differ. |
| [02](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-02-Desktop-Variation-Preview-r01.png) | [1440-preview.png](captures/1440-preview.png) | Single-record preview uses the native drawer and an Open record action. |
| [03](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-03-Desktop-Variation-Record-r01.png) | [1440-variation.png](captures/1440-variation.png) | Desktop Overview separates all three valuations; native facts and header actions differ. |
| [04](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-04-Desktop-Variation-History-r01.png) | [1440-history.png](captures/1440-history.png) | Stored reasons and notes, loaded-page filter counts and expandable content. |
| [05](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-05-Desktop-Decision-Dialog-r01.png) | [1440-decision.png](captures/1440-decision.png) | Exact submitted price, reason and note; G8 prospective totals omitted. |
| [06](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-06-Desktop-Basis-Record-r01.png) | [1440-basis.png](captures/1440-basis.png) | Three protected values and retained references; aggregate source status replaces per-source annotations. |
| [08](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-08-Desktop-Obligations-r01.png) | [1440-obligation-list.png](captures/1440-obligation-list.png) | Native grouped register; one synthetic obligation with no due date. |
| [09](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-09-Desktop-Obligation-Record-r01.png) | [1440-obligation.png](captures/1440-obligation.png) | The fixture is open/date-needed rather than the source overdue example; overdue display has unit proof. |
| [10](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-10-Desktop-Mark-Satisfied-Blocked-r01.png) | [1440-satisfied-blocked.png](captures/1440-satisfied-blocked.png) | Open Activity blocks satisfaction; generic Activity link and native Done dismissal replace the drawn disabled action. |
| [11](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-11-Desktop-Notices-r01.png) | [1440-notice-list.png](captures/1440-notice-list.png) | Latest and Corrected evidence chain, without delivery claims. |
| [12](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-12-Desktop-Record-Notice-Panel-r01.png) | [1440-record-notice.png](captures/1440-record-notice.png) | Top fields; lower controls are retained in the companion actions capture. |
| [13](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-13-Desktop-New-Variation-Panel-r01.png) | [1440-new-variation.png](captures/1440-new-variation.png) | Top fields and independent unknown/not-priced toggles; lower controls have a companion capture. |
| [14](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-14-Desktop-Value-Breakdown-r01.png) | [1440-values-list.png](captures/1440-values-list.png) | Native breakdown with approved, pending, disputed and excluded groups. |
| [14](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-14-Desktop-Value-Breakdown-r01.png) | [1440-values-reconciliation.png](captures/1440-values-reconciliation.png) | Lower reconciliation and unavailable accounting measures; server totals are not recalculated in the page. |
| [15](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-15-Tablet-Variations-r01.png) | [1024-variations.png](captures/1024-variations.png) | Collapsed native rail, six measures and full table; 960 px test height differs from 768 px source. |
| [16](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-16-Tablet-Variation-Record-r01.png) | [1024-variation.png](captures/1024-variation.png) | Details tab and More actions at tablet width; native header wraps. |
| [17](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-17-Phone-Variations-r01.png) | [390-variations.png](captures/390-variations.png) | Compact values and rows; retained native phone bar and labelled controls. |
| [18](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-18-Phone-Variation-Record-r01.png) | [390-variation.png](captures/390-variation.png) | Details/Overview/Activities/History, stacked values and sticky actions. |
| [19](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-19-Phone-Decision-Sheet-r01.png) | [390-decision.png](captures/390-decision.png) | Bottom sheet with current price and 48 px actions; no prospective totals. |
| [20](../../../reference/ui/projects/project-commercial-design-r01/PPO-Project-Commercial-20-Phone-320-Variations-r01.png) | [320-variations.png](captures/320-variations.png) | Narrow wrapping inspected; browser asserts no horizontal page overflow. |

Additional captures: [320 px record adaptation](captures/320-variation.png), [undrawn notice record](captures/1440-notice.png), [variation lower actions](captures/1440-new-variation-actions.png) and [notice lower actions](captures/1440-record-notice-actions.png). Source 07 is excluded under the #698 precondition. Source 21 is a state-board reference, not a fully reproduced application composition.

### Design differences and boundaries

- The Project record Commercial view (source 07) is excluded because PR #698 is unmerged. Its branch and files are untouched.
- G8 prospective control-value preview is omitted, as allowed by the accepted decision. The decision shows the submitted price and refreshes actual native values after confirmation.
- Synthetic names, dates, versions and row populations differ. The connected native quotation supplies 350.00 rather than the composition's 186400.00; there is one obligation and a two-record notice correction chain.
- The values strip uses a common definition/read-time footnote rather than the composition's per-measure provenance/count annotations. Text buttons replace icon-only actions; native field sizes make creation forms longer, so both their top fields and lower actions are captured.
- Shared shell/control geometry, the retained phone navigation bar, wrapping and scroll height differ from the static compositions. Phone record actions use More actions plus a sticky action area above that bar. The 320 record and tablet/phone views for other record kinds are undrawn adaptations.
- The basis Overview uses the native aggregate source-set status and retained-reference descriptions; the read does not supply the composition's per-source display numbers, author/date summaries or individual checked timestamps. Native source identity remains retained, without showing UUIDs or hashes.
- Linked Activities use generic links and current native states; their read contract does not provide display summaries. History filter counts describe the loaded history page, with stored reasons/notes and expandable exact version content.
- Notice records, other-record History/Activities, basis Sources, Revise, Withdraw, Reopen, waiver requests and signed adjustments use existing record/dialog patterns because separate accepted drawings are absent. Selection previews one record; there is no native bulk commercial command.
- G1 cross-project reviewer queue, G3 readable commercial record numbers and G6 notice links, kinds and attachments are excluded. No offline use, My Work items, MYOB connection, alternative basis authority, owner transfer or changed-source reconciliation is invented.

The implementation uses the native expected-version and permission checks. Unknown or restricted values remain unavailable rather than zero. The original command is journalled before submission; an uncertain outcome retains its operation ID and exact payload for receipt lookup or unchanged retry.

### Reproduction and handover status

Use a disposable `ppo_synthetic_test` configuration and a separate free `PPO_PORT` other than 3000. Start the task-owned server separately with `node --env-file=<external-proof.env> --import tsx scripts/local-server.ts`; do not run against a shared service.

```powershell
node --import tsx --test tests/unit/project-commercial.test.ts tests/unit/project-commercial-ui.test.ts
node --env-file=<external-proof.env> --import tsx --test --test-concurrency=1 tests/database/project-commercial-ui.test.ts
node --env-file=<external-proof.env> --import tsx --test --test-concurrency=1 tests/http/project-commercial.test.ts tests/http/project-commercial-ui.test.ts
node --env-file=<external-proof.env> node_modules/@playwright/test/cli.js test -c tests/browser/project-commercial.config.ts
```

Functional proof: the focused cases passed. Builder visual comparison: completed with the differences above. Independent Claude review: required on the final head; see PR #803 for the request and outcome. Owner acceptance: pending. Deployment: not performed. No visual acceptance is claimed.

The [UI source and capture manifest](ui-source-manifest.json) records LF-normalised source hashes and raw PNG hashes for this proof. Final lint/typecheck and documentation-assurance outcomes are recorded in PR #803.
