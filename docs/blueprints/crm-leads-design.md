# Leads workspace and qualification design

| Document control | Value |
|---|---|
| Document ID | PPO-009-LEADS-DES |
| Revision / date | r02 / 9 September 2026 |
| Status | UI design approved; implementation contract proposed |
| Owner | Dean Fiedler |
| Workstream | PPO-009 / issue #9; CRM-01, CRM-02, CRM-03, CRM-08 |
| Source baseline | main `f8035b5c55251da4da52430adf2f83094feccd6b` |
| Related active presentation | PR #75, inspected `4442d297bb95fa81510d1b8cee8738dffaf41c5e`; separate from main |

[Decision](../decisions/crm-leads-direction.md) · [Interactive preview](crm-leads-preview.html) · [BP-03](BP-03-crm.md) · [Shared style](../standards/ui-style-specification.md)

The [UI approval record](../decisions/crm-leads-direction.md#approved-ui-reference) fixes the accepted preview at `6dd76b22c2cf8348f0b0ee45a158237e86d9816e`. Approval does not change the preview bytes or claim application delivery.

## 1. Purpose and scope

Give early enquiries an owned follow-up list before they enter the deal pipeline. Dean selected a dedicated Leads page with a list only, then authorised this bounded design. The existing Opportunity model remains the deal record. This package specifies the screens, a synthetic conversion and compatibility handling; it does not implement a database, API, hosted feature or operational migration.

The desktop uses the compact navy PPO shell, white navigation icons, a green selected marker, a quiet header and an outlined + Lead button. The supplied PDF pages 17–18 specify Roboto (Verdana fallback), navy #242a37, green #62bb46 and white. The full supplied green/white logo is used intact on navy. The source PDF is not redistributed. The embedded font and existing repository OFL notice are retained in the preview. Other UI colours are functional proposals.

Current main still documents and implements Enquiry → Qualified / Open. PR #75 refines the hosted r11 presentation on PR #73's integration branch; neither branch is silently treated as merged. The standalone design complements that direction without changing its CSS or tests. The original r11 HTML was not available in this checkout; its maintained correction decision was inspected, rather than claiming an exact visual copy.

## 2. Screens and information

| Surface | Design |
|---|---|
| CRM navigation | Leads and Deals are peer destinations. Preserve `/crm/opportunities` and its existing deep links. Proposed `/crm/leads/:id` directly opens the permitted lead and restores list context on close. |
| Leads header | Leads, returned-result count and + Lead. No Board/List switch. Search is scoped to leads. |
| Toolbar | Active / Archived / Disqualified / Converted view; owner, status and source filters; date-added or title sort. Status selector is active-status only and disabled for terminal views. Clear filters preserves selected lifecycle view. |
| Desktop list | Lead title; organisation/contact; owner; status; source; next activity with due date; date added. Title is a keyboard-accessible link. One vertical scroll region and a sticky table heading; no per-row scrolling. |
| Row detail | Desktop right-side dialog; full-screen dialog on phone. Title/reference, state, owner, organisation/contact/site, enquiry and source, notes/history, next activity and conversion action. Close returns focus to the originating row. |
| Mobile list | Single white app bar: back, sort, Inbox/lifecycle selector, search and filter. Full-width three-line rows show title, organisation/contact and status/activity due or attention text. Owner and full next-activity title remain in the preserved detail; owner is also announced with each row. Floating + Lead. No bottom navigation on Leads. |
| New lead | Title, owner and enquiry summary required; source defaults explicitly to Manual. Existing permitted organisation/contact optional at capture; supplied unverified organisation/contact text remains an enquiry detail, never a silently created shared master. Optional next action; otherwise show Next action needed. |
| Converted lead | Read-only source history with a permitted Open deal link; excluded from Active. Missing authority to the deal shows Linked deal unavailable without leaking its title. |

Search covers permitted lead title, enquiry and linked visible organisation/contact; source/owner/status use bounded selectors. Stable sort includes an ID tie-breaker. Runtime pagination must label returned-page counts and preserve filter/sort/scroll on detail return. Failed reads must never become zero leads. No forecast totals appear on Leads. Values remain optional detail information for a later commercial extension; unknown is not zero.

### Mobile refinement r02

Dean requested a phone layout similar to the two supplied Pipedrive screenshots, retaining the individual lead detail styling and focusing this increment on Leads. These images are user-supplied visual references, not an observation of a live account; their customer content and image files are not redistributed. The example records remain synthetic.

At 700px and below, the Leads page replaces the navigation rail, product/profile bar, heading and persistent filter rows with a single sticky white toolbar. The back button opens the existing Deals destination preview; a runtime direct link should use a safe CRM fallback and preserve the originating destination rather than blindly exiting browser history. The selected Active view reads **Inbox** on phone, with Archived, Disqualified and Converted available in the same native selector. The selected view, count and data are shared with desktop.

Search opens one labelled field beneath the app bar. Cancel clears and closes it. Sort opens a compact sheet with newest, oldest and title order. Filters open a bottom sheet with owner, status and source; **Show leads** applies the choices, while Cancel/Escape restores the previous filters. Clear filters preserves the lifecycle view. A small indicator marks applied filters. The native dialog contains focus and returns it to the triggering control. Responsive resizing restores the controls to the desktop toolbar without duplicating IDs or losing committed selections.

Rows begin immediately below a compact count/preview strip, with no outer cards or horizontal scroll. Each complete row is one keyboard-accessible button: title, organisation/contact and a quiet status plus due/attention line. Long titles and company names truncate in the list and remain complete in accessible text and the existing detail. Overdue, unknown due and missing next action remain distinct; warning symbols supplement explicit text. Following Dean’s colour refinement, a navy (#242a37) 58px floating add button has a white plus and accommodates the device safe area. A true empty Inbox and a filtered no-match state have different copy and retain a clear recovery action. No Android status bar or system-navigation imitation is included.

The lead drawer, full-screen phone detail, notes, activity information and conversion form retain their r01 layout and behavior. Desktop layout remains the same apart from the revision marker. The phone workflow remains a standalone in-memory demonstration, not a delivered runtime page.

### Add Lead scrolling refinement

Dean found the Add Lead popup scrolling clunky. Its container now uses a fixed header and action footer around one independently scrolling form body. The outer dialog and background page do not scroll. On phone the form fills the available visual viewport; viewport resize/offset updates accommodate browser chrome and keyboard space. Desktop retains a centred dialog. The requirement textarea grows with its content so it does not introduce a second scrolling surface. The phone header is compact, with a close control; Cancel and Create lead remain available below the form. Owner and source share a row to reduce avoidable vertical space. Escape, close and cancel restore the floating add control’s focus.

The preview check verifies long-input scrolling, stationary header/footer, locked background and reachable final fields/actions at full and reduced phone heights. Reduced-height browser verification is not a physical keyboard/device test. The existing lead information panel and conversion form are unaffected.

### Future mobile bottom navigation direction — design note only

For top-level CRM destinations such as Deals, propose five stable items: **My work, Deals, Activities, Contacts, More**. Use the existing navy background, white outline icons and short text labels, with a green selected indicator and a lighter navy selected tile. Selection must not rely on colour alone. Keep targets at least 44px and include bottom safe-area padding. Put the create button above the bar, separate from destination selection, so its action always belongs to the current page.

Leads remains a secondary inbox with a top-left back button and no bottom bar; record detail keeps its existing full-screen presentation. Hide top-level navigation while a modal or keyboard takes focus. This is a proposed direction for a later Deals design review, not new navigation delivered or an expansion of this Leads increment. Final destination labels and More contents should be reconciled with the current application before implementation.

## 3. State and qualification

| State or action | Meaning / rule |
|---|---|
| New | Captured and awaiting initial follow-up. |
| Contacting | Owner is actively clarifying the requirement. Completing a call never automatically changes this status. |
| Nurturing | Credible potential for later; keep an owned review Activity or explicit next-action-needed state. |
| Disqualified | Owner records a reason; visible in its own view, outside active work. Reopen requires reason and preserves original outcome. |
| Archived flag | Hides an active lead from routine work without changing its status. Unarchive restores that status. Conversion from Archived requires unarchive first. |
| Converted | Terminal retained source with exactly one conversion link; no second conversion, destructive deletion or direct editing. |
| Convert to deal | Owner reviews qualification, target context and next action, then deliberately confirms the transition. |

Synthetic qualification requires a recorded credible requirement, a permitted existing organisation, a permitted contact OR an active owned contact-identification Activity, an eligible accountable deal owner, a qualification note and a selected active next Activity or a new valid one. Unknown budget, authority, value, close date or timing remain explicitly unknown. A dated action is encouraged; an unknown due date remains supported and visibly requires attention. These are prototype defaults, not an invented company sales policy.

For the first bounded implementation the deal owner defaults to and remains the lead owner. A future owner change must use the separately controlled handover design; conversion cannot become a shortcut around it. Activity ownership remains independent. A qualifying owner may select an existing permitted active Activity without changing its owner or due date. New Activity creation requires its existing permissions and eligible owner.

The conversion form shows the fixed current synthetic pipeline and Qualified starting stage as read-only information. It does not offer an invented multi-pipeline selector. Qualified is the proposed result of a new conversion command, not a call that the current API already accepts. Direct + Deal entry for an already-qualified enquiry uses these same qualification checks when implemented; ordinary existing I1 creation/qualification remains until that successor is delivered.

## 4. Synthetic journey

All preview organisations, people, leads, notes and activities are fictional. Preview time is 9 September 2026, Australia/Brisbane; displayed date-only values include the year and do not imply an appointment time.

1. Open **Irrigation controls upgrade**, `SYN-PPO-LEAD-000001`, for fictional Glasshouse Demo Nursery / Casey Bell, owned by Alex Lee. It begins Contacting.
2. Review the enquiry for two irrigation zones, the completed clarification-call outcome and Casey's request for an options discussion. Budget and installation timing remain unknown.
3. The existing next Activity `SYN-PPO-ACT-000201` is **Review control options**, owned independently by Morgan Chen, due 11 September 2026. Its identity, owner, due date and original Lead link are preserved.
4. Select **Convert to deal**, review the qualification note, owner, next Activity and Qualified / Open destination. Saving once shows a conversion receipt.
5. The active Leads count decreases by one. **Open deal** displays `SYN-PPO-OPP-000101`, its original enquiry/source, notes, qualification note, next Activity and source-lead link. The completed call is history; it is not replayed as a new action.
6. The Converted view still opens the original lead with its conversion fact. Reload resets this in-memory demonstration; no durable application save is implied.

The preview also supports search/filter/sort, creation of a temporary synthetic lead, status changes, notes, archive/unarchive, reasoned disqualification/reopen and form validation. It implements one existing-Activity conversion option for the illustrated journey. A new-Activity conversion option and the contact-identification alternative are specified but not simulated; missing next Activity/contact blocks preview conversion with a clear message. No bulk actions, email send, import, deal-stage editing or real record actions are simulated.

## 5. Conversion preservation and proposed integration contract

| Item | Required result |
|---|---|
| Lead identity | Retain UUID, readable reference, workspace/company, source and original chronology; set Converted only after commit. |
| Deal identity | Allocate new UUID/OPP reference; unique conversion relationship per lead; do not rename a lead UUID into an Opportunity. |
| Organisation/contact/site | Reuse permitted shared identities; revalidate relationships and target scope at commit. Unknown site remains null. |
| Notes and history | Retain original IDs, authors, occurrence times and classification. Display through an authorised source association; do not duplicate text into a less restricted feed. |
| Activities | Preserve originals and Lead links. Add permitted Opportunity associations without rewriting completed Activity content. Designate one active Activity or create one explicitly; never clone every Activity. |
| Visibility | Preserve source restrictions. All-target Activity rules remain authoritative. Conversion does not grant access, widen scope or make restricted email bodies visible. Where adding the deal link would change eligibility, block and explain the permitted conflict before commit. |
| Files and email | Permission-checked source associations only; no attachment binary copies, implicit sharing or email-body transfer. First slice has no file upload or provider integration. |
| Commercial facts | No estimate, quote, order, revenue, invoice or downstream work automatically created. A lead value is not an approved deal forecast. |
| Receipt and events | One atomic conversion operation, retained original intent/hash, LeadConverted and OpportunityCreated/qualification facts with source linkage, shared audit and outbox. No sending consumer. |

Proposed physical entities: `lead_candidates` (UUID, `reference`, `workspace_id`, `company_id`, `owner_id`, nullable shared IDs, `title`, `need_summary`, `source_type`, source text/key with provider context, `status`, `is_archived`, `version`), typed append-only `lead_events`, and `lead_conversions` (lead/opportunity unique IDs, actor/time, qualification/source version and operation identity). Lead references illustrated as SYN-PPO-LEAD are proposed allocations and must be reconciled with the permanent reference registry. No migration number is reserved.

Proposed domain commands are CreateLead, UpdateLead, RecordLeadNote, ArchiveLead, UnarchiveLead, DisqualifyLead, ReopenLead and ConvertLeadToOpportunity. Use the existing modular monolith, PostgreSQL transactions and shared operation framework. Lead list/detail/selector reads and exact operation lookup need explicit Lead dispatch. Typed identity, ActivityLink FK, permission projection, receipt lookup and any affected accepted-schema unions must be extended together; do not weaken existing unknown-type denial or rewrite previous migrations.

Conversion must lock in the established shared-operation order, recheck current lead version/active state and every linked target, then atomically create the deal/qualification facts, associate eligible activities and commit the conversion link/receipt. A database uniqueness constraint on the source lead protects two different concurrent operations. Same operation with identical content returns its original authorised receipt; changed content conflicts. Concurrent conversion returns the already-linked permitted result or a safe conflict. A failed transaction leaves the lead active and creates no partial deal/activity. An unknown response reconciles the original operation before retry; a double click cannot start a second intent.

Candidate capabilities: `crm.lead.read`, `crm.lead.create`, `crm.lead.edit`, `crm.lead.convert`, each AND current workspace/company scope. Owner status alone grants nothing. Conversion also needs existing Opportunity create and relevant Activity permissions. Current owner with edit acts on the lead; Systems and another company remain denied. Revalidate permissions before receipt replay; clear displayed context on identity change/revocation. No manager override or new operational role is implied.

## 6. Existing Enquiry-stage records

| Existing case | Treatment in this increment / future implementation default |
|---|---|
| Enquiry Opportunity, any linked work | Keep its UUID/OPP reference, stage, owner, Activities, estimates and history. It remains on Deals under the current query. |
| Qualified Opportunity | Keep unchanged on Deals. No source lead is fabricated. |
| Apparently unqualified existing Enquiry | Surface a later review filter; owner decides whether to continue qualification or request a separately specified reclassification workflow. No bulk move by stage name. |
| Enquiry with estimates, quotes or downstream references | Preserve the canonical deal and all references. It is never silently replaced with a lead. |
| New enquiry after Leads implementation | Capture on Leads by default; clearly already-qualified enquiries can use + Deal and its qualification form. |
| Duplicate lead and existing deal | Show permitted candidates for human review. Linking/merging into an existing deal is deferred; block known exact-source duplicate conversion. Names alone never merge. |
| Historic pipeline definitions or six-stage preview | Preserve issued definitions and past events. Future operational deal-stage names/criteria need an explicit successor contract. No Lead column is added to Deals. |

No counts or historical conversion rates are retroactively recalculated by inventing lead records. A later removal of Enquiry from the deal pipeline must reconcile every remaining Enquiry record before retiring its definition. No live Pipedrive migration is authorised.

## 7. Interaction and recovery requirements

Use native buttons, labelled fields and dialog focus containment; Escape/Close returns focus. Phone targets at least 44px; text wraps without hiding full values from detail. Search/filter remains usable at 320px. Status and Activity urgency use words as well as colour. Unknown due, overdue and missing next action are distinct; no arbitrary lead-rotting threshold is invented.

| State | Required copy and recovery |
|---|---|
| Loading | Loading leads…; no false zero count. |
| No matches | No leads match these filters. Clear filters. |
| Empty active inbox | No active leads. Add a lead. |
| Unavailable | Leads could not be loaded. Retry; retain filter context. |
| Validation | Field-specific reason, input retained and focus on first invalid field. |
| Conversion pending | Converting…; disable duplicate submit. |
| Unknown result | Checking whether the deal was created…; reconcile original operation. Do not announce failure or offer a fresh conversion yet. |
| Stale revision | This lead changed. Compare the current version before converting. |
| Access changed | This lead is no longer available to you. Clear sensitive fields and return to permitted list. |
| Success | Lead converted. Open deal; show receipt and retained source link. |

## 8. Future implementation acceptance

These LC identifiers are local design cases, not new parent requirements. Runtime cases are **Not run**; preview checks do not pass them or full AT-25.

| Case | Observable proof |
|---|---|
| LC-01 / CRM-01 | Create incomplete lead with owned unknowns, reload and application/database restart; record and next-action-needed state persist. |
| LC-02 / CRM-01,08 | List/detail/selectors/search/counts/receipts reject other-company and revoked actors; identity switch clears data. |
| LC-03 / CRM-02 | Required qualification and eligible context enforced server-side; unknown value/budget/close date allowed; fixed Qualified/Open destination. |
| LC-04 / CRM-02 | Double click, same-intent retry and two competing conversion requests produce one deal/link, no duplicate Activity. |
| LC-05 / CRM-02,03 | Transaction failure rolls back everything; lost response reconciles original receipt; restart cannot duplicate conversion. |
| LC-06 / CRM-03,08 | Exact notes/authors/times, completed and active Activity IDs/owners/dates and restricted source visibility survive conversion. |
| LC-07 / CRM-01,02 | Archive/unarchive and disqualify/reopen preserve reasons/history; converted source is read-only and excluded from Active. |
| LC-08 / CRM-01,08 | 1440px, 390px and 320px list/detail/conversion; keyboard focus/Escape, long text, no-match and every recovery state. |
| LC-09 / CRM-01,02 | Upgrade preserves every existing Enquiry/Qualified record and its linked estimates/Activities; original URLs still resolve. |
| LC-10 / CRM-02 | Direct qualified deal creation uses the same checks, with no fabricated source lead or implicit downstream effect. |

First implementation should deliver the synthetic capture → follow-up → conversion → durable deal journey and its focused database/HTTP/browser checks. Reconcile actual current main and PR #73/#75 before allocating schema/ADR identifiers. Validate affected all-target Activity/receipt permissions and existing CRM/estimating journeys once at the review checkpoint. No workflow or required CI gate is weakened by this design.

## 9. Sources, validation and handover

Inspected source: repository AGENTS/README/STATUS, BP-03, CRM implementation sequence, ADR-0015, `src/crm/opportunities.ts`, shared style/assets and PR #75's r11 correction decision. The current source is a dated observation, not an assertion that active branches have merged. The full attached logo was inspected and brand PDF typography/colours read locally.

Official Pipedrive [Leads Inbox](https://support.pipedrive.com/en/article/leads-inbox) and [Leads vs. deals](https://support.pipedrive.com/en/article/leads-vs-deals), checked 9 September 2026, support the separate list and qualified conversion pattern. PPO deliberately retains its own immutable source conversion record. Vendor documentation does not establish this user's tenant settings or lead usage.

Validation results and publication reference will be recorded below after execution. Design review and runtime acceptance remain separate. No application, schema, seed, dependency, hosted configuration or issued baseline is changed. The existing CRM design workflow gains one standalone preview-check invocation; it uses existing pinned tooling and retains all earlier checks.

### Local checks and remaining visual review

Foundation, prototype and naming checks pass, preserving all 78 parents, four issued sources and existing acceptance statuses. Embedded JavaScript passes syntax checking; the reattached logo matches the repository asset byte-for-byte. Local Chromium installation timed out and the cloud preview browser rejected the local URL with ERR_BLOCKED_BY_CLIENT. Therefore local rendered review is not claimed. The focused standalone check runs in the existing CRM design workflow and retains desktop/phone images for visual inspection. Publication and rendered results will be appended when available.

### Publication hold

The attempted push of `docs/crm-leads-design` was rejected by automatic approval review: the repository is public and the reviewer did not consider the design instruction authority for public publication, citing possible disclosure. No alternate publication path was attempted. No PR, remote check, merge or deployment is claimed. The prepared design and focused verification script remain in the local branch. Public publication requires Dean’s explicit approval of this concrete synthetic package.

### Public publication approved

Dean explicitly approved publishing this synthetic design package to the public `deanrfiedler-gif/powerplants-one` repository and opening a draft PR for verification. This supersedes the earlier publication hold; the hold remains recorded as history. The authority covers the prepared package, focused verification and corrections, not application implementation or deployment. Actual publication and rendered results remain to be recorded after execution.

### First remote preview verification

[Draft PR #82](https://github.com/deanrfiedler-gif/powerplants-one/pull/82) published source `dfc6df91bfa6741e9b7ab66ce3de31b632560c6e` with tree matching local preparation. [Run 34399774385](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34399774385) passed the existing 147-view wireframe and 17-capture branded checks. The new journey captured the desktop list/detail/conversion/deal and verified source Activity preservation, but stopped at the exact View selector. The correction adds explicit accessible names to native select controls without changing the assertions, timeout or business flow. Artifact 10122998212 retains the original evidence; corrected-source and phone verification remain pending.

### r01 verified baseline and r02 follow-up

The accessible-select correction at `9cad225387ccaa319435aa09ea1d44ed74d35159` passed [CRM design run 34400198070](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34400198070). Its 12 desktop/phone list, detail, conversion and deal screenshots were visually reviewed; exact HTML and screenshot hashes are retained in the run artifact. This supersedes the pending corrected-source statement above. It proves the synthetic design journey only.

The r02 mobile refinement extends the same focused check with compact row/header placement, floating add, back navigation, sort, filter apply/cancel/Escape, search, true-empty and no-match screens, and responsive control relocation. Current-source run IDs and rendered review are recorded in [draft PR #82](https://github.com/deanrfiedler-gif/powerplants-one/pull/82) after execution. Application acceptance LC-01–LC-10 remains Not run.
