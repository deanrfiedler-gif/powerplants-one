# Connected customer journey owner walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared 8 October 2026. Review: pending actual owner observations.

[Scope decision](../decisions/integrated-journey-acceptance.md), [execution ledger](../testing/evidence/integrated-journey/README.md), [continuity contract](../contracts/lead-to-delivery-continuity.md).

> Next milestone: the [28 October Issue 737 execution packet](#issue-737-execution-packet--28-october-2026-utc) below identifies current gates, coverage and the missing Sales-to-Service fixture join. The retained 8 October session remains historical evidence.

## What this review establishes

Review one connected fictional customer need from Lead through Deal, independent estimating discovery/costs, exact quotation issue/response, explicit Won, native Project receiving and a new owned Lead for a later need. Verify that the next action and the reason for each handover are understandable. This is a source-specific prototype review, not operational approval or full PT-30 acceptance.

The automated proof prepares initial records and commercial reviews with native HTTP commands, then operates conversion, explicit links, Won recovery, Project creation and return-to-Sales through the real compiled browser interface. It does not claim an unaided human completed every authoring form. The independent Service receiving alternative is covered by its retained browser scenario; this joined chain deliberately follows Projects.

## Retained local session

Use the isolated `codex/integrated-journey-acceptance` checkout and private session root `C:/Users/Dean.Fiedler/.codex/tmp/integrated-journey-20261008`. The database is `ppo_synthetic_test` on loopback port 55838. Configuration, document storage, browser traces and raw preservation snapshots remain outside Git. Do not reset this session or substitute a regression database.

The [desktop entries](../testing/evidence/integrated-journey/desktop-entry-records.json) and [phone entries](../testing/evidence/integrated-journey/mobile-entry-records.json) supply every saved ID. Both chains survived a real application/PostgreSQL restart. Choose the **coordinator** synthetic identity for the saved-record walkthrough. Estimating source review, quotation approval and quotation issue used their distinct named synthetic duties during preparation. One human switching roles does not count as independent human review.

Desktop starting points (local retained session only):

- [Original Lead](http://127.0.0.1:3000/sales/leads/ca556a31-23f6-44b1-962b-2b1ca0b899a8) → [Won Deal](http://127.0.0.1:3000/sales/opportunities/1d8fa0f6-db4d-4b52-b4a6-ba1f86f42ad2).
- [Accepted estimating brief](http://127.0.0.1:3000/sales/handoffs/estimating/b8279e92-70d4-475b-80b1-801a6a9ea286) → [independent Discovery](http://127.0.0.1:3000/estimating/discovery/a3ae5d97-f10d-44e7-ba86-e69b56f9d497) → [exact quotation](http://127.0.0.1:3000/estimating/quotes/3ef94a4f-dceb-4f0e-8b65-99a6eccff60e).
- [Project receiving](http://127.0.0.1:3000/projects/339ecc22-77c9-4a88-b7c9-57f0375c1213) → [owned follow-up](http://127.0.0.1:3000/work/72c53cec-b826-44bc-b053-0a0af79c9614) → [returned Lead](http://127.0.0.1:3000/sales/leads/b1c53cd1-30d2-4c41-a5cf-e1e36e9c3162).

The application is the compiled source at main `4f883d1`; this contribution changes verification/documentation only unless the execution ledger records an application fix. Check for an existing task-owned listener at `http://127.0.0.1:3000/api/v1/health` before starting another. From the isolated checkout, use `npm run serve:compiled` with its private `.env.local`. Never kill an unexpected listener or copy the environment file into Git.

## Review tasks

Record reviewer, date/time/timezone, source/build, device/browser, viewport, actual zoom, input method, assistive technology and whether help was needed. For each task record Pass, Fail or Blocked and the actual comment; silence is not acceptance.

| Task | Open and act | Expected observation | Owner result |
|---|---|---|---|
| IJ-H01 | Original Lead → Open deal → Activities | Same customer/site, original Lead reference, owner and planned action; conversion did not discard the enquiry | Pending |
| IJ-H02 | Accepted estimating handover → linked Discovery | Sales wording is attributed; the independently confirmed discovery revision remains its own record | Pending |
| IJ-H03 | Exact estimate and quotation → Deal commercial evidence | The saved scope/cost version and released quotation match; independent approval, issue and staff-recorded response are distinct | Pending |
| IJ-H04 | Deal History and saved outcome | Won cites the exact reviewed response; it was an explicit action, not an automatic consequence of issue or reported acceptance | Pending |
| IJ-H05 | Won handover → native Project → Sales handovers | Exact accepted source is retained; receiving does not approve Project scope or complete delivery | Pending |
| IJ-H06 | Project → Sales handovers → Record a customer need for Sales review | The route to a dated owned review is findable. The saved follow-up retains Project provenance and has an explicitly linked new Lead | Pending |
| IJ-H07 | Returned Lead and its next Activity | Same Activity owner/date/status and Project relationship; the original Won Deal remains Won | Pending |
| IJ-H08 | Keyboard through handovers; Escape from Project Sales dialog; browser Back/reload | Visible focus, sensible focus return and durable saved context; interrupted commands use original recovery | Pending |
| IJ-H09 | Desktop and physical phone, plus actual 200% zoom | Text/actions remain usable. Automated 390 px coverage is not a physical-phone observation | Pending |
| IJ-H10 | Representative screen reader and independent visual comparison | Labels, announcements, errors and navigation are understandable; missing accepted cross-module mockups remain explicit | Pending |

Dean's final review records **Accepted within stated scope**, **Changes required**, or **Not yet reviewed**, with the relevant IJ-H IDs. Keep defects separate from suggestions. Existing Field/Finance/PT-30 obligations remain in the [Field owner walkthrough](field-integrated-owner-walkthrough.md) and [acceptance ledger](../testing/field-integrated-acceptance-ledger.md).

## Hosted demo

Azure run 37677805712 was started externally and deployed main `4f883d1` on 8 October Brisbane time. Its database gate, web readiness/health, anonymous refusal and worker-image configuration passed. Dean completed invited Microsoft sign-in. The implementation agent then reopened the existing saved Deal, estimate version 2 and Draft quotation revision 1, viewed its saved HTML and verified the downloaded PDF against its stored hash. These read-only hosted checks do not exercise the full locally prepared chain or actual hosted worker execution. See the execution ledger for exact references.

The hosted tester has existing invited permissions, not the local role chooser. Newly seeded local review/issue profiles do not expand hosted permissions. A denied action is a boundary to record; do not widen access to manufacture the complete local journey online. No customer distribution, live MYOB/SharePoint/CAD operation or invitation change belongs to this walkthrough.

## Issue 737 execution packet — 28 October 2026 UTC

This section prepares the next [integration and synthetic operational acceptance milestone](https://github.com/deanrfiedler-gif/powerplants-one/issues/737). It does not supersede the historical execution or owner tasks above. Inspected main: [`af079a2f11abb8e5c80d184d99ba0029702cee47`](https://github.com/deanrfiedler-gif/powerplants-one/commit/af079a2f11abb8e5c80d184d99ba0029702cee47). The matrix's source URLs are pinned to that commit; PR and Actions links identify separate unmerged or executed evidence. Refresh all heads before integration.

**Disposition: ready for bounded synthetic rehearsals; the milestone remains blocked.** The [coverage matrix](../testing/issue-737-acceptance-coverage.csv) retains all 38 original IDs, scenario wording and expected results. All 38 catalogue statuses remain **Planned - not executed**. Its readiness labels are assessment judgments, not test results:

| Readiness | Count | Meaning |
|---|---:|---|
| Runnable slice | 13 | An implemented synthetic path can be rehearsed; the whole written AT still needs its own evidence and boundary statement. |
| Join needed | 12 | Components exist, but their required shared fixture or complete sequence is not evidenced. |
| Partial | 10 | Only part of the written scenario is implemented or supported by the inspected fixtures. |
| Blocked as written | 2 | AT-21 business migration and AT-24 source-system transition lack approved source/mapping fixtures. |
| Re-scope needed | 1 | AT-26's historical CREMS framing must be interpreted against the adopted [current product direction](../decisions/product-direction-quality.md), preserving the original ID and historical wording. |

The matrix's CI link is supporting automation, not an execution result for its AT row. A contract or procedure link establishes scope; it does not establish execution. Historical retained evidence stays at its original source, date and limitations.

### Integration gates and ownership

| Gate / inspected head | Verified state | Required next action / responsible contributor |
|---|---|---|
| [#735](https://github.com/deanrfiedler-gif/powerplants-one/pull/735), `429413af5280039af16553e8faa6e3aaf2427fac` | Draft, reconciled with inspected main. Earlier no-defect review was at `cb1d7a79`; [later review 5687793701](https://github.com/deanrfiedler-gif/powerplants-one/pull/735#pullrequestreview-5687793701) identifies an unresolved Important malformed-envelope discovery defect. 14/15 workflows succeed; [Application run 40693504129](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40693504129) fails CR05. | Existing Claude branch owner corrects the defect, obtains a different-model review and passing final-head CI/current-main reconciliation. No security clearance or merge from the old review. |
| [#695](https://github.com/deanrfiedler-gif/powerplants-one/pull/695), `5f6962e3f61002de016ddded0f4aff4b44e1073e` | Draft S3 parent is behind main and conflicted. Its 22 successful workflows concern its old head. Independent review identified correction/predecessor and unavailable-owner defects. | Existing S3 owner reconciles the parent and both corrections once; retain immutable predecessor/sent bytes and native-operation authority. |
| [#730](https://github.com/deanrfiedler-gif/powerplants-one/pull/730), `6af062609a669944657358ce2a629141646e8366` | Targets #695. Production-code corrections and cumulative main reconciliation; 23/24 workflows succeed. [Application run 40596724433](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40596724433) fails on stale fixture/ledger expectations. | S3 owner preserves these code corrections while applying the incremental #734 changes. Do not merge two cumulative branches independently. |
| [#734](https://github.com/deanrfiedler-gif/powerplants-one/pull/734), `50f197390cdc23454f9b22861cda1d99354f2292` | Also targets #695; 24/24 workflows succeed. [DB1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40649853483/job/122693640824) passes 283 tests; [DB7](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40649853483/job/122693640967) passes 209. No submitted independent review found. | Extract its three-file incremental delta against `8f5e662cdedff41b5a081164649cf6e270899ae1`: `tests/database/customer-delivery.test.ts`, `tests/database/site-readiness-upgrade.test.ts`, `docs/status/2026-10-28-s3-regression-proof.md`. Review the final reconciled diff independently; rerun DB1/DB7, full upgrade/seed, browser and demo gates on the resulting SHA. |
| [#731](https://github.com/deanrfiedler-gif/powerplants-one/pull/731) and [#736](https://github.com/deanrfiedler-gif/powerplants-one/pull/736) | Merged P11 History and phone record-readiness test corrections. They do not establish a runtime shell correction. | Preserve landed behavior; verify remaining callers and failures from their actual traces/diagnostics. |
| [#733](https://github.com/deanrfiedler-gif/powerplants-one/pull/733), `463747307b647554c5eed09137800aa3dba86a58` | Draft P05 readiness overlaps #736; distinct held-response 390/320 tests also exist. 14/15 workflows succeed; [compiled run 40648780944](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40648780944) fails. | Existing owner drops duplicate waits, retains genuinely additional regression coverage, diagnoses failures and reruns the final head. |
| [#732](https://github.com/deanrfiedler-gif/powerplants-one/pull/732), `cad582043f2ec6c2f89f0f985c0afd0e51175d78` | Claim/investigation only; no pushed runtime fix. | Existing owner proves any remaining shell defect against current main before proposing a distinct correction. |
| [#693](https://github.com/deanrfiedler-gif/powerplants-one/pull/693), `757f782ce4f02708e3dc3775dcb39689d7275a71` | ES-08 Working guard reported locally; published branch remains claim-only. | Existing owner completes reported repetitions, integration and final-head CI. Do not treat private local work as available main functionality. |
| [#738](https://github.com/deanrfiedler-gif/powerplants-one/pull/738), `0428d20569e0e8c6964d62aa7c17ec5855bbc648` | New CR05 diagnostic contribution. Its original #735 failure artifacts establish a loading-only page, not a root cause. CI was still running when this packet was prepared. | Its existing Codex owner evaluates the diagnostic run. Preserve the six-second hold and existing assertions; a diagnostic PR is not a fix or acceptance pass. |

All eight workspace claims below currently contain one status fragment and no implementation. PR descriptions name Codex for Dean; no assignee or current owner handover was found. The session behind each claim must confirm its current progress, remaining scope and build-slot allocation before implementation resumes. Green claim-only CI is documentation evidence. Existing native functionality on main remains separately testable.

| Claim | Exact inspected head | Availability implication |
|---|---|---|
| [#698 PJ-02](https://github.com/deanrfiedler-gif/powerplants-one/pull/698) | `a12a387281d7048809d6ba394c5a226d83959f49` | Accepted Project record composition not delivered by this PR. |
| [#699 CR-04](https://github.com/deanrfiedler-gif/powerplants-one/pull/699) | `228834e1d32b464518d923722cc6357c2a47336a` | Accepted Deals workspace not delivered by this PR. |
| [#702 Sales briefs](https://github.com/deanrfiedler-gif/powerplants-one/pull/702) | `6a37661059b3a2ea75593f709ff09929e42af7aa` | Accepted receiving queue not delivered by this PR. |
| [#703 Intake/workload](https://github.com/deanrfiedler-gif/powerplants-one/pull/703) | `f3a86d176acab1f51f355252d35c713368009796` | Accepted ES-01 layout not delivered by this PR. |
| [#704 DK-06](https://github.com/deanrfiedler-gif/powerplants-one/pull/704) | `42872cf51def049e25c8093cdd3784f654875700` | Accepted template-management workspace not delivered by this PR. |
| [#705 Cost sources](https://github.com/deanrfiedler-gif/powerplants-one/pull/705) | `8a673d396cd881e59cd9b1c6460694303ef85100` | Accepted register not delivered by this PR. |
| [#706 Documents](https://github.com/deanrfiedler-gif/powerplants-one/pull/706) | `3245b741abecca13d3eee6c21524b0ca28a39e1b` | Accepted workspace not delivered; Documentation and merged-tree checks also failed on this claim head. |
| [#707 Engineering workload](https://github.com/deanrfiedler-gif/powerplants-one/pull/707) | `f5f5d20b7da593dfd337b36937450e489942416f` | Accepted register not delivered by this PR. |

Apply the existing [three-build, one-owner and one-level stacking rules](../../CONTRIBUTING.md#working-in-parallel). The published queue already exceeds three Codex implementation PRs; this packet does not start another implementation build or take over a branch. Read-only review and this documentation preparation can continue. Current branch-protection settings could not be inspected through this connection (HTTP 403); repository-recorded requirements must not be represented as a fresh settings observation. Before merge, an authorised maintainer verifies the live required checks and current-main result. All changes land by PR; milestone acceptance remains Dean's explicit decision.

### Trustworthy evidence already available

| Evidence class | Available evidence | What it does not establish |
|---|---|---|
| Automated current-main regression | 13/13 workflows succeed on `af079a2f`; checks are 59 successful and 11 skipped. [Application run 40687697265](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40687697265) and [compiled run 40687697275](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40687697275). Desktop job [122814199270](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40687697265/job/122814199270) and mobile job [122814199131](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40687697265/job/122814199131) explicitly pass IJ-01, P11 and the offline recovery cases. | No AT-01–AT-38 execution, same-record Sales-to-Finance journey, broad 320px result or owner acceptance follows. Ten Change scope jobs and the PT-27 controlled comparison are skipped. |
| Finance/restart automation | [Finance job 122814199219](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40687697265/job/122814199219) records 11 passes, including PT-17/PT-19 at both viewports and write/accept/reconcile/verify phases. [PT-30 ledger](../testing/field-integrated-acceptance-ledger.md) retains an earlier four-phase rehearsal and restart evidence. | Restart is not restore. The historical retained cluster is not the next integrated source, and human H01–H11 observations remain pending. |
| Independent code review | #735's latest unresolved defect and #695's two S3 findings are real review evidence. | A no-defect review applies to its reviewed source and scope. #734's 24 green workflows do not replace the missing final integrated independent review. This packet creates no new independent code-review approval. |
| Design acceptance | Accepted-page decisions remain the authority for intended appearance and workflow; source presence and the development register remain separately inspectable. | A claim-only workspace PR or accepted Figma design does not show implementation, visual alignment, device suitability or operational acceptance. |
| Operational acceptance | Original catalogue and owner worksheets remain unexecuted/pending for this milestone. | No scenario is marked Passed by this packet. Synthetic adapters and staff-recorded customer responses are not production integrations or actual customer acts. |

A fresh read-only check on #735 head `429413af` ran `node --import tsx --test tests/unit/guide*.test.ts` on Linux / Node 24.22.1: **101 passed, zero failed or skipped**. A separate disposable synthetic probe confirmed the latest review finding: outside `docs/guides/pages`, a YAML key written as `"guide\u005fkey"` with a trailing-space opener, a BOM before the opener or a leading blank line produced zero library errors, build exit 0 and a release file. Direct compilation rejected each file's front matter and raw HTML. Exact-opener escaped-key and malformed-opener plain-key controls correctly failed build with no release; an ordinary non-guide document remained ignored. This proves a discovery/build refusal gap, not that unsafe HTML is served. No correction, security clearance or full application build is claimed.

### Fixture and environment entry checklist

Use the supported [runtime setup](p08-handover.md#runtime-setup-and-recovery) and a disposable, task-owned `ppo_synthetic_test` database with current migrations/seeds, compiled application, working document renderer and private output store. Record actual Node/npm/PostgreSQL/browser versions. Do not use, reset or borrow the historical retained session above. Keep credentials, connection strings and raw database/trace content outside Git. One process owns each application/database listener; unexpected listeners are a stop condition, not permission to kill them.

Before starting a joined run, give the fixture a unique `SYN-737-<UTC>-<viewport>` label and save a manifest with actual IDs, not invented fixed IDs:

| Fixture group | Minimum selected data and invariant |
|---|---|
| Identity and accounts | Two similarly named accounts in distinct ERP-company contexts, one selected customer/site, permitted and denied actors, explicit site timezone and company/currency. Separate missing, ambiguous and stale mappings. |
| Sales and estimating | Original Lead/Deal and owned Activity, accepted Sales brief, independent Discovery revision, two alternatives, exact cost version and explicitly expected PPO calculation values. Keep scope confirmation separate from sales wording. |
| Commercial originals | Quotation revision, independent reviewer/approver/issuer duties, exact HTML/PDF hashes, staff-recorded response, explicit Won operation and original recovery receipt. Generated, issued, sent, delivered and acknowledged remain separate states. |
| Delivery and scheduling | Native Project and accepted receiving reference; a separately authorised Service request/work order, exact scope/task/asset, appointment, crew, policy/calendar and booking version. Identify the actual supported Project-to-Service handover or explicitly stop at its unsupported boundary. A matching customer name or free-text ProjectReference alone is not an enforced native link. |
| Readiness and field | Required technical/material/site evidence, partial/quarantined quantity case, old/current pack issues and both crew acknowledgements, two independent sessions for booking conflict, retained offline browser profile, exact time/parts/photo originals and reasoned successors. |
| Documents and Finance | Report version and response, output template/source versions and hashes, distinct Finance preparation/review/processing/reconciliation duties, expected allocations and payment/credit/reversal/incomplete-source amounts. Provider effects are synthetic. |

Use the actual seeded profiles named by [IJ-01](../../tests/browser/integrated-journey.spec.ts): `coordinator`, `estimating-source-reviewer`, `quotation-approver`, `quotation-issuer`, plus `assigned-technician` for denied reads. The [Service narrative](../../tests/helpers/service-journey.ts) uses `coordinator`, `assigned-technician` and `second-technician`; [Finance](../../tests/helpers/quality-finance.ts) separates `finance`, `finance-reviewer`, `finance-processor` and `finance-reconciler`. Record the resolved actor ID and grants at each handover. One person changing synthetic identities is not independent human review. Hosted identities do not inherit the local role chooser.

The existing P11 `prepareJourney` constructs its own fixture. Running IJ-01 and P11 successively does not make their records connected. Before reusing either as full-milestone evidence, the fixture owner must provide a deliberate bridge through native supported commands, prove original customer/company/site and source-version lineage, and retain separate receiving authority. Do not patch database relationships, rename unrelated seeded records or treat a free-text cross-reference as an implemented relationship. If the bridge cannot be demonstrated, mark that step Blocked and retain the two bounded slices separately.

### Recommended execution order

| Order | Execute and retain | Stop / required verification |
|---|---|---|
| 1 — integration | Resolve the gate table in Issue #737 order; freeze one candidate commit/tree, record all incorporated PRs, final CI and review dispositions. | Block milestone execution until security/S3/final-head gates clear. Bounded rehearsals on labelled main may proceed without implying integration acceptance. |
| 2 — fixture/authority | AT-01, AT-02, AT-30: verify fixture manifest, explicit company mapping, allowed/denied roles, source IDs and independently owned handovers. Provision the selected readiness fixtures before Service progression. | Wrong-company, ambiguous identity, unowned work or a missing native join blocks its dependent steps. |
| 3 — Sales/Estimating/quotation | AT-03–AT-05, AT-25–AT-28: original Lead → accepted brief → Discovery/cost → exact review/issue/response → explicit Won/recovery → Project receiving. Exercise two alternatives and preserve the accepted original. | Select formula/rounding fixtures; do not substitute CREMS reconstruction for current PPO rules. AT-26 needs a current scoped procedure. ES-08 and questionnaire export/type-change gaps stay explicit. |
| 4 — receiving/scheduling | AT-06–AT-09, AT-32: authorised Service intake, incomplete/blocked readiness, explicit permitted exceptions, exact pack amendment/acknowledgement, two-session booking conflict and Project-request decision. | Preserve Project source and existing confirmed booking until an authorised Service decision. Recheck material/site/crew readiness; no blanket exception. |
| 5 — field/recovery | AT-10–AT-14, AT-34: disconnect, capture and restart; change assignment/pack; reconnect with original-operation recovery; reasoned corrections; exact report response; partial completion and owned return. | Record physical-device limits. AT-14 whole-order/ticket closure and the two-task/two-asset narrative are unsupported by the selected one-asset Authorised-order path. |
| 6 — downstream evidence | AT-15–AT-18, AT-20, AT-29, AT-31, AT-36–AT-38: inspect selected technical changes, partial/quarantined supply, failed/retest/phased acceptance, immutable document versions, Finance totals/unknown outcomes and separately accepted handovers. | Retain every unsatisfied criterion; do not let component success close a whole Project. No real MYOB/SharePoint/channel effect can be inferred. S3 notice cases require the integrated S3 gate. |
| 7 — resilience and usability | AT-19, AT-22, AT-23, AT-33, AT-35: occurrence replay/lifecycle, current-schema restore/outage, compatibility and retained originals, desktop/390/320/keyboard, physical phone and representative screen reader. | Actual restore uses a separate disposable cluster and measured RPO/RTO; restart alone is insufficient. Do not run historical schema50→54 rollback instructions against the current schema. Keep PT-27 skips and p95 misses visible. |
| 8 — deferred written scope | AT-21, AT-24: approved business-data migration and Pipedrive/Smartsheet transition inventory, mapping, delta/history and exception fixtures. | Blocked as written. Native schema upgrade or local dependency tests do not satisfy source-system migration. |

The current bounded browser slices can be rerun after environment setup and `npm run build`, without claiming the missing bridge. Run each command on an isolated fixture baseline and preserve its own output directory; do not reset a database while another suite or retained journey uses it:

```sh
npx playwright test -c playwright.compiled.config.ts tests/browser/integrated-journey.spec.ts --project desktop-chromium --project mobile-chromium --reporter=list
npx playwright test -c playwright.compiled.config.ts tests/browser/quality-journey.spec.ts --project desktop-chromium --project mobile-chromium --reporter=list
```

These configured mobile projects cover their configured viewport, not automatically 320px. Record viewport/zoom from the actual run and execute a separately declared 320px and assistive/device matrix. The existing [offline procedure](../testing/evidence/offline-recovery-acceptance/README.md), [Field integrated ledger](../testing/field-integrated-acceptance-ledger.md), [PT-30 readiness](../testing/pt30-integration-readiness.md) and current workflow definitions supply their own prerequisites. No browser, database or operational scenario was freshly executed in preparing this packet; the only fresh application checks here were the #735 guide tests and disposable discovery probe above.

### Record results and decide the milestone

For every attempted AT and joined step, retain: run ID; exact source SHA, executed checkout/tree and CI attempt; UTC time; environment/device/viewport/input method; synthetic actor and actual record/version IDs; fixture hash; ordered actions; expected and observed result; output/receipt hashes; screenshot/log artifact references with retention location; Pass/Fail/Blocked/Not run for the explicitly stated scope; defects; and remaining exceptions. Store synthetic, redacted evidence only. A script's success must be labelled automated evidence. A reviewer records independent code review separately; accepted design references remain separate; Dean records actual operational acceptance with scope and exceptions.

Do not prefill Pass from this matrix. Update an original catalogue status only after the corresponding written procedure has execution evidence, or after a separately recorded owner-scoped procedure makes its changed boundary explicit. A partial pass stays partial; an unsupported step stays Blocked. Preserve historical failures and rerun attempts instead of presenting a later retry as an uninterrupted green run.

The final dated status fragment must identify the integrated commit(s), actual scenario records, final CI/review dispositions, defects and accepted exceptions, remaining unsupported boundaries, and the words **synthetic demonstration**. Dean then explicitly accepts the milestone or requests changes. Deployment is a separate decision.
