# Service requests register and logging — page contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:SV-01`.

Owner: Dean Fiedler. Implementation owner visual review: **pending**. Design acceptance is recorded in [Service requests design](../../../decisions/service-requests-figma-design.md); it does not grant implementation acceptance. Scope: SV-01/SV-02; parent requirements SVC-01, SVC-02 and SVC-06 are unchanged.

## Accepted source

Live source: **PPO - Design**, named version **Service requests — accepted**, page 1249:9313; index 630:2, Service requests row 1262:5220; notes card 1261:289978. D1–D6 and Q1–Q2 bind this build. No private file identifier, URL or Pro artwork is retained here.

Desktop section 1249:9359 (1440 × 900): register 1249:9382, snapshot 1254:3846, Board 1255:2587, Log a request / possible duplicate 1259:3354, record Triage 1255:3172, Complete triage 1256:287381, Triaged / Linked work 1257:3058. Tablet section 1249:9363: 1259:288310 (1024 × 900). Phone section 1249:9367: register 1259:289789, 320 register 1259:290489, record 1259:290111, triage validation sheet 1259:290321 (390/320 × 844). States section 1249:9374: loading 1261:4946, no matches 1261:5127, failed load 1261:5300, view only 1261:289734, refused newer revision 1261:289886. Page parts 1250:963 include row 1250:965, header 1250:1010, Board card 1255:2149 and phone row 1259:289773.

Retained icon-free references: [thirteen captures and manifest](../../../reference/ui/service/service-requests-design-r01/README.md). Those issued bytes remain unchanged. Live Figma supplies the current layout; its generated code is not application source. Runtime comparison and limits are recorded in the [evidence ledger](../../../testing/evidence/service-requests-accepted/README.md).

## Desktop

The existing routes are refined in place. List is the default; queues live in the flush secondary menu: All open, My requests, New to triage, Urgent, Needs information, Overdue clarifications, No work order yet, Work order linked. The last two describe visible linked work only. Grid rows are 40 px, with separate reference and summary columns, row selection and a pinned snapshot action. Selection permits Open in sequence and Export list only. Board retains only New, NeedsInformation and Triaged. A large snapshot opens the same permission-filtered record.

The record uses a full-bleed header, readiness row, 380 px details column and Triage, Reported issue, Linked work, Updates and History tabs. Complete triage edits inline with a save bar. This accepted composition supersedes the earlier padded-record proposal. The logging page keeps its draft open beside the possible-duplicate check. No extra module masthead is added. The known tablet shell account clipping remains separate (Q2).

## Mobile

Use the shared 56 px compact header and existing bottom navigation. At 390 and 320 px the register has dense three-line rows, a queue selector and floating Log a request action. The record shows status first, view tabs and pinned permitted actions. Complete triage occupies the full screen, with a validation summary and sticky save/cancel controls. Unknowns use amber words. Controls have names, visible focus, keyboard tab operation and dialog focus return; optional equipment is not promoted to a server blocker.

The page makes online requests only. No offline queue, offline acceptance or guaranteed draft survival across reload is claimed; follow the [offline contract](../systems/offline.md). An uncertain save retains its original command for an unchanged retry. Stale revision refuses saving and retains entries for comparison.

## Behaviour and handovers

Existing scoped selectors, native intake commands, permission checks and revision guards remain authoritative. The [scoped backend decision](../../../decisions/service-request-capture-and-triage.md) authorises immutable customer statements and one atomic triage review, including completion of the caller's owned clarification when permitted. Neither action authorises work or books a visit. Statements remain ReportedSymptom evidence, never verified findings.

Site handover accepts site and site_id query parameters and derives the company from a permitted Site read. Existing Sales delivery handover binding is retained. Linked work opens native work orders with their own authorisation/readiness checks; none of the field readiness, quotation tracking, ADR-0058/0059 or MYOB authority rules is changed. Test data remains synthetic with stable internal IDs and explicit references.

## Shared components and states

Reuses SecondaryMenuFrame/useSecondaryMenu, usePhoneHeader, RegisterTable/RegisterChip, Button/ButtonLink, ProductIcon through font-awesome-icons.ts, Field/EnumField/SelectField, LocalDateTimeField, ValidationFields/ErrorNotice, ReadState, RecordTabs/RecordPanel, useResource/useCommand and existing IntakeForm/TriageActions. These are consumer bindings; no new shared component is introduced.

States include loading, zero results, filtered no matches, failed/denied reads, partial bounded results, view-only actions, validation, unsaved-discard confirmation and refused newer revisions. Reads never present stale rows as current after failure. Board and duplicate windows disclose their bounds. Existing Request information and Update details forms retain native behaviour because their accepted layouts are not drawn.

## Deviations and open questions

- Customer selection in the drawing has no native persisted customer field. The form displays the visible current site Operator and labels company visibility separately. Should a later design add explicit customer binding? This change does not silently create that field.
- Duplicate detection is advisory matching of permitted open requests at the same site, narrowed to selected equipment, within a declared 20-result window; it does not assert a verified duplicate. Semantic matching rules remain unspecified.
- Reported issue, Updates, History, Request information, Update details, phone filter internals and tablet record layouts are not drawn. Existing controls and native data are reused; their final visual treatment remains an owner question.
- Existing Board drag/Move behaviour remains native and is not an additional stage. All later ADR-0043 stages and Conversations remain out of scope.
- Some form counters in Figma differ from existing command limits. Native limits remain explicit; no silent truncation or new business rule is added. Request information remains available only from New; the existing command refuses a second clarification while the request is already NeedsInformation.

- The later shared compact phone-header contract shows reference/revision and retains bottom navigation. The accepted Service record shows summary/reference and no bottom navigation. This build preserves the shared shell contract; owner alignment remains open.
- Earlier on this equipment uses visible Triaged requests from the declared loaded window. Its date is labelled received because the register does not expose a triage-event timestamp. It implies neither resolution nor closure.
- Existing Board Preview and Move actions remain in a labelled per-card menu. Standalone snapshots have no invented previous/next context; record sequence navigation is available through Open in sequence.

## Delivery and evidence

Source implementation is under review in draft PR #636. [Verification ledger](../../../testing/evidence/service-requests-accepted/README.md) records actual check results and local limits. No review fingerprint, reviewer or review date is asserted. No deployment or production readiness is claimed. Passing documentation checks is not business acceptance.
