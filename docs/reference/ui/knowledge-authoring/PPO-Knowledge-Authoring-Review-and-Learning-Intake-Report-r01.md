---
document_id: PPO-DK05-REPORT
title: Knowledge Authoring, Review & Learning Intake — HTML Module Report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
scope_id: DK-05
status: Built standalone design; model and DOM verification passed; native visual review pending
source_commit: 16ff789990122eb2af23a70aa3f0e2bd5bf289c0
---

# DK-05 — Knowledge Authoring, Review & Learning Intake

**Companion report · Design revision r01 · 17 September 2026**

**HTML:** [PPO-Knowledge-Authoring-Review-and-Learning-Intake-r01.html](PPO-Knowledge-Authoring-Review-and-Learning-Intake-r01.html)

DK-05 is a self-contained, interactive Powerplants One workspace for turning staff observations and reviewed evidence into bounded technical knowledge. It includes learning intake, structured article drafting, exact source references, applicability checks, independent technical review, internal publication, reader feedback and owned follow-up. The file contains twelve fictional starting situations and working local state transitions.

This is a delivered design prototype. Its buttons operate on synthetic data saved in the browser; they do not publish to the application, modify SharePoint, issue documents, send messages or update service records. **44 model groups and 33 DOM integration groups passed. Native Chrome, visual layout and device acceptance remain outstanding because browser launch was blocked by the execution environment.** These limits are part of the package, not implied successful checks.

## Contents

1. [Purpose and delivered package](#1-purpose-and-delivered-package)
2. [Scope and design conformance](#2-scope-and-design-conformance)
3. [Workspace structure and navigation](#3-workspace-structure-and-navigation)
4. [Intake and worklist](#4-intake-and-worklist)
5. [Article authoring](#5-article-authoring)
6. [Sources and applicability](#6-sources-and-applicability)
7. [Technical review and corrections](#7-technical-review-and-corrections)
8. [Publication, withdrawal and recovery](#8-publication-withdrawal-and-recovery)
9. [Reader projection and exact references](#9-reader-projection-and-exact-references)
10. [Usage, feedback and follow-up](#10-usage-feedback-and-follow-up)
11. [Identities and permission demonstrations](#11-identities-and-permission-demonstrations)
12. [Synthetic catalogue](#12-synthetic-catalogue)
13. [Recommended walkthrough](#13-recommended-walkthrough)
14. [Persistence, exports and exception states](#14-persistence-exports-and-exception-states)
15. [Design, accessibility and responsive behaviour](#15-design-accessibility-and-responsive-behaviour)
16. [Technical construction and retained evidence](#16-technical-construction-and-retained-evidence)
17. [Interfaces and receiving responsibilities](#17-interfaces-and-receiving-responsibilities)
18. [Verification and evidence](#18-verification-and-evidence)
19. [Plan reconciliation and remaining work](#19-plan-reconciliation-and-remaining-work)
20. [Source register and maintenance](#20-source-register-and-maintenance)

## 1. Purpose and delivered package

The module addresses the gap between a useful observation and a dependable article. A technician's successful intervention, an engineering note or a recurring question can begin a learning record; none automatically becomes a validated procedure. DK-05 keeps the observation, explanation, supporting source, permitted context, technical decision and publication decision distinct.

The supplied HTML can be opened directly in a modern browser. It embeds its styles, fonts, icons, fixtures and JavaScript, with no runtime library download or external service request. Browser storage must be available to retain changes. If local saving is unavailable, the application shows the failure and keeps the proposed state in the open tab. Browser handling of storage for local files varies; native behaviour has not been verified in this environment.

| Package item | Included content |
|---|---|
| Standalone HTML r01 | Six connected views, synthetic identities, twelve fixtures, dialogs, evidence inspections, reader presentation, local commands and recovery controls |
| This Markdown report | Detailed inventory of behaviour, information fields, roles, workflow rules, sources, implementation, checks and limits |
| Maintained source | Template, scoped stylesheet, fixture catalogue, workflow model, controller, canonical hashing utility and source manifest |
| Deterministic builder | Assembles the standalone artifact and refuses changed pinned reuse sources |
| Verification scripts | Executed model and DOM integration scripts; a separate native-browser follow-through script supplied for an unrestricted environment |
| Handover records | Design decision, retained build plan, evidence record, latest-family index entry and document-register entries |

The earlier DK-03 and DK-06 work is treated as completed predecessor design work. DK-05 does not rebuild those modules. It respects their actual delivered boundaries: OUT-18 and a knowledge-specific supported template are not connected by this increment.

## 2. Scope and design conformance

| Required declaration | Delivered treatment |
|---|---|
| Existing scope identity | **DK-05 — Knowledge authoring, review and learning intake**, retained from HTML Page Coverage Register r06 |
| Parent scope | DOC-01–DOC-06 retained; DOC-04 is the principal knowledge requirement and DOC-06 the confidentiality/access relationship |
| Supporting traceability | Product quality C04; DK-04 links to ENG-07 and SVC-06; broader AT-20/AT-37 acceptance remains separate |
| Primary r20 page type | **Work queue + persistent detail** for intake triage |
| Supporting page types | Form / guided workflow for drafts; Document & evidence workspace for sources; Review / comparison for technical decisions; Record detail for publication and history |
| Shell boundary | Module interior only. No second application masthead, global search, product navigation or authentication system |
| Reused assets | Exact DK-04 embedded Roboto and icon assets; adapted DK-04 controls, colours, article references, source/context presentation and inspection pattern |
| Source authority | Current user instruction authorises the build. Maintained repository requirements and decisions retain authority. Workflow composition, fixture policy and identities are proposed design |
| Incoming handover | Permitted original learning or missing-guidance request; exact source revision; observation; equipment/software/growing context; confidentiality; owner and due date |
| Outgoing handover | Exact article, technical decision and publication identities; local reader projection; exact citation; prepared owned source/usage/output follow-up |
| Exceptions | Incomplete context, unavailable or changed source, source scope mismatch, returned correction, hypothesis, missing policy, restricted scope, missing revision, failed save, corrupt state, stale storage and unknown publication outcome |
| Departures | Six-view composition, synthetic role/date controls, 328 px persistent worklist detail, expandable inspection and a wider reader inspection are proposed DK-05 adaptations |
| Verification | Executed model and DOM evidence; deterministic build and repository assurance. Native browser, visual/device review, operational policy approval and application acceptance are separate |

The existing module ID and parent requirement IDs are unchanged. No accepted UI baseline is promoted by delivering this file. The r20 lineage is grounded in the inspected DK-04 source package; no fresh rendered theme-board comparison is claimed.

## 3. Workspace structure and navigation

The module title is **Knowledge authoring**, with the local DK-05 identifier and design revision. A clearly labelled synthetic-preview strip shows the selected identity and the evaluation date. The header provides scoped review export, help and preview options.

| View | Main information | Main actions |
|---|---|---|
| **Intake & worklist** | Searchable learning catalogue, task counts, predefined views, owner, due date, next action and persistent selected-item detail | Capture learning; assign/clarify/close intake; retain duplicates; inspect evidence; open article |
| **Article draft** | Identity, purpose, observations, reasoning, stable guidance sections, source mappings, limits, audience, review dates and private author note | Save; add/reorder/remove sections; submit exact revision; create successor |
| **Sources & applicability** | Exact sources, required/contextual designation, section mappings, source holds and five-dimension context comparison | Inspect evidence; edit draft source set; edit explicit allowed values; compare context |
| **Technical review** | Frozen submission, predecessor comparison, findings, author responses and retained decisions | Record finding; return/decline/retain hypothesis/accept; respond; accept correction |
| **Publication & usage** | Exact review/publication identities, readiness, uncertain operation, reader preview, retained usage and receiving boundaries | Publish; reconcile; withdraw; inspect usage; prepare source/impact/OUT-18 follow-up; record feedback |
| **History & follow-up** | Retained revisions, dated events, technical decision history, feedback dispositions and prepared owned actions | Open exact revision; review feedback; link an eligible successor; inspect follow-up |

The hash route retains the view, article, explicit revision when selected, search text, predefined worklist view and comparison context. Exact revision selection never silently falls back to the newest revision. Missing article and missing revision routes have their own unavailable states. Sort order and preview identity are in-tab choices rather than persisted user preferences.

The reader identity receives a reduced three-view navigation and a published-article catalogue. It does not receive the intake sidebar or newer working-draft titles. No-access mode replaces the workspace with a scope-denied state.

## 4. Intake and worklist

### Worklist content

Four selectable summary tiles cover new learning, awaiting review, ready to publish and review attention. Counts are computed from permitted synthetic records. A partial-read scenario explicitly labels counts as fixture response counts, rather than proving completeness of an external source.

Search considers the article reference, intake title, original source/origin reference, topic, derived state and next action. It is a local text filter, not semantic search. Predefined views are All work, My work, New learning, Needs information, Ready for review, Returned, Ready to publish and Review attention. Sorting is by due date or title. These are supplied filter choices; the module does not create personal saved-view definitions.

The desktop worklist shows each learning/article reference and current revision, title, origin, derived state, owner, next action and due date. Selecting a row updates the persistent detail. Opening the record moves to its article workspace. On narrower layouts, the dedicated open action provides access to the record when the persistent sidebar is removed.

### Capturing and triaging learning

A new learning record captures:

- Learning title and original observation.
- Exact origin reference and origin revision.
- An exact evidence source selected from the supported fixture catalogue.
- Accountable owner, or an explicit unassigned state.
- Recorded equipment and growing context selected from the fixture contexts.
- Due date.

Capture is available to the contributor and author identities. Repeating the same origin reference and title reopens the original record, preventing duplicate local capture of that exact intent. This is a bounded prototype duplicate rule, not a production fuzzy-match policy.

Manage intake permits owner, due date, state, recorded context and clarification text to be changed with a required reason. Earlier context and triage details remain in intake history. The supported active states are New, Assigned, Needs information and Linked to draft. These triage labels are editable independently; a label does not itself create or approve an article.

Closing requires a retained disposition. Linking a duplicate requires another permitted receiving record and a reason; the contribution remains available rather than being deleted. A closed intake cannot create its initial draft. The design deliberately separates closing a contribution from withdrawing any published article.

## 5. Article authoring

The draft editor is structured into four sections:

| Editor section | Fields and controls |
|---|---|
| Identity & purpose | Title; reader summary; article type; proposed evidence classification; topic; intended audience |
| Observation & reasoning | What was observed; what the evidence supports |
| Bounded guidance / learning | Stable section IDs; section title; guidance text; exact supporting source; add, move up/down and remove |
| Limits & review context | Stop/escalation conditions; review due date; expiry date; private author note; required change summary |

Article types are Troubleshooting, Procedure and Lesson learned. Proposed classifications are Validated procedure, Reviewed lesson, Suspected fix and Working note. Choosing a classification expresses the author's requested outcome. It is not independent validation.

The supported publication audience is **Internal technical team**. The deliberately unsupported customer-audience choice demonstrates a readiness refusal. Actual customer publication is not implemented.

Sections retain stable identities during reordering. Removing a working section requires a reason. The current editor assigns one exact source per section; the underlying section representation is an array, but a multi-source-per-section editing control is not included. Adding, reordering or removing sections saves a working draft update, including the currently entered fields. There is no rich-text editor, attachment upload, inline image authoring or automatic technical-content generation.

Drafts can be saved while incomplete. Submission readiness identifies missing purpose, observation, reasoning, stop conditions, owner, intake context, explicit applicability, dates, source mappings or eligible required evidence. An unrelated source count does not meet the requirement for a mapped required source on each section. Automated checks establish structural and explicit-scope completeness; a technical reviewer remains responsible for whether the evidence actually supports the written claim.

Submitting freezes the exact article body and its SHA-256 identity. Direct editing of a submitted or decided revision is refused. Returned, Accepted, Declined or Hypothesis retained revisions can start a successor. The successor retains a predecessor link and a new revision identity, while earlier submissions and decisions stay unchanged. Review and publication do not transfer to the successor.

The private author note is retained in local state for the owning author's editor. It is omitted from the reader projection and scoped review JSON. Its exclusion does not make the standalone HTML a secure container for real confidential information.

## 6. Sources and applicability

### Exact evidence

Each source has an internal version ID, readable reference, revision, title, section, retained fictional excerpt, explicit applicability, review date, expiry, classification, reviewer, provider and SHA-256. Source observations separately record current availability, whether a newer source has changed the basis, the observation date and an explanation.

The source itself is not overwritten when its observation changes. A required source becoming unavailable or changed causes a hold. No newer source version is silently substituted for a missing exact version. When availability is unavailable, the UI retains recovery metadata and suppresses the evidence excerpt.

Draft source selection distinguishes **Required supporting evidence** from **Contextual reference**. Removing a source clears its section mappings and requires the author to retarget affected sections. Required-source readiness checks availability, current observation, reviewed status, expiry, intended-reader confidentiality and coverage of every explicitly allowed article value.

A source can be inspected in a right-side panel. The panel includes its exact reference, review and expiry information, classification, retained hash and observation note. Expand inspection provides a wider reading surface without creating another source record or replacing the selected revision.

### Five independent dimensions

| Dimension | Example permitted article values | Example exception |
|---|---|---|
| Equipment model | SYN AquaControl A2 | A different model |
| Firmware | 2.4.1, 2.4.2 | 2.5.0, or no recorded version |
| Control software | GrowDesk 6.2 | A required source covers GrowDesk 6.0 only |
| Facility / growing area | Tunnel | Propagation house |
| Crop & growing stage | Blueberry · fruiting | Seedlings · propagation |

Values use exact membership. The module does not infer semantic version ranges, inherit compatibility or interpret an empty set as all contexts. A known mismatch yields **Outside scope**; an unknown value yields **Context incomplete** unless another dimension already establishes a mismatch; complete matching values yield **Matches context**.

Article and required-source applicability are checked independently. A matching article scope cannot repair a source with incompatible software or firmware. Classification, review currency, publication and context match remain distinct facts in the reader presentation.

## 7. Technical review and corrections

The Technical review view presents the exact selected submission, submitting identity, submission date, requested classification, audience, retained content identity and readiness findings. A predecessor comparison identifies changed or unchanged title, summary, classification, scope, audience, source links, sections and review dates. It compares retained snapshots, rather than a moving latest record.

The reviewer can record a finding against applicability or a stable article section. A finding has text, a blocking/advisory flag, author ownership, original reviewer and date. Positive technical acceptance is blocked by unresolved blocking findings.

The author responds against a specific revision and body digest. A response is not its own resolution. The reviewer must independently accept the current response before it can satisfy a blocking finding. If content changes after the response, that response no longer satisfies the current digest; it remains visible as earlier evidence.

| Technical outcome | Result |
|---|---|
| **Accepted** | Exact review decision retained after readiness and blocking-correction checks; independently publishable only if later checks still pass |
| **Returned** | Exact original submission retained; author prepares a corrected successor |
| **Declined** | Decision and rationale retained; a later proposal requires its own successor and review |
| **Hypothesis retained** | Observation retained with uncertainty; not accepted as a validated procedure or eligible for this publication path |

All decisions require a rationale. The author identity lacks review capability, and reviewer commands also refuse the submitting actor as reviewer. A fixture without configured policy cannot acquire a positive review through a permissive fallback. These are demonstration role rules, not a competent-person register or real organisational delegation.

## 8. Publication, withdrawal and recovery

The publisher acts on an exact accepted revision. Readiness is evaluated again at publication, including evidence, scope, audience, current review dates, configured policy and exact decision binding. An Accepted label alone is insufficient if required evidence has changed since review.

Internal publication stores its own identity, article/revision, technical decision, content digest, audience, publisher, date and original operation. It makes the local reader projection available. It does not generate an OUT-18 document, issue an output, send it, prove delivery or record an acknowledgement.

### Interrupted publication

The publication dialog includes an explicitly labelled interruption demonstration. Selecting it retains the original operation as **Outcome unknown** and creates no confirmed publication. The UI holds repeat publication and successor creation until that original operation is reconciled.

Reconciliation uses the retained original revision and digest, rechecks current readiness, and returns one original publication result. Repeating a completed reconciliation returns the same result. Repeating a successfully completed publication intent also reopens its original result. If the source changes while the outcome is unknown, reconciliation stays held; it cannot substitute corrected content.

This is local operation modelling. There is no server receipt lookup, durable remote transaction or background reconciliation service.

### Later changes

A changed/unavailable required source, overdue article review or expired article produces a **Held** current-use state. The historical positive review remains an exact record. The publisher can add a reasoned **Withdrawn** event. Earlier publication content, decisions, pack references and acknowledgements are retained.

Publishing an accepted successor adds a **Superseded** event to prior active publication records and records the successor revision. It does not rewrite their content or move earlier review evidence. Repeating a withdrawal is refused rather than adding duplicate withdrawal events. Interrupted-outcome recovery is implemented for publication; a separate uncertain-withdrawal workflow is not implemented in r01.

Review due today remains current under the fixture convention; the next day is overdue. All checks use the explicit preview date shown in Australia/Brisbane context. It is a deterministic date-only scenario, not a production timezone or timestamp service.

## 9. Reader projection and exact references

Preview as reader opens a bounded article presentation with:

- Readable article reference and exact revision.
- Title, summary, type and technical evidence classification.
- Separate review currency, applicability and publication labels.
- Observed situation, evidence-supported reasoning and numbered guidance sections.
- Stop/escalation conditions.
- Permitted source references, retained excerpts when available, source applicability and source warnings.
- Review date, review due date, expiry and evaluation date.

A caution remains visible whenever the article is not a current, matching, published validated procedure. A Reviewed lesson keeps that classification and is not treated as a validated procedure merely because it is published. A held, withdrawn or superseded publication remains available as historical context with its state exposed.

The **Exact reference** control provides selectable citation text containing the article ID, revision, title, SHA-256 and current classification/publication/applicability. It does not claim clipboard success; the user can copy the text. The reference does not silently follow the newest revision.

The DK-04 receiving preview is embedded in this DK-05 file. The existing DK-04 HTML and its separate catalogue are unchanged. No cross-file data exchange, bookmark synchronisation or application search indexing is delivered.

## 10. Usage, feedback and follow-up

### Known usage

The publication view lists fictional known usage against an exact article revision. Each usage record identifies the receiving issued pack, receiving owner, observed date, completeness flag, retained bytes, digest and original crew acknowledgement. Inspect retained content shows those original facts.

One fixture has a partial usage response. It explicitly says that known references cannot establish that no other records are affected. Other zero-result statements are limited to the complete synthetic fixture catalogue; they are not represented as live cross-system searches. Preview options can change the usage-completeness label for existing fixture usage records.

### Owned actions

Source reassessment, affected pack follow-up and OUT-18 capability handover are prepared with a receiving target, accountable owner, optional due date, reason and originating article/revision. Their status is **Prepared locally**. The same target and origin reopen an existing follow-up rather than creating a duplicate local action. For usage, the origin is the retained usage identity; for a new demonstrated source-review event, the origin includes that event identity.

The receiving person is not notified. The receiving pack, service record, task system or output centre is not changed. Prepared local follow-up is deliberately not labelled Sent, Received, Accepted or Converted.

### Feedback

Reader feedback captures an exact revision/digest, feedback category, observed context, text, date and author ownership. Categories are Possible error, Context mismatch, Source changed and Improvement suggestion. Capturing feedback does not change the technical classification or validate a suspected fix.

Author and reviewer identities can record an additive disposition: Under review, More information needed, Closed with reason or Linked to successor. A successor link must point to a later retained revision of the same article. Original feedback and its context remain intact, with reasoned disposition history. This is not a messaging or notification facility.

## 11. Identities and permission demonstrations

| Preview identity | Demonstrated capabilities | Boundary |
|---|---|---|
| SYN Casey · Contributor | Capture/manage permitted learning and provide feedback | Cannot edit article drafts, grant technical acceptance or publish; restricted article excluded |
| SYN Alex · Knowledge author | Intake, owning draft edits, submission, finding response, feedback disposition and follow-up | Cannot approve own submission or publish |
| SYN Morgan · Technical reviewer | Findings, current correction acceptance, exact technical decision, feedback disposition and follow-up | Does not edit the author's content or publish |
| SYN Jordan · Knowledge publisher | Exact publication, original-outcome reconciliation, withdrawal and follow-up | Cannot replace technical acceptance or override source holds |
| SYN Riley · Internal reader | Published exact article catalogue, reader presentation and feedback | Drafts, intake detail and private notes are omitted |
| No permitted scope | Denied workspace and empty scoped review export | No record titles, excerpts, counts or selected-detail residue |

The restricted customer-evidence fixture is visible only to author, reviewer and publisher. Its required source is still unsuitable for the broad internal reader audience, so visibility to a reviewer does not authorise publication.

All embedded source data is fictional and inspectable in the HTML or local state. Identity switching and filtered views demonstrate the intended receiving behaviour; they are not authentication, encryption or server access control. Real restricted information must be filtered before a future server sends it to the browser.

## 12. Synthetic catalogue

The initial evaluation date is **17 September 2026**. All names, equipment, references, software labels, observations and technical statements are fictional. The guidance concerns evidence capture and handover, not real operating settings or repair instructions.

| Fixture | Initial situation | What it demonstrates |
|---|---|---|
| A01 · Intermittent irrigation readings | Needs information; firmware unknown; no article yet | Clarification, intake history and the complete author/reviewer/publisher journey |
| A02 · Possible connector movement | Draft suspected fix | Uncertainty retained; hypothesis cannot become validated through ordinary acceptance |
| A03 · Crop-window handovers | Accepted Reviewed lesson | Publication preserves lesson classification |
| A04 · Climate review | Draft article with a wrong-software supporting source | Matching article context cannot override source mismatch |
| A05 · Screen drive history | Exact manual unavailable | Recovery metadata retained; unavailable evidence blocks submission |
| A06 · Customer-specific evidence | Restricted article and source | Permitted inspection remains distinct from broader publication rights |
| A07 · Missing guidance | Unassigned DK-04-origin request with no draft | Explicit owner, request lineage and triage before submission |
| A08 · Returned lesson | Returned exact revision with blocking scope finding | Corrected successor, retained finding, response and independent acceptance |
| A09 · Published guidance | Published revision with changed required source and issued-pack usage | Current-use hold, withdrawal, owned impact and unchanged pack history |
| A10 · Publication interrupted | Accepted revision with unknown original operation | Original result reconciliation without duplicate publication |
| A11 · Screen Systems learning | No configured review/publication policy | Missing policy held rather than silently defaulted |
| A12 · Review due today | Published current revision, due today, partial usage response | Date boundary, unknown impact completeness and retained exact pack bytes |

The common comparison contexts are Willowbank Berries Tunnel 04, the same tunnel with changed firmware, the same tunnel with unknown firmware and Cedar Nursery Propagation House 02. These are scenario choices, not imported customer or installed-base records.

## 13. Recommended walkthrough

1. Open the HTML as **SYN Alex · Knowledge author**. Select the irrigation-readings intake, choose Manage intake, set the recorded context to Tunnel 04, supply a reason and save.
2. Open the article workspace and create a draft. Inspect Sources & applicability. Return to Article draft, adjust the bounded explanation and save.
3. Submit the exact revision. Change preview identity to **SYN Morgan · Technical reviewer**. Record a blocking applicability finding and return the submission with a rationale.
4. Change to Author, create a corrected draft, change the explanation and save. In Technical review, respond to the finding. Submit the successor.
5. Change to Reviewer. Accept the current correction with a reason, then record technical acceptance. Notice that no publication has yet been created.
6. Change to **SYN Jordan · Knowledge publisher**. Open Publication & usage. Publish with the interruption option selected, then reconcile the original outcome. The result is one retained publication.
7. Open the reader preview and exact reference. Use Preview options to mark the required source Changed. Inspect the resulting hold and prepare source review. Withdraw with a reason if appropriate.
8. Open A09 to inspect a previously issued pack and prepare an owned impact action. Its bytes and earlier acknowledgement remain unchanged.
9. Change to Reader, open A12 and record feedback. Change to Author and use History & follow-up to record the disposition.
10. Export a scoped review copy if needed. Use Preview options → Reset this demonstration only when intentionally replacing the DK-05 local working state.

A shorter route begins with A08 for correction, A10 for reconciliation or A09 for changed-source impact. The built-in Help dialog supplies the principal journey without requiring this report.

## 14. Persistence, exports and exception states

Local state uses the namespaced key `ppo.dk05.knowledge-authoring.r01.state`, schema version 1. Saves validate the proposed state and retain body/source/usage identities. Normal business actions compare the in-tab stored base with the current saved bytes before writing, and model commands require the expected state version.

| State or failure | Observable treatment |
|---|---|
| Unsaved draft fields | Local unsaved indicator; navigation/identity changes require deliberate discard; browser-unload warning requested |
| Failed save | Proposed state retained in the current tab; further business actions paused; Retry same save writes that state without repeating the command |
| Newer storage version | Stale action refused; unsaved draft fields retained; user can export in-tab review before explicitly loading the saved version |
| Malformed or incompatible local state | Original readable bytes retained; writes paused; retained-data download and deliberate module reset offered |
| Read response Partial | Records remain visible with incomplete-response warning |
| Read response Loading, Failed or Empty | Distinct labelled response state with retry/finish control; stored records remain unchanged |
| No search matches | Filter-specific empty state and Clear filters; distinct from a failed request |
| Missing exact article/revision | Unavailable state; no latest-record substitution |
| Unsupported policy/audience/source basis | Readiness reason remains visible and consequential action is refused |
| Unknown publication outcome | Original operation retained and repeat held pending reconciliation |

The preview controls simulate read and source observations; they are not failures produced by a live provider. localStorage comparison is advisory concurrency handling, not an atomic database compare-and-swap or a cross-tab transaction lock. A simultaneous interleaving between comparison and write remains a production receiving obligation. Reloading or closing a tab after a failed write can lose the in-tab state; the UI does not call it durably saved.

**Export review** downloads a scoped JSON review copy. Authoring exports omit private notes; reader exports contain published reader projections; denied exports contain no records. If an author has unsaved form edits, those current fields are included in the scoped review copy and labelled accordingly. The export is explicitly not an importable backup. The separate retained-data recovery download is only offered for unreadable saved-state recovery.

The file makes no network request. There is no service worker, remote sync, multi-user transaction service, image uploader or source-system write. A standalone file copied to another location can have a different browser-storage context.

## 15. Design, accessibility and responsive behaviour

The visual language follows the retained DK-04/r20 lineage: embedded Roboto 400/500/700, navy `#242a37`, green `#62bb46` accents, light workspace background `#f5f6f8`, neutral card borders, concise state pills and line icons. Primary decisions use dark buttons; status meaning is written in text as well as colour.

The wide workspace has a 1,600 px maximum width. The primary worklist pairs a fluid register with a 328 px detail area. Article and review views use a main column and contextual readiness/detail cards. The normal inspection panel is approximately 448 px wide; expanded evidence and reader inspection can use up to 780 px. Dialogs gather short decisions and reasons, while source/reader content uses side inspection.

Responsive rules are authored for tablet and phone widths. They collapse multi-column detail, replace the desktop worklist rows with compact labelled cards, reduce surrounding spacing, preserve horizontally scrollable view navigation and provide larger form text on phones. They are **implemented CSS intentions, not verified device measurements**.

Accessibility provisions include native controls, labelled fields, named dialogs, a skip-to-workspace link, a main landmark, focus-visible styling, focus restoration after inspection, polite save/status feedback, an alert region for dialog errors and button-based section reordering. Reduced-motion and print treatments are present. Native focus trapping/Escape behaviour relies on the browser's dialog implementation. The DOM harness supplies dialog shims and therefore does not prove native keyboard behaviour.

No WCAG conformance, screen-reader acceptance, complete keyboard journey, zoom/reflow acceptance, print-layout acceptance or visual/device approval is claimed. These remain specific checks to execute with the supplied native harness and human inspection.

## 16. Technical construction and retained evidence

The module follows the existing dependency-free standalone design pattern. It introduces no application dependency, framework, route, database migration or deployment service. Existing repository architecture remains unchanged; a framework-based application page was not selected for this design deliverable.

| Source file | Responsibility |
|---|---|
| `template.html` | Document structure, local regions, named dialogs and assembly markers |
| `workspace.css` | Module-scoped components, typography, layout, responsive and print rules |
| `fixtures.js` | Twelve synthetic records, sources, role definitions, contexts and initial history |
| `model.js` | Pure commands, capability/readiness checks, state validation, reader projection, operation recovery and export filtering |
| `workspace.js` | Rendering, navigation, forms, persistence, event handling and demonstrations |
| `utils.js` | Canonical JSON representation, cloning and actual SHA-256 |
| `source-manifest.json` | Inspected source commit, build-plan digest and exact reused-source hashes |
| `scripts/build-knowledge-authoring.py` | Source guard, deterministic assembly and output hash reporting |

The maintained source directory is `docs/design/knowledge-authoring/`. The generated deliverables are in `docs/reference/ui/knowledge-authoring/`.

The build baseline is main commit `16ff789990122eb2af23a70aa3f0e2bd5bf289c0`. The earlier build plan used `636a604b97342507bdab8f1ef405e8636cce429b`; the build refreshed the repository and reused the newer available predecessor sources. The contribution was subsequently reconciled onto main `86802e9cbaa7f0f72a5108018802a3d95e0a4285`; reused source bytes were unchanged. The plan's issued bytes are retained with SHA-256 `4d8eb7908d38739ff4a999c2da3f3c3185c82cf0898595a24ee7c0d1e184dde8`.

Content identities are computed, not decorative fixture labels. Canonical article-body digests bind submissions and decisions; source digests bind retained source objects; usage digests bind actual retained text. Tests compare the SHA-256 implementation against Node's trusted implementation, including multibyte text. A hash establishes identity, not source truth, reviewer competence, an electronic signature or permission.

The model retains articles, intakes, revisions, source records/observations, findings/responses/dispositions, review decisions, publications/events, original operations, usage snapshots, feedback/history, follow-ups and activity events. It validates important record links and hashes before accepting a command. It is a prototype integrity check, not a comprehensive hostile-data schema validator or server audit system.

## 17. Interfaces and receiving responsibilities

| Receiving or originating area | Represented in DK-05 | Responsibility retained elsewhere |
|---|---|---|
| DK-04 Knowledge Search & Article Detail | Missing-guidance origin fixture; exact reader projection and citation | Live search, bookmarks, catalogue publication, permissions and runtime reader integration |
| DK-01/DK-02 Document Register & Linked Library | Exact source version, review context, availability and source-change observations | SharePoint document authority, underlying source review, content access and actual source retrieval |
| DK-03 Output, Issue & Distribution Centre | Prepared OUT-18 capability handover with exact article context | Supported rendering, formal issue, distribution attempts and recipient responses; OUT-18 is not enabled here |
| DK-06 Template Management | Explicit supported-template receiving boundary | Knowledge-template definition, review/publication, schema and renderer compatibility; no new template registration |
| Service and field work | Reviewed service-origin learning and retained issued-pack citations | Work authority, scheduling, physical intervention, service closure, original pack issue and crew acknowledgement |
| Engineering | Source-linked technical findings and bounded scope | Engineering release, calculations, competency and native CAD authoring |
| Owned task/notification facilities | Prepared local follow-up records | Actual task creation, delivery, receipt, assignment acceptance and reminders |

No article publication resolves a service case, closes a corrective action, changes an estimate, authorises a shutdown or repairs equipment. Knowledge availability and operational authority remain separate.

## 18. Verification and evidence

The executed checks use **Node 24.21.0**. Repository dependencies were installed with **npm 11.19.0**. The DOM-only tool was **jsdom 26.1.0**, installed separately for verification; it is not an application or HTML dependency. Repository Playwright is 1.63.0.

| Verification | Actual result | Evidence / limit |
|---|---|---|
| Pure workflow model | **44 groups passed** | Initial integrity, digest agreement, intake, owner/context/source holds, exact submission, role separation, correction, publication recovery/replay, successor, date boundary, historical usage, filtering, feedback and corruption |
| Generated HTML DOM integration | **33 groups passed** | Full connected journey, real generated markup/handlers, source inspection, route errors, reader filtering, conflict retention, failed-save retry, read scenarios, unsafe-text escaping and named controls |
| JavaScript lint | **Passed for all new model/controller/fixture and verification files** | Repository ESLint; no broad disable rule introduced |
| Deterministic build | **Passed** | Repeated assembly produces identical bytes; pinned source mismatch refusal exercised |
| Foundation, prototype and naming assurance | **Passed** | Repository documentation assurance; does not establish business acceptance |
| Native Chrome startup | **Blocked before a page was opened** | Chrome 153.0.8010.47 failed on local socket creation with `Operation not permitted`; policy rejected escalation |
| Native browser and visual/device checks | **Not executed** | Follow-through harness supplied; no screenshots or native success claims |
| Application integration, live systems and owner acceptance | **Not executed / not included** | No runtime route, migration, external transaction, message or deployment |

Model checks are distinct from the build plan's K01–K40 scenarios; the numerical counts are not an assertion that all forty planned acceptance procedures were executed. The adjacent evidence record maps the delivered assurance to the main risks and retains the actual output files.

Defects corrected during construction included a seeded pack reference with an outdated article digest, reader worklist exposure of working/intake details, unavailable-source excerpt display, stale-save handling that could discard unsaved form fields, and a restricted-source intake selection gap. Final checks exercise the corrected implementation. Two early DOM assertions were adjusted to match the actual search field coverage and jsdom's lack of automatic pointer focus; these were harness assumptions, not product failures.

## 19. Plan reconciliation and remaining work

| Planned area | Delivered state / deliberate limit |
|---|---|
| Twelve fixtures and six-view primary journey | Implemented, including return/correction, independent response acceptance, publication recovery, holds and feedback disposition |
| Exact evidence and five-dimension applicability | Implemented with exact-value membership; semantic version ranges and broad-scope inference excluded |
| Section-to-source evidence | Required/contextual mapping implemented; current editor supports one mapped exact source per section |
| Content corrections and predecessor comparison | Implemented for retained structured fields and sections; no rich-text diff or attachment comparison |
| Publication/withdrawal/supersession | Implemented locally; original uncertain-operation recovery applies to publication, not a separate uncertain-withdrawal command |
| Confidentiality demonstration | Scoped UI and exports implemented; standalone embedded data remains inspectable and synthetic |
| Known usage and owned impact | Fixture references and prepared follow-up implemented; no live usage discovery or receiver acknowledgement |
| Missing/failed/partial/empty responses | Labelled scenario controls implemented; no provider pagination, network retry/backoff or provider-specific diagnostics |
| Persistent local recovery | Version/base checks, corruption retention and failed-save retry implemented; no atomic multi-tab transaction or durable server receipt |
| Evidence inspection/full detail | Docked inspection with an expansion control; no independent full-page source route |
| Native layout, keyboard and visual checks | Supplied harness; blocked in this environment and explicitly pending |
| OUT-18 and knowledge template integration | Prepared capability handover only; no new renderer, issue path or template registration |

Before production implementation, the receiving application needs authoritative actor permissions and reviewer competence, source access filtering, content/retention policy, review and expiry rules, an exact transactional command/receipt contract, live usage discovery, approved template/output capabilities, and integration with the application's existing domains. These are receiving requirements, not additional scope silently implemented by the prototype.

Before adopting a visual baseline, run the native harness, inspect the resulting desktop and phone captures, exercise real keyboard and assistive-technology behaviour, and record the owner's screen/device decision. Passing the current model or DOM suite does not close these items.

## 20. Source register and maintenance

The retained build plan is `docs/delivery/knowledge-authoring-build-plan.md`. The design handover is `docs/decisions/knowledge-authoring-review-learning-design.md`; actual evidence is `docs/testing/evidence/knowledge-authoring-r01/README.md`.

| Source | Use in this increment |
|---|---|
| HTML Page Coverage Register r06 | Existing DK-05 identity, dependency and parent scope |
| BP-01 master blueprint and Product Quality C04 | Knowledge purpose, DOC parent set, evidence/learning and OUT-18 relationship |
| HTML module conformance r01 | Module shell boundary, r20 page-type declaration, reused components, handovers and baseline separation |
| DK-04 source, report and design handover | Fonts, icons, reader semantics, independent classification/currency/applicability and exact source context |
| DK-01/DK-02 design handover | Document authority, source inspection and source-owned recovery boundary |
| DK-03 source and completed handover | Exact issue/receipt semantics and actual SHA-256 utility; unsupported OUT-18 boundary |
| DK-06 completed handover/report | Separate template and content approval; supported renderer/definition boundaries |
| Document, issue and distribution contract | Original identity, retained historical evidence and distinct distribution facts |
| ADR-0003 and BP-02 architecture | Existing application architecture; this standalone design adds no new runtime technology |
| PPO-STD-001 and repository guidance | Naming, retained versions, source traceability, reviewable branch and accurate verification claims |

All repository references in this source register are available under the [inspected baseline tree](https://github.com/deanrfiedler-gif/powerplants-one/tree/16ff789990122eb2af23a70aa3f0e2bd5bf289c0). Exact reused-source hashes and assembly lineage are retained in `source-manifest.json` rather than inferred from a filename.

Maintain the source files and regenerate the HTML; do not hand-edit the issued generated artifact. Run the model and generated-DOM checks after behaviour changes. For a substantive correction after adoption, issue a new artifact revision and preserve the previous reference. Code delivery, executed design checks, owner acceptance and application integration must continue to be recorded separately.
