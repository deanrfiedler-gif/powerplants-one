---
document_id: PPO-KNOWLEDGE-REPORT
title: Knowledge search and article detail — module design report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed interactive design; local verification complete; native visual review and application integration pending
source_commit: 07eb34d5df5ea430c365da78e160cb6aa0b76f20
page_scope: DK-04
---

# Knowledge search and article detail

## 1. Purpose and delivered outcome

The [companion HTML](PPO-Knowledge-Search-and-Article-Detail-r01.html) presents a professional, self-contained Knowledge workspace for Powerplants One. It supports one central question: **Which guidance can I rely on for this equipment and growing situation, and what must be checked before I use it?**

The design connects searchable troubleshooting, procedures and lessons to an explicit equipment context, source evidence, technical review and revision history. It deliberately separates an article's validation state, its review currency and its applicability. A reviewed article can be out of date, applicable to different equipment or dependent on a source that has changed. A suspected cause remains a hypothesis until a competent reviewer establishes a validated procedure.

This deliverable is a standalone interactive design, with synthetic records and browser-local persistence. It is not an integrated application module, operational knowledge base or approved technical manual. No real manufacturer procedure, repair setting, control limit, firmware compatibility or biosecurity instruction is invented.

## 2. Source basis and traceability

| Source | Contribution to the design |
|---|---|
| User's current DK-04 brief, 16 September 2026 | Reviewed troubleshooting, procedures and lessons; equipment/model/software/growing applicability; sources, reviewer and dates; uncertain and superseded advice; source review and expiry |
| Attached Powerplants One Theme & Style Board r20 | Layout, typography, palette, controls, status treatments, snapshot pattern and responsive design direction |
| [BP-01 §16.3](../../../blueprints/BP-01-master-blueprint.md#163-communications-and-knowledge) | Distinguish approved instructions, working notes, suspected causes and obsolete advice; expose applicability and protect customer-facing outputs |
| [Coverage audit r04](../module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md) | DK-04 page contract; DK-05 authoring/review remains a separate capability |
| [Product quality register C04](../../../requirements/product-quality-register.md) | Source-linked learning, reviewed applicability/revision, expiry/supersession and private-content boundaries |
| [PPO naming standard](../../../standards/naming-conventions.md) | Stable identities, readable references, explicit revisions and SYN-PPO demonstration records |
| [Shared UI specification](../../../standards/ui-style-specification.md) | Reusable controls, reviewable visual baseline and separation of design from implementation acceptance |

The repository was inspected at main commit `07eb34d5df5ea430c365da78e160cb6aa0b76f20`. The supplied attachment and repository r20 board are byte-identical: SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.

Primary traceability is **DOC-04**, supported by **DOC-06, ENG-07 and SVC-06** through C04. **AT-20/AT-37** remain parent acceptance obligations; this visual contribution does not claim they have passed. The broader product-quality work remains tracked in [issue #181](https://github.com/deanrfiedler-gif/powerplants-one/issues/181).

## 3. Included views and navigation

| Surface | Included information and behaviour |
|---|---|
| Search articles | Catalogue summary, search, topic/type/status filters, current-applicable-only filter, historical visibility, sort, result metadata, preview and bookmark controls |
| Saved articles | The same result model and active filters, limited to local bookmarks; review and suitability warnings remain visible |
| Review watchlist | Articles with overdue, unreviewed, expired or changed evidence; proposed owner and review date; locally captured requests awaiting review |
| Quick snapshot | Right-side article summary with exact reference/revision, independent status labels, model/versions/growing scope and reviewer/date fields; opens the full article |
| Article | Purpose, observation sequence or learning, limits, stop conditions, related knowledge and review request |
| Applicability | Five-dimension comparison between article scope and selected installation; provenance of the selected context |
| Sources & evidence | Exact synthetic source references/revisions, source status, reviewer, reviewed/expiry dates, source-specific applicability and retained excerpts |
| History | Article revision events and local requests tied to that article's exact revision |

The top-level views and article sections use labelled navigation controls. Search criteria and selected context are retained when opening an article. The URL fragment stores view, article, requested revision, section, context and filters. Browser navigation restores these values. A link requesting an unavailable article revision produces an unavailable state instead of silently substituting another revision.

The preview is a **module interior**. It follows the supplied theme's modular approach without adding a duplicate global navigation rail, a replacement logo or a second application header.

## 4. Equipment and growing context

A persistent context strip states which installation is being checked. It exposes the fictional equipment reference and model, firmware, control software and crop stage. The context selector offers these scenarios:

| Scenario | Purpose |
|---|---|
| Willowbank Berries · Tunnel 04 | Default complete context: SYN AquaControl A2, firmware 2.4.2, GrowDesk 6.2, Tunnel, Blueberry · fruiting |
| Same installation after firmware change | Firmware 2.5.0 deliberately falls outside the example's approved version set |
| Same installation with unknown firmware | Demonstrates that missing evidence is not a positive applicability result |
| Cedar Nursery · Propagation House 02 | Different model, software, facility and crop stage; its own climate article can match |
| No equipment selected | Keeps all context dimensions explicitly unknown |

Each selected context retains an equipment reference, captured date and source owner. These are fixed synthetic snapshots, not live equipment telemetry. Changing the context recalculates article and source applicability, search eligibility and visible warnings. It does not change the technical article or assign approval.

The five comparison dimensions are:

1. Equipment model.
2. Firmware.
3. Control software.
4. Facility or growing-area type.
5. Crop and growing stage.

The demonstration uses explicit allowed values, not inferred version ranges. Each row is **Match**, **Mismatch** or **Unknown**. Any mismatch yields **Outside scope**; otherwise any unknown yields **Context incomplete**; only five explicit matches yield **Matches context**. A facility name, shared parent or similar equipment appearance never establishes suitability. Site-specific access, biosecurity, work windows and shutdown authority remain separately governed.

## 5. Search and result information

### Search behaviour

Search uses all entered words, case-insensitively, against titles, summaries, readable references, content types, topics, evidence states, tags, applicability values and source titles. It is a deterministic local search over eight fixtures. There is no semantic ranking service, external index or generated answer.

Filters combine rather than replacing one another. Topic choices are Water & irrigation, Climate and Screen systems. Content types are Troubleshooting, Procedure and Lesson learned. Evidence filters include Current & validated, Needs review, Suspected fix, Reviewed lesson and Superseded. A separate control includes historical superseded articles; selecting the Superseded status enables that visibility explicitly.

**Current applicable procedures only** applies the combined eligibility rule, including required source checks. Sort choices are best contextual match, article title and review due date. Contextual sort gives first position to a current eligible procedure; uncertain hypotheses are not promoted ahead of validated matching guidance.

### Result fields

Every result includes its content type, topic, exact revision, title, short summary, validation state, review currency and contextual suitability. It also shows the synthetic article reference, reviewer, reviewed date where available, review due date and required source count. A changed-source label is added when required evidence is not current or does not match.

Titles open the full page. The eye control opens the snapshot. The bookmark control toggles local saving and exposes its selected state accessibly. Summary shortcuts filter all articles, current applicable procedures or suspected fixes; review attention opens the watchlist.

By default, seven articles are visible and the superseded example is hidden. The catalogue count includes all eight fixtures and is explicitly distinguishable from the filtered result count. In the partial-result scenario, a warning explains that the response is incomplete and that catalogue figures are fixture counts.

### No-result recovery

The empty state offers Clear filters and Request guidance. A missing-guidance request retains the current search and equipment context, with no fabricated article relationship. Zero results are never presented as proof that authoritative guidance does or does not exist.

## 6. Validation, currency and eligibility controls

| Control axis | States or treatment |
|---|---|
| Knowledge state | Validated procedure, Reviewed lesson, Suspected fix, Superseded |
| Review currency | Current, Review overdue, Expired, Unreviewed |
| Context applicability | Matches context, Outside scope, Context incomplete |
| Required source | Independently checked availability, review date, expiry and all applicability dimensions |
| Work authority | Always separate from reading, saving, citing or technically reviewing an article |

A procedure appears as current and applicable only when all of the following are true:

- Its state is Validated procedure.
- Its technical review is current; its review due date has not passed and its expiry has not passed.
- All five article applicability dimensions match.
- It has required evidence sources.
- Every required source is Available, reviewed, has an established unexpired expiry and independently matches the selected context.

Dates are evaluated against the visible fixed demonstration date, **16 September 2026**. This makes examples repeatable; it is not a live production clock. In the demo, a date equal to that day remains current for that day. Production expiry must define exact timestamps, timezone and policy explicitly.

An overdue review excludes the article from the current-applicable shortcut even if its expiry is later. A reviewed lesson remains learning material rather than a procedure. Suspected fixes show a working hypothesis and validation questions without corrective steps. Superseded advice retains its identity, reason and successor link, while operative steps are withheld. Expired material remains available as clearly labelled reference information.

## 7. Article content and technical boundaries

The default article, **Intermittent irrigation readings: capture the right evidence**, demonstrates an evidence-gathering sequence. It asks the user to confirm recorded context, capture symptoms and conditions, compare exact evidence and hand the unresolved finding to technical review. It contains no invented repair instruction, control setting or manufacturer-approved compatibility claim.

The full page combines a readable article area with a compact review sidebar. The sidebar contains reviewer, reviewed date, next review date, expiry, article owner, readable reference, revision, audience, content type, source count and local request count. Related-article controls lead to other records; each destination shows its own warnings and applicability.

The article warning remains above every detail section. This prevents a user opening Sources or History from losing the overall suitability limitation. Review date and expiry remain distinct fields. An absent review or expiry is displayed as Not established.

The article's stop conditions explain when the guidance must be referred back to the technical owner. Reading, saving or copying a reference does not authorise work, alter a service case, approve a repair, complete a job, permit a shutdown or establish site access.

## 8. Source evidence and provenance

Each source record exposes:

| Field | Purpose |
|---|---|
| Readable source reference and revision | Identify the specific retained evidence cited by the article |
| Title and evidence kind | Explain what the material is |
| Availability / review state | Distinguish available evidence from changed or superseded material |
| Required-source designation | Establish whether failure of this evidence affects procedure eligibility |
| Reviewer and reviewed date | State who reviewed the source and when |
| Expiry | Expose the source's own review validity |
| Source location and section | Show where the evidence belongs and the part being relied upon |
| Five-dimensional source applicability | Compare the source's scope with the current installation independently of the article |
| Retained synthetic excerpt | Make the illustrative evidence inspectable within the standalone file |

The **Sensor trend gaps** article intentionally has current article-level review and matching article scope, while its required source is changed and applies to firmware 2.3.0. The UI therefore shows source review attention and excludes the article from current-applicable procedures. This demonstrates the difference between a credible-looking article label and evidence that actually supports the selected installation.

The source records are fictional and embedded. They do not fetch SharePoint files or claim an authenticated document permission check. A future integration must retain immutable source revision/version identifiers and content hashes, handle deleted or unavailable versions, and apply document permissions before returning a title, excerpt or link. SharePoint remains the intended business-document authority.

## 9. Review requests and watchlist

The reader can raise a local request from an article or request missing guidance from search/watchlist. The form captures a reason, observation or missing information, proposed reviewer and due date. It requires at least 12 non-whitespace characters of detail and a due date on or after the fixed demo date.

An article request retains the article reference, exact revision and selected context; a general guidance request has no article link and retains the search description. The context ID refers to an immutable fixture snapshot. Every request receives a synthetic reference and remains **Awaiting review**. Proposed owners are fictional functional examples, not employee assignments or approved organisational roles.

Requests appear in the watchlist and, for article-linked requests, in History. They persist locally when storage is available. Requesting review does not change an article's validation, replace its sources or send a notification. Approval, rejection, publication, withdrawal and authoring belong to the separate DK-05 capability and are intentionally outside this reader-focused module.

## 10. Demonstration catalogue

| Article ending | Title | Deliberate scenario |
|---|---|---|
| 000001 | Intermittent irrigation readings: capture the right evidence | Current validated procedure matching the default context |
| 000002 | Prepare an irrigation event record for technical review | Review overdue, although expiry remains in the future |
| 000003 | Possible cause: connector movement and intermittent readings | Suspected fix, no technical validation or corrective sequence |
| 000004 | Lessons from a crop-window handover | Reviewed learning, not a procedure or permission to work |
| 000005 | Legacy irrigation readings investigation | Superseded historical reference linked to 000001 |
| 000006 | Review a climate alarm evidence pack | Different equipment/software/growing scope; matches the propagation-house fixture |
| 000007 | Historical screen drive observation sequence | Expired article/source with explicit ScreenDrive equipment scope |
| 000008 | Sensor trend gaps: source revision under review | Current article label undermined by changed, incompatible required evidence |

All readable article references use `SYN-PPO-KA-`, source references use `SYN-PPO-SRC-`, review requests use `SYN-PPO-KR-`, and equipment references use `SYN-PPO-EQ-`. These are demonstration references, not production UUIDs or external ERP keys.

## 11. Persistence, failures and recovery

Bookmarks and review requests are saved under one module-specific browser storage key. View, query and context live in the URL fragment. A copied exact article reference includes its revision, review/applicability state, reviewed/expiry dates, context, source references and a synthetic/no-authority notice. Clipboard denial opens a selectable text fallback.

The Preview options dialog offers internal-reader and no-access scenarios; ready, partial, loading, failed, empty and denied result scenarios; and a simulated save failure. These are UI demonstrations rather than authentication or real service states.

| Situation | Visible response |
|---|---|
| Failed local save | Unsaved status, retained in-tab change, Retry save and export options; retry saves existing records without creating another request |
| Unavailable or malformed saved data | Explicit recovery warning; original stored bytes are not silently overwritten; deliberate reset is required before normal saving resumes |
| Partial result load | Explicit incomplete-response warning with retry |
| Loading | Loading state with a demonstration finish control |
| Load failure | No false empty catalogue; retained local records and retry |
| No matching results | Clear filters and request missing guidance |
| Denied access scenario | Article titles, result counts and equipment strip hidden from the visible workspace |
| Unknown article/revision | Unavailable state; no substituted article or revision |
| Another tab updates local data | Valid saved state is refreshed; this is not a multi-user transaction protocol |

Export produces a labelled synthetic JSON file. Reset clears only this module's local records after a deliberate confirmation dialog. Local storage has no server concurrency or security boundary; simultaneous browser writes can still race. There is no implemented offline cache expiry, encrypted offline store, background synchronisation or server-side deduplication. Those remain explicit receiving requirements.

## 12. Theme, accessibility and responsive design

The design reuses r20's navy `#242a37`, green `#62bb46`, pale workspace `#f5f6f8`, white cards, fine `#e1e5eb` dividers and muted supporting text. Embedded Roboto weights 400/500/700 use the supplied board's assets, with Roboto/Verdana fallbacks. Primary actions are navy; green indicates selected navigation and positive reviewed state. Warning and expired states use both text and colour.

Search uses a narrow filter rail beside a wide results area. The full article uses a readable main column and a compact review sidebar. The quick snapshot follows the 448 px desktop pattern with square outer corners and a full-height scrollable panel. At narrower widths, filters wrap, summaries form two columns, article/sidebar content stacks and the snapshot fits the available screen.

Accessibility provisions include a skip link, native buttons and form controls, explicit labels, visible focus outlines, meaningful button names, bookmark pressed states, navigation current-state attributes, live save/result feedback, native modal dialogs and reduced-motion styling. Icons are decorative beside text or have accessible control labels. The design includes print styling but is not an issued-document/PDF workflow.

These are authored provisions. Native layout, keyboard focus behaviour, zoom, screen reader and physical-device acceptance remain to be verified; local DOM tests do not establish WCAG conformance.

## 13. Future application integration contract

The existing TypeScript/Next.js modular monolith, PostgreSQL, server permissions and replaceable document adapters remain the receiving architecture. No new runtime framework, application route, migration or service is added by this design.

A bounded implementation should introduce:

- Article identity with immutable revision, state, reviewed scope and separate publication/audience control.
- Source links carrying provider/company context, immutable document version and hash, section, reviewer, dates, availability and structured applicability.
- Equipment context containing source identity, capture time, completeness, firmware/software and actual growing-area/crop scope.
- Permission-filtered search whose results, counts, previews, excerpts and deep links use the same allowed scope.
- Revision-bound bookmarks and citations that display stale, withdrawn, superseded or unavailable state without automatic revision substitution.
- Review requests with server-generated identity, exact article/context snapshot, owner, due date, durable receipt and audited disposition.
- Server recomputation of applicability and source currency; the client cannot grant validation or publication authority.
- Explicit version-range semantics, expiry timestamps/timezones, source-change invalidation and protected historical access.
- Conflict handling and retry semantics for writes, including unknown outcomes and duplicate requests.

There is no customer publication in this module. Portal knowledge must use its own explicit reviewed audience/scope and exclude internal notes. Technical approval does not grant publication, work, commercial or customer-message authority.

## 14. Verification and limitations

The [verification record](../../../testing/evidence/knowledge-r01/README.md) retains the actual results and reproduction commands. At this issue, **15 model groups and 13 non-rendered DOM interaction groups passed**. Checks cover all applicability dimensions, unknown/changed firmware, overdue/expired review, suspected and superseded advice, changed-source invalidation, exact revision handling, bookmarks, owned requests, failed-save retry, malformed local-state preservation and denied UI state.

The preview browser's security policy blocked local HTTP and local file navigation. Native browser rendering, visual screenshot review and mobile interaction testing were therefore **not completed**. A repository-native Playwright script is supplied for an authorised environment with the maintained browser installation; it has not been represented as executed evidence. The final handover records repository assurance results separately.

Owner acceptance, complete AT-20/AT-37, integrated permissions, live documents, search performance, concurrency, offline controls and operational use remain open. The design does not promote the broader knowledge capability to implemented or production-ready status.

## 15. Suggested review walkthrough

1. Open the HTML with the default Tunnel 04 context. Inspect the independent status labels and use Current & applicable.
2. Preview article 000001, open it and read the applicability table and source excerpt.
3. Change to the firmware-changed and firmware-unknown contexts. Confirm that a previous article match no longer establishes suitability.
4. Open article 000008. Compare its current article review with its changed and incompatible required source.
5. Inspect the suspected fix and reviewed lesson; neither provides procedure authority.
6. Include superseded articles, open 000005 and follow its successor. Confirm that the replacement is assessed in the current context.
7. Save an article, open Saved articles and reload. Its warnings remain visible.
8. Raise an owned review request, inspect History and the watchlist, and confirm that article validation has not changed.
9. Use Preview options to demonstrate save failure, retry, empty/partial/failed results and no-access presentation.
10. Complete native desktop/phone and keyboard review before adopting this issue as the implementation baseline.

The next bounded step is visual review and refinement of DK-04, followed by a server-backed reader/search slice with revision-bound article and source permissions. DK-05 authoring and publication should follow its separately specified workflow.

## Publication handover

The complete repository contribution was committed locally. GitHub publication could not be completed because HTTPS push authentication was unavailable. In accordance with the repository contribution guide, publication stopped at that point; no remote branch or pull request was created. The delivered patch preserves the source, artifacts, checks and additive index/register changes for normal repository handover.
