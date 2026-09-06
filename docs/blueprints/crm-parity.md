# CRM — Pipedrive parity and evidence assessment

**Revision:** r02 · **Date:** 6 September 2026 · **Status:** Bounded discovery; account context and exhaustive parity unverified · **Owner:** Dean Fiedler, private prototype · **Workstream:** PPO-009 / issue #9.

[BP-03](BP-03-crm.md) owns target journeys/contracts. This register expands the original PAR-01–PAR-18 without changing their identities. All dispositions are **proposed**, not accepted. Preserve means retain the required outcome/history; improve means retain it with an evidenced improvement; integrate means keep an authoritative external capability; defer means retain it in its operational tool pending a later decision. No retirement is approved. Proposed criticality describes the impact of losing the outcome, not measured usage or an approved priority.

## 1. Evidence ledger

| Evidence ID | Date / source | Actual scope and confidence | Limit |
|---|---|---|---|
| E1 — User direction | 6 September 2026 current PPO-009 instruction | High confidence in authorised scope, synthetic-only boundary, required CRM outcomes and Pipedrive retention | Does not supply account configuration or accept proposed business rules |
| E2 — Maintained baseline | Inspected 6 September 2026; BP-01 sections 3.3, 9 and sources SRC-04/SRC-17; source at main `85bd2fcc388495cc24dc2ee4f273accc49da2f24` | High confidence in what the maintained record says: earlier two pipeline IDs, ten stages and 60 recently updated open deals; varied service/upgrade/automation/facility pursuits | Original observation date and account identity not independently established here. No source-wide counts, lead/add-on/licence conclusions or newly read deal sample |
| E3 — Live stage metadata | 6 September 2026; authorised Pipedrive MCP BETA `getstages`, `limit=30`, no filter | Successful read; 10 returned rows, 2 distinct pipeline IDs (1, 6), `next_cursor=null`; all nondeleted, ageing enabled. High confidence in returned values | Only one endpoint and its visible scope. Account/current-user/tenant identity, pipeline names, licence, invisible/empty pipelines and actual usage unknown. Matching E2 is consistency evidence, not proof of account identity |
| E4 — Available connector surface | 6 September 2026 tool discovery | Read tools exist for stages, deals, leads/conversion status, organisations, people, activities and notes; bounded list/direct/search variants | Tool availability is not verified endpoint permission. Only stage read exercised. No exposed account/current-user, pipeline-definition, field-metadata, file, mail/calendar-settings, automation, report, licence or visibility/admin read. Mutating tools were not used |
| E5 — Current PPO contracts | 6 September 2026; physical P02–P08 sources listed in BP-03 section 4 | High confidence in inspected code/schema/design boundary; prior runtime evidence is linked in P08 handover | This discovery runs no new CRM runtime. Existing functions do not establish CRM targets/types or operational acceptance |
| E6 — Official product/API docs | Checked 6 September 2026; links in section 5 | High confidence in documented product semantics at inspection | Product documentation never proves entitlement, configuration, complete API visibility or account use |

No operational record content, customer communications, credentials, raw export or mailbox data was written to the repository or publication record. Configuration values below are non-personal metadata. Because E4 cannot establish account context, identifiable operational-record inspection is deferred. This is a targeted evidence gap, not a failed account login or proof of no data.

## 2. Observed stage configuration

E3 values match the maintained E2 table. Order is source `order_nr`, not row-return order. Source timestamps are configuration changes, not deal stage-entry history. All ten rows had `is_deal_rot_enabled=true`, `is_deleted=false`. Pipeline names are **unverified**, so only exact IDs are used.

| Pipeline | Stage ID | Label | Order | Probability (%) | Ageing days | Source update time (UTC) |
|---|---|---|---|---|---|---|
| 1 | 1 | Lead | 0 | 0 | 30 | 2026-09-02T19:39:44Z |
| 1 | 2 | Qualification | 1 | 10 | 30 | 2026-09-02T19:39:44Z |
| 1 | 5 | Estimating | 2 | 20 | 21 | 2026-09-02T19:39:44Z |
| 1 | 3 | Quote | 3 | 40 | 21 | 2026-09-02T19:39:44Z |
| 1 | 34 | Negotiation | 4 | 80 | 14 | 2026-09-02T19:39:44Z |
| 1 | 18 | Closing | 5 | 90 | 7 | 2026-09-02T19:39:44Z |
| 6 | 35 | Enquiry | 1 | 10 | 5 | 2026-09-02T19:41:46Z |
| 6 | 36 | Quoted | 2 | 40 | 7 | 2026-09-02T19:41:46Z |
| 6 | 37 | Order Confirmed | 3 | 90 | 7 | 2026-09-02T19:41:46Z |
| 6 | 38 | Awaiting Delivery | 4 | 95 | 14 | 2026-09-02T19:41:46Z |

Stage Lead does not prove separate Lead entity use; Order Confirmed does not prove Won or an ERP order. Probability/ageing settings are neither target policy approval nor revenue rules. `next_cursor=null` establishes no further page for this visible response, not that all account pipelines or historical stages were inspected. No mutation was performed.

## 3. PAR-01–PAR-18 assessment

Each item includes outcome, dated evidence/scope/confidence, usage/users/criticality, fields/history, proposed disposition, dependencies, acceptance and unresolved evidence. Named functional owners below are proposed reviewers, not assigned employees or invited repository users. Dean coordinates owner input. All acceptance cases are planned; CA cases are defined in the [CRM implementation plan](../delivery/crm-implementation-plan.md#acceptance-catalogue).

### PAR-01 — Organisations, people and relationships / CRM-01

- **Outcome:** reliable prospect/account/contact identity, ownership, affiliations and site roles without duplicate masters or access inheritance.
- **Evidence:** E1/E2/E5, inspected 6 September; high confidence in requested need/PPO structure, low confidence in account configuration. No organisation/person records or custom-field definitions read in this pass.
- **Use/users/criticality:** operational CRM use established generally; precise relationship/custom-field usage and users/volumes unknown. Proposed users Sales/Data; critical identity/history outcome.
- **Fields/history:** organisation/person IDs, owner/visibility, parent/affiliation, custom key/type/option, duplicate/merge/archived history, original author/time and source tenant.
- **Disposition:** Preserve; reuse shared identities. Dependencies D-011/D-013/D-020, P02 boundaries. **Acceptance:** CA-01/05/06/10/15, AT-01/02/25/30; same-name and multi-affiliation cases retain correct scope and provenance.
- **Open:** Q1/Q2/Q5/Q7; need field metadata and a redacted multi-affiliation/duplicate walkthrough before account mapping acceptance.

### PAR-02 — Separate lead qualification and conversion / CRM-02

- **Outcome:** capture unqualified need, qualify/disqualify with ownership and preserve any conversion lineage.
- **Evidence:** E3 stage label Lead and E6 Leads API, 6 September; high confidence in label/product distinction; actual separate-lead use unknown. No lead read/conversion executed.
- **Use/users/criticality:** unknown lead usage/volumes; Sales; high if used. Absence from deal sample is not non-use.
- **Fields/history:** lead UUID, linked person/organisation, source/channel, owner, archive/disqualification, conversion target/status/time; inherited deal custom-field keys where applicable.
- **Disposition:** Preserve qualification; defer separate LeadCandidate implementation pending evidence, retain Pipedrive. Dependencies D-013, shared identity, accepted conversion rules. **Acceptance:** CA-03/15/16, AT-25; one lead conversion, preserved original ID and retry result, failed/unknown conversion owned.
- **Open:** Q1/Q3; owner walkthrough showing whether Leads inbox is used and one redacted converted/disqualified example. No need for all leads to design first slice.

### PAR-03 — Deals, pipelines, stages and close outcomes / CRM-02

- **Outcome:** distinct workflows with controlled progression and preserved won/lost/reopen history.
- **Evidence:** E2/E3, 6 September; high confidence in ten returned stage settings, pipeline display names/use and full stage history unverified. E2's 60 open deals excludes closed outcomes.
- **Use/users/criticality:** pipeline configuration observed, actual volumes/stage usage unknown; Sales/managers; high.
- **Fields/history:** source pipeline/stage IDs/order, deal ID/status, stage-entry/change times, close/won/lost/reopened times/reasons, owner and definition version.
- **Disposition:** Preserve. First synthetic pipeline is explicitly fictional; no operational remapping accepted. Dependencies D-013 and versioned lifecycle. **Acceptance:** CA-02/03/07/11/15, AT-24/25; stage Lead ≠ lead object and Order Confirmed ≠ ERP order.
- **Open:** Q3; redacted pipeline settings plus one open/won/lost progression walkthrough, including backward move and reopen policy.

### PAR-04 — Ageing, probabilities and next-action risk / CRM-02

- **Outcome:** find stalled pursuits without confusing stage age, task due dates or revenue.
- **Evidence:** E3, 6 September; all ten probability/rotting values known within response. Actual probability overrides, threshold use and report definitions unknown.
- **Use/users/criticality:** settings observed, active decision use unverified; Sales/Finance; high for forecast interpretation.
- **Fields/history:** stage-entry and update dates separately, per-deal probability/override source, ageing setting/version, close-date/basis, next Activity due/unknown/completed state.
- **Disposition:** Improve, retaining source settings/history; target probabilities require approval. Dependencies D-013/D-017, REP-01/02 and alternative selection. **Acceptance:** CA-07/09/16, AT-25/31; missing dates/basis never yield verified zero; stage edits do not fabricate historical entry dates.
- **Open:** Q3/Q6; one ageing/forecast report definition and override example; no assumed target thresholds.

### PAR-05 — Activities, next actions and completion / CRM-03

- **Outcome:** owned calls, meetings/tasks/visits and follow-up with due and completion evidence.
- **Evidence:** E1/E5/E6, 6 September; P03 typed Activity exists; account activity types/recurrence/usage unknown. E4 activities read is exposed but not exercised before Q1.
- **Use/users/criticality:** required outcome; precise sales types/users/volume unknown; Sales/coordinators; high.
- **Fields/history:** subject/type, owner, linked entity IDs, due date/time/timezone, duration, done and marked-done time, outcome, participants and recurrence source/exception if used.
- **Disposition:** Preserve; add Opportunity link, reuse current lifecycle; typed sales channel/recurrence later. Dependencies D-013/D-025, all-target access. **Acceptance:** CA-04/08/10/14/15, AT-25; owner change/concurrent completion/retry and unknown due tested.
- **Open:** Q4; small redacted planned/completed/missed/recurring example set, completion expectations and next-action policy.

### PAR-06 — Email/calendar and communication references / CRM-03

- **Outcome:** find relevant communications and planned events without duplicate effects or disclosure.
- **Evidence:** E4/E6, 6 September; official sync semantics researched, account mailbox/calendar/permissions uninspected. No message bodies, attachments or settings retrieved.
- **Use/users/criticality:** actual users/mailboxes/direction/history unknown; Sales/Systems; critical privacy/history if used.
- **Fields/history:** provider/mailbox/thread/message/event/instance IDs, original authors/recipients/time, visibility, filing links, recurrence, edits/deletion, attachment identity and supported delivery evidence.
- **Disposition:** Integrate; first slice manual activity only. Dependencies D-025/D-020/D-012, explicit provider authority. **Acceptance:** CA-10/14/15, AT-20/25/34; duplicate event, private record, changed owner and unknown send outcomes.
- **Open:** Q4/Q5; redacted settings plus one communication/event linking walkthrough. No mailbox connection or sending authorised.

### PAR-07 — Account plans, segmentation, territories and visits / CRM-04

- **Outcome:** plan relationship development using customer/site/horticultural context and accountable follow-up.
- **Evidence:** E1/E2/E5, 6 September; outcome specified; actual account-plan, sector/crop/territory fields and visit practice unknown.
- **Use/users/criticality:** required planning outcome, account adoption unverified; Sales/account owners; medium pending owner prioritisation.
- **Fields/history:** organisation/site roles, sector/crop/territory field keys/options, objectives, review owner/date, stakeholder influence/evidence and visit actions. Territory does not define access.
- **Disposition:** Improve via shared organisation children, not separate master. Dependencies D-011/D-013/D-028. **Acceptance:** CA-05/13, AT-25; historic affiliation retained, account plan becomes an owned action and site visit does not create technician reservation.
- **Open:** Q2/Q4; one redacted account-plan or salesperson visit-preparation walkthrough; identify mandatory versus useful data.

### PAR-08 — Pursuits, alternatives and estimating links / CRM-05

- **Outcome:** retain one commercial pursuit across options/revisions and avoid double-counting alternatives.
- **Evidence:** E2 maintained CREMS alternatives/source design and E1, inspected 6 September; actual CRM linkage or quote integration unknown.
- **Use/users/criticality:** alternative business need documented, linked Pipedrive usage unverified; Sales/Estimating; critical commercial interpretation.
- **Fields/history:** pursuit/deal ID, estimate/quote IDs, exact revision, exclusive-group/additive scope, selected forecast basis, approved option/customer response and ERP reference separately.
- **Disposition:** Integrate with BP-04/ERP. Dependencies D-009/D-010/D-013/D-017 and document contract. **Acceptance:** CA-09/11, AT-03/26; alternatives not summed, accepted revision unchanged, unavailable link clearly labelled.
- **Open:** Q6; one redacted pursuit with alternative estimates and source ownership map. No formulas, price master or live quote generation inferred.

### PAR-09 — Customer/project/service/Finance context / CRM-06

- **Outcome:** relevant downstream history with appropriate audience, source date and completeness.
- **Evidence:** E1/E5, 6 September; P02/P03 shared context implemented; P09 active separately; P10 remains later. Live ERP/project integrations unverified.
- **Use/users/criticality:** required integrated view; current CRM displays unknown; Sales/Service/Projects/Finance; critical permission boundary.
- **Fields/history:** shared UUIDs, source connection/company/entity, project/work/report/version references, restricted-class flags, as-at/completeness, approved account measures only.
- **Disposition:** Improve through independently authorised projections. Dependencies D-011/D-017/D-020, accepted P09/P10 contracts. **Acceptance:** CA-06/10/12, AT-01/18/31; no restricted notes or hidden counts, no implied Finance processing.
- **Open:** Q5/Q6; minimum safe sales audience and desired downstream fields; no CRM acceptance of service reports.

### PAR-10 — Aftercare, renewals and reviewed growth / CRM-07

- **Outcome:** owned post-delivery/training/renewal reviews and qualified growth opportunities.
- **Evidence:** E1/E2/E5, 6 September; requested outcome and shared Activity pattern known; operational renewal practices/automation unknown.
- **Use/users/criticality:** intended need established, usage/cadence/volumes unknown; Sales/Service; high continuity impact.
- **Fields/history:** source service/project/agreement event and revision, observation, review owner/next action, decision/reason, renewal dates/basis and successor opportunity lineage.
- **Disposition:** Improve. Dependencies D-018/D-028, P09 permitted source outcomes, future agreement contract. **Acceptance:** CA-12/13, AT-25/33; one review per source event, technical work stays open, no automatic offer/value/renewal.
- **Open:** Q4/Q6; who reviews service observations, what evidence may be shared and how unavailable respondents are followed up.

### PAR-11 — Automations and notifications / CRM-08

- **Outcome:** preserve used triggers/actions with ownership, permission and repeat-safe execution.
- **Evidence:** E4/E6, 6 September; no automation/settings/run endpoint exposed; actual usage unknown, not zero.
- **Use/users/criticality:** users/rule counts/volume/add-on entitlement unknown; Sales/Systems; high if business-critical rules exist.
- **Fields/history:** definition/version, trigger/conditions/delay, acting identity, recipients, target field/effect, source event, run/attempt/error/result, pause/replay behaviour.
- **Disposition:** Preserve required outcomes after inventory; defer activation while retaining source. Dependencies D-013/D-025/D-020. **Acceptance:** CA-14/16, AT-25; duplicate trigger, revoked actor, paused rule and timeout produce controlled results.
- **Open:** Q8; redacted rule list and one important rule with success/failure history. Do not build guessed automation from stage names.

### PAR-12 — Filters, dashboards and reports / CRM-08

- **Outcome:** reproducible pipeline, conversion, forecast, activity and account-planning views.
- **Evidence:** E2/E3/E6, 6 September; only stage settings and prior sample known. Saved filters/Insights dashboards/forecast definitions uninspected.
- **Use/users/criticality:** report names/readers/schedules/usage unknown; Sales/management/Finance; high for decisions.
- **Fields/history:** filter expressions/owner/sharing, columns, date grain/cohort, stage/probability/value basis, currency, alternative treatment and source cutoff.
- **Disposition:** Preserve approved outcomes with improved explicit definitions. Dependencies REP-01–REP-03, D-013/D-017. **Acceptance:** CA-07/09/10/16, AT-25/31; same permitted population reconciles list/board/export, mixed currencies/incomplete scope not verified totals.
- **Open:** Q6; screenshots of two relied-on reports with filters/definitions and a small redacted expected comparison.

### PAR-13 — Products, quotation and document features / CRM-08

- **Outcome:** maintain catalogue/quote/reference continuity without competing price or document authority.
- **Evidence:** E4/E6, 6 September; product, document, e-signature and pricing usage/entitlement unknown; no connector read for them exposed.
- **Use/users/criticality:** Sales/Estimating/Commercial, actual adoption/volume unknown; high where issued offers depend on it.
- **Fields/history:** item/provider/company key, unit/currency/price-source date, product-deal links, exact quote/template/issue revisions, customer response and attachment IDs.
- **Disposition:** Integrate with MYOB/Estimating/SharePoint; retain used source feature until accepted. Dependencies D-009/D-010/D-012/D-013/D-024. **Acceptance:** CA-09/11/15, AT-20/26/36; exact issued bytes and separate response survive.
- **Open:** Q6/Q8; used product/document feature list and one redacted source-to-quote walkthrough, including external e-signature if used.

### PAR-14 — Mobile sales and poor connection / CRM-08

- **Outcome:** prepare visits, find contacts, capture notes/photos and own follow-up on actual sales devices.
- **Evidence:** E1/E4/E5, 6 September; mobile parity required but device/connectivity/current mobile use unknown. P08 is technician-specific and cannot prove sales offline behaviour.
- **Use/users/criticality:** sales traveller roles/devices/volumes unknown; Sales; high if field use depends on it.
- **Fields/history:** minimal permitted customer/action context, capture actor/time/source, photo/file provenance, explicit local/queued/server states only when implemented.
- **Disposition:** Preserve outcome; first slice responsive online, defer cache/queue pending scoped design. Dependencies D-016/D-020/D-021/D-025. **Acceptance:** CA-13/14, AT-23/25/34; actual device, disconnect/restart/quota/identity-revocation tests before offline claim.
- **Open:** Q9; one representative handset/browser and a real visit workflow described without customer content. No implicit CRM caching authority.

### PAR-15 — Visibility, owner transfer, export/delete/admin / CRM-08

- **Outcome:** preserve approved access/actions and prevent disclosure through related records, counts or exports.
- **Evidence:** E4/E5/E6, 6 September; PPO boundary inspected; Pipedrive permission sets/visibility groups/admin scope unavailable.
- **Use/users/criticality:** exact roles/grants/delegations unknown; all CRM users/Systems; critical.
- **Fields/history:** owner/followers/visibility, group and permission definitions, transfer/history, archived/deleted state, export rights and source keys. Ownership does not itself grant PPO access.
- **Disposition:** Preserve approved outcomes via explicit capabilities/scopes. Dependencies D-020/D-011/D-013; no hierarchy-derived access. **Acceptance:** CA-06/10/15, AT-01/25/34; former-owner behaviour follows actual grants; denied target/receipt/file/count remains hidden.
- **Open:** Q5; redacted role/group matrix and one owner-transfer/revocation walkthrough. Successful endpoint access is not an admin/complete-visibility conclusion.

### PAR-16 — Import/export, integrations and history preservation / CRM-08

- **Outcome:** usable retained history, reviewed mappings and reconciled initial/delta transition.
- **Evidence:** E2/E4/E6, 6 September; no operational export/import or integration inventory inspected. Ordinary export is not proof of all notes/files/event history coverage.
- **Use/users/criticality:** Data/Systems/Sales; actual source volumes/interfaces/history needs unknown; critical before transition.
- **Fields/history:** tenant/company/entity IDs, relationships, custom fields, original author/time versus import actor/time, deletion/archive, change cursor/version/hash, file bytes/version and unsupported-source exceptions.
- **Disposition:** Preserve with BP-03 coexistence design. Dependencies D-011/D-012/D-013/D-020/D-026. **Acceptance:** CA-15/16, AT-20/21/24/25/35; baseline/delta/retry/restart plus missing-history exceptions and rollback evidence.
- **Open:** Q7/Q8; export field headers and a tiny approved redacted history/relationship sample, plus retained-history requirement; no exhaustive export prerequisite for design.

### PAR-17 — Campaigns, forms, chat, enrichment and add-ons / CRM-08

- **Outcome:** every used add-on has a deliberate replacement, integration or retained-tool outcome.
- **Evidence:** E4/E6, 6 September; licence/add-on/configuration reads unavailable. Product catalogue does not establish purchase or use.
- **Use/users/criticality:** unknown; Sales/Systems/Commercial; criticality unassessed until owner identifies business dependence.
- **Fields/history:** add-on identity/vendor/plan, accountable owner, inbound source/consent, records/files/communication links, export and workflow dependencies.
- **Disposition:** Defer target build pending inventory; preserve current operational tool. Split any identified used add-on into a named child entry under PAR-17, without new parent requirements. Dependencies D-013/D-025/D-020.
- **Acceptance:** CA-14/15/16, AT-25; evidence for each used campaign/form/chat/prospecting/enrichment/document/e-signature capability and approved consent/retention handling.
- **Open:** Q8; redacted billing/features and installed-app/settings list, with owner-marked used/unused/unknown. No purchase or activation.

### PAR-18 — Residual features and connected applications / CRM-08

- **Outcome:** detect omitted workflows/integrations before replacing a source capability.
- **Evidence:** E1/E2/E4, 6 September; residual inventory incomplete. No exhaustive parity assertion is defensible.
- **Use/users/criticality:** owners/users/volume unknown; product owner with Sales/Systems; high cutover completeness risk.
- **Fields/history:** feature/app name, business outcome, input/output fields, owner, cadence, permissions, history/export, incidents and accepted disposition.
- **Disposition:** Preserve required outcomes; defer unidentified scope while Pipedrive remains. Dependencies all PAR entries and D-013/D-025/D-026. **Acceptance:** CA-16 and complete AT-25; every used capability linked to accepted target/manual process/retained tool, with explicit retirement only if approved.
- **Open:** Q8/Q10; walkthrough of a normal sales week plus exceptional won/lost/aftercare cases and a residual inventory sign-off. Empty endpoint/sample never closes this item.

## 4. Smallest useful evidence requests

Provide only approved redacted evidence in the conversation or another authorised private source. Do not upload credentials, full mailboxes, raw operational exports or identifiable customer content to GitHub. Names in role columns are functional ownership proposals. None of Q2–Q10 blocks the explicitly synthetic I1 vertical slice; Q1 blocks new identifiable source-record discovery.

| ID | Proposed evidence owner | Minimum useful evidence | Practical effect while open |
|---|---|---|---|
| Q1 | Dean / Pipedrive account administrator | Confirm the connected Pipedrive account/company and user's intended account; redacted account identifier/settings showing account context and role/visibility limits; no secret/token | Stage match remains conditional account evidence; no identifiable-record discovery or operational mappings |
| Q2 | Sales / Data steward | Redacted field-definition list for organisation/person/deal: exact key/type/options/required flags; one multi-affiliation/site/group walkthrough | Full field/relationship parity unaccepted; shared synthetic selection still implementable |
| Q3 | Sales owner | Pipeline names/settings and entry/exit rules; say whether separate Leads inbox is used; one redacted open/won/lost/conversion example | Only fictional pipeline in I1; no operational lead/stage/close mapping |
| Q4 | Sales / Service relationship owner | One ordinary activity/visit/aftercare walkthrough, redacted planned/completed/unavailable/recurring examples and mail/calendar privacy/direction settings | Recurrence/channel and aftercare policy remain provisional; manual actions only |
| Q5 | Systems / data owners | Redacted visibility/permission matrix, export/delete rights and owner-transfer/revocation example | No operational access/transfer/export design acceptance |
| Q6 | Sales / Estimating / Finance | Two important reports with filters/definitions; one pursuit with exclusive options and exact quotation/order references redacted | Forecast, money, quote/order integration and commercial handover remain later |
| Q7 | Data / document owner | Export headers and a few redacted related records demonstrating author/time, history, files and archive/deletion; required history access/retention | No migration completeness, history retention or cutover claim |
| Q8 | Account administrator / integration owners | Redacted installed apps/add-ons/licence screen and automation list; one critical rule with result/retry history | Add-on/automation/residual inventory unknown; source functions retained |
| Q9 | Sales / Systems | Representative handset/browser, usual poor-connectivity situation and visit capture requirements | Responsive online only; no CRM cache/queue/device-durability claim |
| Q10 | Dean with functional owners | Review each proposed disposition and residual sales-week walkthrough; explicitly accept/defer with reason | D-013 and issue #9 remain open; full AT-25 cannot run against an unapproved inventory |

After Q1, a proportionate next discovery pass is metadata first, then a bounded sample of one organisation/person relationship, up to three contrasting deals (open/won/lost), a lead only if use is confirmed, and up to four activities spanning known/unknown due and completion. Notes only when a specific unanswered behaviour requires them; avoid communication bodies. Summarise structure and aggregate observations, not identifying content. Stop when the design question is answered, or document visibility/pagination limits. No request to change access or broaden privileges is implied.

## 5. Current primary technical sources

All checked 6 September 2026. The statements below are product documentation, not account observations. Source limits are intentional; do not expand them into usage conclusions.

| Source | Supported design point |
|---|---|
| [Pipedrive Stages API](https://developers.pipedrive.com/docs/api/v1/Stages) | Stage metadata, pipeline association and bounded retrieval are distinct from account identity or complete usage |
| [Pipedrive Deals API](https://developers.pipedrive.com/docs/api/v1/Deals) | Deal stage, status, owner and custom-field structure must be mapped explicitly |
| [Pipedrive Leads API](https://developers.pipedrive.com/docs/api/v1/Leads) | Leads are distinct resources; lead custom-field structure follows deal fields; absence of unset values is not absent schema |
| [Fields API v2 announcement](https://developers.pipedrive.com/changelog/post/introducing-new-fields-api-v2) | Official field-definition APIs exist for deal/person/organisation/product; this exposed connector does not provide them |
| [Visibility and permissions](https://support.pipedrive.com/en/article/visibility-and-permissions-overview) | Seeing records and performing actions are distinct concerns; settings require actual account evidence |
| [Calendar sync](https://support.pipedrive.com/en/article/calendar-sync) | Creation direction differs from linked-event edit behaviour; owner and linked-record visibility matter. Detailed interpretation is in BP-03 section 9 |
| [Email sync](https://support.pipedrive.com/en/article/email-sync) | Configurable sync/visibility requires mailbox-specific evidence before target integration |
| [Exporting data](https://support.pipedrive.com/en/article/exporting-data-from-pipedrive) | Exports depend on permission and visible scope; list/type/detail exports differ. An export cannot establish data the extracting user cannot see |

## 6. Coverage conclusion

18/18 parity items now have outcome, evidence/limits, proposed disposition, dependency, acceptance and evidence-owner treatment. This is **register completeness**, not account parity completeness. Only PAR-03/04 have refreshed live configuration evidence; all account-use conclusions remain bounded or unknown. No item is retired, no operational decision is closed, no CRM runtime case or AT-25 is passed. Issue #9 remains open for account-context/evidence completion and owner acceptance.

## I1 implementation distinction

The separately authorised [I1 implementation](../delivery/crm-i1-handover.md) exercises only CRM-01/02/03 and partial CRM-08, with PAR-01/03/05/15 foundations, in a fictional owned-opportunity journey. Actual checks/publication are recorded there; this assessment does not promote an unmerged branch or a component test to parity acceptance. All PAR-01–PAR-18 dispositions and account evidence requests remain proposed/open. No new Pipedrive/account read, import, retirement or cutover follows from I1. The original E1–E5 discovery observations retain their dates and limits.

## I1 synthetic implementation evidence

The separately invoked [I1 implementation](../delivery/crm-i1-handover.md) exercises bounded Opportunity/Activity ownership, progression, persistence and permission components associated with PAR-01/03/05/15. Its successful component tests and actual publication have their own source/head/run provenance. This does not establish account configuration, change any PAR disposition to accepted, close D-013/D-025, prove migration parity or pass full AT-25. The remaining parity assessment above is proposed. The Board/Grid starter was subsequently invoked; its bounded implementation and publication are distinguished below.


## I2 implementation distinction

The invoked [scoped Board/Grid slice](../delivery/crm-i2-handover.md) adds a bounded presentation and query contract under CRM-01/02/03/04/08 and PAR-03/04/05/15 foundations. Actual runtime checks/publication are separate from this assessment. No PAR disposition, operational pipeline mapping, Pipedrive access or full AT-25 status changes. Remaining relationship/close/commercial capabilities retain their separately bounded dependencies.
