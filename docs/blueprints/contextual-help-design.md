---
document_id: PPO-HELP-DES
title: PPO Contextual Help & User Guidance Design
revision: r01
date: 2026-09-13
status: Prepared for review; application implementation pending
owner: Dean Fiedler - personal prototype owner
source_commit: 1cc882e53020bdfb22f7e9192365d90b1d8282ab
---

# PPO Contextual Help & User Guidance Design

Provide a consistent **Page guide** on every business page, explaining its purpose, required information, actions, responsibilities, exceptions and completion criteria. Start with CRM Deals. Guidance belongs to the application release it describes and links to authoritative business procedures.

This r01 delivers the design, [authoring template](../standards/page-guide-template.md), [worked CRM guide](../guides/crm-deals.md), [interactive preview](contextual-help-preview.html), [acceptance and pilot plan](../testing/contextual-help-acceptance.md) and [decision/handover](../decisions/contextual-help.md). It introduces no application controls, business rules, permissions or integrations. The HTML is a standalone synthetic design review surface.

## 1. Authority, evidence and scope

Dean authorised this design package in the current session on 13 September 2026. His requested direction is detailed contextual help, linked SOPs, a shared interface and guide template, maintenance responsibilities, and a CRM Deals pilot. Dimensions, content lifecycle, release binding and measurement design below are proposed implementation details for review. No corporate SOP or departmental appointment is approved by this package.

| Source inspected | Finding and consequence |
|---|---|
| Live GitHub `main`, `1cc882e53020bdfb22f7e9192365d90b1d8282ab` | Fixed source baseline for the CRM pilot; this session read the code, not a running PPO application. |
| [AGENTS](../../AGENTS.md), [README](../../README.md), [STATUS](../STATUS.md), [CONTRIBUTING](../../CONTRIBUTING.md) | Synthetic public source, private demo, reviewed branches, preserved evidence. STATUS records an older baseline; do not infer current CRM behaviour from that snapshot. |
| [BP-01](BP-01-master-blueprint.md), especially DOC-04 and training/rollout | In-app help and maintained approved knowledge are already within the seven-domain direction. |
| [Shared UI](../standards/ui-style-specification.md) | Roboto/Verdana, navy `#242a37`, green `#62bb46`, white; functional neutrals remain UI choices. No new logo is introduced. |
| [Shell controls](../../src/components/shell-controls.tsx) | Desktop Quick Help already contains three general topics. Evolve this entry point; its desktop-only geometry is unsuitable for the proposed mobile guide. |
| [CRM worklist](../../src/components/crm-worklist.tsx), [deal controls](../../src/components/crm-deal-controls.tsx), [detail/create](../../src/components/crm-screens.tsx) | Current Board/List, snapshots, edits, activities and stage controls ground the worked guide. |
| [Worklist service](../../src/crm/worklist.ts), [creation validation](../../src/crm/validation.ts), [edit validation](../../src/crm/refinement-validation.ts), [edit service](../../src/crm/refinements.ts) | Two-stage baseline; permission-filtered page counts; conditional qualification evidence; money and close-date edits are present despite older prose describing their absence. |
| [Five-stage plan](../delivery/crm-five-stage-implementation-plan.md), [PR #148](https://github.com/deanrfiedler-gif/powerplants-one/pull/148) | Five-stage implementation was open at inspection. Do not teach Discovery–Closing as current controls on this baseline. Recheck before implementing help. |
| [PPO Assistant direction](../decisions/ppo-assistant-direction.md), [BP-02](../architecture/BP-02-platform-architecture.md) | Reviewed static guidance can support later assistance; no model, external search service or new infrastructure is required for this pilot. |

The full-page guide standard applies across CRM, Estimating & Quotation, Engineering & Design Control, Projects & Commercial Delivery, Service Operations, Supply Chain Management and Finance & Commercial Controls, plus shared customer/site/equipment/activity pages. Each route is registered with a guide or an explicit fallback. Design coverage is not a claim that every guide has been authored.

Public sign-in/error pages receive only generic access/recovery help. Customer portal help later requires its own permitted audience. Technicians' offline workspace needs a separately verified cached guide policy; this online CRM pilot does not extend offline support.

## 2. Shared interface

### 2.1 Entry and page context

Use the existing header Help position for **? Page guide**. Keep the words visible on desktop; use a 44 px icon target with accessible name “Page guide: [page title]” where mobile space requires it. Add the mobile entry to the page header. Do not add a second generic Help button alongside it. General navigation, keyboard basics and all available guides remain reachable inside the same help surface.

Resolve context from an explicit page registration, not the displayed title or scraped DOM. The registration identifies the route pattern, guide key and, where necessary, section. Static `/new` must take precedence over a dynamic `/:id` match. Board/List are two presentations of one worklist guide, not duplicated manuals. A field-level “Learn more” link opens a stable section within the same guide.

| Page/context | Proposed guide destination |
|---|---|
| `/crm/opportunities` Board or List | `crm.deals.worklist`, quick start; retain Board/List context when returning |
| `/crm/opportunities/new` | Same pilot guide, “Create an opportunity”; later split only if content size warrants it |
| `/crm/opportunities/:id` | Same pilot guide, “Review and maintain a deal” |
| Deal stage editor | Same guide, “Change stage”, without discarding the open editor |
| Unregistered page | “A detailed guide for this page is being prepared”, plus available module/general help; no empty dialog or fabricated procedure |
| Unknown retired section link | Open the guide contents with a notice; use an explicit section alias when available |

### 2.2 Reading modes

| Mode | Proposed behaviour |
|---|---|
| Desktop side panel, viewport at least 1100 px | Fixed 600 px wide at the right edge, full available height below the app header. Overlays rather than squeezes the board. Non-modal: visible page remains usable. Close help to reveal covered controls. |
| Expanded reading, desktop | User selects “Expand guide”; centred modal, maximum width 1120 px, width/height no greater than viewport minus 32 px, fixed header and a content scroll area. |
| Tablet/phone below 1100 px | Full-screen modal reader; no partially hidden business controls behind a narrow panel. Search, contents, close and article remain available. |
| Help invoked from an active business modal | Modal reader above the existing dialog. Underlying form stays mounted and inert. On close, return focus to its help trigger, retaining all fields and its save state. |

The 1100 px threshold is a proposed help breakpoint, independent of CRM's current 781 px desktop breakpoint. Validate at 1366×768, 1440×900, 1024×768, 390×844 and a 320 CSS px viewport. Moving between help modes must preserve section, query, article scroll and any underlying form values. No drag resizing, animations that delay reading, or automatic opening on every visit.

**Stable geometry:** section changes, zero search results, short SOP lists and long content do not change the outer panel's size. Use one article scroll region in compact mode. Expanded mode may add a narrow contents column with its own overflow only when necessary. Avoid multiple nested article scrollbars. Header and close action stay visible.

**Structure:** page-guide title and current status; search within this guide; contents; short outcome and quick start; detailed article; related resources and review information. Proposed reading text is 16 px with approximately 1.6 line height and a maximum measure around 70 characters. Headings, numbered steps, concise tables and annotated synthetic examples provide hierarchy. Green is an accent; primary text and focus outlines use navy. Do not rely on colour for warnings or status.

### 2.3 Keyboard and focus

Opening help moves focus to its title, which is programmatically focusable. Side-panel mode uses a labelled complementary region, no `aria-modal` and no focus trap. Include “Return to page” to focus the original trigger while leaving help open. Escape closes help when focus is inside it; Escape used elsewhere belongs to that page's active control.

Expanded/mobile mode uses a labelled modal dialog, traps Tab/Shift+Tab, makes the background inert, and provides a visible close button and Escape dismissal. Closing returns focus to the opener, or the page heading if the opener no longer exists. Do not attach the entire article as `aria-describedby`. These modal requirements follow the [W3C dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), checked 13 September 2026.

Retain heading order, semantic tables and keyboard-operable contents/search results. Announce result counts and loading/errors politely; do not announce the entire article after every keystroke. No global bare “?” shortcut or override of browser F1. Respect reduced motion. Test zoom, touch and screen-reader navigation; an HTML screenshot is not accessibility acceptance.

Help stays in consistent relative order across equivalent page layouts. [W3C consistent-help guidance](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) supports that approach; it does not require a guide on every page. Universal page coverage is the user's PPO product direction.

### 2.4 Interaction and recovery contract

| Event | Required result |
|---|---|
| Open/close/toggle size | No route reload, form submission, mutation, reset of filters or new business audit event. |
| Search | Search the current permitted guide's headings/body. Empty query shows contents; no matches shows a clear message and Clear search. Selecting a result opens its section. No business/global search is implied. |
| Navigate to another business page | Close help and use the new page's guide on next open. Existing unsaved-navigation protection remains authoritative. |
| Reopen on the same page in the same session | Restore section and scroll unless “Start guide” is selected. Do not persist business values or help search text to shared/browser storage. |
| Link to another guide | Keep an internal Back-to-previous-guide trail, same size and visible context title. Check audience/applicability again. |
| External SOP | Explicit link, labelled “opens in a new tab”; page and drafts remain intact. No automatic download, sign-in or permission request. |
| Guide load failure | Stable error view with Retry and general help. Keep the business page usable. |
| Session lock/sign-out/access change | Close help and clear restricted content, search index, query and feedback context using existing session signals. No stale cross-identity content. |
| Business save is pending/uncertain | Help may explain recovery; opening it neither retries nor cancels the operation. |
| Help opened inside a business modal | Do not fire the business modal's outside-click dismissal. Close only the topmost help layer first. |
| Narrow viewport or zoom change while open | Retain reading position; deliberately transfer focus into/out of modal mode and remove any obsolete inert/focus-trap state. |

There is no save button in a read-only guide. “Copied link”, “Feedback saved” and “Could not save feedback” are distinct outcomes where such functions are implemented. Help access is not an acknowledgement that an SOP has been read or training completed.

## 3. Guide content standard

Use [the template](../standards/page-guide-template.md) for every guide. It contains required user sections and separate author/reviewer metadata. All mandatory sections must have meaningful content or a specific “Not applicable” explanation; remove placeholders before review. A guide's length follows the task's complexity.

| Section | Content standard |
|---|---|
| Purpose and outcome | Explain when to use the page and the observable result. |
| Before you start | Actor/permission assumptions, prerequisites, information and related records. |
| Quick start | Approximately 3–7 steps for the most common task, ending with confirmation. |
| Page tour and tasks | Exact labels, where actions are found, expected results and linked follow-through. |
| Information requirements | Required now / conditionally required / optional; explain unknowns and units. |
| Statuses and warnings | Meaning, cause, next action and distinction from other business states. |
| Responsibilities and handovers | Who retains ownership, what constitutes acceptance, and outstanding obligations. |
| Worked examples | At least a normal case and an incomplete/change/recovery case with synthetic data. |
| Troubleshooting | Recognisable symptom, safe recovery and escalation route if known. |
| Related procedures | Approved links with applicability/status; explicitly state when none is connected. |
| Review and feedback | Content owner role, last reviewed date, applicable version description and feedback path. |

Use Australian English, user-facing labels and explicit AUD/GST/date/unit meanings. Link technical details in an author appendix, keeping commit hashes, field keys and APIs outside the rendered business guide. Explain distinctions such as saving versus submitting, submitting versus accepting, and viewing versus acknowledging only where they affect the task.

Screenshots must show synthetic records, match the described release, carry useful alternative text and avoid replacing written instructions. Do not embed real operational records in this public repository. A screenshot's image revision and source build belong in author metadata. Do not create a separate copy of an entire guide for each role; keep common text and scope any restricted sections before delivery/indexing.

## 4. SOP and resource linking

The page guide explains use of PPO. The SOP governs the business procedure. SharePoint remains the intended business-document authority. An app guide cannot revise that authority, approve a draft procedure or grant permission to perform work.

### 4.1 Proposed resource record

This is a design data contract, not a new database migration.

| Field | Meaning and rule |
|---|---|
| `resource_id` | Stable internal identity; title and URL are not keys. |
| `resource_kind` | `Sop`, `Template`, `Guide` or `Reference`. |
| `title`, `document_reference` | Verified human title and controlled reference where the source supplies one. |
| `provider`, `provider_item_id`, `entity_context` | Preserve verified SharePoint or other source identity and company context when available. Do not invent IDs. |
| `canonical_url` | Owner-verified HTTPS link in an approved location; never an expiring access token or unauthenticated mirror. |
| `source_status`, `revision` | Source-declared approval/revision; an accessible file is not automatically approved. Unknown remains unknown. |
| `owner_role`, `reviewed_at`, `review_due_at` | Actual source metadata if known; not inferred from file modified time. |
| `applicability` | Module, task, audience, equipment/site/company or jurisdiction where relevant and verified. |
| `link_mode` | `CurrentApproved` for normal guidance, or `ExactRevision` for an explicitly revision-bound obligation. |
| `checked_at`, `check_basis`, `link_health` | Evidence of link review, e.g. manually opened by permitted reviewer; separate from approval. |
| `supersedes_resource_id` | Verified successor relation; preserve historical references. |

Initial pilot: public synthetic metadata only, no SOP URL. “No approved SOP linked yet” is a legitimate state. Actual private URLs, access-scoped titles and business documents require a private configuration/integration boundary before use. Public repository content must be suitable for public disclosure even when the UI happens to hide it.

### 4.2 User-visible states

| State | Display and action |
|---|---|
| Approved and applicable | Show title, reference, known revision and “Open SOP”; include source and last verified date. |
| Draft | “Draft — for review”; excluded from the normal approved-procedure list. Preview only to its permitted audience. |
| Review due | Show the due state separately from source approval. Do not silently revoke or reaffirm approval; review owner decides disposition. |
| Superseded | Show successor for current guidance; preserve exact historical references without describing them as current. |
| Withdrawn/unknown applicability | Exclude from instructions to perform the task; explain unavailable guidance without inventing a substitute. |
| Access unavailable | Generic message with the established internal access route if configured; do not expose restricted document titles through search or counts. |
| Broken/unverified link | Show “Link needs review” and configured reporting route; no false “current SOP” badge. |
| Offline/provider unavailable | Explain availability. Do not silently serve an old SOP as current. Caching is a separate scope. |

For the manual pilot, “checked” means a dated human review, not a live SharePoint connection. Links inherit source access controls. A future integration must verify permitted metadata before returning it and must not use a service identity to broaden user access.

Ordinary help links resolve to the currently approved procedure where the source provides that facility. Instructions governing an issued job pack/report must keep the exact approved revision required by that record; updating general help must not substitute a later SOP into historical evidence. A help visit or click never creates a compliance acknowledgement.

## 5. Content identity, applicability and maintenance

### 5.1 Guide metadata

Each guide has a stable `guide_key`, title, route/section mappings, `revision` (rNN), content state, audience, owner role, reviewer, review dates, workflow basis, source commit, related resources, supersession/section aliases and evidence references. Readable guide revision is separate from software version and database schema.

Recommended pilot delivery: reviewed Markdown in the repository, a small explicit page-to-guide registration and application-bundled rendered content/search index. It fits the existing Next.js app and normal release review; no external CMS, SaaS subscription, model or new runtime service. Later private SOP metadata stays outside the public bundle. Compare this with an external knowledge base or CMS only when non-developer authoring volume or source-permission needs justify the additional system.

This is a bounded design recommendation within BP-02, not a material architecture replacement. Before implementation, record the final renderer/sanitisation choice and dependency rationale; do not introduce executable MDX just to render instructions. Only approved internal routes and safe HTTPS resource links are allowed; reject script URLs and executable raw content. Search results must use the same audience scope as the displayed content.

### 5.2 Release binding

Keep app help in the same release bundle as the described UI and workflow. Resolve guide applicability against that release's manifest/capabilities, not the newest branch or the current calendar date. The author records the exact source baseline reviewed; a guide-only commit does not require claiming that an application was executed.

| Situation | Required treatment |
|---|---|
| UI/workflow changes | Update affected instructions, examples, bindings and acceptance evidence in the same PR/release. |
| Documentation correction only | Review and release the correction; retain prior Git history and increment issued guide revision. |
| Old hosted demo | Retain its matching guide until that demo is upgraded. Never pull “latest” user instructions from public `main` at runtime. |
| Feature exists on an open branch | Keep it out of current user instructions; record the planned change in author notes. |
| Guide applicability cannot be established | Show “Guide for this version is being prepared” and safe general help; do not display an unverified procedure as current. |
| New route has no specific guide | Register explicit fallback and assigned content owner; release checks prevent silent missing coverage. |

**CRM transition:** this pilot covers Enquiry/Qualified at `1cc882e`. The accepted future sequence is Discovery, Scoping, Quoting, Negotiation, Closing; Won/Lost and ownership transfer remain separately bounded. When the five-stage work lands, re-read the actual merged UI, database contracts and conversion path. Update the current-stage instructions and run their scenarios against the intended deployed version before publishing the successor guide. Do not make one user-facing article mix both stage models.

### 5.3 Responsibilities

| Responsibility | Proposed role | Concrete duty |
|---|---|---|
| Prototype product/content accountability | Dean Fiedler | Accept scope and guide usability; appoint business reviewers before operational rollout. |
| Business accuracy | Module process owner, to be nominated | Check task sequence, required information, ownership and exceptions; resolve contradictions with SOP owner. |
| SOP authority | Source document owner | Approve procedure, applicability, revision and withdrawal/supersession. |
| Content preparation | Assigned guide author | Use the template, exact labels, synthetic examples and evidence; act on feedback. |
| Release implementation | Developer/release maintainer | Register routes, bundle correct content, enforce permissions and update affected guides with code. |
| Verification | UX/QA reviewer or documented sole-reviewer check | Exercise tasks, keyboard/touch/recovery and content correspondence; state whether review is independent. |

No employees are assigned by the proposed role table. Dean is accountable for the personal prototype only; company approval remains separate.

Proposed content states: Draft → InReview → Published → Superseded, with Withdrawn available where instructions should no longer be used. This r01 CRM guide is **InReview**, not Published. A role label or passing test is not business approval. Record reviewer/date and content revision when accepting publication.

Review on material workflow/control/permission changes, SOP revision or withdrawal, recurrent feedback, or observed user errors. For a later steady-state pilot, propose a quarterly review reminder, subject to the owner choosing a cadence; no automation is created here. A due date alone must not fabricate an expiry policy.

### 5.4 Release completion checklist

1. Identify affected routes/tasks and guide sections in the PR.
2. Read current workflow/permission definitions and approved SOP metadata.
3. Update content and revision, verify exact labels and normal/exception examples.
4. Check links, route bindings, permitted search and modal/side-panel behaviour.
5. Execute relevant user tasks on the candidate app with its bundled guide.
6. Record outcome, reviewer and known limitations; release compatible app/help together.

No material business rule may be stated solely in help. Required fields, permission checks and transitions remain enforced by domain/server logic and explained by the guide.

## 6. CRM Deals pilot and later intake guide

The [worked CRM article](../guides/crm-deals.md) is deliberately complete enough to review as user guidance: find a deal, compare Board/List, understand counts/values, inspect details, create within permissions, maintain scope/contact/value, manage next action, change stage with evidence and recover from uncertain saves. Its author appendix maps factual claims to source files.

The [preview](contextual-help-preview.html) demonstrates opening, searching, contents navigation, stable panel size, expanding, mobile presentation and returning to a synthetic unsaved note. It does not execute CRM mutations, bind real permissions, connect SOPs or measure real onboarding. Article text in the preview is derived from the pilot Markdown at authoring time; it is a review copy, not a second maintained authority.

The next Sales-to-Estimating guide will reuse the template and interface. Prepare its content alongside that workflow's accepted contract; no live Submit/Accept button is invented now.

| Intake stage to explain later | Required guide coverage |
|---|---|
| Capture/save | Customer/site/contact identity, shared brief, conditional equipment questions, owned unknowns, save confirmation. |
| Submit | Actual submission prerequisites, exact submitted revision and receiving queue. |
| Clarify | Specific question, response owner, attachments/evidence and affected revision. |
| Accept | Who can accept, what becomes the agreed estimating brief and what remains open. |
| Revise | Change reason, preserved accepted brief, impact review and whether reacceptance is needed. |

Use the potting-line questionnaire as the intended later example when its source mapping is verified. That questionnaire was not supplied or inspected in this help-design task; this package does not invent its fields or equipment-selection/pricing rules.

## 7. Delivery sequence and success evidence

| Increment | Outcome | Exit evidence |
|---|---|---|
| This package: design r01 | Interface contract, reusable template, CRM article, review preview, SOP rules and pilot measurement plan | Documentation checks, source correspondence and preview inspection; owner review remains distinct. |
| First application increment, proposed | Shared guide renderer and entry; CRM route bindings; search/contents; mobile/expanded modes; explicit fallback on other pages | Execute HELP-01–HELP-14 in the linked acceptance plan; no live SOP integration or business mutations. |
| Workflow expansion | Author and verify guides as modules mature; intake guide with its workflow | Coverage register, accepted module scenarios and correct release applicability. |
| Operational SOP/feedback integration, later | Private source links, established support route and maintained reporting | Verified source identities/permissions, ownership and retention decisions; separate accepted implementation. |

The first implementation should be freshly scoped after this design review and the current CRM pipeline PRs. Keep P01–P12 dependency order and PP-01 acceptance intact. This package is not an instruction to begin P12 or to modify another active branch.

Assess benefits through independent task completion, repeated support questions and avoidable information omissions, with time-to-completion and guide-maintenance effort as supporting measures. The [pilot plan](../testing/contextual-help-acceptance.md) defines denominators, paired synthetic scenarios, confounders and evidence records. No savings estimate or fabricated result is reported.

## 8. Traceability

HELP identifiers below and in the acceptance plan are local design/verification identifiers, not new parent requirements. All 78 existing parent IDs remain unchanged.

| Existing parent | This package's contribution | Future evidence |
|---|---|---|
| DOC-04 | Owned/reviewed/applicable knowledge and SOP links | HELP-07, HELP-08, HELP-11 |
| CRM-01, CRM-02, CRM-03 | Customer context, stages, next actions and linked activity instructions | HELP-09; CRM tasks T1–T6 |
| NFR-01 | Scoped content, resource metadata and session clearing | HELP-06, HELP-07 |
| NFR-05 | Useful unavailable/mismatch states | HELP-08, HELP-11 |
| NFR-08 | Keyboard, mobile, reflow and readable guidance | HELP-01–HELP-05, HELP-12 |
| NFR-09 | Explain pending, refused, stale and uncertain commands without duplicate action | HELP-10 |

These mappings contribute to existing acceptance scope; they do not mark AT-01, AT-20, AT-23, AT-25 or AT-37 passed.
