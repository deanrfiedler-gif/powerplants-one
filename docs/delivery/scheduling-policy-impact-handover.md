# Scheduling policy impact review — handover

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 27 September 2026 · **Branch:** `codex/scheduling-policy-impact-review`
**Status:** Native synthetic read-only increment; publication, owner acceptance and deployment remain separate.

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

PR #322's compiled suite passed on `ab61c06`. Its separate development browser job in run `36313348099` recorded 519 passed, 79 skipped and one CR05 Sales reload failure at `tests/browser/sales-workflows.spec.ts:429`: retained context still displayed Loading aftercare review at the five-second assertion. Sales source/test is unchanged from main. This is an observed loading timeout, not evidence that closure data was lost. The database lane was still running when GitHub initially refused a job rerun. It subsequently passed; browser attempt 2 is running on the same exact source. Do not merge through the failed gate. PR #323 is ready for review; compiled checks passed and its remaining browser/database lanes were still running without failure at this checkpoint. Exact final integration state belongs in current STATUS and GitHub.
