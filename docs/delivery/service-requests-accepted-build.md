# Service requests accepted-design build

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Contributor: Codex, Service requests build session. Scope: SV-01 and SV-02; parent requirements SVC-01, SVC-02 and SVC-06.

## Authority and target

Dean requested implementation on 20 October 2026 of the [accepted Service requests design](../decisions/service-requests-figma-design.md). Reference: Figma file “PPO - Design”, page `1249:9313`, named version “Service requests — accepted”. Desktop register `1249:9382`, snapshot `1254:3846`, Board `1255:2587`, capture `1259:3354`, record `1255:3172`, triage `1256:287381`, linked work `1257:3058`; tablet `1259:288310`; phone `1259:289789`, `1259:290489`, `1259:290111`, `1259:290321`; states `1261:4946`, `1261:5127`, `1261:5300`, `1261:289734`, `1261:289886`; notes `1261:289978`. [Retained icon-free captures](../reference/ui/service/service-requests-design-r01/README.md) remain unchanged.

## Build plan

1. Refine the existing register and its page-local parts in `src/service/components/client/`, `src/service/ticket-register-view.ts` and `src/app/styles/service-requests.css`: compact List default, queues in the shell side menu, Board, selection, snapshot and responsive states. Extend existing permission-filtered reads in `src/service/intake.ts` only where required for the accepted queues and duplicate matches.
2. Refine the existing intake and record in `src/components/intake-screens.tsx`, extracting Service-only presentation into `src/service/components/client/` where useful. Preserve existing command, revision, permission and retry boundaries. Register only these routes in the shell workspace/secondary-menu configuration. Keep the Sites `site_id` handover.
3. Reuse the application shell and compact phone header, ProductIcon/Font Awesome mapping, RegisterTable/RegisterChip, Button/ButtonLink, business-ui fields, reads, errors and command hooks, and the existing modal/record patterns where their contracts fit. Migration 0112 adds attributed customer-statement evidence and its scoped command; the existing triage command saves the review and owned clarification atomically. Existing permissions are reused. No dependency, capability, later lifecycle stage or Conversations is added.
4. Update the five existing scope/route page contracts and their register/guide entries, relevant consumer bindings, generated build sequence and a generated status fragment in this PR. Owner visual review remains pending.
5. Use synthetic test fixtures. Verify queue/filter agreement, permissions, duplicate handover, revision refusal preserving entries, keyboard/focus, desktop/tablet/390/320 layouts and drawn read/form states. Run studio, lint, typecheck, unit, build, naming and foundation checks; record actual results and limitations.

## Scoped backend authorisation — 20 October 2026

Dean directed: “Implement both customer-statement capture and atomic triage so the page matches the accepted design. I authorise all and any scoped backend changes needed to ensure the Powerplants One app is professional as possible; keep the rest of ADR-0043 out of scope.” This resolves both questions below. Add immutable, attributed statement storage and its intent-specific command using existing ticket edit authority; extend Complete triage to save reviewed intake values and the triage transition in one transaction and one ticket revision. Migration 0112 was reserved before implementation and is included in this PR. No later lifecycle, resolution, closure, customer commitments, Conversations or live integrations are adopted.

## Earlier pre-build findings

The live notes confirm D1–D6 and Q1–Q2. The working page contracts retain older proposed compositions; the 17 October accepted design supersedes those layouts. ADR-0043 remains proposed. The tablet top-bar issue Q2 is a separate shell follow-up. Sites is being refined separately in draft PR #626.

The two pre-build gaps are resolved under the scoped instruction above. Customer statements retain immutable reported symptoms with attribution. Reviewed intake values, an owned clarification and triage commit together; a stale revision or failed evidence write leaves all of them unchanged. The rest of ADR-0043 remains proposed.

## Delivery and verification

Implementation is delivered in draft PR #636, following planning claim #632. The [evidence ledger](../testing/evidence/service-requests-accepted/README.md) records actual local and CI outcomes. Owner visual review remains pending; no deployment or business acceptance is claimed.
