# Service requests accepted-design build

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Contributor: Codex, Service requests build session. Scope: SV-01 and SV-02; parent requirements SVC-01, SVC-02 and SVC-06.

## Authority and target

Dean requested implementation on 20 October 2026 of the [accepted Service requests design](../decisions/service-requests-figma-design.md). Reference: Figma file “PPO - Design”, page `1249:9313`, named version “Service requests — accepted”. Desktop register `1249:9382`, snapshot `1254:3846`, Board `1255:2587`, capture `1259:3354`, record `1255:3172`, triage `1256:287381`, linked work `1257:3058`; tablet `1259:288310`; phone `1259:289789`, `1259:290489`, `1259:290111`, `1259:290321`; states `1261:4946`, `1261:5127`, `1261:5300`, `1261:289734`, `1261:289886`; notes `1261:289978`. [Retained icon-free captures](../reference/ui/service/service-requests-design-r01/README.md) remain unchanged.

## Build plan

1. Refine the existing register and its page-local parts in `src/service/components/client/`, `src/service/ticket-register-view.ts` and `src/app/styles/service-requests.css`: compact List default, queues in the shell side menu, Board, selection, snapshot and responsive states. Extend existing permission-filtered reads in `src/service/intake.ts` only where required for the accepted queues and duplicate matches.
2. Refine the existing intake and record in `src/components/intake-screens.tsx`, extracting Service-only presentation into `src/service/components/client/` where useful. Preserve existing command, revision, permission and retry boundaries. Register only these routes in the shell workspace/secondary-menu configuration. Keep the Sites `site_id` handover.
3. Reuse the application shell and compact phone header, ProductIcon/Font Awesome mapping, RegisterTable/RegisterChip, Button/ButtonLink, business-ui fields, reads, errors and command hooks, and the existing modal/record patterns where their contracts fit. No new dependency, migration, capability, stage or command is planned. Conversations is excluded.
4. Update the five existing scope/route page contracts and their register/guide entries, relevant consumer bindings, generated build sequence and a generated status fragment in this PR. Owner visual review remains pending.
5. Use synthetic test fixtures. Verify queue/filter agreement, permissions, duplicate handover, revision refusal preserving entries, keyboard/focus, desktop/tablet/390/320 layouts and drawn read/form states. Run studio, lint, typecheck, unit, build, naming and foundation checks; record actual results and limitations.

## Pre-build findings and question

The live notes confirm D1–D6 and Q1–Q2. The working page contracts retain older proposed compositions; the 17 October accepted design supersedes those layouts. ADR-0043 remains proposed. The tablet top-bar issue Q2 is a separate shell follow-up. Sites is being refined separately in draft PR #626.

The accepted duplicate panel offers “Add as customer statement”, but [the existing integration plan](service-requests-integration-build-plan.md#i4--capture-with-a-duplicate-check-frames-5-and-18) explicitly defers that operation to ADR-0043. No Ticket statement command exists in current main. Dean has been asked whether this build should use a possible-duplicate panel with an Open request handover and an explicit unavailable statement-capture explanation. This question is unresolved; no replacement behaviour has been approved or implemented.

A second contract conflict is visible in desktop triage frame `1256:287381`: reviewed priority, request owner, priority reason and next action are edited together with the clarification outcome, and the caption moves revision 3 to revision 4. The existing `triageTicket` command accepts only the expected version, reason and clarification outcome. `saveIntake` is a separate command with its own revision increment. Chaining them would produce two revisions and could save intake changes without completing triage. Dean has been asked whether to retain two explicit steps or pause for a separately authorised atomic command change. No chained save or command extension has been implemented.

## Delivery and verification

Planning claim only. Implementation is paused for the two scope answers above, under Dean’s instruction to stop on a material design/contract conflict. Application changes, application verification, owner visual review and deployment are not complete.
