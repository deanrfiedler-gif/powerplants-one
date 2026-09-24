# Native Supply Chain verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Reviewer: Codex, 25 September 2026 (Australia/Sydney). Native implementation evidence; owner acceptance and deployment remain pending. The design register stays Draft / Needs review, without accepted fingerprints.

## Source and execution

The compiled application was built from `6305a2cc5b844444dad30d3369c73788b45b2d15`. The later `ecf2f576a8f26fecb651e63dce38d85b9bab56d5` adds database quantity guards and a navigation test expectation; it does not change the compiled UI. Browser verification uses loopback port 3059 and an isolated PostgreSQL database named `ppo_synthetic_test` on port 5550. Database tests use another isolated instance on port 5549. Fixtures and identities are synthetic. Other local sessions were not reset.

Run `npx playwright test --config=playwright.supply.config.ts` against the configured local server. The suite covers SC-01–SC-10 at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 844. Its route cases exercise the shell, selected rail, filters, URL restoration, browser Back, guide, focus return, mobile detail navigation and horizontal containment. Further cases exercise receipt correction, pick/stage/partial delivery, original receipt recovery after an accepted response is lost, retained stale proposals, read-only access and denied company scope. The SC-08 route case opens all six views.

`sc-01` through `sc-10` are native application captures. `detail` files show mobile selected records. `receipt-form`, `pick-form` and `pod-form` show the actual native capture forms. Files prefixed `reference` are newly captured images of the unchanged issued HTML, not native runtime evidence. `manifest.json` records each image's SHA-256, dimensions, source and capture time. The handover records executed counts and CI results separately.

## Visual inspection and proposed departures

The retained Material Readiness r03, Fulfilment r01 and Returns r01 HTML were opened and compared with native captures. Their original bytes are unchanged. The old SC-08 authoring package remains historically incomplete and its recorded HTML hash mismatch remains unresolved; opening that HTML here does not validate its original authoring claims.

| Area | Retained design | Native implementation and review limit |
|---|---|---|
| Shell and theme | Standalone module headers and local identity preview | Existing PPO shell, navy/green tokens, Roboto/Verdana, canonical identity and seven Supply rail destinations. No second shell. |
| Register and detail | Dense tables, illustrative KPI cards and design-specific filtering | Server-scoped worklist plus selected detail, search and completeness filters. Native composition is proposed for review; the illustrative KPI counts and source-specific state taxonomy are not claimed as adopted business rules. |
| Evidence and actions | Browser-local illustrative records and action panels | Versioned server records, explicit observation forms, exact source basis, corrections and original-operation recovery. Native actions retain the ten scopes and six Returns views. |
| Mobile | No exact issued mobile image for these native pages | Single-column forms with 16px inputs and 44px targets. Selecting a record replaces the worklist on mobile; Back to worklist and browser Back restore it. Dialogs have one scrolling body and retain close controls. |
| SC-10 | No exact historical HTML or image | New native custody composition, exact Work Order/visit/Field links and independently attributable outcome quantities. Its new native captures are the design reference, pending owner review. |

Inspection found and corrected missing host-specific modal styling, focus loss after save, and mobile detail being placed below a long worklist. Representative desktop, intermediate and phone captures were inspected directly; automated checks cover all four widths. This is not pixel-equivalence certification, physical-device acceptance or a business approval.

## Functional and authority limits

The domain coordinates manual/synthetic observations. Unsupported live source commands remain **Not configured**. MYOB remains the intended inventory and Finance authority. PNG evidence uses the existing inspected durable-store pattern, with a 2 MB limit; other camera formats and physical-device capture are not certified by these browser checks. Existing native readers supply Customer/Site/Facility/Equipment, Project, Service, appointment and Field identities. Where a receiving source contract is absent, quotation, release and warranty references remain explicit evidence, not inferred approvals.

See the [implementation handover](../../../delivery/supply-chain-native-handover.md) and [BP-08](../../../blueprints/BP-08-supply-chain.md) for traceability, commands, results and unresolved policies.
