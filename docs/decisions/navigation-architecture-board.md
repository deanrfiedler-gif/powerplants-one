---
document_id: PPO-NAV-ARCH-BOARD-DEC
date: 2026-10-09
owner: Dean Fiedler
status: Proposed design reference; not owner-reviewed; no implementation authorised
source_commit: dcec2cf05e82e1eaf2c7f90f136701d080cb6248
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

This record identifies the resulting board and what it proposes. It changes no route, rail, capability, grant, migration or scope count. [Navigation consolidation](navigation-consolidation.md) and `src/shell/navigation.ts` remain the authority for navigation.

## 1. Classification

| Item | Classification | Evidence and scope |
|---|---|---|
| Six-domain brief, three outputs | User request, 8 October 2026 | Session brief. The domains are a capability view; no parent requirement ID is added or renamed |
| Seven improvements | User instruction, 9 October 2026 | Session instruction |
| Keep the seven department rails as the navigation; use the six domains as the specification view | Proposed, not decided | Reconciliation artboard (capture 02). Built rails read from `navigation.ts:7-45, 309-333` |
| Navigation rules NR-01 to NR-16 | Proposed inputs to the navigation consolidation review | Capture 04. "Built" rows describe source at `dcec2cf`; they are not acceptance |
| Interaction register HO-01 to HO-18 | Proposed, built on existing journeys | Capture 05. Capability names in the gate column exist in `permissions.ts` unless marked New |
| Brief departures R1 to R15 | Proposed, for owner decision | Capture 06 |
| Wireframes for RP-01, RP-05 and PJ-02 | Proposed composition on existing scopes | Captures 14 to 20. No new scope; the register's 150-scope count is unchanged |
| New capability names | Proposed, not in the contract | Domain tables (captures 07 to 12). None exists in the 131-value contract |

## 2. Design reference

| Reference | Identity |
|---|---|
| Board | Private Design artifact in Dean's claude.ai account, <https://claude.ai/artifact/UKeykdt6pNm9stkUH8JSLH>, version 24 (`1791503903-79bd`), 20 artboards, built with the Powerplants One design system. Only the owner can open it |
| Retained captures | [Navigation architecture board r01](../reference/ui/application-shell/navigation-architecture-board-r01/README.md): 20 PNG captures with hashes, plus the two Mermaid sources. These are the repository reference |
| Mermaid sources | `navigation-overview.mmd` (domains, working areas, handovers) and `navigation.mmd` (page level, one subgraph per domain). Both parse in Mermaid 11.4.1 |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md) on the board's conformance artboard (capture 20).

| Wireframe | Existing scope | r20 page type | Departure |
|---|---|---|---|
| Management overview | `scope:RP-01`, /reports | Overview / dashboard | New capability `reporting.overview.read`; synthetic stage weights |
| Exception desk | `scope:RP-05`, /reports/reconciliation; supporting `scope:AD-04` | Work queue + persistent detail | Widens RP-05 from Supply and Finance to every department |
| Portfolio health | `scope:PJ-02`, /projects | Overview / dashboard over Register / worklist | Synthetic health thresholds pending D-017 |

Reused components: the application shell, Breadcrumb, Segmented control, Button, Field, Section tabs, Status chip, Register table and the phone bottom bar. Wireframes are drawn at 1440 px and 390 px only.

## 4. Findings from the reconciliation

- The built navigation has seven department workspaces, each with its own rail. My workspace, Shared records and Administration sit in More. Of the 75 destinations, 13 are reserved and withheld.
- Proposals from the board fill six reserved slots:
  - Projects: Risks & issues.
  - Finance: Project performance, Cash outlook, Reconciliation and Exceptions.
  - More: Settings.
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

## 6. Not authorised

No application code, route, rail change, capability, grant, seed, migration, register scope or UI baseline change follows from this record. Owner visual review, device, accessibility and business acceptance remain separate.
