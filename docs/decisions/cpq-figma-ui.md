# CPQ Figma application implementation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Authorised 13 October 2026 in the CPQ UI implementation conversation. Design comparison and owner acceptance are recorded separately.

## Decision and architecture

Implement the accepted CPQ Figma pages with the existing React/Next.js, native CSS, PostgreSQL and CPQ interpreter. Retain ES-02/ES-03 and EST-02–EST-09 parent identities and ES-04–ES-07 handovers. Dean additionally instructed expansion of the backend to implement the design states and information. Add an additive migration and opt-in definition schema 3; preserve existing schema 1 bytes and calculations. No new dependency, framework or automatic permission grant. This supersedes the earlier allocation of UI work to another assistant for this contribution only.

Reuse SecondaryMenuFrame, Button, RegisterTable, native modal focus handling, current business session, command receipt recovery and the existing Font Awesome Kit/brand assets (ADR-0050). The [accepted design decision](cpq-figma-design.md) confirms the named version “CPQ — Configure & price and Rules studio, accepted” and [44 icon-free captures](../reference/ui/estimating/cpq-figma-design-r01/README.md), integrated from main PR #455. This newer implementation authorisation covers the code and contract work which that earlier design-only record explicitly left separate. The exact private Figma page IDs are 464:2–464:7. Representative frames: register 483:3760; configure 476:338; materials 480:1244; pricing 481:2485; rule registry 485:301; rule definition 486:641; tests 489:1398; release 492:2722; phone 506:678 and 508:1123. Do not publish private Pro artwork or private Figma URLs.

A read-only server evaluation endpoint provides live previews without creating saved evaluations. Save invokes the existing immutable run command; adoption requires its own exact receiving preview and confirmation. Structured rule authoring saves whole immutable release revisions using the current contract. Server-generated hashes and receipts remain authoritative. Browser arithmetic is not a substitute for the interpreter.

Alternatives rejected: embedding the Figma screenshot, a second browser-only rule engine, raw JSON as the authoring interface, and a new configuration persistence layer parallel to the merged CPQ backend.

## Expanded design contract

Add durable working drafts, immutable rule versions and release membership, seal separately from activation, Text facts and typed conditions, bounded ceil/floor/round functions, decision tables with exact finite-domain coverage and overlap findings, option availability, shared capacity constraints, line explanations and explicit override rebase/restore. Keep validation, testing, version creation, independent review, sealing and activation distinct. The backend remains the authority. Operational pricing thresholds are authored inputs; synthetic examples do not establish policy. Review/publish duties remain independently assigned.

Configuration identity is the existing selected discovery option and immutable evaluations; no SYN-CPQ identifier type is invented. Rule keys and release revision labels provide navigation. Known operational policy questions remain open. All calculations and demonstrations are synthetic and excluding tax.

## Verification and handover

Maintain page/component registers and guides in this contribution. Test actual persistence, exact preview/save/use separation, independent release duties, changed basis, unknown inputs, override retention, denial, keyboard and responsive layouts. Link results in the delivery evidence; owner/device acceptance and deployment are separate.

## Publication duties selected for this implementation

On 13 October Dean delegated the live CPQ duty arrangement: “Whatever you believe is the most professional.” Apply the existing three-person release boundary: a rule author creates/tests versions, a distinct technical reviewer approves exact content, and a publisher distinct from both seals and activates it. Estimators calculate/configure with active approved releases and submit the resulting estimate to its existing review process. This is the selected implementation arrangement, not evidence that any particular person has received a grant or reviewed a release. Current access administration owns assignments; there is no automatic grant/backfill. Preserve the historical DEC-CCE-06 question and link this newer arrangement rather than rewriting its source record.
