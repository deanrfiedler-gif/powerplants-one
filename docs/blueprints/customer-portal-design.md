---
title: Powerplants One - Customer portal design
revision: r01
date: 2026-09-06
owner: Dean Fiedler - personal private prototype
status: Authorised design and staged direction; runtime not implemented
source_commit: 94289a20fc609e47af647b29ca8170557da312bb
---

# Customer portal

## 1. Outcome and authority

Give a named customer access to permitted support, equipment, project and published knowledge information, with clear actions and accountable staff follow-up. Reuse the seven PPO domains and shared records; the portal is a customer channel, not an eighth domain or another customer/ERP master.

Dean instructed: “design it now and implement it in bounded stages as the supporting workflows become ready.” This authorises this design, synthetic walkthrough and normal checked repository handover, and establishes continuing authority for the bounded synthetic stages in the [delivery plan](../delivery/customer-portal-implementation-plan.md). It does not authorise live customer accounts, invitations, hosting, paid services, production migration, operational communications or financial transactions. Do not add a repeated approval gate for already authorised synthetic work. Check current readiness when resuming; no automatic implementation or future execution is implied merely by storing a starter.

The master already identifies portals in Wave D and D-027. Preserve P01–P12 ordering, the seven domains and all 78 original parent requirements. This design elaborates existing requirements without marking their acceptance complete. [Decision](../decisions/customer-portal-direction.md), [acceptance](../testing/customer-portal-acceptance.md), [walkthrough](customer-portal-mockup.html), [handover](../delivery/customer-portal-handover.md).

## 2. Evidence and current boundary

Inspected main: `94289a20fc609e47af647b29ca8170557da312bb`, including AGENTS, README, STATUS, BP-01/BP-02/BP-07, ADR-0003, Ticket/identity/permission source, service API, document contract, parent register and shared UI specification r03. P09 issues exact customer-safe reports, but its staff-mediated response capture is not authenticated customer access. P03 supports internal Ticket New/NeedsInformation/Triaged, not a full portal conversation or resolved/closed lifecycle. Existing company permission means PPO's operating company, not a customer organisation. A Company grant must never be reused as customer-wide permission.

At inspection P10 #48, CRM I2 #47 and estimating E1 #49 were open. P11/P12 were not delivered on main. Their designs or component tests do not establish portal readiness. Use actual merged-main publication evidence on resumption, not this dated observation or an open branch. BP-06 project controls, published knowledge governance, external identity and live integration remain unimplemented/unverified here.

Brand evidence: supplied PDF pages 17/18 visually inspected; Roboto/Verdana and navy `#242a37`, green `#62bb46`, white `#ffffff` match shared guidance. The supplied complete PNG SHA-256 `8d12f0ecc394950cd9eb66964c588efb71c8e6f445390336c245c3f6712b9694` matches the existing shared logo exactly. PDF SHA-256 `335d3049bc72783799315d4790bd56b04e928acd0e1c2c81d8099cec2f2b8fd3`. Reuse the existing logo unchanged; source files are not reissued by this package.

## 3. Customer roles and explicit grants

These are proposed capability bundles, not assigned employees or an accepted corporate authority matrix. Every grant has issuer, recipient, customer organisation, operating company, permitted sites/records, effective period, issuer authority, reason and audit history. Default is no access. A verified email or matching domain never grants account membership.

| Actor | Permitted actions within explicit scope | Exclusions |
|---|---|---|
| Customer requester | View their shared requests; create support intake and reply on permitted threads; read published guides and explicitly shared equipment context | Other contacts' requests unless explicitly shared; internal notes; staff ownership or state changes |
| Customer site coordinator | Requester actions plus explicitly shared site requests, visits, equipment and project publications | Other sites, financial data or organisation-wide access by default |
| Customer commercial representative | Separately granted issued quote/variation response and account reads in CP5 | No authority inferred from requester/coordinator membership; no margin or cost access |
| Customer viewer | Read-only selected publications and records | Ticket submission, replies, commercial acceptance and access administration |
| Service coordinator | Own and triage incoming requests; author explicit customer replies; publish allowed service updates | Cannot grant wider customer access without the separate access capability |
| Project publisher / knowledge publisher | Review and publish content within the relevant domain, audience and current authority | No automatic publication of drafts, internal RAID, technical working files or unreviewed articles |
| PPO access administrator | Provision/revoke explicit synthetic membership and grants; later verified external invitation process | No automatic financial/technical approval or blanket business-data access |

CP1 uses two fictional customer organisations within one PPO company, a second company, multiple sites, own-request and shared-site examples, an expired/revoked grant and a user with no membership. Customer-managed invitations, delegation and partner/group-company access are later options requiring their own rules. A consultant serving several customers receives independent grants; switching context clears previous queries and content.

## 4. Proposed journeys

| Journey | Customer action | Internal responsibility and completion |
|---|---|---|
| Defined product or spare part | Request help against a permitted supplied asset/order, or explicitly unknown equipment; give symptoms and desired outcome | Service owns triage. Sales/estimating receives a separate accepted handover if a quotation is required. No stock reservation or price promise. |
| Planned/reactive service | Create a request, answer a question, view a published update and later a confirmed visit/report | Service owns next action, work authority and scheduling. Submission is not work authorisation; triage is not booking. |
| Equipment upgrade | Share an issue or requirement against existing equipment; review approved project information and later exact offer | Engineering/estimating resolves compatibility and shutdown assumptions. A portal description never changes approved scope. |
| Major greenhouse project | View approved milestones, next work, customer actions and exact released documents | Project owner publishes dated updates and owns stale/incomplete information; internal forecasts and commitments remain separate. |
| Warranty or return | Raise a request linked to known supply/equipment, or explain unknown identity | Service/Finance assesses entitlement and remedy. No auto-credit, accepted warranty or resolved dispute is implied. |

The first complete CP1 journey is named synthetic customer → permitted site/equipment or explicit unknown → support request → durable receipt and one owned internal Ticket → staff public question → customer reply → owned staff follow-up. CP1 does not claim resolution/closure, report distribution or appointments unless the owning domain has delivered those exact transitions.

## 5. Information architecture and screens

| Screen | Content and primary action | Required states |
|---|---|---|
| Home | Current organisation/site context; own action-needed requests; upcoming confirmed visit when enabled; latest permitted publications. Primary: Request support. | Loading versus zero; partial source failure per card; last refreshed; access changed |
| Support | Search/filter permitted requests; reference, title, customer-visible status, last update, next action. Open one conversation. | No requests / no matches; cursor paging and completeness; inaccessible deep link |
| New request | Site required or explicit unknown; equipment optional/unknown; summary; problem/context; customer impact; contact route; later safe attachments. Review before submit. | Field validation; retained input; submitting; received; uncertain receipt lookup; unavailable |
| Request detail | Customer-safe intake, public timeline, messages and relevant attachments; who needs to act; Reply. Internal staff use a distinct private view. | Concurrent question/reply; access loss; original operation recovery; withheld attachment |
| Equipment and reports | Permitted identity/configuration summary, location as-at, published service history and exact report revisions. | Unknown identification; unpublished/withdrawn report; superseded issue; restricted history |
| Projects | Published stage, confirmed/forecast date labels, discrete milestones, delivery updates, customer actions, exact release history. | Update as-at; unknown date; overdue review; withheld release; changed access |
| Knowledge | Search by product family/topic; applicable equipment/model/version; reviewed article, sources, owner and review date; Request support with article context. | No results; withdrawn/superseded article; source unavailable; applicability unknown |
| Documents | Explicitly released report/manual/drawing/quote revisions within the current audience. | Exact revision, hash and release state; missing bytes; replaced version clearly linked |

Future commercial navigation appears only when its capability and source are available. CP1 navigation contains Home and Support, plus any separately delivered read scope. The design walkthrough shows later views for review and labels its entire surface as a synthetic design. It does not infer these views are runtime-ready.

## 6. Shared data and proposed extensions

These are logical candidates, not allocated SQL migrations or approved new API catalogue numbers. Follow PPO UUID/reference/version separation and snake_case fields. Allocate physical changes only when the stage starts against current main.

| Record | Minimum relationship/fields | Invariant |
|---|---|---|
| PortalMembership / PortalGrant | `principal_id`, `workspace_id`, `company_id`, `customer_organisation_id`, explicit scope references, capability, valid dates, revoked fact, issuer/reason | Membership alone grants nothing; every referenced record must match the current customer relationship and explicit scope |
| PortalRequestLink | canonical `ticket_id`, customer organisation, site/asset or unknown reasons, submitting principal, request-sharing policy, original operation | Exactly one canonical internal Ticket per accepted request operation; no duplicate support master |
| CustomerMessage | request/thread UUID, author principal/type, direction, immutable body, posted time, predecessor/correction, operation and attachment IDs | Explicit customer audience on creation; internal notes cannot be converted by toggling a visibility flag |
| PortalPublication | domain/source UUID and exact revision/hash, approved customer projection, intended audience, publisher, released time, predecessor, withdrawal fact/reason | Release is separate from internal save/review; original content/audience evidence is immutable |
| PublicationAccessEvent / CustomerResponse | publication/issue UUID and exact presented hash, authenticated actor when implemented, observed time, event kind, explicit response/remarks | Open/download is not acknowledgement; a new revision receives no inherited response |
| KnowledgeArticleRevision | stable article ID, content revision, applicable product/model/software, source/version, author/reviewer, review due, audience, release/withdrawal | No unreviewed generated technical advice; applicability and version are explicit |
| CustomerAction | source publication/message, requested action, responsible customer contact/scope, due date or unknown, fulfilment evidence, internal follow-up Activity | Completing a customer task changes no commercial/work authority implicitly |

Reuse existing durable operation receipts, audit, outbox, Activity and replaceable document adapters. Portal-facing responses use allowlisted projections from the owning domain; they cannot expose raw internal Ticket, report review, account, Activity or document objects. Staff owners are selected by verified routing/policy, not customer-supplied IDs. No queue ownership may be claimed unless a durable queue and accountable role actually exist; otherwise reject submission safely as unavailable before creating an orphan.

## 7. CP1 request and conversation contract

Proposed routes under `/api/v1/portal`: context, permitted site/equipment selectors, requests list/detail, request creation, request messages and operation receipts. They use the existing schema-version/operation envelope, with expected versions on mutable workflow actions. Routes are proposals until physical allocation. Staff public reply is a separate explicit command in the internal service view with customer audience and preview. Internal APIs continue to reject external principals.

1. Resolve current server identity, membership, requested customer context, action and all target scopes. Never accept a posted actor, customer membership or owner as authority.
2. Validate trimmed summary (1–200 characters), description (1–4000), site choice or meaningful unknown reason, equipment belonging to the permitted site or unknown reason, declared impact and safe contact selection. Bounds are conservative synthetic defaults, not an operational SLA. Reuse stricter current domain bounds if they change.
3. Resolve an eligible scoped service owner. Atomically create canonical Ticket in New, portal link, first immutable public message, owned Activity, original receipt, audit and internal outbox event. Reuse canonical reference allocation. No work order, appointment, invoice or outbound delivery is created.
4. Show Received only after durable commit. Identical retries return the original receipt after current permission checks; changed payload with the same operation is rejected. After an uncertain send, query the original receipt before retrying the same operation. Never create a replacement operation automatically.
5. Staff request-for-information creates/updates the domain's owned clarification Activity and an explicitly public question. Customer reply appends an immutable message and makes the existing internal follow-up actionable; it does not triage or close the Ticket. Concurrent replies have distinct operations; retrying one cannot duplicate it. Staff can correct a public message through a visible successor, preserving original history for audit.

Customer status mapping for CP1 is limited to actual facts: New → Received; NeedsInformation with unanswered explicit public question → Your reply needed; Triaged → Reviewed by service team. A private clarification alone never exposes “Your reply needed”. No SLA countdown, technician assignment, In progress or Resolved label is derived merely from Ticket state. Later status projections require owning-domain transitions and published event mappings.

CP1 is online only and text first. The first stage omits uploads unless CP1's safe quarantine/storage/finalisation path is fully implemented and verified. CP2 adds bounded image uploads with type/signature/size verification, private storage, quarantine and inspection, non-executable serving, recipient checks, original-byte recovery and separate Pending/Available/Rejected status. Do not reuse a technician-assignment capability for customers. Uninspected files cannot be previewed, indexed or forwarded; scanning outage means withheld availability. Photo metadata/contact details are filtered from customer publication.

## 8. Publication and customer responses

Draft → Reviewed → Published is a separate publication lifecycle, not an automatic mirror of internal state. Publication atomically freezes an allowlisted snapshot, exact source revisions, audience and publisher authority. Material source or audience change needs review and a successor; current permission is rechecked at release and every read. Withdrawing access never erases the historical issue or claims downloaded copies were recalled. Superseded content remains accessible only where explicitly allowed and clearly marked; withdrawal removes access/search/notification payloads while keeping staff audit.

P09 OUT-10 already freezes exact reviewed HTML/PDF. A portal release references those original issue IDs and hashes and the intended customer audience; it must not regenerate them from latest evidence. Customer report acknowledgement is CP2b, a later bounded part of CP2: authenticated identity, exact HTML presented hash, explicit choice/remarks, original operation and owned exceptions. Preserve P09 Accepted/AcceptedWithReservations/Declined/Unavailable/Disputed semantics. Unavailable remains a staff-recorded unsuccessful contact outcome, not a choice for a signed-in responding customer. Report response is not extra-charge approval, project acceptance, invoice acceptance or whole-order completion.

Projects publish approved summaries: stage, discrete milestone statuses, confirmed versus forecast dates, as-at, next update date/unknown, customer actions, released attachments and owner. Do not show a fabricated percent complete or automatically publish internal RAID, commercial margins, staff-only comments or raw schedule. A customer action reply records evidence and staff review; it does not approve a variation unless CP5's commercial authority and exact-revision response exist.

Knowledge articles require source rights, applicability, review ownership, review due and withdrawal/successor handling. CP3 starts with a small manually reviewed synthetic collection, including “Information to include in a support request”. Relevant article links may accompany a ticket, but search never blocks request submission. Supplier manuals retain publisher/version and verified distribution permission. AI answers, equipment control, diagnostics and telemetry remain separate optional work.

## 9. Identity, access and recovery design

Extend ADR-0003's domain/service architecture. CP1 uses a separate local-only synthetic external-principal model; it must prove customer isolation before any real identity integration. Remote login later uses a verified supported OIDC identity provider and explicitly administered customer membership. Decide account verification, MFA/recovery, invitation expiry, offboarding and support ownership before real onboarding. Existing local profile selection is prohibited remotely. No new identity vendor or paid infrastructure is selected by this design.

Enforce current grants on lists, counts, selectors, deep links, message threads, attachments, HTML/PDF, search snippets, exports, receipts and notification content. Verify both operating-company and customer-organisation/site/record relationships. Deny direct staff API access. Use non-enumerating failures for inaccessible IDs; protect sessions and state-changing requests against CSRF and validate redirect/origin handling. Restricted responses use `Cache-Control: no-store`; exclude them from service-worker/browser persistence. No customer offline mode in CP1.

On logout, membership loss or context switch, abort old reads and clear visible details and old query caches; responses from old requests cannot repaint another context. During connection loss with a still-valid session, retain unsent form text in memory and state clearly that it is not saved; do not persist it to local storage. On access loss, lock/remove sensitive values from display and do not provide an export bypass. A current authorised recovery process may reconcile the original operation without exposing the former record. Browser refresh can lose an unsent draft; the UI warns before deliberate navigation. Operational retention/deletion and already-downloaded-file handling remain D-012 decisions.

## 10. UX specification

Use the shared navy/green/white tokens, Roboto where available and Verdana fallback. Navy text on green; complete shared logo unchanged at 88×88 CSS pixels on navy with its transparent padding and clear space. No customer/company logo or contact details are invented. Use neutral text navigation and semantic controls; no decorative imagery behind operational information.

Desktop: 216px navy navigation, generous white content surface, 24–32px main gutter, restrained 16px body text and 28px page title. Phone: compact identity header with the same full logo size, labelled navigation selector and one-column cards; keep Request support prominent. Reflow at 320px, readable long values, 44px primary targets, visible keyboard focus, linked field errors, Escape/return focus for dialogs, and live announcements for results. Content determines card height. Dates show site timezone; unknown due dates and source failures are explicit.

The [standalone walkthrough](customer-portal-mockup.html) uses fictional Greenhaven Nursery, North propagation site and fictional staff/customer names. Overview, Support, Projects, Equipment and Knowledge are clickable. Request/reply edits live only in page memory and reset on reload. It performs no API call, upload, login, save or message send. Normal/empty/unavailable/access-changed scenarios illustrate behaviour, not server security. Acceptance tests remain Not run until actual implementation.

## 11. Build, configure, integrate or retain

| Option | Fit and limits | Decision |
|---|---|---|
| PPO customer area over existing domain services | Strong fit for exact site/equipment/service/project continuity; requires external permission and publication work | Preferred synthetic design; prove CP1 before wider exposure |
| Configure Acumatica portal | Vendor describes cases, account access and knowledge sharing; may reduce ERP/account duplication | Assess actual MYOB edition, licence, supported identity/API, branding and customer workflow coverage before purchase/build commitment |
| Integrate a helpdesk/knowledge product | Could provide mature support operations and search; creates identity, thread, attachment and reconciliation boundaries | Consider only if support volume/ownership and product evidence justify it; no plugin selected |
| Retain assisted phone/email service | Necessary supported route during coexistence and for urgent work | Preserve; publishing a portal does not establish continuous monitoring or emergency response |

Sources checked 6 September 2026: [Acumatica portal](https://www.acumatica.com/cloud-erp-software/customer-management/customer-portal/) supports vendor capability only, not Powerplants' entitlement; [OWASP authorisation](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) supports current-request/least-privilege controls; [OWASP file upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) supports quarantine/type/size/storage controls; [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) supports narrow-screen layout. These sources inform the proposed controls, not a conformance certification.

## 12. Traceability, success and unresolved facts

| Portal capability | Existing parent requirements | Local acceptance |
|---|---|---|
| Customer/site scope, request and owned follow-up | CRM-01/03/06, SVC-01/02, NFR-01/02/09 | CPA-01–CPA-06, CPA-12/13 |
| Equipment history, reports and exact responses | SVC-06/10/11/12, DOC-01/02/03/06 | CPA-07–CPA-09 |
| Approved project updates | PRJ-02/03/05/07/08, DOC-02/05/06 | CPA-10 |
| Published knowledge and search | DOC-01/02/04/06, NFR-08 | CPA-11/12 |
| Later commercial and account views | EST-03/07/08, FIN-01/02/06/07, DOC-02/06 | CPA-15 |
| Recovery, access and usable delivery | NFR-01/02/03/05/06/08/09/10/11/12 | CPA-01/02/04/05/12/13/14/16 |

Measure in a later accepted pilot: requests received with usable site/equipment context, follow-up ownership completeness, repeated status enquiries per active project, customer actions answered, aged unanswered threads, publication age and article usefulness. Record denominators, sample window and baseline before setting targets. Portal opens or fewer tickets alone do not prove better support. Include customer task completion and staff publishing effort in review.

Open operational facts: permitted customer contacts/delegation and site relationships; real account verification/identity; urgent-contact and response policy; publication owner/authority; article distribution rights/review capacity; hosting/support/cost; retention and incident response; MYOB/SharePoint entitlements and adapters. These do not block a labelled synthetic design or CP1 after its software dependencies. They do block their corresponding real customer capability. D-027 is resolved only for the private staged direction, while its broader optional-feature decision remains open.
