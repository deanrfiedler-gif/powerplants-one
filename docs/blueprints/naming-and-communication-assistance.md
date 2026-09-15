---
document_id: PPO-NAM-FUNC
revision: r01
status: Authored design; synthetic prototype supplied; application implementation pending
owner: Dean Fiedler — personal prototype owner
date: 2026-09-15
---

# Naming and Communication Assistance — Functional Specification

[Package and evidence](../delivery/naming-sharepoint-handover.md) · [Naming rules](../standards/naming-conventions.md#24-business-filing-and-communication-assistance) · [SharePoint configuration](../architecture/sharepoint-information-architecture.md) · [Interactive prototype](naming-filing-prototype/index.html) · [Requirements](../requirements/naming-assistance.csv)

## 1. Purpose, scope and current position

Help people name, file and retrieve business information consistently across all seven PPO domains. One shared capability supplies context-specific suggestions in document upload, existing-file review, folder selection, email composition and Activity creation. It does not add an eighth business domain or a competing document repository.

Dean authorised this full design package, contract amendments and synthetic HTML on 15 September 2026 (Brisbane). This is authority to produce the design, not evidence of visual acceptance, live Microsoft access or operational rollout. Inspected main: `42383fc2e3a85f6cf9c38c829683b14787578579`. Existing pack/report/Finance code generates structured filenames; the synthetic email journey supports explicit opportunity linking and one internal follow-up. General naming suggestions, SharePoint renaming and live email sending are new proposed application behaviour.

The first complete example is Banksia Demonstration Nursery — Synthetic, Example propagation site, Greenhouse 2, Growing area A, irrigation controller. Its stable work reference is `SYN-PPO-WO-000001`, equipment `SYN-PPO-AST-000001`, appointment `SYN-PPO-APT-000001` and report `SYN-PPO-RPT-000001`. Facility/growing-area labels are fixture context, not newly allocated production identifiers. Corporate ownership, retention, integration permissions and support commitments remain unverified.

## 2. Actors and access

The following are proposed capabilities, not existing role grants or company appointments. Map them to actual roles in the receiving implementation.

| Actor/capability | Permitted action | Boundary |
|---|---|---|
| Contributor | Suggest a new file/title and save to a permitted record/library | Cannot infer access from a filename or choose a hidden target |
| Naming reviewer | Review existing-file changes and record a justified exception | Requires current access to both source and destination; naming approval is not document-content approval |
| Document issuer | Use the established reviewed-output issue workflow | A name containing r01 or issued never confers issue authority |
| Communication author | Prepare an editable draft for permitted records and recipients | Send permission is separate; record visibility is not permission to disclose its content |
| Rules administrator | Publish versioned naming templates and explicit exceptions | No retroactive renaming; preview affected new suggestions before publication |
| Read-only observer | Inspect permitted names, links and history | No mutation or disclosure of private email through a linked Activity |

Server access must be rechecked at suggestion, preview, approval, execution, read, search and recovery. SharePoint direct access must honour the intended audience as well. The prototype's identity switch is solely an interaction demonstration and supplies no real access control.

## 3. Deterministic suggestion service

1. Read the selected record using current permissions. Resolve actual UUIDs, provider context, readable reference, document type, content revision and allowed destination.
2. Select the versioned rule for the channel/type and any applicable verified external requirement. Never copy another project's numbering system.
3. Assemble a readable candidate from confirmed facts. File descriptions use portable hyphenated words; email/task titles use ordinary sentence case. Missing required references/revisions produce Needs information, not invented values.
4. Validate extension, allowed characters, path/segment limits, case-insensitive collisions, destination access, classification and source protection. A file extension describes the verified file format; renaming never converts content.
5. Return candidate, original name, rule/version, source record/version, evidence for each populated field, missing fields, conflicts and permitted choices. Suggestions are explicitly advisory until applied.

AI is optional for description/type suggestions after a separately scoped provider/data decision. It must expose uncertain fields and never infer approval, actual revision, identity, equipment serial, recipient authority or issue status. Deterministic checks apply to manual and AI suggestions alike. The r01 prototype uses fixed rules and fictional metadata only; it never reads a local file's contents or calls AI.

## 4. Interaction journeys

### 4.1 New upload and filing

Open Upload from the owning record or Documents workspace. Select a document type and short description; inspect the suggested filename and destination together. Display the original name, extension, contextual site/equipment chips and any missing information. A folder picker lists only currently permitted destinations. Users may adjust a valid description or retain an external name with the appropriate exception.

Choosing Save starts upload/verification, not issue. Show Uploading, Verifying, Saved or Needs attention according to actual state. PPO persists the link only when stored content is verified; partial operations enter recovery. A duplicate retry reuses the operation and never overwrites an existing file silently. Changes to the source record, destination or rule after preview invalidate that preview. The static prototype selects a fictional sample and simulates the complete filing result in memory.

### 4.2 Existing-file review

Find files by original/current name, record, type and naming status. Show current and proposed names side by side with rationale and destination. Preview each source item/version before selection. A reviewer can accept, amend, request missing context or retain the original with a reason.

Classify items as Ready to review, Needs information, Conflict, Protected source, Outcome unknown, Applied or Retained by exception. Supplier-controlled originals, CAD dependencies and exact issued outputs default to Protected source; a display alias may be added without renaming the file. No blanket retrospective compliance rewrite occurs.

Batch approval captures exactly the selected previews and their versions. Revalidate every item independently at execution. Return an individual result for each; a batch may be partially applied. Do not report whole-batch success when some items fail, or reapply successful items when retrying. Log original/current/new names, item identity, rule version, actor, time and reason. A requested reversal is a new checked operation, subject to current collisions and authority; the interface must not promise unconditional undo.

### 4.3 Folder selection and provisioning

Choose the owning record and an approved library template. Suggest `<record reference> - <short description>` with stable identity. Creating a folder is distinct from moving a file. A repeated request finds the existing mapped folder or reconciles the prior outcome. An opportunity later linked to a project retains its document identities; it is not automatically relocated or renamed. Folder relocation and cross-library moves are later controlled operations with explicit link/permission impact assessment.

### 4.4 Generated and issued documents

Use the current pack/report/Finance output contracts. Source review, generation, issue, distribution and acknowledgement remain separate. Output names use the actual document reference and revision. Store issued bytes and manifest immutably; metadata status or a filename cannot establish issuance. A changed report becomes a successor revision. A naming-only display alias does not change an issued manifest or inherited acknowledgement.

### 4.5 Email authored in PPO

Start from a permitted record, choose a communication purpose and prepare `[reference] Purpose – Short description`. The author sees the full subject, recipients, body and selected attachments before saving a draft. Remove duplicate reference prefixes and unsupported claims. A saved subject suggestion is not a saved Microsoft draft; the UI must identify the actual storage location.

Replies retain the original subject by default. PPO tracks provider conversation/message identities and explicit links independently. An explicit new topic can begin a separate conversation with a reviewed new subject. Incoming and historical emails keep their original subject; aliases and links improve local retrieval without modifying Outlook. A subject match suggests a record but cannot silently link it, grant access or merge conversations.

### 4.6 Email authored directly in Outlook

This is a separate future Outlook add-in/compose integration. Account linking and read-only Graph sync do not alter every email composed in Outlook. Define supported Outlook clients, mailbox types, installation, permissions, reply detection and failure/fallback before implementation. The assistant may offer a subject suggestion and permitted record selection; it must not silently rewrite a reply or disclose internal context. No Outlook add-in is supplied by this package.

### 4.7 Activities and task messages

Use an action-led title such as “Confirm access to Greenhouse 2”. Keep owner, due date and status in their fields. The Activity's typed record links provide identity; compact in-app context chips avoid repeating a long code in every row. Outbound notification subjects include the actual linked reference and meaningful action, for example `[SYN-PPO-WO-000001] Action required – Confirm site access`.

Creating an Activity, generating a notification, sending it, delivering it and completing the Activity are different operations. One notification per intended event/audience/template revision, with an idempotency key; reminders are new intended events. Email-derived Activities retain only explicitly approved task text, not private body/subject history copied by default. Existing email-to-opportunity follow-up remains limited to its implemented relationship; a service-linked prototype task demonstrates future shared behaviour.

## 5. State and recovery contract

| Object | States and transitions | Guard/recovery |
|---|---|---|
| Suggestion | Draft → Ready / NeedsInformation / Conflict / Protected | Source/rule/destination change makes a ready preview Stale |
| Rename | Ready → Approved → Pending → Applied / Failed / OutcomeUnknown | Approval and provider success are separate; recheck source eTag and current authority |
| Unknown rename | OutcomeUnknown → Reconciling → Applied / ReadyForReview / NeedsAttention | Read the exact provider item; do not infer success from a matching filename belonging to another item |
| Exception | Requested → Accepted / Returned → Superseded | Scoped item/rule/reason/owner/review trigger; preserve prior decisions |
| Communication | Prepared → DraftSaved → SendRequested → Accepted / Failed / OutcomeUnknown | Only separately authorised send stage can request delivery; accepted is not delivered |

Capture original intended payload and operation ID before side effects. Retry only unchanged intent using its original operation. Validate current source and actor even on recovery. A 412 source conflict returns to review; a name collision requires a new candidate; a 403 withdraws unavailable content; a 429 follows supported retry delay. Multi-step name/metadata changes retain separate step receipts and reconcile partial completion.

## 6. Proposed receiving data and interfaces

| Record | Required information |
|---|---|
| NamingRuleVersion | Immutable ID, channel/type, rule revision, effective state, required fields, limits, exception priority, publisher |
| NamingProposal | UUID, workspace/company, source record/provider identity and expected version, original/candidate name, destination identity, rule revision, rationale, missing fields, proposal state |
| NamingOperation | Operation UUID, actor, exact approved payload/hash, proposal/version, per-step provider outcome, receipt, retry/reconciliation state |
| NamingEvent / NamingException | Immutable actor/time/reason, original/new name, relevant source context; exception scope and review trigger |
| CommunicationDraft | Channel, author/mailbox, exact selected records, subject/body/audience/attachment revisions, reply identifiers, draft location/state |

Conceptual commands are SuggestName, ReviewName, ApplyName, ReconcileNamingOperation, PrepareCommunication and CreateActivity. Routes/schema are to be specified within the existing modular monolith at N1; this document does not add an API or migration. Use the existing document adapter, Activity services and operation/outbox patterns. Stable object storage keys never derive from user filenames.

## 7. UX and acceptance

Present one clearly labelled primary action, original/suggested comparison, concise reason and explicit outcome. Keep one scrollable main region. Use r18 tokens, Roboto, navy actions, restrained green success, 1 px menu borders, 14 px floating menu corners, anchored collision-aware menus, native dialog focus and bottom-only corners on forms drawn from the screen edge. Preserve accessible labels, keyboard alternatives, focus return, error association, live results and 44 px phone targets. Long references wrap in narrow layouts.

The HTML has five connected views: Filing, Naming review, Communications, Libraries and History. Its in-memory result history survives navigation only; reloading resets it. No files are uploaded, SharePoint libraries created, email sent or task persisted in the application. Browser checks cover both complete successful sequences and refusal/recovery paths. See the [pilot plan](../delivery/naming-sharepoint-pilot.md) for the full acceptance matrix and deployment prerequisites.
