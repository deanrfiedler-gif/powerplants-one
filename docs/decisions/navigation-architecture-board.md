---
document_id: PPO-NAV-ARCH-BOARD-DEC
date: 2026-10-09
owner: Dean Fiedler
status: Proposed design reference; six NAD decisions adopted (section 6); shell increment built; not owner-reviewed
source_commit: 5005e7e1763bd53a28b47d6d48f3c87210f5cc1c
versioning: git
---

# Navigation architecture board

On 8 October 2026 Dean asked for a navigation architecture and visual sitemap covering six operational domains. The brief replaces the Pipedrive, Wrike, Smartsheet and ServiceTitan workflows and asks for three outputs:

1. a Mermaid.js graph;
2. an inter-module interaction register;
3. a capability table for each domain.

On 9 October Dean asked for seven improvements to the first board:

1. reconcile it with the built navigation;
2. add navigation rules;
3. render the graph on the board;
4. wireframe the proposed pages;
5. check personas and capabilities against the code;
6. draw return paths and fix frame sizes;
7. register the board here.

Later on 9 October Dean asked for an audit of the board for gaps, best practice and professional standard. The audit (capture 33) recorded 23 findings, AU-01 to AU-23. Dean then adopted NAD-08, a Reports workspace, and the board's design fixes were applied. The revised board is issued as capture set r02; r01 is retained unchanged as the earlier issue.

This record identifies the resulting board and what it proposes. It changes no route, rail, capability, grant, migration or scope count. [Navigation consolidation](navigation-consolidation.md) and `src/shell/navigation.ts` remain the authority for navigation.

## 1. Classification

| Item | Classification | Evidence and scope |
|---|---|---|
| Six-domain brief, three outputs | User request, 8 October 2026 | Session brief. The domains are a capability view; no parent requirement ID is added or renamed |
| Seven improvements | User instruction, 9 October 2026 | Session instruction |
| Keep the seven department rails as the navigation; use the six domains as the specification view | Proposed, not decided | Reconciliation artboard (capture 02). Built rails read from `navigation.ts:7-45, 309-333` |
| Reports workspace for governed management reports, NAD-08 | User decision, 9 October 2026; design only | Rule NR-20 (capture 04); sitemap, reconciliation and D5 boards; wireframes 23 to 31. Building it needs separate approval |
| Audit findings AU-01 to AU-23 and their resolution | Audit, 9 October 2026 | Capture 33. 16 design findings resolved on the board; built-app and evidence findings (AU-01, AU-02, AU-07, AU-08, AU-13, AU-14, AU-23) stay open |
| Navigation rules NR-01 to NR-20 and accessibility rules NR-A1 to NR-A7 | Proposed inputs to the navigation consolidation review; NR-20 adopted under NAD-08 | Capture 04. "Built" rows describe source at `dcec2cf`; they are not acceptance |
| Interaction register HO-01 to HO-23 | Proposed, built on existing journeys; HO-19 to HO-23 added from the audit | Capture 05, drawn on capture 03. Capability names in the gate column exist in `permissions.ts` unless marked New |
| Brief departures R1 to R15 | Proposed, for owner decision | Capture 06 |
| Wireframes for RP-01, RP-05 and PJ-02 | Proposed composition on existing scopes | Captures 23 to 32, at 1440, 390 and 320 px. No new scope; the register's 150-scope count is unchanged |
| Record page pattern, relationship map RL-01 to RL-06, landing, attention routing and access scope | Proposed | Captures 20 to 22 |
| New capability names, each with a scope level | Proposed, not in the contract | Domain tables (captures 07 to 12) and capture 20. None exists in the 131-value contract |

## 2. Design reference

| Reference | Identity |
|---|---|
| Board | Private Design artifact in Dean's claude.ai account, <https://claude.ai/artifact/UKeykdt6pNm9stkUH8JSLH>, version 26 (`1791516976-d300`), 27 artboards, built with the Powerplants One design system. Only the owner can open it |
| Retained captures | Current: [Navigation architecture board r02](../reference/ui/application-shell/navigation-architecture-board-r02/README.md), 33 PNG captures with hashes, plus the two Mermaid sources. Earlier issue: [r01](../reference/ui/application-shell/navigation-architecture-board-r01/README.md), version 24, retained unchanged |
| Mermaid sources | `navigation-overview.mmd` (domains, working areas, handovers) and `navigation.mmd` (page level, one subgraph per domain). Both parse in Mermaid 11.4.1 and carry an accessible title and description |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md) on the board's conformance artboard (capture 32).

| Wireframe | Existing scope | r20 page type | Departure |
|---|---|---|---|
| Management overview | `scope:RP-01`, /reports; Reports workspace landing | Overview / dashboard | New capability `reporting.overview.read`; synthetic stage weights |
| Exception desk | `scope:RP-05`, /reports/reconciliation; Reports secondary page; supporting `scope:AD-04` | Work queue + persistent detail | Widens RP-05 from Supply and Finance to every department (NAD-02, open) |
| Portfolio health | `scope:PJ-02`, /projects?view=health | Overview / dashboard over Register / worklist | Synthetic health thresholds pending D-017 |

Reused components: the application shell, Breadcrumb, Segmented control, Button, Field, Section tabs, Status chip, Register table and the phone bottom bar. Wireframes are drawn at 1440 px, 390 px and 320 px; 1024 px is not drawn.

## 4. Findings from the reconciliation

- The built navigation has seven department workspaces, each with its own rail. My workspace, Shared records and Administration sit in More. Of the 75 destinations, 13 are reserved and withheld.
- Every one of the 13 reserved slots now has a disposition (capture 02). Twelve are filled; Insights moves to Reports › Sales performance (RP-02).
  - Reviews & approvals is filled with its own estimate review queue. The coverage ledger says My Work reviews are not a substitute, so the audit's suggestion to merge it there was not used.
  - Finance Reconciliation and Exceptions stay Finance's own working queues; the exception desk links to them.
- Capacity planning stays under Service operations (Schedule). The brief grouped it with finance ledgers, but Service owns the confirmed field schedule (BP-01 §5.3).
- Two inconsistencies were found in the built navigation:
  - The Sales phone bar shows unavailable destinations as disabled; everywhere else hides them (NR-02).
  - `application-shell-integration.md` still describes /crm canonical routes, although the code redirects to /sales (NR-04).
- Personas against seeded identities:
  - Field technician and Finance match seeded identities exactly.
  - Executive leadership and Systems owner have no runtime equivalent.
  - "SYN Robin Supply coordinator" holds no `supply.*` grant despite its name.
- Proposed capability names were renamed to fit the existing `domain.object.verb` convention:
  - Scheduling thresholds reuse `schedule.policy.review` and `schedule.policy.publish`.
  - Master data uses `shared.merge.*`.
  - Access changes follow the AD-01 `admin.access.*` design.
  - Cross-department views use `reporting.*`, because `report.*` already means service reports.

## 5. Decisions needed

| ID | Decision | Recommendation |
|---|---|---|
| NAD-01 | Navigation structure: seven department rails or six domains | Keep seven rails; six domains as specification view |
| NAD-02 | Exception desk scope | Widen RP-05 to every department, or keep it narrow and route other rules to My Work |
| NAD-03 | Sales phone-bar disabled destinations | Hide, matching every other surface, or record an accepted exception |
| NAD-04 | Portfolio health thresholds | Set after D-017; the board's values are placeholders |
| NAD-05 | Technician location data | No continuous tracking without a workforce privacy decision |
| NAD-06 | Payment gateway | Keep excluded; invoices are released in MYOB |
| NAD-07 | Executive and Systems owner bundles | Define before RP-01 and access governance are built |
| NAD-08 | Where cross-department reports live | **Adopted by Dean, 9 October 2026:** an eighth workspace, Reports (proposed id `reporting`, because `reports` is the Service review destination). It holds the governed management reports RP-01 to RP-06, owns no records and edits nothing (NR-20). Shown only to people who can open the overview; Executive lands on it. Design decision only |

## 6. Decisions and increments under Dean's approval, 9 October 2026

Dean then approved "any changes, improvements, and refinements" that would make the app more professional. Under that approval:

| ID | Outcome |
|---|---|
| NAD-01 | Adopted: the seven department rails, plus Reports (NAD-08), stay the navigation. The six domains remain the specification view |
| NAD-02 | Adopted as design: the exception desk (RP-05) covers every department. Department queues such as Finance Exceptions stay with their owners and are linked. Not built |
| NAD-03 | Adopted and built: the Sales phone bar hides destinations the identity cannot open |
| NAD-05 | Adopted: no continuous technician location tracking without a workforce privacy decision |
| NAD-06 | Adopted: the payment gateway stays excluded; invoices are released in MYOB |
| NAD-04, NAD-07 | Still open: thresholds wait on D-017, and the Executive and Systems owner bundles need defining |

Built in this PR first (shell only; no grant, capability, migration or seed):

- **AU-01 page titles (NR-17).** Each shell page has its own title, taken from route metadata. Record pages lead with the record reference; create pages lead with "New record".
- **AU-23.** The Sales phone-bar fix, and a dated routing note in [application-shell-integration.md](application-shell-integration.md).
- **AU-13, partly.** Global search finds work orders and estimates by number.

Then, at Dean's request on 9 October 2026:

- **AU-02 working company (NR-18).** The working company narrows every access check that names a company at the shared access layer: record scope in `scopeSql` and company-level `hasPermission`. Capability checks that name no company, such as navigation, are unchanged. This settles the architectural question above in favour of filtering every read.
  - **Storage:** migration 0077 adds `ppo.working_companies`, one optional row per person.
  - **Safety:** no row means every company the grants reach. A row only narrows access; it never grants anything. Users, grants and the hosted runtime privileges are unchanged.
  - **How it applies:** the choice is loaded when a request resolves the signed-in identity and held for that request only, so jobs, seeds and older-schema upgrade paths are unchanged. The narrowing condition names its actor and uses validated UUIDs only.
  - **Rejected alternatives:**
    - a browser-only filter, which would leave pages and search inconsistent;
    - a column on `ppo.users`, which is read-only to the hosted runtime role;
    - a table reference inside every access check, which breaks application code run against older schemas during upgrades.
- **AU-08 grouped Service rail.** The Service rail is grouped under three headings, with order and permissions unchanged.

Still open:

- Quotation and purchase-order number search: needs new readers.
- AU-07 speed and AU-14 tree test: need evidence.
- Owner visual review of the new shell controls.

## 7. Not authorised

Beyond the shell increments and migration 0077 in section 6, no application code, route, rail change, capability, grant, seed, migration, register scope or UI baseline change follows from this record. Adopting NAD-08 settles the design; adding the Reports workspace to `navigation.ts`, its capabilities and its pages needs separate approval. Owner visual review, device, accessibility and business acceptance remain separate.
