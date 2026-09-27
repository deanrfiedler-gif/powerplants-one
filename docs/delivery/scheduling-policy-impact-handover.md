# Scheduling policy impact review — handover

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 27 September 2026 · **Branch:** `codex/scheduling-policy-impact-review`
**Status:** Native synthetic read-only increment integrated through #324; controlled publication is planned, while owner acceptance and deployment remain separate.

## Delivered boundary

`/schedule/policy-impact` extends PL-04 with a temporary comparison of the exact published synthetic rule against a proposed maximum visit duration and future effective instant. The original expiry and all other policy terms remain fixed. The screen reports permitted overlapping future Confirmed bookings that exceed the duration or cross the effective instant, with exact versions, service owner and a handover to the existing appointment review. Changing inputs or identity clears the analysis. No proposed operational value is prefilled as a recommendation.

The no-store GET uses a read-only repeatable-read transaction and current scheduling/work-order/shared scope, including historic scope-asset visibility. More than 200 permitted matching bookings is refused before returning results. Hidden bookings do not affect the count or limit. Started, completed, cancelled, proposed and differently pinned visits are explicitly outside the comparison. This is not a complete revalidation of skills, calendars, travel or readiness.

The [architecture decision](../decisions/scheduling-policy-impact-review.md), [API-R04 extension](../contracts/service-api.md#scheduling-policy-impact-read), [page contract](../design/development/pages/route-schedule-policy-impact.md) and draft guide retain source, review and publication boundaries. Shared button/field/read-state implementations are reused, with consumer bindings updated. No new dependency, capability, migration or seed is introduced; 0051/0052 remain allocated to Maintenance/Products.

## Verification record

Local environment: Windows, Node 24.21.0, PostgreSQL 16.15, Playwright 1.63.0, Chrome 154.0.8037.58. Tests use a separate loopback `ppo_synthetic_test`; earlier return/update databases and private archives remain intact. The live schema confirms policy immutability and fixed contact/crew terms.

Retained [evidence and source pins](../testing/evidence/scheduling-policy-impact/README.md): 14 focused units, seven real database tests and six compiled desktop/phone cases passed, including existing scheduling navigation/reflow. Build, lint, type checking and foundation/prototype/naming/design-register assurance passed. All 78 parent IDs remain intact; the register has 321 entries, 167 routes and 29 components, with all 321/29 reviews pending. The first database run had a test expectation naming `Unavailable` instead of existing `RecordUnavailable`; the first browser run assumed an unprefixed appointment number. Both assertions were corrected against the observed contract; neither required a runtime workaround. The first volume fixture was also refused by real synthetic-reference and complete-crew constraints; the corrected load fixture retains those constraints and non-overlapping reservations. Naming assurance caught the project-instruction character limit; wording was condensed without dropping the referenced decision. Retained successful checks do not erase these earlier failures.

The database snapshot comparison covers every PPO table before and after analysis, including source and receipt records. It proves those database values remain identical in this fixture; it is not a new issued-file/rollback proof. Existing compiled offline-update evidence retains its exact original scope. Phone tests use Chromium mobile/touch emulation; physical devices, native 200% zoom, screen readers and owner visual review remain open.

Full repository application/database suites run through ordinary PR CI, not inferred from focused local checks. Previously reproduced Windows baseline unit failures remain in their earlier handover; no aggregate `npm run check` success is claimed here.

## Remaining work

Implement reviewed immutable proposals, dedicated synthetic publisher authority, deterministic effective-policy selection, transactional publication and owned impact tasks after reconciling migration allocation. Publication must recheck current permissions, policy/proposal versions and affected bookings under the same workspace graph lock as booking commands. Retain old pins and issued content, exact receipts and altered-retry refusal. Define unresolved-review consequences explicitly. API-C26/EVT-12 and complete PT-28/PT-30 remain open.

## Prior integration checkpoint

PR #322's compiled suite passed on `ab61c06`. Its separate Application assurance browser job (later confirmed to use the compiled configuration) in run `36313348099` recorded 519 passed, 79 skipped and one CR05 Sales reload failure at `tests/browser/sales-workflows.spec.ts:429`: retained context still displayed Loading aftercare review at the five-second assertion. Sales source/test is unchanged from main. This is an observed loading timeout, not evidence that closure data was lost. The database lane was still running when GitHub initially refused a job rerun. It subsequently passed; browser attempt 2 was running on the same exact source at that checkpoint. Attempt 2 later failed the pre-reload Closed assertion (job `108614290307`); its result is retained separately from corrected-head CI. Do not merge through the failed gate. PR #323 is ready for review; compiled checks passed and its remaining browser/database lanes were still running without failure at this checkpoint. Exact final integration state belongs in current STATUS and GitHub.

## Initial stack correction checkpoint

The [CR05 investigation](../testing/evidence/cr05-reload/README.md) supersedes the earlier development-server diagnosis: both originally failing jobs used the compiled configuration. Exact original request timing cannot be recovered from the uploaded artifacts, which excluded raw traces and capped diagnostics before CR05. The test's missing asynchronous record-read boundary is reproduced with a delayed real saved response and corrected by exact receipt/version/state/feedback assertions before the unchanged visible Closed assertion. Eight normal compiled Sales cases and two delayed cases passed; the altered-state negative control failed as intended. Correction `a17c670` is carried through #323 by normal merge `547c7a0` and into #324. Fresh full PR CI was required before dependency-order protected merges; the completed results are recorded below.

Source review of #324 covered scope predicates, exact hashes/versions, time boundaries, request/identity invalidation, overflow refusal, no-write evidence, existing shared-control/register bindings and the explicit publication limitation. No new migration, grant or production authority is introduced. This is source review, not owner visual acceptance.

The later original-head retry failed before reload after Close was saved but its resource refresh remained pending. Follow-up `f3f560d` adds that missing saved-refresh boundary too; normal merge `67aa70c` carries it through #323. Both delayed refresh/reload cases passed, all eight normal Sales cases passed, and the altered reload-state control still failed. Original failures and final checks remain separate in the CR05 evidence.

## Completed protected integration

| PR | Checked head | Protected merge | Merged at (UTC) | Result |
|---|---|---|---|---|
| [#322](https://github.com/deanrfiedler-gif/powerplants-one/pull/322) | [`f3f560d`](https://github.com/deanrfiedler-gif/powerplants-one/commit/f3f560d4c00cd6905b2a9c60034be4633402803d) | [`62b20f7`](https://github.com/deanrfiedler-gif/powerplants-one/commit/62b20f799fc04d2ef029c8d20c6909dabb7eaf54) | 2026-09-27T14:35:07Z | All 17 head checks passed; all seven required contexts passed; merged tree equals checked head. |
| [#323](https://github.com/deanrfiedler-gif/powerplants-one/pull/323) | [`67aa70c`](https://github.com/deanrfiedler-gif/powerplants-one/commit/67aa70cb82e4afd9cba5c47fbbd65e363184693d) | [`daad4e9`](https://github.com/deanrfiedler-gif/powerplants-one/commit/daad4e9444ef8f3d28a1df5923ea72feb7f51d34) | 2026-09-27T14:35:16Z | All 16 head checks passed; all seven required contexts passed; merged tree equals checked head. |
| [#324](https://github.com/deanrfiedler-gif/powerplants-one/pull/324) | [`724e9d6`](https://github.com/deanrfiedler-gif/powerplants-one/commit/724e9d62988403806c9ceecb40d027fe3fd23bc8) | [`a3b5d49`](https://github.com/deanrfiedler-gif/powerplants-one/commit/a3b5d49e47d70e85840594cb4259a595d24b125c) | 2026-09-27T14:40:34Z | All 17 head checks passed; all seven required contexts passed; merged tree equals checked head. |

Final integrated main: `a3b5d49e47d70e85840594cb4259a595d24b125c`. All seven current required contexts and all other head checks passed before each normal merge; the merge trees equal the reviewed/checked head trees. [Full exact record](../testing/evidence/cr05-reload/integration.json). No protection was bypassed and no branch history was rewritten.

Final correction `f3f560d` waits for both saved refresh and reload, preserves the five-second UI assertions and checks exact state/version/feedback. The original two reload failures, later pre-reload retry failure, first-correction delayed-refresh failure and corrected/negative controls remain separate. Fresh matching-source type/lint and documentation/register assurance passed; all 321 entry and 29 component reviews remain pending. The 35 committed return/update/policy artifacts still match their original manifest hashes.

The [concrete publication plan](scheduling-policy-publication-plan.md) and [proposed decision](../decisions/scheduling-policy-publication.md) cover dedicated synthetic authority, immutable exact review binding, deterministic effective selection, shared graph locking, complete fresh evaluation/stale refusal, atomic successor/owned impacts/audit/EVT-12/receipt, exact retries and unresolved holds while retaining existing pins and issued bytes. Begin with its pure selector/contract step from the integrated baseline; refresh provisional 0053 before schema work. Reserved 0051/0052 remain untouched and unregistered. Publication itself has not begun.

Full PT-28/PT-30, PT-27 performance misses, owner/device/accessibility/visual acceptance and operational authority remain open. This task made no deployment, live integration, production migration, business transaction or customer communication. Root edits, unfinished feature worktrees and earlier proof environments remain preserved.
