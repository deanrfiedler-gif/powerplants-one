# BP-03 — Controlled opportunity handover design handover

**Revision:** r01 · **Date:** 7 September 2026 · **Owner:** Dean Fiedler · **State:** Contract/design proposal; policy acceptance and implementation outstanding. **Work:** [#55](https://github.com/deanrfiedler-gif/powerplants-one/issues/55), linked to [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9).

The [external publication ledger](https://github.com/deanrfiedler-gif/powerplants-one/issues/55#issuecomment-5567257651) owns final source/tree, check/review/control evidence, merge identity/parents and actual-main workflows. Read its current completion state; this document does not claim its own future SHA or convert a proposal into accepted policy.

## Outcome and next decision

The package specifies a proposed current-owner handover with an explicit scoped capability, independently eligible receiver, preserved original qualification/Activity ownership, immutable owner-chain evidence and recovery of proven original operations under current permission. [H-01–H-03](../decisions/crm-opportunity-handover.md) compare the unresolved authority, immediate-effect and recovery policies for Dean. An explicit acceptance of the recommended package can resolve them together. No manager or live role policy is invented.

| Deliverable | Content |
|---|---|
| [Decision proposal](../decisions/crm-opportunity-handover.md) | Recommended policy, alternatives, required owner answers and already-fixed preservation rules |
| [Contract and affected map](../contracts/crm-opportunity-handover.md) | Accepted source facts, eligibility, exact command/read payload, physical invariants, receipts and downstream boundaries |
| [Synthetic canonical-detail journey](../blueprints/crm-handover-journey.md) | Full current/proposed owner form, independent next-action consequences, validation/conflict/unknown-result/revocation and keyboard/reflow |
| [Future verification matrix](../testing/crm-handover-verification.md) | 22 DB/HTTP/browser/restart/migration obligations, all Not run |
| [Conditional implementation starter](crm-owner-transfer-implementation-starter.md) | Concrete single-command scope and unresolved prerequisites; no present implementation authority |

## Verified starting source and dependencies

Connected identity `deanrfiedler-gif` (231005545); private repository, admin/maintain/push/pull authority reported and collaborator permission admin. Starting main `744b6e6b89e69abdd0fbd4bfdd6ef5ae51e154f3`, tree `48ddac2931df66828aef42be5c78b772d9267167`, parents `655f17cfc7e68036939eeecc85b75069ccde8a5c` and `60ad9cf15673fd98a30aaf19d271909b9d4cf78c`. An isolated shallow checkout materialised that exact existing Git tree from local object caches; remote commit/tree/parents were independently read. Other checkouts were not edited. Branch `docs/crm-opportunity-handover-contract`.

| Dependency | Verified publication and merge |
|---|---|
| I1 | [Complete external record](https://github.com/deanrfiedler-gif/powerplants-one/issues/39#issuecomment-5557831957); #39 closed; PR #40 merged to `c3ac9b2ab9c09308f620a5b451a337eb75fe6390` |
| I2 | [Complete external record, including earlier failed checkpoints](https://github.com/deanrfiedler-gif/powerplants-one/issues/43#issuecomment-5562200516); #43 closed; PR #47 plus follow-up #53 normally merged; final main is the starting baseline above |
| P09 | [Complete external record](https://github.com/deanrfiedler-gif/powerplants-one/issues/36#issuecomment-5557392390); PR #37 merged to `17f1505e2708663e7d2948f2c6bafc57a409085e`; exact reports/response/Activity controls retained |
| P10 | [Complete external record](https://github.com/deanrfiedler-gif/powerplants-one/issues/45#issuecomment-5562750221); PR #48 merged to `655f17cfc7e68036939eeecc85b75069ccde8a5c`; migration 0011 / ADR-0016 present |
| E1 | [Complete current-main external record](https://github.com/deanrfiedler-gif/powerplants-one/pull/49#issuecomment-5562344440); PR #49 merged to `1f13dd8d6f5006559152fe9d5410aed3fff64234`; later #47/#53 verification preserved; migration 0012 / ADR-0017 present; E2 prepared only |

Actual starting-main push workflows were read as completed/success, attempt 1: Application [34088912272](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34088912272), E1 [34088912253](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34088912253), Documentation [34088912277](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34088912277), CRM design [34088912289](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34088912289). The linked publication records 434 unique complete application cases and retained focused/restart gates; this design session does not claim to have rerun or reinspected their original images.

Discovery read AGENTS/README/STATUS, PPO naming/project instructions, full BP-03/parity/sequence and I1/I2 handovers/publications, accepted shared UI/I2 guidance/asset manifest; actual CRM owner/relationship/stage/expected-version/receipt guards, Activity ownership/all-target visibility, identity/grants/operation dispatch and P09/P10/E1 ownership dependencies. No operational Pipedrive records were queried. The proposed map cites the exact physical files; older broad manager rows remain proposals.

Concurrent work: Projects design PR #52 was the initial open PR and subsequently merged to `ebbcac5c9e210e7742bb619da3c8518592d19f31`, tree `3deb75000c13c8eea013ff3b654745768a2015ca`, parents the starting main and `52f0ab1fef609701ab9b4fd8bfbfb650a1c24bea`. All 25 changed blobs, the complete tree and signed merge commit were verified locally. This contribution was rebuilt on that exact newer main; its six Projects register additions, BP-06 record and all Projects files/visuals are preserved. Projects actual-main Documentation/E1 had passed while Application was running at reconciliation; no pending result is counted as completed. P11 #54 subsequently opened on `feature/p11-integrated-quality`, owning integrated runtime/access/recovery work. This contribution reserves no migration, numbered ADR, runtime grant or shared application file. Before publication, newer accepted work must be retained and shared document/register changes reconciled by field; its current result belongs in the external ledger.

## Design assurance and limits

Required local checks: `python3 scripts/check_foundation.py`, `python3 scripts/check_prototype.py`, `python3 scripts/check_naming.py`; diff/link/register/parent/issued-byte review. Existing CRM design CI remains applicable. Complete unchanged application/E1 workflows also trigger on the contribution and actual main; their real conclusions must be published, not inferred from the unchanged runtime tree. Local foundation, prototype and naming checks passed after Projects reconciliation: four issued sources, 78 parent requirements/dispositions, 29 decisions, 38 Planned master scenarios, 30 prototype procedures, 12 implementation packages, 1,338 links and 79 document records. Diff whitespace checks passed. Final publication evidence is external.

The reattached logo SHA-256 `8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694` and brand PDF SHA-256 `335d3049bc72783799315d4790bd56b04e928acd0e1c2c81d8099cec2f2b8fd3` match the original supplied-asset manifest. The complete PNG and rendered primary-colour PDF page 18 were inspected. Existing specification supplies typography/clear-space/keyboard/reflow rules. No new artwork or runtime screen capture is presented as implemented transfer evidence. The proposed form is a field/state design, not a tested UI.

Self-review covers the two hidden compatibility risks: creator is not necessarily original owner, and original-operation recovery currently depends on today's Opportunity owner. The contract explicitly preserves the qualification-time identification basis and fences Activity-only comparison changes. It proposes a CRM-only recovery distinction without weakening shared replay authorisation.

Accessible rulesets returned an empty list; main reported unprotected. Detailed branch protection returned 403, Resource not accessible by integration. This is a visibility limitation, not proof that hidden controls do not exist. No settings/control changes, force or bypass are authorised. Required submitted/requested reviews and unresolved threads must be checked at merge time. Self-review is not independent approval.

## Traceability and stop

CRM-01/02/03/08; PAR-01/03/05/15; CA-02/03/04/05/06/07/08/10/13/15 component design; AT-01/02/24/25/30/34/35 links remain prospective. CRM-05/06 and P09/P10/E1 are preserved downstream boundary tests, not newly implemented scope. All 78 parent definitions and issued bytes remain unchanged; PP-01 dispositions and full AT-25 Planned remain. #9 stays open; #55 may close only for this design publication.

The next bounded step is Dean's H-01–H-03 policy decision against this concrete package, followed by a separate explicit invocation of the conditional implementation starter if accepted. This session stops after contract/design publication. No application/schema/seed/grant mutation, transfer implementation, operational read expansion, live source write, communication, automation, hosting, paid service or access/settings change is included.
