# Powerplants One — Engineering module audit

**Review date:** 10 September 2026  
**Reviewed baseline:** PPO-Engineering-Container-r01.html  
**Revised deliverable:** PPO-Engineering-Container-r02.html  
**Scope:** Standalone engineering module container, using fictional projects and people.

## Recommendation

**Keep the current page structure, refine its interaction quality and engineering terminology, and expand it selectively.** The register, filtered work views and package drawer provide a sound foundation. The largest weaknesses were functional reliability and the meaning of engineering records: revision, source version, technical checking, review and formal issue needed clearer separation.

R02 implements those refinements and adds a bounded technical-query view and a working review-request demonstration. It retains the established Powerplants One visual language and the container-only scope.

The next substantial increment should connect controlled document references and previews to the real project workflow. Workload planning, detailed change management and materials handover can follow once the core document and review process is agreed.

R02 is suitable for design and workflow review. It is an interactive prototype; it does not provide live engineering approvals, file access or durable operational records.

## What was examined

The audit covered the actual r01 HTML and JavaScript, rendered browser behaviour, information architecture, synthetic engineering records, interaction states, keyboard behaviour, responsive embedding and alignment with the supplied reference designs.

References examined included the Leads, Projects Gantt and Field Technicians HTML files, the supplied module screenshots and the Powerplants Australia brand guidelines. The brand typography and colour guidance confirms Roboto, dark navy `#242a37` and green `#62bb46`. The revised container retains the embedded reference font, restrained backgrounds, compact controls and familiar table treatment.

Findings below distinguish defects reproduced in the browser from issues identified through source inspection. This was not a live SharePoint integration test, a formal accessibility certification, a security penetration test or an assessment of engineering calculations.

## Findings and changes

Priority indicates significance to the intended workflow: **High** can prevent normal use or misrepresent an engineering record; **Medium** affects reliable interpretation or task completion; **Low** concerns polish and consistency.

| Priority | Finding in r01 | Evidence and impact | R02 treatment |
|---|---|---|---|
| High | Engineer and discipline choices were malformed. | Source inspection found missing opening option tags. In the browser, the engineer selector exposed only “All engineers”; selecting a named engineer failed. | Rebuilt the filter and request selectors with complete option elements and explicit values. Named-engineer and discipline filtering now work. |
| High | An unsubmitted review note could disappear. | Reproduced by entering a note, switching drawer tabs and returning. Re-rendering replaced the textarea. | Retains a separate note draft for each package throughout page navigation, including closing and reopening the drawer. |
| High | A new-request draft was cleared when reopened. | The form was reset whenever the request dialog opened. | Preserves entered fields when cancelled or closed; resets only after successful creation. The preview still resets on reload. |
| High | New requests could imply events that had not occurred. | Generic history and defaults could imply earlier acceptance, an assigned reviewer and a revision before deliverables existed. | A new request has its actual preview creation event, an unassigned reviewer/revision, undefined deliverables and an optional package deadline. |
| High | Issued records depended on current working data. | Issue output lists were assembled from the current document set, with inferred revision/file details. That weakens the meaning of an earlier issue. | Explicit issued manifests hold document numbers, output filenames, revisions, source versions, purpose, issuer, recipient and response. They are separate from current working documents. |
| High | “Ready”, checked and issued could be confused. | Aggregate readiness did not establish what had been technically checked or what use an issued set permitted. | Counts are calculated from document records and labelled “checked”. Working revision, latest issued revision and issue purpose are presented separately. |
| Medium | Review requests did not demonstrate a complete useful workflow. | The action either stopped at a preparation message or lacked a meaningful successful transition. | A prepared package can record a reviewer, due date and scope; the request captures document references, changes status to “In review”, updates the next action and records an event. |
| Medium | Different deadlines shared one date. | Package, next-action and review commitments could appear to have the same deadline by construction. | Stores and displays package required date, action date and review due date separately. Missing action dates remain visible. |
| Medium | The attention count could disagree with the filtered list. | The count did not consistently use the current engineer/discipline/search scope. | Calculates the attention count within the current view and filters. The attention toggle then narrows that same set. |
| Medium | Empty-state recovery changed the user's context. | Clearing filters could switch back to all packages unexpectedly. | Clear filters retains the selected view. Returning to all packages is an explicit action when appropriate. |
| Medium | Technical questions lacked enough context. | A general note did not clearly retain the affected revision, responsible person, response date or design impact. | Added example technical-query records with those fields and open/answered status. This is a read-only query demonstration; notes remain available for additional comments. |
| Medium | Source files, published outputs and revisions were underspecified. | Generic documents did not sufficiently explain native model/drawing formats, output types, configuration or source versions. | Added a tailored drawing/model register and source-detail dialog. Native source type, published output, engineering revision, configuration, source version and issue relationship are distinct. |
| Medium | Responsive behaviour depended on the browser width. | A module embedded in a narrow area of a wide app could retain desktop styling; fixed-width dialogs could extend outside it. | Layout responds to the module's own width. Cards replace the table in compact containers. Drawers and information/request dialogs are constrained to the module. |
| Medium | Narrow filters and modal positioning needed further correction. | R02 visual testing found truncated filter choices and a scrollbar-width offset in an embedded drawer. | Filter controls now wrap onto usable rows, and dialog positioning accounts for the actual layout viewport. |
| Medium | Resizer accessibility values could drift from actual widths. | Initial and reset values did not always reflect measured columns; fixed table sizing could distort adjustments. | Uses measured widths, consistent limits and keyboard adjustment. Resetting restores the expected widths and reported values. |
| Low | User identity, navigation feedback and focus were inconsistent. | “My work” depended on an implicit person; re-rendered elements could break return focus. | Shows the preview actor, provides status feedback for recorded actions, and restores focus to the relevant package or dialog context. |
| Low | Visual density and document terminology could be more consistent. | Some repeated labels, mixed document names and detail presentation reduced clarity. | Preserved the familiar design, tightened row spacing, clarified revision labels and paired working/issued summaries. Internal detail actions use an internal-navigation icon. |
| Low | Some sample histories and source versions were inconsistent. | An issue could precede a synthetic acceptance event, or an older issue could carry a higher source version than the current example. | Corrected those fixtures so the illustrated chronology and version relationships are coherent. |

The issued manifests and review snapshots are fixed objects within this preview's memory. That is useful for demonstrating the intended behaviour, but does not establish production immutability, retention or audit security.

## What should remain in this page

The page should answer five everyday questions quickly: what needs engineering, who owns it, what is due, what is blocking progress, and which package or issued set should be opened.

The current primary columns support that purpose: work package, customer/project, engineer, status, checked deliverables, required date and next action. The All packages, My work, Reviews and Released views are worth retaining. Their badges describe the overall view; the result count and attention count describe the currently filtered results.

The drawer should remain the place for brief review, document identification, technical questions and concise activity history. This keeps the main register readable while allowing project managers and engineers to inspect the reasons behind a status.

The existing navy buttons, green active-view indicator, subtle status backgrounds, pale grey surfaces and embedded typography should remain. Large decorative charts or unrelated summary cards would consume space needed for package names and actions. The current page does not require a visual rebrand.

## Expansion priorities

| Order | Addition | User benefit | Recommended boundary |
|---|---|---|---|
| 1 | Real SharePoint document references and previews | Engineers and project teams can locate the correct model, render or drawing directly from its package. | Begin with stable file identifiers, permission-aware access, PDF/image previews and clearly labelled source/output relationships. Confirm the native CAD viewing route using actual customer files. |
| 2 | Controlled review and issue workflow | Makes responsibilities, decisions and permitted use explicit. | Define reviewer assignment, changes requested, review completion, authorised issue, withdrawal and supersession. Keep technical checking distinct from authority to issue. |
| 3 | Full technical-query workflow | Removes unanswered questions from informal notes and makes blockers visible. | Add query creation, responses, attachments, due dates and closure evidence. A query response should link to any resulting change request. |
| 4 | Engineering change and impact tracking | Helps teams understand how a revision affects procurement, fabrication, installation and cost. | Link changes to exact documents, affected tasks and an existing project variation/approval process. |
| 5 | Engineering workload and effort | Helps the lead engineer assign work and forecast delivery. | A dedicated workload view with planned/actual effort, availability and due dates; connect to the existing project schedule. |
| 6 | Materials and handover outputs | Gives procurement and site teams an agreed package of usable information. | Map approved BOM/output data to purchasing, and define installation and as-built handover requirements. Confirm ownership of item codes and material revisions first. |

A larger document workspace may become appropriate once actual models and drawings are connected. It can provide a preview canvas, revision comparison and document discussion while this register remains the entry page. R02 intentionally contains no fabricated CAD viewer or non-working file-opening buttons.

## Engineering information model to agree

These are separate records with different responsibilities:

| Record | Minimum information |
|---|---|
| Engineering package | Linked project/opportunity, brief, discipline, engineer, stage/status, required date, effort, next action and action owner/date. |
| Document/source | Stable reference, document number, native type, configuration where applicable, engineering revision, source version and related published output. |
| Review request | Exact submitted document/version set, requester, assigned reviewer, scope, due date, outcome and resulting actions. |
| Technical query | Question, owner, affected document/revision, response deadline, status, response and impact. |
| Formal issue | Exact retained output set, purpose, revisions, issuer, recipients, issue date, distribution/receipt evidence and supersession relationship. |
| Engineering change | Reason, proposed change, affected records and downstream work, decisions and approved implementation. |

A package-level revision is a useful summary. Before implementation, decide whether Powerplants issues every document at the same revision or allows mixed document revisions within an issue. The actual issue manifest must preserve the per-document values either way.

The prototype illustrates SLDASM/SLDDRW sources and published formats. A real document model should also accommodate parts, referenced components, configurations, PDFs, renders and any other outputs actually produced by the engineering team.

## SharePoint and integration implications

Microsoft Graph exposes a file-version resource and methods for retrieving metadata and downloading a specific version. That supports identifying a source version separately from an engineering revision. The recommendation to store stable item/version references alongside document numbers is a design inference from that capability. [Microsoft: driveItemVersion](https://learn.microsoft.com/en-us/graph/api/resources/driveitemversion?view=graph-rest-1.0)

Microsoft's preview action provides a temporary embeddable URL for SharePoint and OneDrive for Business items. Its documentation also states that previews run with the calling identity's permissions. The implementation should obtain previews in the appropriate user/access context and avoid treating temporary URLs as permanent document identifiers. This API documentation alone does not establish native SOLIDWORKS-format preview support; that must be verified with the selected viewer and real files. [Microsoft: driveItem preview](https://learn.microsoft.com/en-us/graph/api/driveitem-preview?view=graph-rest-1.0)

For the live integration, agree how model dependencies are collected, which source version produced each output, and how revised source files invalidate or trigger review of existing published outputs. A simple file path does not describe those relationships adequately.

## Verification performed

| Check | Observed result |
|---|---|
| Baseline preservation | r01 remained byte-for-byte unchanged. |
| JavaScript syntax | Final extracted script passed `node --check`. |
| Static markup | 56 unique static IDs, no unresolved static label/control references, and 30 explicit static option values. No external script, stylesheet or image dependencies in the deliverable. |
| Engineer filtering | Casey Quinn returned the two expected packages; attention count was zero in that scope. |
| Discipline filtering | Electrical returned the expected single package. |
| Empty-state recovery | An unmatched search in My work displayed the empty state; clearing filters retained My work. |
| Note draft | Entered note survived tab changes and drawer close/reopen. Submitting it added the expected history event and cleared the draft. |
| Request draft | Entered title survived cancellation and reopening. |
| New request | Created a package without a deadline; reviewer and revision remained unassigned, deliverables undefined, and history contained only its creation event. |
| Text escaping | A title containing literal HTML tags remained text in the register and drawer. This is a targeted escaping check, not a security certification. |
| Successful review request | Propagation bench layout accepted a scope and a separate 15 September review date, entered In review, recorded five document references and updated the action/history. |
| Incomplete review set | Seedling conveyor arrangement listed five outstanding deliverables and stayed in its existing state. |
| Document filter | Fertigation's Not yet checked view returned the two expected documents. |
| Issue record | Fertigation's Rev A customer-review issue retained its two explicit outputs while the current working set remained Rev B. |
| Keyboard column resize | Right Arrow increased the first column from 287 to 297 pixels; Reset columns restored 287. |
| Focus return | Closing the package drawer restored focus to the package button. |
| Desktop visual inspection | Reviewed the register and deliverables drawer in the browser at approximately 1363 × 936. |
| Embedded widths | Checked 390px and 820px module widths inside a wider browser. Both had matching content/scroll widths, without unintended horizontal module overflow. |
| Narrow dialogs | Confirmed the drawer matched the 390px module bounds and visually inspected its nested issue dialog. |

The responsive checks used fixed-width embedded containers, not physical mobile devices. Cross-browser behaviour, screen-reader use, touch resizing, actual app-shell integration and unusually large datasets remain to be tested during implementation. Only column-width preferences use local storage; operational data and drafts reset when the page reloads.

## Decisions and requirements before operational use

1. **Agree authority and workflow.** Identify who may assign reviews, complete checks, issue each purpose of package, supersede an issue and approve a change. The interface must reflect those decisions and the server must enforce them.
2. **Define the document source of truth.** Confirm the current SharePoint organisation and any existing CAD data-management arrangements. Define document numbering, revision conventions, dependency handling and publication ownership.
3. **Preserve issued evidence.** Retain the exact output bytes and their identities, source relationships, approved purpose, issuer and distribution history. Define retention and supersession behaviour explicitly.
4. **Implement durable records.** Notes, drafts, requests, reviews and changes need server persistence, reliable timestamps, concurrency handling and attributable events.
5. **Validate connected states.** Design for missing files, revoked access, stale source versions, failed publication, offline use, deleted records and incomplete model dependencies.
6. **Connect existing PPO records.** Use real project, customer, task and person identities; replace free-text example links with validated relationships.
7. **Validate with real work.** Walk one presales layout, one complex mechanical package and one installation/as-built handover through the proposed process with engineers and downstream users.

The unresolved decisions above do not prevent review of the revised design. They identify the work needed to turn the approved interaction model into an operational engineering module.

## Deliverable record

- **R01 SHA-256:** `d6480456629b053785c019763006aa02191ccb1665ff0d7f85f31437d88aba6c`
- **R02 SHA-256:** `52a7d24705ba3faf5f7ce87e33ccd09b641ca2b3b5e7e592975ec949552665b4`
- **R02 size:** 456,757 bytes.
- **Packaging:** one self-contained HTML file, with embedded font, styling, icons and JavaScript. No installation is needed to open it in a modern browser.
- **Suggested review route:** open Fertigation skid & pipework to compare working/issued records, then open Propagation bench layout to try Request review. Use the main Request button to inspect the new-work flow.
