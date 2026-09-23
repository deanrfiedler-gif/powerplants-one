---
document_id: PPO-SV01-PLAN
title: SV-01/SV-02 — Service requests application integration — build plan
date: 2026-09-23
owner: Dean Fiedler
status: Prepared under Dean's acceptance of D3 on 23 September 2026; I1 delivered for review in a stacked PR; I2–I5 not started; lifecycle increments wait for ADR-0043
scope_id: SV-01
source_commit: 7bf972cbc38a9e62fd25b1bd635c6991895d76e6
versioning: git
---

# SV-01/SV-02 — Service requests application integration — build plan

## 0. What this plan is

This plan applies the [proposed service requests refinement](../decisions/service-requests-native-refinement.md) to the running `/service/tickets` pages. It is **not** a new module. P03 already delivers intake and triage, and P04 links work orders. The pages change presentation, and the server gains read-model additions. No command, state or migration is added before [ADR-0043](../decisions/ADR-0043-service-request-lifecycle.md) is accepted.

**Authority.** Dean accepted D3 on 23 September 2026: build the refined register and record natively for the three states the application already moves a request through, and draft the lifecycle extension separately. Native integration follows the precedent of every current `module_integrations` entry in `docs/standards/ui-baselines.json`: it proceeds on Dean's authorisation, and owner visual and device acceptance stay separate. The integration entry this plan adds in I5 grants no baseline acceptance.

**Tags.** Every binding below carries exactly one tag:
- **Contract:** on `main` in a merged migration or server module, and enforced by the running application.
- **Seed:** a synthetic fixture only.
- **Proposed:** a choice made here; it is applied under Dean's delegation unless marked for his decision.

**Read for this plan (base `7bf972c`):**
- `src/service/intake.ts` (`listTickets`, `readIntake`, `triageBlockers`) and `src/service/tickets.ts` (`ticketVisibility`);
- `src/activities/activities.ts` (`activityVisibility`) and `src/service/work-orders.ts` (`orderVisibility`);
- `src/shared/reads.ts` (`page`, `envelope`) and `src/components/intake-screens.tsx`;
- `src/shell/module-workspaces.ts`, `tests/ui/deals-design-conformance.spec.ts` and `docs/standards/ui-baselines.json`;
- migrations 0001–0004 (`tickets`, `site_parties`, `relationships`, `companies`, `work_order_tickets`);
- `tests/database/intake.test.ts`, `tests/http/intake.test.ts`, `tests/browser/intake.spec.ts` and `tests/browser/quality-states.spec.ts`;
- [ADR-0008](../decisions/ADR-0008-p03-customer-intake.md), [ADR-0009](../decisions/ADR-0009-p04-work-scope-readiness.md) and the [conformance standard](../standards/html-module-conformance.md).

## 1. What exists today

| Area | Fact | Tag |
|---|---|---|
| Routes | `/service/tickets`, `/service/tickets/new` and `/service/tickets/[id]`. Each page file is a shim onto `TicketList`, `TicketCreate` or `TicketDetail` in `src/components/intake-screens.tsx` (666 lines) | Contract |
| States reachable | New, NeedsInformation and Triaged. The status check already allows the other five (ADR-0043) | Contract |
| List read | `listTickets`. Filters: `limit`, `cursor`, `q`, `company_id`, `site_id`, `status` (three values) and `owner_id`. Rows: id, reference, summary, status, priority, version, triage owner id, site id, site-identification flag and received-time basis. Ordered by UUID, with a signed, filter-bound cursor | Contract |
| Record read | `readIntake`: the full intake, owner name, the clarification when its activity is readable, permitted actions and triage blockers | Contract |
| Visibility | A ticket is visible only when its site, requester and asset are visible too (`ticketVisibility`). Activities and work orders have their own visibility SQL | Contract |
| Company | `tickets.company_id` is the **company visibility context** (the ERP company), labelled so in the intake form. It is not the customer | Contract |
| Customer | The Ticket has no customer field. Organisations relate to a site through `site_parties` (Operator, BillingParty or Owner, with validity dates; at most one effective Operator per site) and to people through `relationships` | Contract |
| Shell | `/service/tickets` is not a module workspace, so the shell's Service tab row shows | Contract |
| Tests touching these pages | `tests/browser/intake.spec.ts` (heading *Service requests*, *New service request*), `quality-states.spec.ts` (PT-29 record row), `tests/ui/shell-geometry.probe.mjs` (`/service/tickets`) and the my-work specs | Contract |

## 2. Design to application mapping (three-state increment)

| Frame element | Native source | Tag |
|---|---|---|
| Lanes New, Needs information and Triaged (frame 14) | `status` | Contract |
| Reference, title, priority, received time and channel | Ticket columns | Contract |
| Customer line | See **P1** below | Proposed |
| Site and equipment | Ticket `site_id` and `asset_id`; names from the visible records | Contract |
| Next-action block | `next_action` text (no due time), or the clarification activity's summary, owner and due time when the request needs information | Contract |
| Triage blocker chip | Count of `triageBlockers()` for New and NeedsInformation | Contract |
| Overdue clarification | The clarification activity is Open or InProgress and its due time has passed | Contract |
| Linked work chip and column | Visible `work_order_tickets` links, each in its own work-order state | Contract |
| Owner | `triage_owner_id` display name | Contract |
| Queue counts | New server aggregate (§3) | Proposed |
| Customer update, affected areas, response route, category, waiting and resolution | No native source. Hidden until ADR-0043 or a later contract | — |
| *Log a request* duplicate check (frames 5 and 18) | Needs a match read (I4). *Add as a customer statement* needs ADR-0043's evidence record | Proposed |

## 3. Read-model extensions — no migration (I1)

| Addition | Where | Rule |
|---|---|---|
| `received_at`, `channel`, `next_action`, `triage_owner_name` | `listTickets` rows | Straight projections |
| `site` `{id, display_number, display_name}` and `asset` `{id, display_number, description}` | `listTickets` rows | Ticket visibility already requires both to be visible |
| `customer` `{id, display_name, basis}` or `null` | `listTickets` rows | **P1** |
| `clarification` `{id, summary, owner_name, due_at, due_needed, status}` or `null`, plus `clarification_unavailable` | `listTickets` rows | Only when the activity passes `activityVisibility`, matching `readIntake` |
| `triage_blocker_count` | `listTickets` rows | Uses `triageBlockers()` for New and NeedsInformation, so the list and the record agree; `null` for Triaged |
| `work_orders` `[{id, display_number, status}]` | `listTickets` rows | Only orders that pass `orderVisibility`; hidden orders are omitted, never counted |
| `sort=urgency` | `listTickets` input | Priority (Urgent, High, Normal, Low), then oldest received, then reference. The keyset cursor stays a signed UUID; the next page resolves that row's key server-side. The default order is unchanged |
| `GET /api/v1/service/tickets/queues` | New route, `service.ticket.read` | Counts for all, new, needs_information, triaged, urgent and overdue_clarifications. It takes the list's filters except `status`, uses the same visibility, and returns `as_at` |
| `src/service/ticket-register-view.ts` | Pure module | Relative time, lane, queue membership and the one attention chip per row. No server imports; unit tested |

**P1 · Which organisation is a request's customer?** The Ticket records none, and the company context is not the customer. Proposed rule, applied under delegation:
1. The **Operator** party current at the ticket's site, when it is visible (basis `SiteOperator`). The schema's exclusion constraint allows one effective Operator per site at a time. This was found in I1; the rule originally said "when exactly one is visible".
2. Otherwise, the requester's single current visible relationship organisation (basis `RequesterRelationship`).
3. Otherwise `null`, shown as *Customer not identified* in amber.

It never guesses between two candidates. **Recommendation for ADR-0043:** add an explicit `customer_id` validated against current site parties, as WorkOrder already does, and retire this derivation. Recorded as ADR-0043 Q7.

## 4. Build sequence

One pull request per increment. After each one, the application works and every suite passes.

### I1 — Read model and view logic (no visible change)

- **Server:** the §3 additions in `src/service/intake.ts`, the queues route under `src/app/api/v1/service/tickets/queues/route.ts`, and `src/service/ticket-register-view.ts`.
- **Contract text:** an SV-01 I1 amendment in `docs/contracts/service-api.md`.
- **Tests:**
  - `tests/unit/ticket-register-view.test.ts`;
  - `tests/database/intake.test.ts`: the projection for a visible and a withheld clarification, customer basis and a null customer, linked work, the urgency order across a cursor page, and queue counts under a site-only principal;
  - `tests/http/intake.test.ts`: the queues route's shape, and 403 without the capability.
- **Exit:** no migration, command, capability or seed; the existing browser suite is untouched and green.

### I2 — Register page (frames 1–3 without later lanes, 6, 14, 16, 19, 20 and 23)

- **Screen and styles:** `src/service/components/client/ticket-register.tsx` (Board, List, preview drawer, queue row, filters, *Columns*, sort and states) and `src/app/styles/service-requests.css`, both scoped to `#ppo-service-requests`.
- **List columns:** the twelve with a native source.
- **Shell:** register `/service/tickets` as `full-bleed` with `navigation: "workspace"` (D6).
- **Board moves:** Move and drag offer only native transitions, New → NeedsInformation and New or NeedsInformation → Triaged, and open the existing commands' forms.
- **Tests:**
  - `intake.spec.ts`: the visible heading becomes the hidden `h1` *Service requests*, and *New service request* becomes *Log a request*;
  - a new `tests/browser/service-requests.spec.ts`: board, list, preview, keyboard Move, 1024 × 768 and phone;
  - the shell-geometry probe for the workspace layout.

### I3 — Record page (frames 4, 7, 12, 13, 15, 17 and 24, native content only)

- **Record:** the header, progress strip and tabs. Overview uses the native fields. Triage & actions shows the clarification and next action. The triage form is docked on desktop and full screen on a phone, and calls the existing `triage` and `request-information` commands with their gates unchanged.
- **Shell:** register `/service/tickets/[id]` as `padded` with `navigation: "workspace"`.
- **Deferred:** Work & visits, Evidence & updates and Resolution & review wait for ADR-0043. Until then, Work & visits shows the linked work orders read-only.
- **Tests:** the PT-29 record row in `quality-states.spec.ts` keeps passing.

### I4 — Capture with a duplicate check (frames 5 and 18)

- **Match read:** `GET /api/v1/service/tickets/matches?company_id&site_id&asset_id` returns visible open requests with the reasons they match. It is a prompt, not a block.
- **Deferred:** *Add as a customer statement* (D8) waits for ADR-0043's evidence record. Until then, the panel links to the matching request.

### I5 — Conformance proof and records

- **Integration entry:** a `module_integrations` entry `sv01-native-r01`. Its fields:
  - `design`: r02 HTML and its SHA-256;
  - `shared_design`: theme board r22;
  - `component_proof` and `application_proof`: I2's specs;
  - `adaptations`: this plan and the refinement record;
  - `authority`: "Dean accepted D3 (native increment) on 23 September 2026; layout adaptations are proposed for owner visual and device review; no accepted screenshot baseline".
- **Proof:** paired captures at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 568. Update the page guides, design register and STATUS from the evidence.

### Lifecycle increments (after ADR-0043 is accepted)

- **L1:** migration, commands and capability, with the registry, access-review and upgrade updates `AGENTS.md` lists.
- **L2:** Active, Waiting and Resolved lanes; waiting, commitment and evidence columns.
- **L3:** Work & visits, Evidence & updates and Resolution & review.
- **L4:** *Add as a customer statement*.

## 5. Constraints for every increment

- The server decides every state, blocker and permitted action. Nothing the page shows comes from a client-side checklist.
- The P03 known-site triage gate stays as it is (ADR-0043 Q6).
- Unknown values are stated in words, and no cell is left blank.
- Tokens and components come from theme r22 and the shared controls.
- The shell owns navigation, identity and viewport height.
- No migration, capability or seed before ADR-0043.

## 6. Risks

| Risk | Control |
|---|---|
| The P1 customer derivation shows the wrong organisation when a site has several operators | It never picks between candidates; *Customer not identified* is the fallback. ADR-0043 Q7 proposes an explicit field |
| Queue counts disagree with the list | One shared visibility and filter builder serves both, with a database test that compares them |
| Renaming *New service request* breaks unrelated specs | I2 updates every spec that names it, found by searching the tests before the change |
| Registering module workspaces changes shell geometry | The shell-geometry probe and the Deals conformance test run in I2 and I3 |
| Visual review changes the frames after I2 | The images are issued sets, so I2 builds to the frame identities it cites, and a successor set drives a follow-up change |

## 7. Immediate next step

I1, on a branch stacked on the refinement PR.
