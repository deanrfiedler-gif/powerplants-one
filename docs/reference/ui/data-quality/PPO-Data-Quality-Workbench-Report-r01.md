---
document_id: PPO-AD03-REPORT
title: AD-03 — Data Quality Workbench — Delivered HTML Report
revision: r01
date: 2026-09-18
timezone: Australia/Brisbane
owner: Dean Fiedler
status: Standalone synthetic design delivered; application integration and owner acceptance pending
module: AD-03
html: PPO-Data-Quality-Workbench-r01.html
repository_baseline: 108b1600152ee12443c75ffaf7feb7cc857316f5
theme_reference: Powerplants One Theme & Style Board r22
---

# AD-03 — Data Quality Workbench

**Delivered HTML module and implementation report · r01 · 18 September 2026 AEST**

The Data Quality Workbench provides a working standalone demonstration of finding a questionable record, examining its evidence, preparing an exact correction, obtaining independent review and following the result through its record owner. It includes six views, sixteen starting scenarios and one complete local Equipment correction journey.

The delivered file is `PPO-Data-Quality-Workbench-r01.html`. It opens directly in a browser and includes its styles, scripts, fonts, icons and fictional data. A companion source package contains the maintained files, deterministic builder, verification scripts, result records and selected browser captures.

**This is a synthetic design module.** It has no connection to MYOB, SharePoint or the Powerplants One application. The Equipment receiver changes fictional browser-local data only. Reviewed requests for other owners remain **Prepared locally**. No application route, database migration, GitHub publication or Azure deployment was performed by this increment.

## 1. Delivered outcome

The central example concerns two assets called “Pump 1” at two separately addressed nursery sites. A mistyped serial on one asset resembles the other asset's serial. The workbench shows why matching labels or serial text alone cannot establish that two physical assets are the same.

The user can inspect both identities, retain a Keep separate disposition, prepare a current serial transcription correction, submit it for independent review, receive a return, create a corrected successor, respond to the finding and obtain acceptance of that exact response and proposal. An Equipment operator can then apply the correction through the local simulator. If the response is lost, the original receiving result can be recovered without applying the correction again.

The workbench retains the original proposal, return reason, corrected revision, accepted digest, before/after target versions, operation identity and receipt. Issued job-pack content and its original acknowledgement remain unchanged. A separate prepared Service follow-up records the need to review draft preparation that might still use the earlier serial.

## 2. Package contents and source basis

| Deliverable | Contents |
|---|---|
| `PPO-Data-Quality-Workbench-r01.html` | Complete interactive standalone module; no external runtime resources |
| `PPO-Data-Quality-Workbench-Report-r01.md` | This feature inventory, demonstration guide, verification record and receiving handover |
| `PPO-AD-03-Data-Quality-Workbench-Source-Package-r01.zip` | HTML/report, maintained source files, asset notices, builder, model/DOM/browser checks, JSON evidence and selected PNG captures |

The preceding build plan remains a separate retained planning artifact. This report describes the implementation actually delivered and identifies where it is narrower than that plan.

The repository was refreshed from public `main` and inspected at `108b1600152ee12443c75ffaf7feb7cc857316f5`. The prior plan was based on `86802e9cbaa7f0f72a5108018802a3d95e0a4285`. Current guidance, scope conformance, status, blueprint identity/source boundaries and relevant source-package guides were inspected. The supplied theme's current content resolved to **r22**, superseding the plan's r20 visual reference for this build.

The reference checkout was used for source grounding. The delivered package is portable and was not added to that repository's indexes or status files. Repository adoption remains a separate contribution step described below.

## 3. Scope and design conformance

| Declaration | Delivered position |
|---|---|
| Scope identity | AD-03 — Data-quality workbench, retained from the existing page-register family |
| Parent context | CRM-08, FIN-06 and inherited NFR-01–NFR-12; relevant F07/F07-A and DAT-01–DAT-03 relationships |
| Primary composition | Work queue + persistent detail |
| Supporting compositions | Review/comparison, guided form, record detail and document/evidence workspace |
| Shell boundary | Module interior; no competing application navigation rail, masthead or global search |
| Visual reference | Supplied r22 board: navy controls, Roboto typography, neutral surfaces, panel tabs and selected summary-card treatment |
| Concrete reuse | Exact three embedded PPOBoardRoboto font rules from r22; unchanged Customer 360 line-icon set; established SH-06/Customer 360 standalone assembly and queue/detail lineage |
| Incoming basis | Finding origin, stable subject identities, exact target version, source observation/evidence and permitted actor scope |
| Outgoing basis | Frozen proposal, independent decision, local mock receipt or prepared owner request, plus owned follow-up |
| Principal departure | Six AD-03 views and a bounded synthetic Equipment serial receiver; these are proposed module compositions, not new production policy |
| Verification position | Model, generated-page and native Chromium checks passed; specific wider plan obligations remain partial/unverified |

Neither a successful build nor a passing check changes the accepted PPO design baseline. No parent acceptance procedure is marked complete by this report.

## 4. Workspace structure

| View | Included information | Main interactions |
|---|---|---|
| **Quality queue** | Summary counts, finding family, case label, organisation/site context, owner, due state, priority, age, coverage and next action | Search, view/family filters, priority/sort filters, summary filters, selection, triage, capture, fixture checks |
| **Record comparison** | Stable record IDs, versions, organisation, addressed site, installation, served areas, manufacturer/model and serial | Compare records, inspect exact evidence, open full source detail, start a proposal or clarification |
| **Correction proposal** | Typed correction class, target version, before/proposed value, rationale, sources, impact acknowledgement, response and digest | Save incomplete draft, submit, inspect frozen content, create successor, compare changed fields |
| **Impact & relationships** | Current master, draft preparation, approved scope, issued pack, historical event and external mapping treatments | Inspect retained issue/acknowledgement hashes; prepare a Service review |
| **Review & resolution** | Exact submitted revision, independent decision, blocking findings, response acceptance, readiness, original operation and receipt | Accept, return, request information, decline, apply locally, reconcile, retry an eligible original, prepare owner request, verify closure |
| **History & follow-up** | Attributed timeline, exact revisions, prepared receiving work and private working note | Reopen exact revision, save note, repeat original observation, simulate materially changed evidence |

On wide screens, the queue has a register on the left and a persistent selected-case snapshot on the right. At narrower widths the row opens the full case, with a clear Queue return action. Comparison cards stack while retaining the labels for both records.

## 5. Queue, search, filters and triage

The initial data set contains sixteen permitted case observations for the default steward. Summary buttons show Unassigned, Needs evidence, Awaiting review, Awaiting domain action and Outcome unknown. Each button filters the queue to its corresponding condition. These categories overlap; their counts must not be added to infer a total.

Search is literal, case-insensitive matching over permitted case labels, titles, finding families, owning domains, owners, observation text, record references, record labels, serials and evidence references. It is not semantic search. Search can be combined with finding family, priority and case-view choices. The available case views are All open, All permitted, My work, Needs information, Awaiting review, Awaiting domain action and Closed. Sorting is by priority/case, due date or oldest first.

Rows identify the responsible person separately from the record-owning domain. A missing owner is shown as **Unassigned**. A missing date is **Date needed**, not On time. Overdue and Due today use the disclosed fixed evaluation date of 17 September 2026. Event instants are shown in Australian Eastern Standard Time; date-only due dates remain date-only values.

Assign / triage allows an authorised fictional steward to change owner, due date, priority and the supported investigation states Assigned, Investigating or Needs information. A reason is required. The form does not provide a shortcut to reviewed closure or a fabricated receiving result.

Capture finding creates a manual identity finding against an existing permitted Equipment record. It records a title, exact origin reference, observation, owner and optional due date. The source is explicitly a manual observation with an unversioned-source label. Repeating the same origin and subject opens the existing case instead of creating another case. Wider manual finding-type authoring is not delivered in r01.

## 6. Comparison and source evidence

The Equipment comparison exposes internal identity independently of display name. The North nursery and South propagation examples use distinct stable Equipment IDs and fictional physical addresses. A pump may be installed in an irrigation shed while serving three growing blocks. Installation, served-area relationships and parent/component meanings are not interchangeable.

Specialised comparison panels explain:

- The difference between a physical site address and an account's billing address.
- An invalid facility chain that returns to its starting point.
- Valid installed-versus-served relationships and a separately questionable cross-site link.
- A repeated MYOB customer key under two different company contexts.
- Original area values `1.250 ha` and `1.250 m²`, with unknown, known-zero and not-applicable meanings kept distinct.

Evidence opens in a single modeless right-side snapshot. Each source has its retained reference, exact version, owner, observation instant, availability and fictional text excerpt. **Open full detail** uses the main content area. Closing the snapshot returns focus to its source trigger where available. An unavailable exact source is not silently replaced by its latest version.

The included evidence is synthetic retained text. No real nameplate photograph, customer document or live SharePoint preview is included.

## 7. Correction proposal editor

The proposal editor supports the case's declared correction class. It does not offer arbitrary JSON editing or a generic master-record update command.

| Proposal element | Delivered behaviour |
|---|---|
| Target and expected version | Captured from the selected current synthetic record |
| Before value | Exact prior serial for supported serial corrections; source observation basis for other owner requests |
| Proposed value | Text-preserving serial, Keep separate disposition or bounded owner-request description |
| Rationale | Required before submission; explains the interpretation of the retained evidence |
| Source selection | Exact source identity/version selections; unavailable sources cannot satisfy submission |
| Impact acknowledgement | Required confirmation of current, draft and retained historical effects |
| Author response | Required after a blocking review finding; bound to the corrected submitted digest |
| Authority/source basis | Fixture policy, source observation and impact versions captured in the revision |
| Content identity | SHA-256 of a canonical representation of the substantive proposal |
| Predecessor | Explicit revision link for corrected successors |

A draft may be saved while incomplete. Submission is held for missing evidence, unavailable scope, unconfigured or changed policy, changed target/source/impact basis, missing rationale, unsupported correction class, no-effect serial change, blank serial, incomplete impact or unanswered blocking findings.

Serials are strings. Leading zeros, punctuation and letter case are preserved. Clearing a serial is unsupported in this increment. Physical relocation, asset replacement and financial changes remain with their lifecycle/source owners.

Submission freezes the substantive revision through the normal editing controls. Returned, declined or accepted-but-unapplied work can produce a successor against the current basis. Earlier revisions remain selectable. Changed value, rationale, evidence, target version, source version, impact version, policy and response are compared where they differ.

Unsaved proposal fields trigger a save/discard/stay choice when navigating. Worklist changes and preview-role changes are held while proposal edits remain unsaved. Validation failures retain the entered fields.

## 8. Independent review and findings

The review view offers **Accept exact proposal**, **Return for correction**, **Request information** and **Decline** for the current submitted revision. Every decision requires a reason and retains the reviewer's identity, time, revision and proposal digest.

The demonstration separates Alex Morgan's Data steward capability from Jordan Lee's Independent reviewer capability. A steward cannot accept their own proposal. Opening the review screen does not confer review authority.

Return and information-request outcomes retain a blocking finding with its original revision, digest, reason and accountable author. The steward creates a corrected successor and records a response. Resubmission binds that response to the new digest. The reviewer must explicitly accept the response for the exact revised proposal before accepting the correction. A response by itself does not resolve the finding.

The preview implements blocking findings. Richer advisory-finding classification, assignment and due-date management remain receiving work.

## 9. Impact, issued records and follow-up

The impact view distinguishes six reference categories. A single proposed current-field correction is not a command to update every linked record.

| Reference category | Treatment |
|---|---|
| Current master | Only the allowed current serial can change through the Equipment simulator |
| Draft preparation | Prepare an independently owned current-use review |
| Approved scope | Retain the original decision basis; reassess future use separately |
| Issued job pack | Retain exact issue bytes, version, hash and original acknowledgement |
| Historical event | Preserve event-time location/configuration and attributable context |
| External mapping | Retain provider/company/entity/key identity and source ownership |

Retained issued examples are bound to the relevant synthetic target. The primary North-pump example uses `SYN-PACK-014` and `SYN-ACK-014`. Other target fixtures have their own retained synthetic issue/acknowledgement identities. The SHA-256 values establish content identity, not source truth.

Follow-ups capture receiving domain, target, purpose, owner, due date or Date needed, reason and proposal/origin context. Repeating the same origin/proposal/purpose reuses the existing prepared obligation. A materially new basis can produce a separate linked request.

The file does not deliver a task to Activities, Service, SH-06 or another module. **Prepared locally** remains visible. Closing the quality investigation does not complete the receiving owner's task.

## 10. Supported local correction and recovery

The only underlying business-record mutation in this file is a fictional Equipment serial transcription correction. Before a new apply, the model requires the operator capability, full permitted scope, exact accepted digest, matching target version, unchanged source/impact/policy basis and complete impact evidence.

A successful local result increments one target version and retains its before/after record, accepted proposal digest, operation ID, result ID, receiving actor and time. It does not change the second asset, issued pack or original acknowledgement.

| Receiving scenario | Observable result |
|---|---|
| Normal | One mock receipt retained; receiving outcome becomes Applied |
| Response lost | Target changes in the local receiver ledger; observed outcome remains Outcome unknown |
| Reconcile original | Looks up the existing operation and recovers its original receipt without a second mutation |
| Still unknown | Retains the original unresolved operation and holds equivalent attempts |
| Confirmed not applied | Retains that conclusion; an original retry is offered under current readiness |
| Retry original | Reuses the original operation and exact payload; changed source/target/policy still blocks it |
| Same operation, different content | Refused; original identity cannot be rebound |

Historical result lookup and authorisation of a new correction are different operations. A recovered receipt remains an exact earlier outcome even if today's source observation has changed. Current access still governs disclosure. New work must meet current readiness.

An unresolved original outcome cannot be hidden through closure or a successor proposal. The separate **Reset demonstration** function explicitly replaces the entire fictional environment; it is not real-operation recovery.

## 11. No-change outcomes and owner requests

A reviewed **Keep separate** proposal has a receiving outcome of **Not required**. The steward can verify the accepted basis and close the case without changing either canonical identity.

A consolidation request, location/parent request, served-area correction, external-key reconciliation or unit clarification can be proposed and reviewed, then prepared for its owning domain. It remains Awaiting domain action / Prepared locally. No generic merge, deletion, redirect, unit conversion or MYOB master update is implemented.

The hierarchy fixture permits only the demonstrated same-site root `SYN-FAC-ROOT` as a typed owner request. Invalid self/cycle/cross-site choices are refused. This is a bounded demonstration guard, not a general-purpose organisational graph engine.

For an applied serial correction, closure requires the current target version and value to match the exact result and accepted proposal. A prepared draft-reference follow-up must exist. If the target subsequently changes independently, closure is held for review.

## 12. Roles and visibility

| Preview role | Included capability |
|---|---|
| Data steward | Draft, triage, clarify, prepare receiving work, annotate and verify eligible closure |
| Independent reviewer | Inspect and decide the current exact submission; accept its blocking-finding response |
| Equipment operator | Apply the supported mock correction; recover or retry its original eligible operation; prepare follow-up |
| Observer | Read permitted content; no consequential model commands |
| North-site scope | Steward interactions restricted to fully permitted North-site cases |
| No access | No case rows, protected detail or summary counts |

The DQ-12 counterpart is unavailable in the synthetic permission projection. Its hidden record identity, serial and site are not rendered in the comparison; proposal, impact, detailed history and review export are held when the required scope is unavailable.

**The HTML contains every fixture and is inspectable by its holder.** These controls demonstrate expected application behaviour; they do not secure confidential data. Real permissions must be enforced by authenticated server commands, permission-filtered queries and the owning domain.

## 13. History, exact navigation and exports

History records attributable actions and timestamps, including draft saves, submissions, decisions, receiver results, clarification requests and observation changes. Exact proposal selection persists across local views and browser Back. A missing exact revision displays an unavailable state instead of selecting the newest revision.

Private working notes are stored separately for the fictional author. Their text is excluded from proposal hashes and scoped review copies. Note-content history is not implemented: the latest private note is retained with attributed save events.

The **Review copy** action downloads JSON for the current permitted case and selected exact proposal. It includes the relevant records, sources, decisions, findings, outcome, observed receiving evidence, follow-ups, public history and retained issue. An unsaved draft may be included explicitly as such. Unobserved receiver results and private notes are omitted.

A review copy is neither an importable backup nor proof of production delivery. Markdown export and whole-workspace restoration are not implemented.

## 14. Fixture checks and incomplete reads

**Check fixture data** performs deterministic checks over the declared permitted synthetic case set. It reports the run, exact rule family/version and case-level finding. The checks include repeated local names, missing or repeated serial/model context, fixture hierarchy cycles, composite mapping context, unit representation and installed-versus-served meaning. They do not scan PPO, MYOB, SharePoint or arbitrary imported data.

A repeated original observation reuses its case and records that reuse. A material source-observation change can reopen a closed investigation while retaining the prior outcome. The checker does not automatically close cases or permanently suppress future matches after Keep separate. More complete accepted-basis suppression and recurrence policy remain future receiving work.

Preview read states include Complete, Partial, Failed, Loading and Empty. Partial/failed displays retain a labelled earlier snapshot and withhold complete totals. Empty is an explicitly complete-empty demonstration response, not evidence that the business data is defect-free. Loading withholds the response. These are controlled fixtures, not live provider failures.

## 15. Persistence, conflicts and damaged state

The module uses a versioned `ppo.ad03.r01.workspace` browser-local envelope. Cases, revisions, findings, decisions, follow-ups, mock operations and issued fixtures survive supported reloads. View preferences use a separate module-specific key.

A command result is retained in the current tab before the save outcome is reported. A failed local write pauses further material actions, retains the in-tab result and offers **Retry same save**. Retrying the save does not execute the correction command again.

Before saving, the current stored bytes are compared with this tab's expected base. A newer saved state produces a hold rather than a silent overwrite. The native second-tab check exercised the browser storage-event path. A deliberate reload warns that changes held only in the current tab will be discarded; a scoped review copy can preserve reviewable content first.

Malformed or unsupported saved envelopes retain their original stored bytes and pause writes. The user can inspect the initial fixture view and deliberately reset the fictional environment. There is no generic repair/import facility for damaged envelopes.

Browser-local storage is not an atomic multi-user transaction system, a durable audit store or an external receiving ledger. Browsers may restrict local-file persistence. The HTML's demonstrated safeguards are not substitutes for server-side transaction and receipt handling.

## 16. Included scenario catalogue

| Scenario | Included situation and expected use |
|---|---|
| DQ-01 | Two “Pump 1” assets at different sites; reviewed Keep separate, no mutation |
| DQ-02 | Mistyped North-pump serial; complete draft → return → successor → acceptance → simulated correction journey |
| DQ-03 | Potential genuine canonical duplicate; prepare owner consolidation without merging |
| DQ-04 | Missing nameplate/serial evidence; save investigation, request information, hold submission |
| DQ-05 | Billing address mistaken for work-site address; preserve separate location/account meanings |
| DQ-06 | Invalid facility parent cycle; bounded same-site root request, no silent reparenting |
| DQ-07 | Shed pump serves three blocks; retain valid links and review additional cross-site source link |
| DQ-08 | MYOB key `C0042` repeated in AU-DEMO and NZ-DEMO; composite identity comparison |
| DQ-09 | `1.250 ha` versus `1.250 m²`; retain representation and request owner clarification |
| DQ-10 | Partial import observation, eight of twelve declared records; no verified zero-defect claim |
| DQ-11 | Pre-accepted serial correction with changed current target; application held |
| DQ-12 | Comparison counterpart unavailable; scoped rendering and command/export refusal |
| DQ-13 | Pre-accepted correction applied with lost response; original-result lookup |
| DQ-14 | Missing configured field-owner/review policy; no permissive fallback |
| DQ-15 | Prior no-issue decision retained and new source observation available for reassessment |
| DQ-16 | Correction touches current display, draft work and retained issued evidence |

All organisations, people, addresses, equipment, provider-company examples, documents and observed content are fictional. Scenario labels are local package references, not newly allocated production numbering codes.

## 17. Suggested demonstration sequence

1. Open the HTML in a current desktop browser. The initial queue selects **DQ-02**. Use Help for the same guided sequence inside the file.
2. Open Record comparison. Inspect both pumps, their separate site addresses and the exact source snapshot. The North identity confirmation is `SYN-SRC-002-B v2`.
3. Open Correction proposal. Enter `00-EP-101`, explain the exact evidence and acknowledge the affected references. Save and submit.
4. In Preview options, choose **Independent reviewer**. Return the proposal with a reason requesting clearer reference to the exact nameplate version.
5. Choose **Data steward**, create the corrected successor, enter a response and acknowledge its impact basis. Resubmit.
6. Choose **Independent reviewer**. Accept the exact proposal and explicitly accept the response to the blocking finding.
7. Choose **Equipment operator** and set the next receiver response to **Response lost**. Apply the local correction. Outcome unknown is retained. Reloading the file keeps the original operation.
8. Use **Look up original result**. The recovered receipt shows one version increment and one applied correction.
9. Prepare a Service follow-up for the draft reference. Choose **Data steward**, verify the current value/result and close the case. The prepared follow-up stays independently open.
10. Review both proposal revisions, the original return, acceptance, operation and retained issue evidence. Export a scoped review copy if useful.

DQ-11 and DQ-13 provide shortcuts to changed-target and unknown-result situations without completing the whole journey. Reset demonstration restores the complete initial fixture set after a deliberate confirmation.

## 18. Visual, responsive and accessibility treatment

The module uses navy `#242a37` for primary actions, green `#62bb46` as a restrained selection accent, neutral surfaces and explicit text statuses. It uses the theme's three embedded Roboto weights with Verdana fallback, the established line icons, panel tabs, selected summary cards, bordered forms and modeless snapshots. It does not require a hosted font service.

Native Chromium layout checks exercised all six views at **1440, 1024, 768, 390 and 320 pixels**, without horizontal page overflow. The tab strip intentionally scrolls locally on small screens. Comparisons and forms stack and retain their field labels. A 200% **CSS zoom reflow proxy** also passed; this is not a claim that the browser-toolbar zoom control was tested.

Keyboard checks exercised source-panel Escape/focus return and native-dialog focus containment/Escape. Tab controls implement arrow, Home and End navigation; forms have visible labels, error summaries receive focus and statuses use text rather than colour alone. Reduced-motion rules are present.

Screenshots of the desktop queue, phone comparison, tablet proposal and enlarged review were inspected. That review led to clearer mobile filter widths and a corrected completed-proposal readiness message. Physical phone use, assistive-technology review, a complete contrast audit, browser-toolbar zoom and independent owner acceptance remain unverified.

## 19. Executed verification

| Evidence layer | Actual result | Main coverage |
|---|---|---|
| Pure model | **36 groups passed** | Scope, immutable submissions, independent review, exact responses, policy/version holds, receiver/replay/recovery, retained history and export projection |
| Generated-page / DOM | **24 groups passed** | Initialisation, six views, all fixtures, filters, snapshots, unsaved drafts, full correction journey, exact revisions, privacy, persistence and damaged-schema handling |
| Native browser | **15 groups passed**, Chromium **153.0.8010.0** | Portable-file execution, dialogs/focus, full returned-correction journey, interrupted reload/recovery, download, Back, five widths, enlarged reflow and real second-tab conflict |
| Resource behaviour | Passed | No external HTTP(S) requests during the native journey; no external script/style/image dependencies |
| Source/build | Passed | JavaScript syntax, deterministic assembly, pinned reused fonts/icons and final artifact identity |

These are **75 executed test groups**, not 75 independent business acceptance procedures. The original plan's 48 rows have wider requirements than some implemented fixture paths. The following mapping states those limits instead of declaring the entire plan complete.

### Original build-plan verification mapping

“Verified locally” applies only to the delivered synthetic behaviour and the cited test layer. It is not production acceptance.

| Plan ID | Result | Evidence and limit |
|---|---|---|
| AD03-T01 | Verified locally | Model/DOM denied and restricted projections; no-access counts/detail and export refusal. |
| AD03-T02 | Partial | Combined search/family filters and native Back checked; exact scroll-position and selected-row focus restoration are not fully implemented. |
| AD03-T03 | Verified locally | Explicit Unassigned and Date needed fixture rendering; no inferred On time. |
| AD03-T04 | Partial | Same-origin reuse is implemented; general import ingestion/deduplication and its full native capture path are not proven. |
| AD03-T05 | Partial | New-observation reopening and prior decision retention are implemented; not a full rule-version recurrence engine. |
| AD03-T06 | Verified locally | Distinct identities/sites and reviewed no-mutation Keep separate model path. |
| AD03-T07 | Partial | Serial text/context retained; fixture checker is not a universal serial-identity or replacement engine. |
| AD03-T08 | Partial | Composite-key comparison and owner-only handover checked; real multi-company ERP mapping not connected. |
| AD03-T09 | Verified locally | Missing evidence can be investigated but refuses submission. |
| AD03-T10 | Partial | Source meanings rendered distinctly; broad typed numeric editing and every export representation were not implemented. |
| AD03-T11 | Partial | Self/cycle/cross-site fixture requests refused; only the supported same-site root can be proposed. No generic graph editor. |
| AD03-T12 | Verified locally | Three served blocks remain independent of the installed irrigation-shed location. |
| AD03-T13 | Partial | Arbitrary location mutation unavailable and owner boundary explained; no executable physical-movement workflow. |
| AD03-T14 | Partial | Raw unit/precision panel retained and request-only handling; no conversion engine or area-total commands. |
| AD03-T15 | Verified locally | Exact sources remain named; missing/current-source changes hold readiness without latest substitution. |
| AD03-T16 | Partial | Partial snapshot and withheld totals checked; all read-state combinations are controlled simulations, not provider/pagination tests. |
| AD03-T17 | Verified locally | Draft/revision values retained through DOM reload and native correction reload. |
| AD03-T18 | Verified locally | No-effect values and unsupported local receiving classes refused. |
| AD03-T19 | Verified locally | Clearing is unsupported and blank serial submission is refused; not an implemented clear-value policy. |
| AD03-T20 | Verified locally | Frozen controls, canonical SHA-256 agreement and tampered-content rejection. |
| AD03-T21 | Verified locally | Steward acceptance refused; reviewer and author remain distinct fictional identities. |
| AD03-T22 | Verified locally | Missing policy and changed policy hold consequential commands. |
| AD03-T23 | Verified locally | Model/DOM/native return and successor preserve original r01. |
| AD03-T24 | Verified locally | Independent acceptance of the exact response required and exercised. |
| AD03-T25 | Partial | Digest-bound responses and successor reset implemented; the full edit-after-response acceptance sequence was not separately executed. |
| AD03-T26 | Verified locally | Accepted proposal does not change target; reviewer lacks operator capability. |
| AD03-T27 | Partial | Six typed reference categories rendered; actual cross-module dependency queries are absent. |
| AD03-T28 | Verified locally | Incomplete/current-impact hold exercised at model layer. |
| AD03-T29 | Verified locally | Issued content/acknowledgement structures unchanged across primary correction; retained content hashes exposed. |
| AD03-T30 | Verified locally | One current serial and version change through the mock owner, with before/after receipt. |
| AD03-T31 | Verified locally | Canonical records retained; consolidation request prepared locally and cannot close as applied. |
| AD03-T32 | Verified locally | Mapping handover remains prepared; no record version, ERP master or posting changed. |
| AD03-T33 | Verified locally | Same origin/proposal/purpose reuses one follow-up. |
| AD03-T34 | Verified locally | Matching current result required for closure; later independent version change holds it. |
| AD03-T35 | Verified locally | Changed target refuses apply and retains accepted proposal; DQ-11 starts in this state. |
| AD03-T36 | Verified locally | Changed source and policy each refuse a new apply. |
| AD03-T37 | Verified locally | Repeated original identity/payload returns existing result without another target version. |
| AD03-T38 | Verified locally | Conflicting operation binding refused. |
| AD03-T39 | Verified locally | Lost response, equivalent-repeat hold, native reload and original recovery exercised. |
| AD03-T40 | Verified locally | Still-unknown hold and confirmed-not-applied original retry checked, including changed-source refusal. |
| AD03-T41 | Verified locally | Failed-write retention and same-save retry exercised in DOM and native browser. |
| AD03-T42 | Partial | Native second-tab hold and unsupported-schema/raw-retention checks passed; arbitrary nested corruption, quota/crash combinations and multi-user atomicity are not proven. |
| AD03-T43 | Partial | Scope rechecked by model and denied counterpart tested; real authenticated access-revocation races are outside the standalone file. |
| AD03-T44 | Verified locally | Unsafe private text escaped; private notes excluded; native scoped JSON download checked. |
| AD03-T45 | Verified locally | Missing exact revision state, selected revision across views and native browser Back checked. |
| AD03-T46 | Partial | Five widths and six views checked without page overflow; 200% CSS zoom proxy checked. Physical devices and browser-toolbar zoom unverified. |
| AD03-T47 | Partial | Native dialog containment/Escape and source focus return checked; comprehensive keyboard, contrast and assistive-technology review outstanding. |
| AD03-T48 | Partial | Final one-file output, source pins, deterministic builder and report/package supplied; repository indexing/publication and owner acceptance not performed. |

## 20. Differences from the wider build plan

The complete primary correction and no-change journeys are delivered. The following planned breadth remains intentionally narrower or outstanding in r01:

- Queue filtering uses case view, family, priority and summaries. Dedicated organisation/site/provider/owner pickers, shared saved-view authoring and full due-state filter composition are not included.
- Manual capture is an identity finding against an existing permitted Equipment record. It is not an arbitrary-domain finding builder.
- The hierarchy safeguard is a controlled fixture allowlist, and specialised owner requests use descriptive text. General typed relationship operations, conversion rules and genuine consolidation receivers are not implemented.
- Blocking review findings are supported. Advisory classification, richer finding ownership/due editing and full per-note content history remain open.
- Source snapshots are exact fictional excerpts. There is no live document viewer, image upload, record discovery or whole-dataset scan.
- The checker keeps reviewed outcomes but does not implement a complete accepted-basis false-positive suppression service.
- The impact view uses a declared synthetic set. It does not discover all real uses of an asset across modules.
- Review-copy export is JSON. Importable backups, Markdown review export and general damaged-state repair are not included.
- Browser Back retains selected identity and exact revision. Full queue scroll/focus restoration and all long-content/device combinations remain to be refined.
- Source files and evidence are supplied in the ZIP. Repository UI indexes, document register, status, stable handover and a PR were not updated in this portable delivery.

These items must not be represented as implemented simply because they appeared in the preceding build plan.

## 21. Application receiving requirements

A future implementation should use PPO's existing modular architecture and typed domain services. It needs an authoritative QualityCase/Proposal/Decision/Operation model, authenticated scope enforcement, server-side field-owner policies and receiving commands that preserve exact expected versions.

The receiving transaction must bind the accepted proposal, authorisation decision, target mutation, audit/outbox and original operation receipt. Equivalent unknown outcomes need durable reconciliation across restarts and users. Browser-local save guards are not sufficient.

| Receiving owner | Required future contract |
|---|---|
| Equipment | Confirm writable identity fields and source authority; supply typed correction, lifecycle, receipt and reconciliation commands |
| Customers/Sites | Own usable addresses, effective site-party meanings, hierarchy and location history |
| MYOB / AD-05 | Verify provider/connection/company/entity keys and retain ERP master authority |
| AD-02 | Publish approved vocabulary, unit, field-owner and review policies |
| AD-04 / AD-06 | Own integration observations, import completeness, migration and supported replay |
| DK-01/DK-02/DK-03 | Resolve exact permitted evidence and retain controlled issue/acknowledgement history |
| SH-06 / Activities / Service | Receive exact review or follow-up requests, return actual receipts and own completion |
| AD-07 | Provide appropriate audit retention and controlled diagnostic/export access |

Repository adoption should place the source family under `docs/design/data-quality/`, issue the HTML/report under `docs/reference/ui/data-quality/`, record the stable design decision and update the current UI index, document register and status through a reviewed contribution. Preserve prior issued sources and do not promote the design to an accepted baseline without the corresponding owner decision.

No automatic merge, generic master-edit endpoint, external write, customer message, financial posting, migration or deployment is authorised by this prototype's controls.

## 22. Source register and artifact identity

| Source | Use |
|---|---|
| [Repository guidance](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/AGENTS.md) | Current package, naming, source-authority and verification rules. |
| [Current project status](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/STATUS.md) | Separates existing runtime, design contributions and outstanding acceptance. |
| [HTML module conformance](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/standards/html-module-conformance.md) | Existing scope identity, workspace interior, reuse, receiving boundaries and baseline treatment. |
| [Master blueprint](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/blueprints/BP-01-master-blueprint.md) | DAT identity context, CRM-08, FIN-06 and unresolved real field ownership. |
| [F07/F07-A quality direction](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/requirements/product-quality-register.md) | Partial/duplicate/mapping findings, original outcomes and retained references. |
| [Customer 360 source guide](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/design/customer-360/README.md) | Portable assembly, source separation, escaping and asset lineage. |
| [Customer 360 icons](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/design/customer-360/icons.json) | Exact reused line-icon bytes. |
| [SH-06 source guide](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/design/approvals-handover/README.md) | Queue/detail composition and prepared/domain-owned receiving distinction. |
| [Roboto source notice](https://github.com/deanrfiedler-gif/powerplants-one/blob/108b1600152ee12443c75ffaf7feb7cc857316f5/docs/standards/ui-assets/roboto-ofl.txt) | Repository accompanying font notice included in the source package. |
| Supplied Theme & Style Board r22 | Current exact source for embedded font rules, tokens and selected-state direction; hash below. |
| Retained AD-03 Build Plan r01 | Scope/journey/fixture/test basis; its wider requirements are reconciled above. |

| Artifact | SHA-256 / size |
|---|---|
| Final HTML | `be9d546dfc8826f99e3219e2dd46243d0760206c0f79cd0311b408c81f371c97` |
| HTML size | `203639 bytes` |
| Theme r22 | `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |
| AD-03 build plan r01 | `f33dc29f24f911ad01e6a38c7b27436034b7665141e78ff167dbf700de5c4b61` |
| Embedded font rules | `a3c83afa45da8ccb05686729f4cfdd2f4694e6771334b025f00207ef381185e9` |
| Reused icon set | `cf868d77b2c07f14f07985afd218649ba4362067ff2d55ef625c56bc2df1fcae` |

The ZIP includes `evidence/build-manifest.json` and the actual model, DOM and browser result JSON files. The builder verifies pinned reused assets, escapes embedded script endings and creates one self-contained HTML. Runtime fixture state is not pre-populated from the tests: opening the delivered file in a clean browser starts the original demonstration.

## Appendix — Executed check names

The exact named groups below correspond to the retained result JSON. They are included so a reviewer can distinguish real executed checks from the broader planned matrix.

### Model — 36 passed

1. 16 distinct fixtures and stable identity.
2. Denied and restricted scope projections.
3. Missing evidence refuses submit without mutation.
4. Blank serial and no-effect proposals refused.
5. Serial text case and leading zero preserved.
6. Unknown serial retained distinctly from zero.
7. Hierarchy cycle, self and cross-site requests held.
8. Supported same-site parent prepares only.
9. Installed and served links retained.
10. Independent canonical SHA256 agrees.
11. Submitted content cannot be edited in place.
12. Steward self-review and observer changes refused.
13. Missing field-owner policy refuses submission.
14. Return successor and exact response acceptance.
15. Acceptance is not receiving authority.
16. Partial impact blocks apply.
17. Target, source and policy changes each hold apply.
18. Bounded correction retains issued hashes and identities.
19. Replay returns original result without another version.
20. Operation identity cannot bind changed payload.
21. Lost response holds repeats, recovers original once.
22. Historical receipt recovers after source change.
23. Unknown lookup stays held.
24. Confirmed not-applied retry is original and guarded.
25. Not-applied original retry refuses changed source.
26. Keep separate closes with no mutation.
27. Consolidation preserves canonical records and awaits owner.
28. MYOB mapping remains prepared only.
29. Follow-up deduplicates same origin target purpose.
30. Closure requires matching receipt and owned draft follow-up.
31. Post-apply independent target change prevents closure.
32. Private note does not change digest or enter export.
33. Denied export and unavailable counterpart refused.
34. Missing exact proposal not substituted.
35. Seeded stale target and interrupted cases usable.
36. Frozen content tampering refuses apply.

### Generated page / DOM — 24 passed

1. Generated HTML initialises with six views and 16 fixtures.
2. Combined search and finding filters work.
3. Summary filters correspond to states.
4. Comparison renders distinct IDs, sites and serial text.
5. One modeless exact evidence panel and full detail.
6. Unsaved navigation preserves fields.
7. Draft save and frozen submission work through UI.
8. Reviewer return keeps original submission.
9. Corrected successor response binds exact submission.
10. Independent exact response accepted through UI.
11. Interrupted correction recovers exact original result.
12. Prepared follow-up and verified closure remain separate.
13. Old exact revision persists between views.
14. Missing exact revision does not substitute latest.
15. Unsafe note text escaped and excluded from review copy.
16. Partial read retains snapshot and withholds complete totals.
17. All six views and 16 scenarios render without exceptions.
18. Revoked counterpart details withheld.
19. Denied scope hides names counts detail and exports.
20. Failed write retains command result and same-save retry.
21. Exact saved state survives generated-DOM reload.
22. Damaged schema pauses writes and retains raw bytes.
23. No external fetch tags or runtime resources.
24. No generated-DOM runtime errors.

### Native browser — 15 passed

1. Portable file initialises and makes no network requests.
2. Native source snapshot keyboard close returns focus.
3. Dialog name, native focus containment and Escape.
4. Native unsaved navigation and field retention.
5. Native submit and independent return.
6. Native successor and exact response acceptance.
7. Native lost response reload and original recovery.
8. Native prepared follow-up verified closure and scoped download.
9. Real browser Back retains exact revision.
10. Five widths and six views have no page overflow.
11. 200 percent CSS zoom reflow has no page overflow.
12. All scenario comparisons render natively.
13. Failed save retry does not duplicate draft.
14. Native second-tab stale-state guard.
15. No native runtime errors or external requests.

