# PT-29 screen-state checklist

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review status: technical execution in progress; independent and owner review pending. Scope: [PT-29 / AT-23](prototype-acceptance.md#pt-29--honest-empty-error-and-partial-states), [decision](../decisions/pt29-screen-state-verification.md). The SC IDs below belong to the original BP-07/PP-01 screen catalogue; they do not refer to the later Supply page keys.

## Common read-state proof

`tests/browser/quality-states.spec.ts` visits each representative route on desktop (1440×1000) and emulated phone (390×844). Every row requires a real authorised GET, a visible label from its returned record, observable loading while the selected read is held, an injected 503 with actionable recovery, a successful subsequent read, and an actual Systems 403/404 after the identity POST is accepted. Denials must be private/no-store and clear protected context. Empty responses are presentation fixtures; they do not replace server query or permission proofs.

| Screen family | Representative route | Empty/no-record semantics | Additional relevant state or recovery |
|---|---|---|---|
| SC-01 My Work | `/work/actions` | Successful permitted collection with no items | Failed read removes current summary; a deliberately slow real recovery must finish before assertions. Overview coverage remains in `my-work.spec.ts` and `my-work-mobile.spec.ts`. |
| SC-02 Customers | `/customers` | Empty organisation directory, including zero total | Invalid create retains name and linked field error; retry saves the record through the real API. |
| SC-03 Site and asset | `/sites/:id` | Unavailable selected record (404) | Failed refresh cannot establish current authority; current denial clears context. No empty Site object is fabricated. |
| SC-04 Service intake | `/service/tickets/:id` | Unavailable selected record (404) | Same retained/current-authority read boundaries; intake command-specific cases remain in `intake.spec.ts`. |
| SC-05 Work order | `/service/work-orders/:id` | Unavailable selected record (404) | Scope validation and stale proposal comparison are covered by the selected `work-orders.spec.ts` case. |
| SC-06 Pack workbench | `/service/packs/:id` | Unavailable selected record (404) | Draft queue says Not issued. Source/save/print recovery remains distinct from an actual issued artifact. |
| SC-07 Planner | `/schedule?day=:fixtureDay&view=day` | Successful empty appointment collection; resource evidence is separate | Four statistics become unknown while loading. Controlled stale/failed move retains the original booking and proposed input (`planner.spec.ts`). |
| SC-08 Appointment | `/service/appointments/:id` | Unavailable selected record (404) | Same appointment version and saved-booking comparison is exercised by the planner recovery case. |
| SC-09 My Jobs | `/my-jobs` | No current assigned visits | Owned active visit ensures the populated case is not inherited from another test. Offline cached freshness has separate PT-11/12/24 procedures. |
| SC-10 Field job | `/my-jobs/:id` | Unavailable selected record (404) | Injected upload failure leaves the one real Pending attachment and selected original intact; explicit retry/finalise returns exact original bytes once. |
| SC-11 Review and report | `/service/reports/:id` | Unavailable selected record (404) | Report queue failure is not empty. Immutable issued revision and review semantics remain in the report/output procedures. |
| SC-12 Finance queue | `/finance/handoffs` | Successful empty permitted collection | A concurrent real cancellation produces 409 on the stale submission; current Cancelled state, proposed reason and zero processing attempts are asserted. |
| SC-13 Account view | `/customers/:id/account?account_id=:id` | No extraction: no rows, total unavailable | Real complete, partial, failed and recovered synthetic extractions separate historical values from current totals. |
| SC-14 Documents | `/documents/:issueId` | Unavailable selected manifest (404) | Failed applicability read makes no current-use claim; secondary denial removes filename and exact-PDF link. |
| SC-15 Exceptions | `/admin` | Successful empty permitted recovery window | Own retained original populates the matrix; lost disposition response retries identical input once, preserving its envelope/hash and clearing context on real command denial. |

Detail records deliberately use 404 rather than an impossible empty-success object. Immutable exact outputs do not become a newer file when their current-use status is unknown. “Applicable stale” covers retained-read uncertainty and versioned commands; it does not imply every read-only screen has a save action. Unsupported receiving, publishing and provider actions are not manufactured for this proof.

## Execution and evidence

The execution record will identify the exact test source, compiled application source/build, environment, first-run failures, final results and representative capture hashes. The test emits `P11-screen-state-matrix.json` per viewport, with each route, actual query, visible source label and denied status. Captures retain source/head/tree, dimensions, byte counts and SHA-256 in their adjacent JSON files.

Automated state/overflow assertions and inspected representative captures do not grant design acceptance. Original authored catalogue status remains separate from this execution record. No blanket AT-23 or product acceptance is claimed.
