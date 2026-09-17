---
document_id: PPO-NOTIFICATIONS-RPT
title: Notification inbox and preferences — workspace report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed interactive design; owner acceptance and application integration separate
source_commit: 07eb34d5df5ea430c365da78e160cb6aa0b76f20
---

# Notification inbox and preferences

## 1. Purpose and deliverables

The [interactive HTML workspace](PPO-Notification-Inbox-and-Preferences-r01.html) answers three connected questions: **What changed, what needs my attention, and where do I act?** It provides the dedicated SH-03 Notification inbox and preferences page requested by Dean, with unread updates, grouped changes, owned escalations, channel and digest preferences, and links to exact source context.

The governing rule is that **reading a notice never completes its business action**. Notice read state, email delivery and source-owned work have separate meanings and controls. There is no generic Complete, Approve, Acknowledge or Resolve button in this inbox.

This report describes the actual delivered HTML rather than a future feature wish list. It covers the four views, information fields, interactions, demonstration scenarios, r20 presentation, verification and the work required to integrate the design. The package also contains [maintainable sources](../../../design/notifications/README.md), a [design and receiving handover](../../../decisions/notification-inbox-preferences-design.md), reproducible assembly and focused model/browser checks. Exact verification and remaining limits are recorded in the [evidence record](../../../testing/evidence/notifications-r01/README.md).

The HTML embeds its fonts, styles, icons, scripts and fictional data. Download it and open it in a modern browser; a GitHub file preview displays source rather than running the page. It needs no sign-in, build step or provider connection. Changes save to this file's browser storage where supported. Saving in this preview does not modify the PPO application, another standalone design, an email account or a delivery service.

## 2. Source basis and scope

The repository baseline inspected was main `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. The supplied **Powerplants One theme/style board r20** matches the repository copy byte for byte, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.

| Authority or reference | Application to this design |
|---|---|
| Dean's current instruction | Create the Notification inbox and preferences HTML and detailed Markdown companion, aligned to supplied r20. |
| Coverage register r06, SH-03 | P1 Page + panel: unread updates, grouped changes, owned escalations, preferences and deep links. |
| Adopted F06 / F06-A, issue #181 | Extend existing My Work and Activities; permission-filtered source links, deduplicated obligations, explicit missing dates, safe stale-link recovery and required-work visibility. |
| F06 parents | CRM-03, PRJ-03, SVC-02/12, DOC-05, NFR-01/11 remain unchanged. |
| SH-03 family parents | CRM-03, DOC-06, NFR-01/05/08/11 are retained as planning traceability. |
| My Work design, PR #209, inspected head `53351a574375bcaa00486320c8f239a9907532ae` | Reference context for Updates & preferences. Its small notification surface is not copied as a second authoritative action system. |
| BP-02 and shared source contracts | Domain services own controlled commands; current grants apply to reads, counts, sources and delivery. |
| Document distribution contract | Notice reading cannot establish delivery or acknowledgement of an exact issued document. |

All records, assignments, customer names and dates are fictional. Date classification is fixed at **16 September 2026** for reproducibility. The design elaborates SH-03; it does not close F06-A, issue #181, SH-02, SH-06 or any of the 78 parent requirements. The issued page register and theme bytes remain unchanged.

## 3. Workspace composition

The module header presents Notifications, a brief task-oriented description, Page guide and Preview options. A compact environment line identifies the synthetic revision, preview person and save status. Four navigation controls provide Inbox, Grouped changes, Owned escalations and Preferences.

The page is a **module interior**, consistent with recent Warranty and Maintenance designs. It mounts inside the shared shell; it does not duplicate a navigation rail, global search or account controls. The r20 shell remains the surrounding reference: 76 px rail and 64 px desktop header. The module itself uses the continuous grey workspace, compact heading, green navigation accent, white record surfaces, restrained borders and contextual right-hand snapshot.

On desktop the main list occupies the larger column, with a 345 px detail column. On narrower screens the snapshot stacks below the results. Selecting a notice on a phone scrolls and moves focus to that exact snapshot. The selected notice remains explicit when it falls outside current filters; it is not silently replaced by another record.

## 4. Summary cells and count definitions

| Summary | Calculation | Interaction |
|---|---|---|
| Unread updates | Available, permitted, unarchived notices not marked read by the current preview person. | Opens Inbox with Unread selected. |
| Owned escalations | Distinct active required source obligations owned by the current person. Several notices for one source count once. | Opens all owned escalations. |
| Overdue actions | Owned escalations with a known source due date earlier than 16 September 2026. | Opens the overdue subset. |
| Date needed | Owned escalations whose source has no due date. | Opens the undated subset. |

The initial coordinator view contains ten total notices: nine in the inbox and one archived. Seven inbox notices are unread. Four required source records exist, of which three belong to Alex and one belongs to Riley. Alex therefore sees three owned escalations: one overdue, one due today and one with an unknown date.

Summary cells cover the currently available sources and preview identity, independently of list search/read/module filters. Failed loading shows unavailable counts, not zero. Partial loading appends a qualification mark and a banner identifying the missing Service source. A successful empty result is a separate scenario. These are obligation counts, not staff capacity, estimated duration or organisation-wide workload.

## 5. Inbox

The Inbox is a chronological record list, divided by Australian Eastern calendar date. Each row contains a selection checkbox, source-module icon, title, customer or fallback explanation, source module and readable reference, event time, read indicator and required-action tag where applicable.

Unread notices use a stronger title and a blue dot. The selected notice uses a pale green surface and left accent. Text labels accompany priority and state; colour alone is not the only signal. The active filters are searchable text, source module, All updates/Unread/Read, and Inbox/Archived. Search covers notice wording, source title, customer and readable reference. Clear filters restores the inbox defaults.

Selecting a title shows its details. **Selection and source preview do not automatically mark the notice read.** The user explicitly chooses Mark as read or Mark as unread. This makes the distinction observable during review and avoids unexpected read-state changes while browsing a snapshot.

Select visible notices applies only to the current result set. Changing a filter clears the selection. Bulk Mark read and Mark unread act on the selected event IDs. Archive is available for routine notices and can be reversed through Archived → Restore or the immediate Undo control. Archiving does not imply reading, source completion, deletion or retention expiry.

An active required notice cannot be archived. A mixed bulk archive containing required and routine notices is rejected as one operation, without silently archiving only part of the selection. The message explains that the required work remains in the inbox. This restriction is a proposed presentation policy supporting F06; operational classification and retention policies remain receiving work.

## 6. Notice snapshot

The selected-notice panel includes read state, source module, event time, title, customer/site context, readable source reference, accountable owner, due date or Date needed, source action status, why the notice was received and the next required step. The footer preserves the notice ID and source revision referenced by that notice.

The prominent Open source preview control leads to exact local source context. Read/unread and archive/restore controls affect the current person's notice state only. Required notices explain why Archive is unavailable. The panel also explains the separation between notice and business state and provides a shortcut to Preferences.

No read timestamp or delivery receipt is invented: the prototype stores personal read membership, local change revision and a demonstration command history. Event timestamps describe the source updates, not when a person read them.

## 7. Grouped changes

Grouped changes presents the same filtered event set organised by stable source record, with newest changes first. A source group shows its readable reference, customer, unread event count and Mark group read control. Its timeline retains every individual event, event time, title and read state. Where supplied by the fixture, Before and After panels expose the changed values.

Examples include a supplier promise moving from 15 to 18 September, a changed gate contact and an added visitor briefing. These are captured event facts; grouping does not combine several updates into an invented latest business decision.

Mark group read captures only the IDs currently displayed for that group. Preview options can add one newer project update. That event remains unread even when earlier project events were marked read; repeating the add operation does not create a duplicate. The selected filters still apply, so reading a filtered group does not read undisplayed events.

## 8. Owned escalations

Owned escalations is a source-obligation view. It deduplicates the available notifications by source identity, selects active required work for the current person and shows it irrespective of read state. It does not inherit Inbox's archive, search or read filters. Its summary shortcuts support Overdue and Date needed subsets, with an explicit Show all owned control.

Each entry includes module and source reference, source date classification, action title, customer/site, explanation, concrete next step, owner, due date and number of related notices. The only progression control is Open source preview.

The late material has two notices but one impact-review obligation. Reading both notices leaves that obligation open. The Service submission remains Awaiting review. The Warranty follow-up remains Waiting with Date needed. The document example belongs to Riley and requires exact pack acknowledgement in the receiving workflow.

The inbox does not set escalation thresholds, service-level commitments or managerial authority. The fixture starts with explicit required classifications and assignments. In the application, the responsible domain must supply and maintain those facts, including when an escalation ends or changes owner.

## 9. Channel preferences

Four categories are configurable: Owned work, Changes, Mentions and Documents. Each shows why that category exists, an always-visible in-app channel and an Email choice of Immediate, Digest or Off.

| Category | Initial email choice | Typical source |
|---|---|---|
| Owned work | Immediate | Assigned review, delivery-impact action or supplier follow-up. |
| Changes | Digest | Changes to followed records. |
| Mentions | Immediate | Direct mention in a permitted source. |
| Documents | Digest | A new issued revision or document update. |

Turning email off does not remove existing notices, hide required obligations, change ownership or alter due dates. In-app notices remain visible for all four categories in r01. Push and SMS are explicitly not connected; the page does not pretend to offer supported providers.

Changes first become a draft, with an Unsaved changes indicator and live draft preview. Save preferences validates and persists the local choice; Discard changes restores the saved values. Attempting to leave with a draft offers Keep editing or Discard and continue. Preview identity changes require the current preference draft to be saved or discarded first.

## 10. Digest and quiet-hour preferences

Digest settings include Daily or Weekly, local time, weekday for a weekly digest, and an explicit time zone. The bounded timezone choices are Australia/Brisbane and Australia/Perth. R01 does not implement daylight-saving transitions or claim support for every Australian zone. The selected zone labels the local delivery preview; it does not rewrite event instants or source due dates.

Quiet hours have an enabled switch, start and end time. A window may cross midnight. The boundary is start-inclusive and end-exclusive: 18:00–08:00 includes 18:00 and 07:59, but not 08:00. Equal start and end times are rejected as ambiguous. Invalid times, unknown zones and invalid preference values cannot be saved.

Under this proposed policy, quiet hours defer all immediate email, including owned-work email, while in-app work stays visible. There is **no invented emergency override**. Any future mandatory channel or urgent exception needs a separately specified operating policy. If a digest time falls inside quiet hours, its preview is deferred to the window end. The preview does not compute an actual future send date, provider job or weekly daylight-saving occurrence.

## 11. Digest and delivery previews

The Digest preview uses the current draft, permitted source set and personal read/archive state. It includes unread, unarchived events whose category is set to Digest and whose source remains available. Read, archived and unresolved-target events are excluded. The grouping switch changes between one digest entry per source and individual event entries.

The Delivery preview has a local-time control, initially 19:30. Each eligible event shows one explanatory result: Email off, Next digest, After quiet hours or Immediate email preview. These are simulation outcomes, not queued, sent, delivered or failed-provider receipts. A preference change never creates an automation or sends an email.

Required-work visibility is independent of digest eligibility. A read required notice may disappear from the illustrative unread digest while its active obligation remains in Owned escalations and its notice remains in the inbox. The future send path must recalculate permissions and the current allowed content immediately before dispatch.

## 12. Source links and receiving boundaries

The self-contained file supports local deep links containing the notice ID and source ID. Opening a valid link selects the notice and opens the corresponding source preview. A mismatched pair is rejected. Closing a source preview returns the file to its ordinary workspace URL. A copy-link control uses the clipboard when available and otherwise selects the visible link for manual copying.

These links address the local demonstration only. They are not deployed PPO routes and may require the recipient to have the same downloaded file. The separate Module design reference link opens a commit-pinned repository design for review. It does not claim that the receiving HTML selects or imports the same record.

| Receiving module | Context retained | Action reserved to that module |
|---|---|---|
| Supply Chain / Projects | Shipment, revised date, installation-impact next step. | Verify material readiness, coordinate the impact and control any booking change. |
| Service Review | Work order and submission revision. | Review labour, parts, findings and remaining work; approve/report through its controls. |
| Warranty / Supplier Recovery | Claim reference, customer outcome and outstanding supplier obligation. | Follow up, record supplier response and separately reconcile recovery. |
| Projects | Project, site, access changes and source revision. | Confirm access and assess readiness. |
| Estimating | Estimate reference and notice/current revision difference. | Review current option through the estimate's authority. |
| CRM | Opportunity and discussion activity context. | Record controlled activity outcomes or opportunity decisions. |
| Job Packs / Documents | Exact issued pack revision and intended assignee. | Retrieve/review issued bytes and acknowledge that revision. |

A notice pointing to estimate r02 warns that r03 is current and requires an explicit refresh before showing it. An unavailable source shows a neutral retained-history message and never opens a different record. The lost-access scenario hides source details in the opening dialog. These are design simulations; actual permission enforcement must occur on the server.

## 13. Information catalogue

| Entity | Fields present in r01 |
|---|---|
| Notice/event | Stable local event ID, source ID, title, body, UTC event instant, category, optional before/after values. |
| Source snapshot | ID, readable synthetic reference, module, customer, site/area, action title, owner, due date or null, business state, current version, notice version, required classification, next action, reason, target description and design-reference path. |
| Personal inbox state | Read event IDs and archived event IDs, independently stored for each preview person. |
| Preferences | Email choice per category, digest cadence/time/day, named time zone, quiet enabled/start/end and digest grouping. |
| View state | Active view, search/module/read/archive criteria, selected notice, explicit checkbox selection and escalation subset. These are in-memory view controls. |
| Save/recovery | Schema version, local revision, per-command actor/type/IDs, original saved bytes, unsaved preference draft and current-copy export. |
| Preview state | Person, source-loading scenario, source-access scenario and delivery-preview clock. |

The r01 shorthand IDs are fixture identities. Production storage must use existing UUID and workspace/entity/provider conventions. Readable labels are not record keys. No raw customer exports or secrets are included.

## 14. Roles, scope and data completeness

Alex Morgan is a fictional coordinator with Projects, Supply Chain, Service, Estimating, CRM, Documents and Warranty scope. Riley Chen is a fictional technician with Service and Documents scope. Switching people recomputes lists, groups, counts, selected context and owned obligations. Personal read states and preferences are separate.

These selectors are explanatory UI controls, not authentication. The full fictional fixture is embedded in the downloadable HTML and export. Runtime integration must use current server grants and scope on all reads, aggregates, target resolution and preference writes. A stored URL, old event, historical assignment or digest must never confer access.

Four source-loading scenarios are available: Available; Partial with Service missing; Failed; and successful empty. A refresh restores the complete fixture without duplicating events. The simulation does not refresh from a network provider or update a live business record.

## 15. Local save, interruption and recovery

Accepted changes are stored under a versioned key in browser local storage. The controller compares the current saved bytes with the copy it originally loaded before saving. A detected changed copy blocks the write and offers reload/export recovery. This is a best-effort client-side stale-copy guard, not an atomic cross-tab transaction lock.

Saved state is checked against the supported schema, valid preferences, known notices and exact fixture content. Unsupported or altered saved data remains untouched and exportable. The page shows a persistent recovery notice rather than claiming success. Retry storage cannot erase the warning for invalid original bytes. A storage write failure retains the previous accepted state and the current preference draft for export/retry.

Export current copy downloads the synthetic model and preference draft. Export original saved data preserves the original bytes for diagnosis. R01 does not import arbitrary backups. Reset is explicit and confirmed; it clears only this preview's local key and restores the original fixture. Immediate Undo reverses the last personal read/archive change while its revision remains current.

Local storage can be restricted for downloaded files or cleared by browser settings. The save indicator distinguishes a ready unsaved fixture, accepted local revision and save-attention state. A successful local save is not a server sync or delivery acknowledgement.

## 16. R20 alignment and responsive behaviour

| Design element | Applied treatment |
|---|---|
| Typography | Embedded r20 Roboto 400/500/700, with Roboto/Verdana fallbacks. Clear 28 px title, 18 px section headings and compact 12–14 px operational text. |
| Colour | Navy `#242a37`, green `#62bb46`, workspace `#f5f6f8`, borders `#e1e5eb`, blue links and separate warning/danger/success surfaces. |
| Components | 6 px controls, 7 px panels, 10 px dialog, line icons, navy primary actions, restrained status tags and visible focus outlines. |
| Desktop | Wide chronological register with source snapshot, compact summary cells and green active navigation underline. |
| Tablet | Single-column content at 850 px and below; exact selected detail retained. |
| Phone | Four views wrap into a two-by-two grid; summaries use two columns; filters stack; checkbox targets and action buttons remain usable. |
| Dialogs | Native modal semantics, named heading, close control, Escape and return focus; constrained height with scrollable content. |
| Accessibility | Skip link, semantic controls, labelled filters, checkbox labels, text states, live save/toast messages, keyboard navigation between view controls and reduced-motion styling. |

No new logo or corporate contact block was invented. Automated browser checks cover 1440, 1024, 820, 390 and 320 px layouts. This remains component verification, not full WCAG conformance or independent physical-device/screen-reader acceptance.

## 17. Recommended review walkthrough

1. Start as Alex. Confirm seven unread notices and three distinct owned escalations.
2. Select all visible notices and mark them read. Open Owned escalations: the three obligations remain active.
3. Open the late-material source preview. Confirm that its action is Open, its due date remains overdue and its next step requires Supply Chain/Project coordination.
4. Return to Inbox, select a routine project notice, archive it and use Undo. Try a bulk archive including required work; the whole archive request is rejected.
5. Open Grouped changes and mark the project group read. Add a new project update through Preview options; only the new event is unread and repeated addition creates no duplicate.
6. Select the estimate notice, open its source and refresh explicitly from r02 to r03. Try the unavailable source and lost-access scenarios.
7. In Preferences, change Changes email to Off. Confirm the digest changes while required work remains visible. Try weekly cadence, quiet hours crossing midnight and an invalid equal-time window.
8. Save, reload and confirm the preferences. Switch to Riley and verify his personal inbox and document acknowledgement obligation.
9. Exercise Partial, Failed and successful empty sources. Confirm their counts and explanations differ.

## 18. Verification and acceptance boundaries

The model suite checks read/action separation, archive protection, personal state, stable groups, duplicate prevention, unknown dates, quiet-hour boundaries, preference validation, delivery eligibility and saved-fixture integrity. The native browser suite exercises the visible journeys, filters, dialogs, saves, reload, deep links, identity changes, failure states, keyboard interaction and responsive layouts. Screenshots and result manifests are retained by the focused workflow.

The [verification record](../../../testing/evidence/notifications-r01/README.md) is authoritative for actual completed runs, exact HTML hash, visual findings and corrections. No test count in this report implies full application or business acceptance. Owner visual acceptance, integration, operational channel policy and live delivery remain separate.

## 19. Receiving implementation and next bounded increment

Implement one synthetic, server-backed notice projection tied to an existing Activity or document event. Store immutable event/source references separately from per-user read state and versioned delivery preferences. Enforce current scope at every query, aggregate, write and deep-link resolution. Preserve unique event/recipient identity and the original event revision; repeated outbox delivery must not create duplicate notices or duplicate obligations.

My Work should continue to read source obligations, not infer them from unread counts. Domain commands should remain responsible for completion, transfer, approval, acknowledgement and financial effects. Runtime source resolution must show changed revision, permission loss, missing target and stale data explicitly. Provider integration must separately define queue, attempt, sent, delivered, failed and unknown-outcome records, with safe idempotent retry and no false delivery claims.

Before connecting external channels, settle category ownership, required-notice rules, digest unread policy, quiet-hour urgent exceptions, retention and privacy, supported time zones, verified email identity and provider capabilities. The bounded design does not establish these as corporate policy. MYOB and SharePoint authority, current integrations, P01–P12 ordering and all existing parent IDs remain unchanged.
