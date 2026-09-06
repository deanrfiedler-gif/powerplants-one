# PP-01 — Minimum document, issue and distribution contract

**Edition:** r05 · **Status:** OUT-09/DAT-07/minimum DAT-11 implemented in P06; bounded DAT-09/OUT-10 implemented in P09 with verification recorded separately; OUT-14 remains a P10 contract. No actual SharePoint repository, template or retention policy has been verified in this package.

[Package](../prototype/README.md) · [Dictionary](service-data-dictionary.md) · [BP-07](../blueprints/BP-07-service-operations.md).

## P06 maintained implementation amendment

[ADR-0011](../decisions/ADR-0011-p06-controlled-job-packs.md) and [handover](../delivery/p06-handover.md) record Playwright 1.63.0, exact immutable source/render/issue evidence, private synthetic adapter and per-assignment response. All content changes are material in this increment. Current applicability, actual release time and as-at are separately read in the application; filenames never establish status.

Because exact bytes must be durable before the issue transaction, the file prints a **reserved issue timestamp** and issue UUID, explicitly effective only upon application release. This reserved output-preparation time is retained across recovery; it is not actual `issued_at` or evidence of release. Actual release is a later immutable database timestamp. This explicit distinction refines the general file-time requirement below without treating a queued or generated document as Issued. No PDF is edited after release to add a timestamp or signature. HTML is semantic/responsive; PDF tagging and outline are requested but PDF/UA and assistive-technology performance are not asserted.

A returned/check decision is immutable, and new input requires a successor. P05/P04 changes cause immediate hold plus immutable events and owned P03 contact Activities in the same transaction. Simulated sending and limited server retrieval facts are separate from explicit responses. The source and financial canary filtering happens before HTML/PDF/manifest creation, including titles and metadata. Missing versions remain owned errors. At the P06 boundary report/Finance were incomplete; P09's report amendment appears below. Finance and integrated PT-18/PT-23 remain incomplete.

## 1. Ownership and content identity

SharePoint remains the intended authority for business documents. Powerplants One owns their links to business records, preparation/review/issue events, manifests, selected audiences and acknowledgement evidence. Native CAD authoring and file dependencies remain in the validated Engineering environment; PP-01 handles only synthetic published references.

A document reference stores provider, tenant/site/drive/item identifiers where applicable, version, owner, classification and availability. A filename or mutable URL alone cannot establish exact issued content. At issue, retain rendered bytes and the manifest with object/revision, source/template versions, hashes, selected scope, audience and issue evidence. Content hash proves byte identity, not retention or legal authenticity.

The synthetic adapter stores fictional source/output files outside Git in a private local directory and returns simulated stable IDs. Every resulting output says **Synthetic prototype — not for operational use**. A future SharePoint adapter must pass renamed/moved/version-unavailable/permission/retention tests. Cross-library or cross-site moves may change supported identities; reconcile them explicitly rather than promising all URLs survive.

## 2. Output register

| Output | Audience and trigger | Required content | Exclusions and acceptance |
|---|---|---|---|
| OUT-09 Technician job pack | Assigned crew; confirmed appointment and checked preparation | Pack/work/appointment IDs, revision, issue time, site timezone; customer/contact/access; approved tasks/limits/exclusions; asset identity/configuration; relevant history and unresolved faults; exact technical sources; parts/tools/collection; controls/readiness/allowed exceptions; completion evidence/escalation | Exclude balances, internal margins, unrelated private notes and secrets; PT-06/PT-07/PT-18/PT-23 |
| OUT-10 Customer service report | Named customer audience and authorised staff; reviewed visit | Site/customer/work/visit, attendance date/time/timezone, permitted personnel details, affected assets, authorised and completed scope, findings/attempted fixes/readings, appropriate parts, exclusions, remaining work, next actions and exact acknowledgement context | Exclude internal review comments, private staff notes, cost/margin and unsupported diagnosis; PT-15/PT-16/PT-18/PT-23 |
| OUT-14 Finance supporting evidence | Authorised Finance/reviewer; reviewed handoff | Work/scope/report revisions; original/approved/allocated/billable quantities; units and agreed basis; coverage/disposition; source-to-target lines; processing mode/status; company/account/source time; reconciliation and corrections | No customer distribution; no invented tax/rates/ERP references; PT-17/PT-19/PT-20 |

Pack section keys for DAT-07 are `identification`, `customer_arrangements`, `scope`, `equipment`, `history`, `technical_information`, `readiness`, `site_controls`, `completion`. Each section carries applicable content, linked source IDs and any allowed not-applicable/exception decision. Required content is policy-driven by job type; omission cannot be disguised as a blank section.

## 3. Presentation specification

Create accessible HTML previews and controlled PDF outputs from one reviewed source snapshot. Choose a maintained renderer during implementation, validate licences and deployment support, and pin its version. Browser print is not assumed to guarantee PDF accessibility or identical output across machines.

Use A4 portrait by default, clear title/record/revision block, readable body typography, full-width structured tables where appropriate, repeated table headers, page numbers and footer classification/status. Repeat the customer/site/work identity on continuation pages. Keep headings with their following content, allow long descriptions to wrap, and avoid splitting a signature/response block in a misleading way. Large drawings are linked/attached as controlled files, not shrunk to illegibility.

Use approved brand assets when available; until then a restrained text-only Powerplants One treatment is a draft design. Do not fabricate an approved logo, address, certification, legal clause or signature statement. D-024 covers final branding/contact block and issue/acknowledgement wording. Long site names, multiple assets, extensive findings, empty optional sections and multi-page tables are required test cases.

Field technicians must be able to read the same content in the mobile HTML job view. An offline PDF may supplement it, but does not replace the sync/revision indication. The file itself shows issue time/revision; the application separately shows last-known/current status.

## 4. Generation and issue protocol

1. Author selects the business revision and required source content. The server filters by intended audience and document policy before creating a render snapshot.
2. Reviewer checks content and required technical/readiness evidence; a Checked/Reviewed state freezes the input revision. Editing invalidates that review.
3. The issue command records an idempotent generation request with template version, source hashes, recipients and correlation ID. UI displays Preparing output, not Issued.
4. Worker renders, validates and stores the output plus manifest in the document adapter. Verify byte count/hash and durable retrievability.
5. Recheck that the checked scope, appointment, recipients, permissions and policy still permit this issue. If changed during rendering, retain the generated draft attempt and request review; do not issue stale content.
6. Commit the immutable issue event and applicable-revision pointer, then durable distribution tasks. The source/output manifest is immutable; current supersession/withdrawal status is an event/projection.
7. Record actual distribution facts and per-recipient acknowledgements separately. A retry returns the same issue/result; it does not create duplicate release events.

If storage succeeds but database finalisation fails, reconciliation locates the stored object by operation ID/hash and completes or abandons the same attempt after rechecking guards. It does not issue another document blindly. If the database request exists but no file is durable, keep it pending/failed with an owned recovery task. File retention/garbage collection checks all issue references before removal.

## 5. Revision, material change and withdrawal

Each issued pack/report has an immutable content revision and one or more distribution/response events. Changing tasks, controls, technical sources, relevant findings, time/crew or customer-facing meaning requires a new revision under PP-01. Cosmetic corrections are still new rendered content; do not reuse the old hash/signature. A future policy may distinguish materiality for notification urgency, but never for silently replacing issued bytes.

For a new pack revision: record change summary/category; hold dispatch for a material pending change; check new input; issue successor; mark predecessor Superseded; require acknowledgement from applicable recipient assignments. A withdrawn issue remains recoverable to authorised users with withdrawal reason/time. An offline device may retain an old issue; show as-at and resolve on reconnect/direct contact.

For a report revision: retain prior response against the prior hash; create the successor from reviewed evidence; re-review and issue. Request a new customer response if presented content changed. An accepted signature is not copied to a revised PDF. Finance handoffs referencing the old report are reassessed; processed outcomes require a linked correction route.

## 6. Distribution and acknowledgement semantics

| Fact | Evidence required | Must not be inferred from |
|---|---|---|
| Generated | Durable render attempt/output with hash/template/source snapshot | Button click or queued job |
| Approved/checked | Reviewer, exact source revision, time and delegated decision | Generated PDF |
| Issued | Immutable issue event, durable exact output and authorised recipients | Approval alone |
| Sent | Recorded channel action and evidence, or explicitly simulated event | File/link creation |
| Delivered | Supported channel evidence of delivery | Sent state or no error |
| Downloaded/opened | Measurable retrieval/open event with limits | Delivery notification |
| Acknowledged | Explicit recipient response to exact issue/revision | Open/download/read tracking |

PP-01 creates in-app tasks and records manual/simulated communication outcomes. It sends no messages or invitations. Actual email/SMS/calendar integration requires D-025 and specific authority. Recipient selection must use validated contacts; no bulk mail action is hidden inside issue.

## 7. Customer response contract

Present the exact report revision or clearly labelled draft evidence. Capture respondent identity/role as stated, response choice, timestamp, capture actor and remarks. AcceptedWithReservations, Declined and Disputed require detail. Unavailable records reason and a next contact action, with no invented signer. Signature/image is optional protected evidence. The application does not assert independently verified identity merely because a name/signature was entered.

The response describes the presented content only. It does not authorise variation pricing, accept the entire project, establish statutory compliance or settle a warranty claim. Exact wording for operational use remains a Commercial/Service policy decision; the synthetic UI uses a neutral acknowledgement statement and draft label.

## 8. Permissions, retention and outage handling

Authorise record and file access at every preview/download/export. The audience-filtered report must not accidentally expose hidden internal fields through its HTML, embedded metadata, attachment names or cached payload. Do not include tokens, private URLs, raw exception traces or author credentials in document metadata.

Operational retention, disposal, legal holds and source-version availability must be agreed under D-012. A historical version reference is not a guarantee that the repository retains it forever. Select a controlled issued-copy/retention approach and validate restore. Do not introduce an arbitrary seven-year rule or other unsourced retention period.

If SharePoint is unavailable, retain the last authorised cached issue within device policy with an honest last-known label. New controlled issues cannot claim successful storage until durable content is verified. If a source version is missing, use a permitted retained exact snapshot or report an owned exception; never substitute the latest version without review.

## 9. Document naming and repository distinction

Use the independent [PPO-STD-001](../standards/naming-conventions.md), adopted in ADR-0005. The other project's STD-001 and OP/SOL numbering do not apply. Selected synthetic outputs are `SYN-PPO-PACK-000001-job-pack-r01.pdf`, `SYN-PPO-RPT-000001-service-report-r01.pdf` and `SYN-PPO-FH-000001-finance-evidence-r01.pdf`, allocated from the actual local record reference and content revision. Integer revisions render as rNN; filenames never replace UUID/provider/version/hash identity. New bytes require a new revision; repeated distribution of identical content records a new event. Every synthetic output is visibly labelled. D-003 is resolved for private naming; D-024 still owns actual output/template/acknowledgement acceptance. No operational output is issued by this amendment.

GitHub working specifications use stable paths and internal edition/change metadata. The issued master v02 is retained separately as a hash-protected baseline under `docs/reference/baselines/`. This repository naming decision does not remove revisions from customer quotes, issued packs, service reports or exported controlled documents.

## 10. Acceptance obligations

P06/P09/P10 implement selected outputs. PT-18/PT-23 verify exact hashes, source/template versions, long-content rendering, confidential-field exclusion, renamed/moved source handling, failed storage/finalisation and distinct distribution events. All full procedures remain Not run in the authored catalogue; executed P06 component evidence is recorded separately in its handover.

## P07 attachment extension

[ADR-0012](../decisions/ADR-0012-p07-online-field-evidence.md) extends the replaceable private P06 byte adapter to original synthetic field PNGs. Existing issued PDFs/HTML/manifests and historical P04 text evidence retain their exact bytes and identities. Attachment initiation, upload and finalisation are separate stable operations with Pending/Uploaded/Quarantined/Available/Rejected evidence. Only durable, retrieved, hash-matching inspected media can become Available. Storage success followed by database failure is reconciled with the same upload item/version/operation/hash. Retrying never replaces old bytes or creates another accepted attachment. Missing originals require owned recovery; regeneration and deletion are not recovery strategies.

Each metadata, preview/download, upload/finalisation and receipt route independently checks current capability, appointment/assignment and file scope. Raw provider paths, confidential metadata and copied URLs confer no authority. Required unavailable bytes are explicit completion blockers. P07's completion draft is not OUT-10, an issued report or a customer response. [Concrete API](service-api.md#p07-implementation-amendment) and [media/identity policy](service-data-dictionary.md#p07-physical-implementation-amendment) govern this extension.

## P08 offline byte and cache extension

[ADR-0013](../decisions/ADR-0013-p08-offline-recovery.md) and [P08 handover](../delivery/p08-handover.md) add explicit owner-bound IndexedDB storage of one exact permitted issued HTML and necessary service-audience context per downloaded job, at most two jobs. The issue hash/revision and last-verified/expiry remain visible. Cached bytes are stale context; current P06 start authority is rechecked on the server. Issued PDFs/HTML/manifests and source identities are never regenerated to recover an offline operation. The service worker caches only public shell assets, never API/files/Finance responses.

Original local PNG Blobs are stored atomically with immutable upload envelopes and size/hash. Original initiation → upload → verified finalisation → Photo/Checklist → completion-draft dependencies remain explicit. Missing/quota-failed bytes cannot be represented as locally saved or server available. The P07 inspection limits and write-once private adapter apply unchanged. An interrupted response or storage-success/database-failure uses the same original identity/hash and exact verified retrieval, including after application/PostgreSQL/browser restart. No referenced-evidence deletion, silent replacement or orphan cleanup is added.

Restricted recovery can retain exact original PNG bytes with an owned evidence case under a previously issued actor/job/authority-bound capability. Only the recorded service owner with current scoped permissions can retrieve those case bytes; the original actor's minimal case receipt grants no general file access. Sign-out/identity change locks cached views without deleting unsent originals. Operational encryption, device policy and retention remain unresolved; no operational security claim follows from browser ownership checks.

At the P08 boundary completion remained a technician draft. P09 adds OUT-10, report review/issue/customer response and response-image semantics below. OUT-14 and Finance processing remain P10. No customer communication or live SharePoint operation is introduced.

## P09 controlled OUT-10 implementation

[ADR-0014](../decisions/ADR-0014-p09-service-reports.md) and the [P09 handover](../delivery/p09-handover.md) define the physical report boundary. OUT-10 uses a customer-safe projection frozen by the exact accepted service review, an explicitly selected active site contact and a supported immutable template definition. It includes customer/site/work/visit and timezone, permitted attendance name, affected assets/identity, original authorised scope and exclusions, exact task outcomes, findings/confidence/attempted fixes/readings/appropriate material quantities, remaining work and next owner. Internal review comments, private time notes, stock-source references, Finance data, attachment filenames, raw tokens and provider paths are excluded from HTML/PDF and public report metadata.

One original owned render job reserves the issue UUID, template/source/review/customer hashes and output-preparation timestamp. A real pinned Chromium render produces A4 PDF and semantic HTML with navy/green treatment, wrapping, repeated identity/table headers and page numbers. The write-once private adapter stores one bundle and verifies retrieval/hash/size. Finalisation again checks current issue-owner authority, exact reviewed set, current source/recipient/template and durable bytes before committing immutable issue, report pointer, audit, original receipt, internal outbox fact and owned distribution/contact task. Output preparation time is not actual release time; `report_issues.issued_at` records release. Rendering alone, download and open do not prove issue, delivery or acknowledgement.

Storage-success/database-failure retries locate the original job's stored bundle. They do not regenerate it. A source/template/audience conflict keeps the attempt StaleSource and owned, with no issue. The technician opens a successor review cycle; old bytes and attempts remain exact. Referenced evidence is never deleted. The provider/item/version/hash/size identity remains immutable in the private physical issue manifest. Customer-facing manifest routes expose only relevant revision/hash/size identity, never the private adapter key.

The response surface presents **HTML**. An IssuedReport presentation binds the exact HTML hash in its released bundle; the same issue separately retains the exact A4 PDF hash. DraftEvidence binds separately retained reviewed HTML with visible draft wording. Responses cannot be transferred from draft to issue or to changed content. Historical PDFs are not modified to add marks. Optional synthetic PNG marks are independently protected response objects bound to the original response operation and presented hash; an existing mark on the same report cannot be uploaded again against changed content.

Offline preparation downloads at most two current reviewed HTML presentations per job (1 MiB each), verifies actual hashes before an owner-bound transaction-complete save, and labels context stale. No offline render, approval, issue or message send exists. A local response is an intent until the server accepts its exact current presentation and permissions. P08 schema/ownership/lease/byte and receipt semantics continue unchanged.

Only in-app owned contact/distribution tasks and synthetic outcomes exist. No email, SMS, calendar or customer delivery integration is invoked. D-024 output branding/response acceptance, operational retention and external SharePoint interface behaviour remain unresolved. OUT-14/Finance belongs to P10; selected-output PT-18/PT-23 obligations spanning it remain incomplete.

The OUT-10 template definition fingerprints the actual report renderer/projection and shared rendering/escaping source bytes. Seed 9 stores that exact definition/hash and current policy in the same seed transaction; repeat seed never rewrites it. Issue request and final release reread and compare those source fingerprints. A changed template source, even during rendering, retains a StaleSource attempt without release. Future rendering changes require an immutable successor template/policy through an authorised forward change; old issued bytes remain retrievable without regeneration.

Customer presentation mode renders the verified exact HTML and response controls without staff review comments, prior response history or owned internal actions in that view. Returning to staff review is explicit. The HTML hash remains the hash of the actual sandboxed content, not of the surrounding capture controls.
