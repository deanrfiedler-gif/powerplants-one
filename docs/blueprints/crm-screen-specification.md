# CRM — Screen specification and synthetic walkthrough

**Revision:** r06 · **Date:** 7 September 2026 · **Status:** Design only; no persistence, permission, integration, offline or business-acceptance claim. **Parent:** BP-03 / PPO-009. **Owner:** Dean Fiedler, private prototype.

[Open the standalone wireframe source](crm-wireframes.html) · [BP-03](BP-03-crm.md) · [Implementation sequence](../delivery/crm-implementation-plan.md) · [Handover and visual evidence](../delivery/crm-discovery-handover.md).

Download/open `crm-wireframes.html` in a browser. It needs no server or connection and uses no local/session storage, external images/fonts, API calls or service worker. Screen/state controls change illustrative views only; the banner remains **Synthetic • Design only**. Data exists only in the document. Inputs and save previews do not create PPO records. The proposal follows current navigation concepts (My Work, Customers, People, Sites, Service) with a new CRM area; the existing application is unchanged.

## Branded C02 layout direction

The [shared UI specification](../standards/ui-style-specification.md) now refines the provisional visual direction below using the supplied Powerplants brand. The [branded Board/Grid preview and original captures](crm-ui-mockups/README.md) demonstrate a Pipedrive-familiar workspace with navy `#242a37`, green `#62bb46`, Roboto/Verdana and the intact supplied logo on navy. They cover the same-record view switch, scoped filters, search, sort, detail and temporary synthetic creation. The [I2 UI guidance](../delivery/crm-i2-ui-guidance.md) coordinates later implementation.

The original seven-screen wireframe remains an unchanged functional/state reference. Its three-stage pipeline and provisional colours are historical design examples. The branded C02 preview uses six screenshot-derived labels for layout review; actual implementation must use accepted stage definitions. I1 stays Enquiry → Qualified / Open with no money fields. Fictional values in the branded preview do not authorise commercial implementation or operational mapping.

## Screen catalogue

Screen IDs C01–C07 are local to BP-03, separate from PP-01 SC-01–SC-15. First implementation includes C01/C03/C05/C07's bounded journey and existing shared-context links; the full board, account-plan and downstream designs are later.

| Screen / primary job | Content and hierarchy | Actions / permission expectations | Responsive and exception design |
|---|---|---|---|
| C01 Sales worklist | Heading and as-at; overdue / due-needed / no-next-action separately; owner/stage filters; task/opportunity, organisation, owner and due state | Open opportunity, plan action, new opportunity. Scoped server dataset; counts share exact filter/access scope | Phone cards with action immediately after context; skeleton/empty unavailable distinct. No numeric sales forecast |
| C02 Pipeline board and grid/list | Branded six-stage reference layout with readable cards, owner and next action; semantic grid shows the same filtered records. Earlier three-stage wireframe retained for state review | Board/Grid switch preserves filters/search/sort; shared detail. Later stage move uses an accessible explicit form with reason/version. No drag-only control | Above 780 px, one horizontal stage sequence with minimum 250 px columns and sticky headings; at ≤780 px, direct single-stage navigation. Grid header/identity stay visible in contained scrolling. Compact controls; incomplete page/count states labelled when implemented |
| C03 Opportunity detail | Permanent reference; title; stage and Open close outcome separately; organisation/site/contact/owner; customer need; next action; history/ref tabs | Qualify with note, view action, plan successor. Owner plus capability; current context/definition/version guard | Phone primary action near title; long need text wraps; conflict compares proposed/current safely, preserving input. No unavailable amount as zero |
| C04 Relationships | Organisation vs group, operational visibility context, site Operator/Owner/BillingParty, person and affiliation roles/effective dates, plan/territory as later scope | Existing shared-context links; stakeholder/account-plan editing later under separate capability | Semantic labelled rows; no hierarchy-derived access. Hidden related rows/counts do not appear; explicit empty means no permitted results, never no source records |
| C05 Activity planning/completion | Activity kind, purpose, owner, due instant or due-needed, linked pursuit/context, outcome, next-action implication | Plan/complete preview; real implementation only current owner can complete. No message/send/sync button | Labelled fields and error summary; retain outcome after validation. Known due displayed with timezone; terminal outcome immutable |
| C06 History and references | Attributed sales events, original occurrence vs server capture, safe document/downstream placeholders; exact revision where real | Open independently authorised exact reference when implemented; currently unavailable targets clearly shown | Timeline linear reading order; no report/customer-response success invented. Restricted service/Finance content not reproduced |
| C07 New opportunity | Existing organisation, optional site/person with explicit unknown, short title, need, owner and initial next action/date or date-needed | Create preview only. Real future transaction creates opportunity/activity/link/event/receipt atomically | Single-column phone form; clear required labels, field length guidance, focused errors and typed-value preservation |

## Shared state specification

The wireframe's State selector demonstrates these alternatives on every screen. This is a review control, not a product setting. Production errors must follow actual server state and current permissions.

| State | Required presentation / recovery |
|---|---|
| Ready | Intended permitted data and proposed actions; design-only badge always visible |
| Loading | Loading indicator and text; suppress stale detail/actions; loading is not an empty result |
| Empty | 'No items match this view'; offer change filters or permitted creation; avoid claiming the entire account is empty |
| Validation | Error summary with affected field/next step, entered content retained, focus on summary then related input |
| Permission denied | Safe message with no record title, counts, fields or source keys; hide prior detail and sensitive inputs |
| Stale/conflict | Safe current version/field comparison plus preserved proposal; explicit review/retry, never automatic overwrite |
| Unavailable | Source/server unavailable; saved state unknown until reconciled; retry/read operation route later. No success or zero count |

Use native buttons/inputs/selects with visible focus and accessible names. Branded r02 uses ≥44px primary/form/phone targets, with 40px desktop grid title controls in approximately 54px rows. The original wireframe uses provisional navy `#15344b`, green `#21634d` and Verdana. For future implementation, use the shared brand-derived specification linked above; the original asset is unchanged. Status uses words and borders as well as colour. The original wireframe has no logo/contact block; the branded preview uses the supplied logo without a contact block. Long content wraps; forms use one column on phone. Header/navigation and review controls wrap without page-wide horizontal scrolling. Board has list alternative; no drag dependency. Error summary receives keyboard focus after preview validation; screen change moves focus to the screen heading. These are design requirements, not a WCAG conformance claim.

## Guided synthetic walkthrough

1. **C01:** synthetic sales owner Alex sees one overdue action, one unknown due date and one pursuit needing a next action. The numbers apply to the example dataset, never operational Pipedrive.
2. **C07:** choose existing `SYN-PPO-ORG-000901 — Example Nursery`; describe a controls upgrade; keep the site/contact unknown with reasons if necessary; record the initial qualification action. Create preview explains that no data was saved. Try blank fields to review validation/focus.
3. **C03:** open `SYN-PPO-OPP-000001`. Enquiry is a stage and Open is the sales outcome. Owner, need and customer context remain visible. Qualify preview explains the intended versioned transition; it does not persist it.
4. **C05:** record an outcome for a CustomerContact action. Completion preview shows why a successor action is needed. It does not send a message, mark customer acceptance or advance a stage.
5. **C02:** compare Board and List over the same three example pursuits. This broader three-stage view is explicitly later than I1's two-stage definition; no production pipeline mapping is implied.
6. **C04/C06:** inspect distinct group/organisation/site/stakeholder concepts and attributed sales history. Quote/report/ERP references are marked unavailable/proposed; no synthetic P09 or Finance completion is shown.
7. Use State to inspect loading, empty, validation, denied, conflict and unavailable views. Switch to phone dimensions. Navigate by keyboard, type long content and inspect focus/labels. Nothing is saved to browser storage.

Revision r02 adds the brand-derived C02 reference and I2 handover without rewriting the original wireframe, changing I1 scope or accepting operational stage rules.

## Visual QA and acceptance limits

Inspect 1440×1000 and 390×844 original captures and 320px reflow, all seven screen/state combinations, board/list equivalence, keyboard focus and validation. The actual checks and captures are recorded in the handover and gallery. The isolated CRM design workflow runs `crm-design-check.mjs` using existing repository dependencies and retains original captures/manifest. All 18 unchanged PNGs and their original manifest are preserved in the [capture gallery](crm-visuals/README.md); nine representative originals covering all seven screens plus denied/conflict were visually inspected; they are screenshots of design, not runtime evidence.

The [UI handover](../delivery/crm-ui-design-handover.md) records the separate branded-export checks; these supplement the original screen/state checks.

The screenshot walkthrough provides reviewable appearance/state examples for CRM-01–CRM-08; it cannot prove server authority, persistence, concurrency, integration, exact file delivery, offline durability or accepted sales policy. CA-13 and AT-23/25 remain Not run as business/runtime acceptance until the implemented workflow and representative-device tests exist.

Revision r03 adds the [audit-driven r02 Board/Grid design](../delivery/crm-ui-design-handover.md): full action/owner in the grid, removable criteria and reset, selected pipeline at creation, preserved filters, focused field errors, long-text wrapping and [branded exception illustrations](crm-ui-mockups/states.html). The original seven-screen wireframe and its state illustrations remain unchanged.

## I1 implemented-subset distinction

[BP-03 I1](../delivery/crm-i1-handover.md) implements only an online Sales worklist, New opportunity, Opportunity detail/qualification/next-action forms, and links to canonical Organisation/Person/Site and existing Activity detail/completion screens. Its physical contract is one fictional Enquiry → Qualified pipeline with Open outcome throughout, fixed customer/owner context, unknown reasons and explicit due-needed. It has no board, lead, closing/transfer, account plan, file, revenue/probability, export or CRM offline UI. Broad screen definitions and checked illustrative wireframes above remain design evidence for later work. I1's actual runtime original captures, source-head/executed-tree and browser results are separately recorded in its handover; phone emulation does not prove real hardware acceptance.

## I1 runtime evidence distinction

The bounded C01/C03/C05/C07 journey is implemented in the online Sales worklist, New opportunity, Opportunity detail and existing Activity screens. The [I1 handover](../delivery/crm-i1-handover.md) records actual DB/HTTP/browser/restart checks and original 1440×1000, 390×844 and 320px runtime captures, separately from the illustrative wireframes and branded C02 preview above. I1 uses Enquiry → Qualified/Open, no commercial fields, current scoped authority and deliberate qualification/action commands. C02 Board/Grid is implemented by the separately invoked I2 slice below; C04 account-plan and later domain journeys remain proposed. Full AT-25, operational parity, real mobile hardware and CRM offline acceptance are unchanged.


## I2 application distinction

The separately invoked [I2 worklist](../delivery/crm-i2-handover.md) implements C02 Board/Grid over the same server-permitted page, with scoped Company/Site/Owner selectors, retained query/sort/page and canonical detail. It renders I1's actual two stages/Open outcome and separate opportunity/action owners. Counts explicitly describe the returned page; failed reads do not show zero. The intact logo/shared tokens and compact phone controls follow the accepted visual direction. Browser originals and actual permission/persistence evidence are recorded in that handover after execution. The standalone mockups, further stages, account builders and commercial fields remain proposed; no design capture passes AT-25.

## C03 controlled opportunity handover proposal

The [synthetic handover journey](crm-handover-journey.md) specifies an inline canonical-detail form, full current/proposed opportunity-owner comparison, separate next/identification Activity owners, deliberate reason/confirmation and stale/uncertain/revoked states. It follows the accepted shared brand and keyboard/reflow rules. This is design only under #55; H-01–H-03 remain unresolved. Original C01–C07 wireframes/assets and delivered C02 Board/Grid are preserved; the [conditional starter](../delivery/crm-owner-transfer-implementation-starter.md) grants no implementation authority.
