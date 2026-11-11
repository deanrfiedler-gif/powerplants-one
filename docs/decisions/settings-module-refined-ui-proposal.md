---
document_id: PPO-SETTINGS-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal in progress, 10 November 2026; the build stopped part-way when the Figma tool-call limit for the day was reached (section 6), and the Global configuration sheets GL02 to GL06, the Interaction states page and the four Read me cards are still to be drawn; design acceptance is Dean's and has not been given; no named version is saved; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment; every record shown is synthetic
source_commit: 1888cc81d4c99e68836390110a6655e767fa17d5
versioning: git
---

# Settings module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal, build in progress. Sections 1 to 8 are the proposal record. Later sections will record the audit, Dean's acceptance, further batches and named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 10 November 2026 Dean asked for the refined UI pages of the Powerplants One Settings module to be designed in a new, empty private Figma file, "PPO - Settings module (proposal)", inside the accepted shell and to at least the standard of the Sales module file. The module is the **Administration** workspace reached from More (fourteen pages in the accepted Shell menu), the **Settings** rail item that opens the Settings hub, **Assistant settings** (AI-06), **My account and preferences** (SH-03, SH-05, EC-02) and the module's own **global configuration**. His brief set the scope, decisions D1 to D13, one synthetic dataset as at Thursday 5 November 2026, 09:00 AEDT, signed in as systems administrator Taylor Quinn, and Addendum A3 (persona and story reconciliation, as amended for Service, Finance and Settings on 10 November 2026). He added a standing instruction: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The ten questions in the brief (Q1 to Q10) were therefore answered by their stated defaults; each is recorded in section 5 and can be reversed.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, does not touch the AD-01 access-review generator, and authorises no business transaction, integration or customer communication. Four statements stay separate throughout: code delivery (none), design acceptance (Dean's, not given), production readiness (not inferred; nothing in the file says "production ready") and integration with MYOB, SharePoint, Microsoft 365, the maps provider, the assistant provider or any migration source (none exists and none is authorised; every connector, key, reply and reference in the file is a synthetic placeholder).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted" (8 November 2026): page "Shell refined · desktop shell and menus" and page "Workspace menus · flyout and docked (accepted 8 November 2026)" | Chrome and geometry: 48 px top bar with global search, 80 px collapsed rail with the fixed Settings item, the accepted Administration flyout and docked menus (four groups, fourteen pages, nested page views, R107, R108), the collapsed docked strip, the 1024 top bar (332 / 360 / 332), the Account menu (sheet I), the record header toolbar set and its phone variant (Addendum A1, R116 to R125); settings pages omit the right strip (R13). Components were rebuilt in the new file under the same names from the Sales and Shell copies |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), the helper library, the phone header and tab bar pattern; the Sales administration sheets as the pattern for propose, review and publish |
| Private Figma file "PPO - Design", the "— Administration —", "— My Work —" and "— Shared records —" pages | Rules, stories and vocabulary of the accepted pages (Users and access, Settings, Settings amendments, Operational health, Assistant settings, Migration & cutover, Retention & lifecycle, Onboarding & support, Help Centre) and the tier-2 proposals of 23 October redrawn here (Data quality, Integrations, Mappings & reconciliation, Audit history, My account). Frozen reference; its shell was not copied |
| [Settings hub](settings-hub-figma-design.md), [Settings amendments](settings-amendments-figma-design.md), [Users and access](users-and-access-figma-design.md), [Users, roles and access review](users-roles-access-review-design.md), [access-change requests](access-change-requests.md), [application](access-request-application.md), [withdrawal](access-request-withdrawal.md), [local teams](access-local-teams.md), [attestations](access-review-attestations.md), [scheduling policy publication](scheduling-policy-publication.md), [Operational health](operational-health-figma-design.md), [Assistant settings](assistant-settings-figma-design.md), [Migration & cutover](migration-cutover-figma-design.md), [Retention & lifecycle](retention-lifecycle-figma-design.md), [Onboarding & support](onboarding-support-figma-design.md), [Help Centre](help-centre-figma-design.md), [Workshop settings](workshop-settings-figma-design.md), [Data quality workbench](data-quality-workbench-design.md), [notification inbox and preferences](notification-inbox-preferences-design.md) | Accepted decisions and rules carried into the redrawn pages |
| [PPO workspace, MYOB book of record](ppo-workspace-myob-book-of-record.md) (EI-1 to EI-10) | MYOB stays the book of record; read-only first (EI-9); finished events sent once with a unique key and unknown outcomes looked up (EI-3, EI-5); daily reconciliation (EI-6); every posting attributable in Audit history (EI-8) |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) and Addendum A2 | Reference form `SYN-<TYPE>-<NUMBER>`; `PRACTICE-` records in the practice space only |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md), [design, build and review roles](design-build-review-roles.md), [documentation source isolation](documentation-source-isolation.md), [UI scope ID mapping](ui-scope-id-mapping.md) | Naming, page order, the nine-field declaration, r20 page types, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/components/product-navigation.tsx`, `src/components/refined-shell-menu.tsx`, `src/admin/settings.ts`, `src/platform/permissions.ts`, `docs/design/access-review/model.js`, `db/migrations/` (0001, 0002, 0004, 0043, 0053, 0054, 0077 to 0084, 0110, 0120) | Destinations and their permissions, the account menu labels, the hub's area statuses, the 163 capability keys and their labels, and the lifecycles where code exists; read only |

The file's link and key are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The Administration workspace and its neighbours: `scope:AD-01` Users and access (with Access-change requests, Proposed role bundles, Capability catalogue), `scope:AD-02` Settings hub and Business policies with its amendments, `scope:AD-03` Data quality, `scope:AD-04` Integrations & recovery with Exceptions & recovery, `scope:AD-05` External mappings and reconciliation, `scope:AD-06` Migration & cutover, `scope:AD-07` Audit history, `scope:AD-08` Retention, `scope:AD-09` Operational health with Foundation checks, `scope:AD-10` Onboarding & support, `scope:AI-06` Assistant settings, `scope:SH-03`, `scope:SH-05` and `scope:EC-02` My account and preferences, and the module's own global configuration (proposed, section 5). No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Overview / dashboard (the hub, Integrations, Operational health, Migration, Assistant settings, the support owner view); Register / worklist; Record detail; Review / comparison (policy versions, bundle against grants, duplicate records, sent against posted, rehearsal counts, cutover readiness); Planning workspace (the coexistence plan); Form / guided workflow as 432 px right panels and 560 to 720 px centred dialogs; states; tablet and phone variants. Per scope in 2.2 |
| Reused components | Rebuilt local copies under the accepted names: Shell / Top bar, Shell / Top bar · 1024, Shell / Rail · collapsed (current variants including Settings, More, Service and None), Shell / Workspace menu · docked · Administration (fourteen current variants with nested page views), Shell / Workspace menu · collapsed strip, Shell / Workspace flyout · Administration, Shell / Account menu, Shell / Record header · toolbar (six states) and its phone variant, phone header, status bar and three tab bars; 101 shell icon components (Lucide stand-ins for Font Awesome Light) and the brand mark; the "PPO colour" variable collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names |
| Source authority | Dean's brief (D1 to D13), Addendum A3 and his standing instruction; the accepted designs listed in section 1 as accepted direction; the 23 October proposals as tier-2 direction redrawn here; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as Taylor Quinn unless the sheet names another person; health checks 08:55; the reconciliation run 06:02 and the MYOB read 06:00 Complete |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record; navigation is discovery only and every page re-checks its permission |
| Outgoing handover | Per scope in 2.2. Nothing drawn posts to MYOB, removes anything from MYOB or SharePoint, moves a booking, re-pins a reservation, edits a published version, a posted document or an audit event, or writes a live record from a rehearsal. Every finished event sent to MYOB shows one of five states: Prepared, Sent, Posted, Unknown, Refused |
| Exceptions and recovery | Drawn per scope: loading, true-empty and filtered-empty, could not load (never read as down or as zero), denied and not permitted, read only, stale (a newer save or an out-of-date review), partial source, outcome unknown with lookup only, a retry refused or already running, a second-person refusal, a held or blocked state with its reason, offline and uncertain sends. A count that cannot be read shows a dash and nothing reads zero where nothing ran |
| Departures | Section 5 |
| Verification | Section 6 |

Across every scope: two people act on every change that matters (hub Q1; access independence; EI-4); versions are immutable and installed by seed until a person publishes (policy persistence); audit events are append-only and corrections are reversals (EI-4, EI-8); finished events are sent once with a unique key and unknown outcomes are looked up, never replaced (EI-3, EI-5); rehearsals write nothing live and snapshots must be synthetic or approved redacted (AGENTS.md); PPO removes nothing from MYOB or SharePoint; grants are facts, never authority.

### 2.2 Per scope

| Scope | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| AD-02 Settings hub and Business policies, `/admin/settings`, `/admin/policies` | Overview; Register; Record; Review; Dialog | The hub and the families editable here (Scheduling policy, Record references); every module publishes its own families | Proposals from a holder of the family's propose duty; module settings shown read-only as "changes elsewhere" | Published versions with affected work in three bands to PL-04 and the owning pages; Settings never moves a booking |
| AD-01 Users and access, `/admin/access` and below | Register; Record; Review; Form; Dialog | Identities, grants, access-change requests, local teams and attestations; every page re-checks its permission | A Request access draft from the denied system page; a proposal by `admin.access.propose` | An independent decision (Jordan Kim), an application by a third person (Taylor Quinn); the grant reads Scheduled, then Current; "Approved means reviewed, not effective" |
| AD-04 Integrations & recovery, `/admin` | Overview; Register; Record; Panel | Sync items and their attempts; source pages own the records and MYOB owns the posting | Finished events from Supply, Finance and Service source pages | Retry under the same key after a check by key; Mark resolved with what MYOB holds; Hand back to the owner; counts read by AD-09 and KPI-14 |
| AD-05 External mappings | Register; Record; Review; Panel | Mappings and the sent-against-posted reconciliation; FN-06 owns values against ledger balances; Data quality owns duplicates | Unmapped keys from sync items, MYOB reads and migration exceptions | Verified mappings that free waiting items; differences owned and resolved through Finance |
| AD-03 Data quality | Work queue; Record; Review; Panel | Findings and correction proposals; owning pages apply corrections | Checks on save and nightly; reports from any record page; migration duplicates | A prepared request to the owning page, its outcome read back (applied, returned, unknown) |
| AD-07 Audit history | Register; Record; Panel | The trail and exports | Every gated act and posting | Export manifests produced after a second person approves; download is an event |
| AD-09 Operational health | Overview; Register; Record; Panel; Dialog | Checks, incidents, recovery items and release readiness with Dean's sign-off | Failing checks; help requests routed as possible incidents (AD-10); Unsafe assistant answers (AI-06) | Incidents owned by a named person; safe retry under the same identities; a release signed off by Dean, never by its preparer |
| AD-08 Retention | Register; Record; Panel | Retention policies, holds and personal information requests; Finance and Dean advise on MYOB and SharePoint | Requests from people; holds from owners of disputes | Lifecycle runs at 02:00 acting on PPO rows only, counts never content; per-system outcomes recorded by each system's owner |
| AD-06 Migration & cutover | Overview; Register; Review; Planning; Panel | Rehearsals in isolated spaces; module owners sign off | Synthetic or approved redacted snapshots by source type | Exceptions to AD-05, AD-03 and source fix owners; cutover readiness Ready for decision or Not ready, never "Cut over" |
| AI-06 Assistant settings, `/assistant/settings` | Overview; Form; Register; Record; Dialog; Panel | Assistant configuration with the billing owner | Flagged answers from the assistant pages | A provider switch only with the billing owner's approval; capability changes recorded in Audit history; Unsafe answers to AD-09 |
| AD-10 Onboarding & support | Overview; Register; Form; Panel | Paths, practice and help requests with the support owner | People's help requests and feedback | Answers by role; possible incidents to AD-09; guide gaps to DK-07 |
| SH-03, SH-05, EC-02 My account and preferences | Form; Register; Record; Dialog | Personal preferences only | The account menu | Consent at the provider; nothing about anyone else changes |
| Global configuration (proposed) | Form; Register; Dialog | The module's own menus, workspaces, companies, numbering registry, notification defaults and support owner | Proposals by an administrator | Versions reviewed by a second person and published with the impact stated |

## 3. Sheet inventory

267 sheets on fourteen scope pages (the thirteen scope areas and Interaction states), each page with its "Flows and notes" card. Node IDs are those of the sheet frame. A sheet label reads `CODE · Page — state (scope) [source]`; the label above each sheet in the file carries the full text. Sections: D = Desktop 1440, X = Dialogs and panels, S = States, T = Tablet 1024, P = Phone 390 and 320.

| Item | Node |
|---|---|
| Pages: Read me `0:1`, — Accepted — `11:2`, — Proposals — `11:3`, Shell and kit `11:18`, Scratch `11:19` | separators and Scratch are empty |
| Shell and kit: helper library `20:600` (hidden text), rebuild library `11:88`, icons `11:89`, page kit `15:21` to `15:86`, top bars `16:7` and `16:66`, rail set `16:585`, right strip `16:586`, phone chrome `16:611` to `16:697`, docked Administration menu `18:1647`, collapsed strip `18:1652`, Account menu `18:1653`, flyout `18:1741`, record header toolbar `19:804` and phone `19:805` | on page `11:18` |

### Settings hub and Business policies · AD-02 — page `11:4` · 29 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| SH01 | Settings hub — Overview from the Settings rail item; Needs attention ranked by rule (full length) | D | `21:8` |
| SH03 | Business policies — all 14 families grouped by how each changes; version 2 waiting to publish | D | `25:973` |
| SH15 | Business policies — register with the docked menu collapsed to the strip | D | `25:1812` |
| SH04 | Scheduling policy — Terms, version 1 in force, version 2 reviewed | D | `25:2561` |
| SH05 | Scheduling policy — version 2 proposal, reviewed, affected work pre-calculated (full length) | D | `26:1838` |
| SH07 | Scheduling policy — Affected work after publication at 09:40, three bands and the PL-04 hand-off | D | `26:2463` |
| SH11 | Preparation policy SYN-POL-000001 — Seed only · no editor | D | `26:3128` |
| SH12 | Field readiness — version 2 in force, read only; versions 1 and 3 | D | `27:2802` |
| SH13 | Scheduling policy — History, versions 1 and 2 compared | D | `27:3202` |
| SH14 | Record references — the namespace rule as a policy record with the proposed families | D | `28:3384` |
| SH16 | More › Administration — the accepted flyout over the hub | D | `28:3863` |
| SH06 | Publish version 2 — Jordan Kim: server checks, affected work, nothing moves | X | `29:3987` |
| SH08 | Propose change — Taylor Quinn proposes version 3 | X | `29:4450` |
| SH17 | Review proposal — Sam Patel reviews version 3 | X | `29:4912` |
| SH18 | Withdraw proposal — the proposal and its history kept | X | `29:5359` |
| SH02 | Hub as a viewer — areas without permission hidden | S | `32:5232` |
| SH09 | Review refused — the proposer cannot review | S | `32:5464` |
| SH10 | Publish refused — the review is out of date | S | `32:5849` |
| SH19 | Propose refused — a proposal is already open | S | `32:6221` |
| SH20 | Publish refused — more than 200 bookings match (the limit as built) | S | `32:6559` |
| TB01–TB03 | Hub (full length), Business policies, Scheduling version 2 (full length) on tablet | T | `33:6549`, `33:6912`, `33:7333` |
| PH01–PH06 | Hub list; version 2 waiting; Propose on desktop; Review (Sam Patel); Publish on desktop; hub at 320 | P | `34:7152`, `34:7294`, `34:7406`, `34:7505`, `34:7623`, `34:7741` |
| — | Notes card | — | `35:7571` |

### Users and access · AD-01 — page `11:5` · 27 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| UA01 | Users and access — All identities, grant counts by state, scope reach, teams, open requests | D | `36:612` |
| UA02 | Sasha Cole — Grants by company and site (full length) | D | `36:1411` |
| UA05 | Access-change requests — grouped by state | D | `38:1176` |
| UA12 | Capability catalogue — 163 keys; counts are grants, not people | D | `38:1777` |
| UA03 | Sasha Cole — grant row states Current, Scheduled, Expired | D | `38:2492` |
| UA04 | Check eligibility — Jesse Moore, `pack.check` at SYN Greenhouse Demonstration: Not permitted | D | `39:2050` |
| UA06 | SYN-ACR-000007 — Jordan Kim's view with the independent decision form | D | `39:2477` |
| UA07 | SYN-ACR-000005 — Approved, not applied; Taylor Quinn applies as the third duty | D | `40:2647` |
| UA08 | SYN-ACR-000005 — history v1, v2, v3 | D | `40:3076` |
| UA13 | Local team Field team · vans — teams grant no authority | D | `40:3465` |
| UA11 | Proposed role bundles — Service coordinator r02 against Ravi Kumar (full length) | D | `41:3533` |
| UA09 | Propose one additional capability — Casey Ward, UTC start with its Melbourne reading | X | `42:3831` |
| UA10 | Withdraw request — only the original requester | X | `42:4263` |
| UA17 | Create local team | X | `42:4590` |
| UA14 | Attest a grant — Dean Fiedler keeps Sasha Cole's `shared.history.record` | X | `42:4929` |
| UA16 | Request access arriving as a draft | X | `42:5303` |
| UA15a–c | Inspection not permitted; working company selected; hosted identity masked | S | `43:5235`, `43:5443`, `43:5650` |
| UA18 | SYN-ACR-000002 — Returned is terminal | S | `43:5935` |
| UA19 | Attestation refused — self-attestation | S | `43:6249` |
| TB01–TB02 | Identities; Sasha Cole grants (full length) on tablet | T | `44:6300`, `44:6726` |
| PH01–PH04 | Phone sheets; PH04 at 320 | P | `44:7088`, `44:7202`, `44:7301`, `44:7421` |

### Integrations & recovery · AD-04 — page `11:8` · 19 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| IN01 | Overview — five connectors with modes in words and yesterday's counts (full length) | D | `46:612` |
| IN02 | Sync items — grouped by state in the five send words, as at 09:00 | D | `46:1057` |
| IN03 | SYN-SYNC-000431 (SYN-RCT-000083) — Refused, Payload with MYOB's reply beside the likely fix (full length) | D | `46:1678` |
| IN04 | SYN-SYNC-000431 — Attempts, Source and History after the fix | D | `47:1443` |
| IN09a | Exceptions & recovery — owned cases with a follow-up | D | `47:1877` |
| IN09b | Case — Morgan Lee's resent "parts used" retained for review | D | `47:2319` |
| IN05 | Retry after the fix — checks first (same key, MYOB asked first, source current, no attempt running) | X | `48:2326` |
| IN07 | Mark resolved with reason — SYN-SYNC-000432 Unknown | X | `48:2740` |
| IN08 | Hand back to owner — SYN-SYNC-000433 | X | `48:3148` |
| IN06a–b | Duplicate prevented; retry already in progress | S | `49:9729`, `49:10084` |
| IN10 | Dependent item waiting behind the refused receipt | S | `49:10422` |
| IN11a–c | Connector Not configured; Read-only with a partial run; MYOB refused as the source owner sees it | S | `49:10751`, `49:11050`, `49:11388` |
| TB01 | Overview on tablet | T | `50:5755` |
| IN12a–c | Overview; sync item Refused; Retry stays on desktop (phone) | P | `50:6118`, `50:6212`, `50:6305` |

### External mappings · AD-05 — page `11:9` · 17 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| EM01 | External mappings — Unmapped and open mappings, as at 09:30 | D | `51:882` |
| EM02 | SYN Potting Systems — proposed match, Match tab | D | `51:1494` |
| EM03 | DP-25 unit each → PK2 — Waiting items | D | `51:1928` |
| EM06 | Reconciliation — run Thu 5 Nov 06:02, all modules | D | `52:1788` |
| EM07 | Difference SYN-DIF-000014 — owned by Avery Lin | D | `52:2222` |
| EM09 | BRC-07 Boiler room — account and cost code unmapped | D | `52:2594` |
| EM04a–b | Propose match (Taylor Quinn); Review match (Jordan Kim, 09:20) | X | `53:2689`, `53:3064` |
| EM07b | Resolve difference — through Finance | X | `53:3453` |
| EM05 | Two PPO records claim one MYOB record (Mallee Fresh) | S | `53:3827` |
| EM08a–d | Run in progress; MYOB source out of date; difference past due; nothing unmapped | S | `53:4159`, `53:4469`, `53:4749`, `53:5029` |
| TB01 | Register on tablet | T | `54:4901` |
| EM10a–b | Reconciliation summary; difference record (phone) | P | `54:5240`, `54:5326` |

### Data quality · AD-03 — page `11:7` · 20 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| DQ01 | Data quality — My findings grouped by status | D | `55:882` |
| DQ02 | SYN-DQF-000045 — Evidence | D | `55:1523` |
| DQ03 | Duplicate comparison — Mallee Fresh Produce and "Mallee Fresh"; mark as duplicate, never a merge | D | `55:1981` |
| DQ04 | SYN-DQF-000047 — revision 2 accepted, delivered, applied by Sasha Cole | D | `55:2395` |
| DQ06 | Rules and policies — read only, SYN-DQ-P01 to P07 | D | `55:2789` |
| DQ05a–c | Draft correction; Review proposal; Dismiss with reason | X | `56:2364`, `56:2790`, `56:3180` |
| DQ07 | Report a data problem | X | `56:3535` |
| DQ08a–g | Policy not configured; source stale; target changed; owner returned; outcome unknown; counterpart unavailable; save failed with the draft kept | S | `57:3475` to `57:5432` |
| TB01 | Findings queue on tablet | T | `58:5551` |
| DQ09a–c | In review list; finding; Review sheet (Jordan Kim, phone) | P | `58:5886`, `58:5955`, `58:6058` |

### Audit history · AD-07 — page `11:11` · 14 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| AH01 | History — today, all sources, as at 10:35 | D | `59:882` |
| AH02 | Event detail — MYOB posted SYN-FH-000044 at 10:31 | D | `59:1442` |
| AH03 | Record timeline — SYN-FH-000040: reversal and corrected document, never an edit | D | `59:1823` |
| AH05 | Exports — SYN-EXP-000005 awaiting Dean's approval | D | `60:1647` |
| AH08 | Export manifest SYN-EXP-000003 — produced | D | `60:2119` |
| AH06 | Request export — Taylor Quinn | X | `60:2471` |
| AH07 | Approve export — Dean Fiedler, not the requester | X | `60:2816` |
| AH04 | Withheld events counted, never listed | S | `61:2725` |
| AH09a–c | Export too large for one file; requester is the approver (refused); no audit access | S | `61:3021`, `61:3291`, `61:3563` |
| TB01 | History on tablet | T | `61:3741` |
| AH10a–b | Record timeline; event detail (phone) | P | `61:4051`, `61:4127` |

### Operational health · AD-09 — page `11:12` · 25 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| OH01 | Health overview — every check with its last time and result in words; why Rendering reads Slow (full length) | D | `62:882` |
| OH02 | Incidents — Open 0, Investigating 0, Mitigated 1, Resolved 1, Closed 2 | D | `62:1377` |
| OH03 | Incident SYN-OPI-000008 — Mitigated, owner Taylor Quinn; suggested summary; audit events (full length) | D | `66:1440` |
| OH04 | Recovery item SYN-RPT-000039 — Glasshouse Valley report re-issue, with the safe retry panel at 09:05 | D | `75:4974` |
| OH05 | Release readiness SYN-REL-000005 — Ready for demo upgrade; Dean's sign-off refused at 09:00 | D | `68:2067` |
| OH06 | After the upgrade — SYN-REL-000004 workflow receipt and runbook checks; verified on the demo only | D | `76:5278` |
| OH07 | Recovery readiness — Not proved | D | `69:2855` |
| OH08 | Foundation checks (Local) | D | `69:3210` |
| OH12 | Take ownership — Wed 4 Nov 06:14 | X | `70:3215` |
| OH13 | Close incident with reason — a second administrator confirms | X | `70:3542` |
| OH14 | Sign off release — Dean Fiedler at 09:00, refused with a reason | X | `71:4065` |
| OH09 | Foundation checks opened on the hosted demo — hidden, explained | S | `72:4243` |
| OH10a–h | Stale; unowned incident; retry failed again; no administrator access; could not load (never read as down); database not answering; release blocked by an open incident; retry refused (source changed) | S | `72:4522`, `72:4856`, `78:5595`, `78:5941`, `78:6125`, `79:5473`, `79:5818`, `79:6157` |
| TB01 | Health overview on tablet (full length) | T | `80:6318` |
| OH11a–d | Overview after an out-of-hours alert; incident acknowledge; recovery item after retry; SYN-REL-000006 Not ready at 320 | P | `81:6492`, `81:6593`, `81:6693`, `84:6767` |

### Retention · AD-08 — page `11:6` · 19 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| RT01 | Policies register — 16 types in three bands; legal basis To be confirmed on every row (full length) | D | `85:882` |
| RT02 | Policy record — quote view events (full length) | D | `87:1214` |
| RT04 | Hold — Goulburn disputed invoice records; On hold: deletion suspended | D | `88:1522` |
| RT05 | Request SYN-PIR-000002 — outcome per system, Partial (full length) | D | `89:1825` |
| RT06 | Export manifest SYN-EXP-000004 — produced | D | `90:2136` |
| RT07 | Run history — last 5 runs, one Failed | D | `90:2529` |
| RT08a–e | Propose a policy; Approve a policy (Dean); Place a hold (Avery Lin); Release a hold (Taylor Quinn); release refused for the placer | X | `92:2708`, `92:3073`, `93:3226`, `93:3582`, `93:3933` |
| RT03 | Policy not set — field photos; nothing removed | S | `94:4008` |
| RT09a–c | Request awaiting identity verification; hold blocks deletion; legal basis to be confirmed | S | `94:4349`, `94:4689`, `94:5005` |
| TB01 | Policies register on tablet (full length) | T | `95:5122` |
| RT10a–c | Policies list (full length); policy summary; request partial outcome at 320 | P | `96:5366`, `96:5535`, `96:5648` |

### Migration & cutover · AD-06 — page `11:10` · 15 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| MC01 | Overview — five modules, the stage strip, sources by type only (full length) | D | `99:882` |
| MC02 | Rehearsal SYN-REH-000003 — customers and deals run 3, source against loaded (full length) | D | `100:1142` |
| MC03 | Exceptions worklist — SYN-MEX-000033 to 000035, one owner each | D | `101:1464` |
| MC04 | Coexistence plan — "Proposed plan: not a decision" | D | `102:1737` |
| MC05 | Cutover readiness — Ready for decision or Not ready per module | D | `102:2132` |
| MC06a–b | Sign-off blocked (Priya Nair, Products); sign-off for Customers and deals (Dean Fiedler, second person) | X | `103:2262`, `103:2615` |
| MC07a–e | Snapshot refused, not synthetic; no rehearsals yet; failed and rolled back; counts do not reconcile; sign-off blocked | S | `104:2795`, `104:3111`, `104:3451`, `105:3651`, `105:4034` |
| TB01 | Overview on tablet (full length) | T | `106:4246` |
| MC08a–b | Overview; exception owner confirming a source fix at 320 | P | `106:4497`, `106:4599` |

### Assistant settings · AI-06 — page `11:14` · 15 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| AS01 | Overview — Simulated in use; live switch Blocked (full length) | D | `108:882` |
| AS02 | Provider and budget — single choice, five pre-call checks, meter against US$30 (full length) | D | `109:1159` |
| AS04 | Capabilities and sources — with the change panel for Opportunity creation | D | `109:1588` |
| AS05 | Data handling — "Not verified against our account" | D | `110:1698` |
| AS06a | Quality — runs Not run; an illustration run; flagged answers worklist | D | `110:2069` |
| AS06b | Flagged answer SYN-AIF-000002 — five outcomes and hand-over | D | `111:2210` |
| AS03 | Switch provider — two people; Send unavailable while checks are open | X | `111:2606` |
| AS07a–e | Budget near limit; budget used up (Paused); provider unavailable (later examples, labelled); checks incomplete (09:00); no flagged answers | S | `112:2761`, `112:3077`, `112:3392`, `112:3697`, `112:4031` |
| TB01 | Overview on tablet (full length) | T | `112:4323` |
| AS08a–b | Overview; flagged answer with one 48 px action (phone) | P | `112:4629`, `112:4737` |

### Onboarding & support · AD-10 — page `11:13` · 21 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| OS01 | Getting started — Jesse Moore, 3 of 7 tasks done, no score | D | `114:882` |
| OS02 | Role task path — Workshop technician | D | `114:1159` |
| OS03a–b | Practice in progress; practice finished (PRACTICE-BLD-0001) | D | `115:1333`, `115:1565` |
| OS05 | My requests and a reply — SYN-HLP-000013 Answered | D | `116:1656` |
| OS06 | What's new — released changes only (SYN-REL-000004) | D | `116:1914` |
| OS07a–b | Support owner view (counts only; KPI-15 Definition pending); request queue | D | `118:2009`, `118:2370` |
| OS04 | Ask for help — three routes | X | `119:2541` |
| OS08 | Feedback — no reply promised | X | `119:2772` |
| OS09a–g | Support owner not set (Send not offered); request sent; adoption definition pending; incident routed; no practice space; uncertain send; offline | S | `119:2975`, `119:3161`, `119:3345`, `119:3629`, `119:3814`, `119:3993`, `119:4178` |
| TB01 | Getting started on tablet | T | `120:4035` |
| OS10a–c | Getting started (full length); practice exercise; Ask for help at 320 | P | `120:4291`, `120:4391`, `120:4471` |

### My account and preferences · SH-03 · SH-05 · EC-02 — page `11:15` · 26 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| MA01 | Account menu open on a Service page | D | `122:882` |
| MA02 | Profile (full length) | D | `123:1131` |
| MA03 | Defaults — one unsaved change | D | `123:1379` |
| MA04 | Notifications — Email and Push Not connected | D | `124:1456` |
| MA05 | Saved views — at most 12 per page | D | `124:1742` |
| MA06a | Mailbox & calendar — Not connected (Taylor Quinn) | D | `125:1783` |
| MA06c | Mailbox & calendar — Connected with 1 sync error (Dean Fiedler) | D | `125:2009` |
| MA07 | Offline devices — Casey Ward, 4 unsent items | D | `126:2103` |
| MA08 | Sessions and security — three sessions | D | `126:2348` |
| MA09 | Assistant personal settings — within AI-06 | D | `126:2596` |
| MA06b | Consent step | X | `126:2834` |
| MA06d | Remove mailbox (Dean Fiedler) | X | `126:3048` |
| MA07b | Remove device warning (Casey Ward) | X | `126:3255` |
| MA11a–h | Mailbox sync stopped; consent declined; no devices (Robin Hale); channel not connected when tapped; saving; saved; save not confirmed; changed on another device | S | `126:3451`, `126:3646`, `126:3841`, `126:4034`, `126:4229`, `126:4433`, `126:4637`, `126:4843` |
| TB01 | Notifications on tablet | T | `127:4289` |
| MA10a–d | Phone menu (P4) with the account entry; section list; Notifications; Offline devices at 320 (technician bar) | P | `127:4559`, `127:4662`, `127:4771`, `127:4867` |

### Global configuration · AD — page `11:16` · 7 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| GL01 | Edit menu (administrators) — Administration menu defaults version 2, reviewed; sets defaults for everyone | D | `129:882` |
| GL02 | Manage workspaces — landing and secondary pages, readiness Ready or Unavailable, feature readiness; version 1 in force (full length) | D | `132:1183` |
| GL03 | Companies and tenants — Powerplants AU (SYN01) and SYN Greenhouse Demonstration (SYN02 read only, Authority not configured) | D | `132:1721` |
| GL04 | Numbering families registry — 81 families in 82 rows (19 adopted, 62 proposed), the DSP clash flagged (full length) | D | `133:1727` |
| GL05 | Notification defaults, the seven nudges with their rules, the support owner, run times and retention (full length) | D | `134:2311` |
| GL06 | Publish configuration version — Taylor Quinn publishes after Dean Fiedler's review; server checks and impact | X | `135:2578` |
| TB01 | Numbering families on tablet, the clash view | T | `135:2937` |

### Interaction states · AD — page `11:17` · 13 sheets

| Code | Sheet | Sec. | Node |
|---|---|---|---|
| ST01 | Interaction states and accessibility — buttons, fields, inline edit, chips in words, keyboard order and zoom, and the contrast table (full length) | D | `138:882` |
| PS01–PS12 | Loading permitted evidence; true-empty with its count; filtered-empty; could not load; denied or not found with Request access; stale (a newer revision); partial source (MYOB Not reachable); outcome unknown, lookup only; read only in its seven forms; bulk action partly failed; permission changed while open; two administrators at once | S | `139:1169`, `139:1489`, `139:1763`, `139:2039`, `139:2311`, `139:2489`, `139:2761`, `139:3053`, `139:3337`, `139:3621`, `139:3913`, `139:4177` |

Still to draw: the four Read me cards.

## 4. Rules applied

- **Shell and layout (6.1).** Top bar 48 with global search; rail 80 with the fixed Settings item; no right strip on settings pages (R13); the docked Administration menu at 280 with the nested page views of the current page, or the collapsed strip; 432 px right panels without a scrim for forms; 560 to 720 px dialogs with a 12 px radius over a navy scrim at 32 %. Overviews (hub, Integrations, Operational health, Migration, Assistant) lead with Needs attention and use no record toolbar; records carry the shared record header toolbar (Addendum A1) with the state-driven primary of section 9.14 and a disabled primary with its reason for anyone who cannot act (R117), then the checks bar of their scope.
- **Content (6.2).** One line per register cell with sideways scrolling; no second search box; counts state their rule, a dash where nothing runs, never zero; every state a word, never colour alone; every version names its proposer, reviewer and publisher with times; every send shows Prepared, Sent, Posted, Unknown or Refused; dates as "Thu 5 Nov 2026"; ISO dates only inside file names; one tone per chip meaning, violet only on `PRACTICE-` records; never "effective" for an approved request, "production ready", "cut over", "deleted" for MYOB or SharePoint, "secure", "compliant" or "uptime"; no credential, token, endpoint or payload secret.
- **Two people (D2).** The proposer's review and the reviewer's publication are refused; requester, reviewer and subject of an access request differ and a third person applies; hold placer and releaser differ; export requester and approver differ; migration sign-off needs the module owner and a second person, never the preparer; a provider switch needs the billing owner; the release preparer never signs off; self-attestation is refused. Every refusal names who may act.
- **Versions and trail (D3).** Version 1 reads "No proposal, installed by seed"; proposals are frozen; a review out of date refuses publication; publication shows affected work in three bands and moves nothing; audit events and posted documents are never editable; corrections are reversals; a rehearsal writes nothing live.
- **Modes and lifecycles (D4, D5).** Not configured, Read-only, Sending (pilot), Synthetic, Seed only · no editor, Policy not set, To be confirmed, Not agreed, Not run, Not selected, Not proved, Not verified against our account, Stale and Local; each lifecycle in its code or accepted words, every state drawn at least once where the scope has it.
- **References (D6, Addendum A2).** `SYN-ACR-`, `SYN-SYNC-`, `SYN-MAP-`, `SYN-DIF-`, `SYN-DQF-`, `SYN-DQ-P`, `SYN-EXP-`, `SYN-PIR-`, `SYN-OPI-`, `SYN-REL-`, `SYN-MEX-`, `SYN-REH-`, `SYN-HLP-`, `SYN-AIF-`; policies named by family; `PRACTICE-` in the practice space only.
- **Phones (6.5, D12).** Taylor Quinn's sheets carry the Service coordinator bar, the technician's My account sheets the technician bar, Onboarding sheets the bar with nothing selected; phones review, approve, acknowledge, confirm and read, while propose, publish, apply, retry, sign off and export stay on desktop and tablet with "… on desktop" shown; inputs 16 px and options 48 px; 320 sheets stack.
- **Automation, rules first (section 10).** Drawn integrated: N-N1 Needs attention ranked by rule (SH01), N-N2 why this state (OH01 and others), N-N3 independence checks before the act, N-N4 affected work pre-calculated (SH05). Drawn as labelled suggestions: N-N10 suggested incident summary (OH03). Every AI feature is grounded in the record, labelled, reviewed before saving and never acts.

## 5. Assumptions and proposed departures

Each item is for Dean's decision. A1 to A49 are cited on the sheets and notes cards by number.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | Where the brief's section 7 counts for the Business policies register differ from sections 9.3 and 9.11, the dataset counts are drawn (Editable here 2, Seed only 3, Changes elsewhere 5, Policy not configured 2, Pending 2, Waiting to publish 1) | Keep the dataset counts |
| A2 | Affected work (SH07) is drawn after publication at 09:40 so the bands read as the PL-04 hand-off | Keep |
| A3 | The propose, review and refusal sheets use Taylor Quinn's version 3 proposal (bookings per technician per day 5 → 6) after version 2 publishes; the stale-review sheet (SH10) is a counterfactual | Keep |
| A4 | Propose, publish, apply, retry and sign-off stay on desktop and tablet (6.5); the phone shows the summary, checks and a disabled "… on desktop". This departs from the accepted AD-02 amendment phone sheets, which drew Propose and Publish on the phone | Keep the brief's rule; record the departure for AD-02 |
| A5 | Dean publishes the Administration policy family (Record references) | Keep |
| A6 | The accepted flyout's Recent rows are redrawn in this story: SYN-ACR-000007 for "AR-0007", SYN-SYNC-000431 for "MYOB sync", and History on Wed 4 Nov because Sun 8 Nov is after the story date | Align the Shell file when it is next touched |
| A7 | The accepted collapsed docked strip component is 12 px wide; the brief says 80 px. The component is used as accepted | Confirm 12 px, or correct the Shell component first |
| A8 | The Account menu uses the code's labels ("Help and page guide", "Last sign-in details unavailable") and the proposed row "Getting started and help" (AD-10 X2) | Keep |
| A9 | "Find a person" is a filter chip, never a second search box | Keep |
| A10 | `src/platform/permissions.ts` holds 163 keys in 26 families by first segment; the brief says 27 | Keep 26 as counted; correct the brief's figure |
| A11 | Access-change requests at 09:00 show Applied (30 days) 2; "Applied this month 3" in 9.11 counts SYN-ACR-000005 after its application at 09:12 | Keep |
| A12 | The seeds' duty labels ("SYN Systems", "SYN Taylor Policy reviewer", "SYN Jamie Policy publisher") are mapped to Taylor Quinn and Jordan Kim as Addendum A3 directs | Keep |
| A13 | SYN-ACR-000001 is added so the request history starts at 1 | Keep |
| A14 | Sync items are drawn as at 09:00; "Posted today 6" holds only after 10:31; Prepared 2 are SYN-SYNC-000441 and a new SYN-SYNC-000442 (receipt SYN-RCT-000092 awaiting pilot release) | Keep |
| A15 | The SYN-RCT-000083 payload detail is synthetic (DE-16 drip emitter unit BX → MYOB BOX; SYN Irrigation Supplies SYN-V-0214; SYN-PO-000301) | Keep |
| A16 | Retry is desktop and tablet only | Keep |
| A17 | Integration administer and retry duties are proposed (†) | Decide with AD-04 Q1 to Q6 |
| A18 | External mappings drawn as at 09:30 (BX verified); the fourth unmapped item is an SV-20 item; SYN-MAP-000016, SYN-ORG-000064 and SYN-SYNC-000443 are added | Keep |
| A19 | Mapping the BRC-07 cost code is an FN-06 definition change, not an AD-05 edit | Keep |
| A20 | A fifth open finding, SYN-DQF-000044 (Returned), is added so the open count matches 9.11 | Keep |
| A21 | Data policies SYN-DQ-P01 to P07 are named with synthetic rules | Keep |
| A22 | The data steward and data reviewer duties are proposed (†) | Decide with AD-03 Q1 and Q3 |
| A23 | Audit history's event list is drawn as at 10:35 so the 10:31 posting appears | Keep |
| A24 | `audit.read` per area and company and the export approver are proposed (†); exports split at 25,000 rows and files are kept 90 days (proposed) | Decide with AD-07 Q1 to Q7 |
| A25 | Report issue 2, request key RPT-000039-i2 and the render detail are synthetic | Keep |
| A26 | Closing an incident is confirmed by a second administrator; incident closure is not in the access model | Decide |
| A27 | The 30 s rendering limit and 120 s render timeout are synthetic examples, like the 10-minute queue limit | Keep as examples |
| A28 | The no-administrator-access state uses Lee Nakamura (Viewer) | Keep |
| A29 | SYN-OPI-000009 appears only in counterfactual states | Keep |
| A30 | "Safe retry" is kept as the section 9.14 primary label although section 6.2 forbids "safe" as a claim; no other sheet uses the word | Keep the label; rename if Dean prefers "Retry with checks" |
| A31 | Retention periods, end actions, approval dates and run counts per type are synthetic (the dataset gives the periods) | Keep |
| A32 | Avery Lin places holds as Finance lead (hold place); releasing is proposed (†) | Keep |
| A33 | SYN-EXP-000004 detail (96 rows, file name, hash placeholder) is synthetic | Keep |
| A34 | End actions read "Remove from PPO", so "deleted" never appears beside MYOB or SharePoint | Keep |
| A35 | Migration module states follow 9.11 (Signed off 1, Exceptions open 1, Rehearsing 1, Not started 2): Customers and deals Signed off on Wed 4 Nov (9.9) although the MC01 inventory line says Rehearsing; Sites and equipment Rehearsing with rehearsal 1 Prepared for Mon 9 Nov although 9.9 says Not started | Keep the 9.11 counts |
| A36 | Rehearsal numbering (Customers and deals runs 1 to 3 as SYN-REH-000001 to 000003, run 2 Failed and rolled back; Products run 1 SYN-REH-000004; Sites and equipment SYN-REH-000005) and the module owners are chosen for the story | Keep |
| A37 | Exception rows, rehearsal counts and the deal value are synthetic | Keep |
| A38 | SYN-AIF-000001 (Reviewed, Incomplete) is added so the worklist has a closed row | Keep |
| A39 | The flagged answer concerns the replacement motor of SYN-DQF-000047, so it hands over to Sasha Cole | Keep |
| A40 | Capability sources and roles per assistant slice are proposed wording | Keep |
| A41 | Data-handling rows are placeholders; nothing states the provider's actual terms | Keep |
| A42 | The seven path tasks, guides and dates are synthetic | Keep |
| A43 | SYN-HLP-000013 was sent 07:52 and acknowledged 08:05 before the 08:30 answer | Keep |
| A44 | What's new lists three released changes for SYN-REL-000004, two for technicians | Keep |
| A45 | The support owner's counts are synthetic | Keep |
| A46 | My account uses an in-page section list (240 px) and the rail with nothing selected, not a docked menu | Keep |
| A47 | MA01 draws the Service page without its docked Service menu | Keep |
| A48 | Event kinds, saved view names and session devices are synthetic | Keep |
| A49 | Account addresses are synthetic placeholders; Dean's account shows no address | Keep |
| A50 | The file is named "PPO - Settings module (proposal)" as Dean created it; the design-to-build standard names the domain file "PPO - Administration & Shared" | Dean to choose; nothing renamed |
| A51 | Page titles are the accepted Shell menu's fourteen labels; the decision records' names (Mappings & reconciliation, Integrations, Retention & lifecycle) are sub-lines. Two boundaries are drawn as splits: AD-05 reconciles records sent against records posted while FN-06 owns values against ledger balances; AD-05 links Finance differences that FN-01 and FN-02 own | Keep; record the labels in the design register in its own change |
| A52 | The Settings reference families (ACR, SYNC, MAP, DQF, DQ-P, EXP, PIR, OPI, REL, MEX, REH, HLP, AIF, TDF) are proposed additions to the type catalogue; OPI replaces the Design's `SYN-INC-` on Operational health (Service's field incidents keep INC) and MEX replaces `SYN-EXC-` on Migration (Finance exceptions keep EXC) | Adopt through PPO-STD-001 in its own change |
| A53 | Send states use the five words of the Supply, Service and Finance files; the AD-04 proposal's and EI-5's words map as waiting → Prepared, sent → Sent, posted → Posted, failed → Refused, needs attention → Unknown or Refused by cause | Keep |
| A54 | Forms are 432 px right panels without a scrim; short decisions are centred dialogs over the 32 % navy scrim | Keep |
| A55 | Phone bars follow D12 (Service coordinator bar for Taylor Quinn, technician bar for Casey Ward, nothing selected for onboarding); other people's phone sheets also use the coordinator pattern | Keep |
| A56 | Users and access shows the cross-module roster (38 identities: 36 active, 1 inactive, 2 hosted masked) instead of the Design's fourteen | Keep |
| A57 | The companies are Powerplants AU (tenant Powerplants Australia, MYOB SYN01) and SYN Greenhouse Demonstration (demo, SYN02 read-only, "Authority not configured"), reading the Design's SYN-A and SYN-B | Keep |
| A58 | Proposed capabilities, marked † and added to nothing in code: `admin.access.review`, `audit.read` per area and company, data steward and data review duties, retention policy approve and hold release, integration administer and retry, migration sign-off, assistant switch approve, support owner, menu and workspace editing | Decide each with its scope's open questions |
| A59 | A Global configuration area (menus, workspaces, companies, numbering registry, notification defaults, support owner) is drawn as this module's own settings (Q6). Its versions follow the scheduling-policy pattern: Taylor Quinn proposes, Dean Fiedler reviews, Taylor Quinn publishes | Keep, marked proposed |
| A60 | Story reconciliations under D7 and Addendum A3 supersede earlier fixtures: Dean or "SYN Systems" as the signed-in administrator; fourteen identities; SYN-A and SYN-B; `SYN-PPO-ACR-`; `SYN P05`; `SYN-INC-` on Operational health; `SYN-EXC-` on Migration; Alex Nguyen on My account; the Design's SYN-RPT-000067, SYN-PIR-000001 and Glasshouse 4 hold read as SYN-RPT-000039, SYN-PIR-000002 and the Goulburn hold | Keep |
| A61 | Stale repository notes are recorded and not fixed here: the design register shows AD-02 "Implemented; AD-02 review pending", AD-07 without a route and every visual status "Needs review"; the fourteen Administration page labels are recorded nowhere; the README's 31 hosted capabilities differ from the checks' 36 | Fix in the design-register change |
| A62 | Sheets signed in as someone other than Taylor Quinn keep the accepted shell's badge counts in the top bar | Keep for the proposal |
| A63 | Administration menu defaults version 2 adds one change, a count on Migration & cutover (open exceptions); the version 1 dates on the Global configuration sheets are synthetic | Keep |
| A64 | The registry shows the DSP clash (proposed by Supply and by Finance) and does not resolve it | Decide through PPO-STD-001 |
| A65 | Nudge thresholds are the brief's (five working days, a day, the 10-minute example) | Keep as examples |
| A66 | The stale and two-administrator page states (PS06, PS12) use Record references and GL01 so both cases stay inside this module | Keep |
| A67 | PS11 (permission changed while a dialog is open) is a counterfactual: Taylor Quinn's apply duty is unchanged in the story | Keep |

Questions Q1 to Q10 of the brief were answered by their defaults: Q1 Shell labels as titles; Q2 signed in as Taylor Quinn with Jordan Kim reviewing and Dean publishing, approving and signing off; Q3 the 38-identity roster; Q4 `SYN-OPI-` and `SYN-MEX-`; Q5 the five send words; Q6 the Global configuration area, marked proposed; Q7 Users and access redrawn although its build is blocked (20 October), which records no acceptance and changes no build order; Q8 proposed capabilities marked †; Q9 the two companies; Q10 My account with Taylor's, Casey Ward's and Dean's examples.

## 6. Verification

Done so far: every scope page was built in batches; representative sheets of every page type were rendered at 900 to 1440 px and read, and the problems found were fixed in the file before moving on (truncated cells and chips, a mislabelled sub-menu highlight, the recovery item corrected to the dataset's single report re-issue, lifecycle words aligned with D5 and primary actions with section 9.14, two gendered pronouns on the Retention page replaced with names, and violet removed from a non-practice chip). Each page's sections were refitted and restacked after its batch.

Not yet done, and required before Dean is asked to accept: the remaining sheets in section 3; a structural pass and position audit over every page; the independence scan; the words scan (including the pronouns on the earlier pages); the story scan across pages; the capability and authority scan; the contrast table from the PPO colour variables on ST01; the audit (C, R, G, N, P) with a recommended order; and the Read me cards. The build stopped when the Figma tool-call limit for the day was reached (200 calls a day for this seat); it resumes when the limit resets.

Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

Not drawn yet: the items listed at the end of section 3. Not drawn by design: prototype links; module settings pages (each module file draws its own); the Assistant pages AI-01 to AI-05 and AI-07; Help Centre DK-07 (a link out); My Work (Settings contributes items to it, section 6.9 of the brief).

Open questions, cited and not resolved here: D-020 (role bundles never adopted); D-012 (SharePoint retention and deletion); the retry count and the 10-minute queue limit (synthetic examples, not operating thresholds); the audit export retention (90 days, proposed) and size limit (25,000 rows, proposed); the lifecycle run time (02:00, a design choice); every retention legal basis (To be confirmed); the assistant model (Not selected); AD-01's build block of 20 October ("Leave AD-01 blocked; continue with accepted pages"); AD-03 Q1 to Q7; AD-04 Q1 to Q6; the AD-05 notes card (not transcribed); AD-07 Q1 to Q7; AD-10 X1 to X6; the scheduling policy's 200-booking refusal limit as built; A26 (who confirms an incident closure); and the proposed type-catalogue additions (A52), including a clash in the brief's registry where Supply and Finance both propose DSP.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, migration, permission, capability, grant, seed or integration, and the AD-01 access-review generation is untouched. Next steps: finish the sheets in section 3 and run the verification in section 6; record the audit in a later section; Dean reviews and, if he accepts, saves a named version (any later design change needs a new one); the design register and per-route page guidance follow in their own reviewed change, together with the stale notes in A61; the Shell file's Recent-row stand-ins are aligned with the reference families (A6); and the module files' administration sheets follow this file's hub, propose, review and publish pattern where they differ.
