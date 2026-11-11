---
document_id: PPO-PHONE-TAB-BAR-DEC
date: 2026-11-10
owner: Dean Fiedler
status: Owner direction and adoption, 10 November 2026, given in chat in Claude's session (no [DEAN] comment); supersedes the icon-only phone tab bar rule in the records listed in section 5; the Figma module files were updated the same day; the application build is handed to Codex; Dean's visual review of the redrawn bars and the named version of the accepted Sales file are still to come; this record changes no application code
versioning: git
---

# Phone tab bar: rail colours and visible labels

## 1. Owner direction and adoption — 10 November 2026

**Colours.** Dean asked Claude to review the Figma module files and make the phone tab bar match the desktop rail: "ensure the bottom menu rail used in the mobile phone view has the dark background with light icons. When the active page is shown, the background will change to a lighter colour and a green top accent will be applied. Basically the same colours as what have been used on the left navigation rail in the desktop views."

**Labels.** Dean then asked: "Do you think we should include the text in the menu in the bottom rail, or just use icons? I'm happy with just icons if you believe that is the most professional." Claude recommended keeping a visible label on every tab, shortening the two Finance labels that do not fit, and adopting the label-fit rule in section 2. The reasons given were these. Most PPO destinations have no universally recognised icon. One icon already means different things in different modules: file-check is Technical reviews in Engineering and Finance handoffs in Finance. The desktop rail labels its items. Both platform guidelines and comparable work apps label bottom-bar tabs. Site and workshop users read a word faster than an icon. A visible label also helps accessibility. Dean answered: "I am happy for you to proceed however you believe is the most professional."

This reverses Dean's own decision of 11 October 2026 ("Icons alone will be enough", [estimate reviews design](estimate-reviews-design.md)) and the records that followed it (section 5). Later is binding: the labelled bar governs from 10 November 2026.

## 2. Rules

| Rule | Requirement |
|---|---|
| T1 Colours | The phone tab bar uses the desktop rail's colours. Bar: `surface/rail` (#2B3241). Tab that is not current: icon and label white at 84 % (`#FFFFFF`, paint opacity 0.84, the desktop rail's own value). Current tab: `surface/rail-active` (#3B4455), with a 3 px `brand/green` (#62BB46) line along its top, inside the cell; icon and label `brand/white` at 100 %. The bar has no top border line. In the application the phone bar takes whatever tokens the desktop rail uses: today `--ppo-rail-navy`, `--ppo-rail-hover` and `--green`. It moves to `surface/rail` and `surface/rail-active` in the same pull request that moves the desktop rail (refined shell S2), never on its own. |
| T2 Labels | Every tab shows its icon and a visible label. No phone tab bar is icon-only. |
| T3 Type | Roboto 11 px on a 14 px line; Regular when the tab is not current, Medium when it is. Icon sizes are unchanged by this record. |
| T4 Cell | Each cell fills the full 64 px bar height, so the current cell's lighter surface runs from the top edge to the bottom edge and the green line sits on the bar's top edge. In Figma the icon and label stack from 10 px below the top. Bar height and safe-area handling are unchanged. |
| T5 Fit | At the narrowest supported phone (320 px), a label in its current (Medium) weight is no wider than its cell less 4 px: 60 px with five cells, 76 px with four. One word is preferred; two short words are allowed (My Work). At the default text size a label never wraps and never truncates. |
| T6 Names | A phone label may be shorter than its destination's full name. The accessible name is the visible label (WCAG 2.5.3, Label in Name); the full destination name may appear as the cell's title on hover or long-press. |
| T7 Current tab | Unchanged: the current tab is marked with `aria-current="page"` as well as colour. A page that is not one of the bar's destinations has no current tab ([Leads L10](leads-design.md); Supply's `Current=None`). |
| T8 Enlarged text | At an enlarged browser or system text size, a label that no longer fits may end in an ellipsis; its accessible name stays complete. |

## 3. Phone labels

Widths are measured in Figma at Roboto 11 px Medium on 10 November 2026. Every phone label passes T5. The full names marked "fails" do not, so they are no longer used as phone labels.

| Workspace | Destination (`id`) | Full name | Phone label | Width (px) |
|---|---|---|---|---|
| All | `work` | My Work | My Work | 44 |
| All | More | More | More | 26 |
| Sales | `deals` | Deals | Deals | 28 |
| Sales | `calendar` | Activities | Activities | 46 |
| Sales | `contacts` | Contacts | Contacts | 45 |
| Estimating | `estimates` | Intake & workload (89, fails) | Estimates | 50 |
| Estimating | `wizard` | Estimation wizard (88, fails) | Wizard | 34 |
| Estimating | `estimate-reviews` | Reviews & approvals (102, fails) | Reviews | 41 |
| Estimating (Figma only) | Quotations | Quotations | Quotations | 55 |
| Engineering | `engineering` | Engineering workload | Engineering | 59 |
| Engineering | `drawings` | Drawings | Drawings | 46 |
| Engineering | `technical-reviews` | Technical reviews (88, fails) | Reviews | 41 |
| Projects | `projects` | Projects | Projects | 41 |
| Projects | `programme` | Programme | Programme | 58 |
| Projects | `acceptance` | Acceptance & closeout (114, fails) | Acceptance | 59 |
| Service | `tickets` | Service requests (83, fails) | Requests | 47 |
| Service | `planner` | Schedule | Schedule | 46 |
| Supply | `supply` | Material demand (84, fails) | Demand | 41 |
| Supply | `deliveries` | Dispatch & delivery (95, fails) | Dispatch | 44 |
| Supply (Figma only) | Receiving, Inventory, Workshop | — | Receiving, Inventory, Workshop | 48, 46, 50 |
| Finance | `finance` | Finance handoffs (86, fails) | Handoffs | 46 |
| Finance | `accounts` | Customer accounts (97, fails) | Accounts | 47 |

Service's primary cell showed "Service" in the application. It becomes "Requests", because inside the Service workspace "Service" names the workspace, not the destination. A workspace whose landing falls back to another destination (when the primary is not permitted) shows that destination's full name if it passes T5; otherwise the build adds a short label under T5 and lists it in its pull request for review.

## 4. Figma changes made on 10 November 2026

Each module file holds its own copy of the phone tab bar on its "Shell and kit" page. Every copy was restyled to T1–T4 in place. No bar was detached, and every placed bar kept the tab it already showed as current.

| File | Component (node) | Placed bars | Design status |
|---|---|---|---|
| PPO - Sales module | Phone / Tab bar · Sales `64:14209` | 11 | Accepted ([record](sales-module-refined-ui-proposal.md)); see below |
| PPO - Estimating module | Phone / Tab bar · Estimating `14:553` (5 variants) | 11 | Proposal ([record](estimating-module-refined-ui-proposal.md)) |
| PPO - Supply module | Phone / Tab bar · Supply `18:766` (6 variants, including `Current=None` `18:765`) | 23 | Proposal ([record](supply-module-refined-ui-proposal.md)) |
| PPO - Engineering module | Phone / Tab bar · Engineering `14:745` (5 variants) | 5 | Proposal; no record on `main` yet |
| PPO - Finance module | Phone / Tab bar · Finance `10:463` (4 variants); labels shortened to Handoffs and Accounts | 11 | Proposal; no record on `main` yet |
| PPO - Projects module | Phone / Tab bar · Projects `25:265`; the file's unused copy of the Sales bar `21:217` was restyled too | 15 | Proposal ([record](projects-module-refined-ui-proposal.md)) |

PPO – Shell, PPO – Library and PPO - Reporting module have no phone tab bar. PPO - Service module and PPO - Settings module are empty. The frozen "PPO - Design" file, including `v2 / Tab bar (phone)` `107:149`, is not edited. This record supersedes that component's icon-only rule; it does not change the file.

What changed in each bar: the light fill became `surface/rail`; the 1 px `line/soft` top border was removed; the bar's top padding went from 6 px to 0; each tab now fills the bar's height, with its top padding raised from 4 px to 10 px so the icon and label do not move; the current tab gained `surface/rail-active` and the 3 px green top line; icons and labels became white at 84 % (not current) or `brand/white` (current). The current tab is still distinguished by its label weight (Medium), so colour is not the only signal.

**Accepted Sales design.** The Sales phone sheets are part of the accepted set, pinned by the named version "PPO - Sales module (accepted) · batch 2 · N13". This change visibly alters accepted sheets without changing their layout or journey. That makes it a Medium change under the [design-to-build standard](../standards/design-to-build-standard.md#5-the-library), and Dean's direction in section 1 is its acceptance. Under the [named-version handoff](figma-named-version-build-handoff.md) rule 5, a build needs a new named version of that file. Recommended title: "PPO - Sales module (accepted) · phone tab bar". Dean saves it; the connector has no route to save one.

**Unbound 84 % white.** Figma does not keep an opacity-only change to a variable-bound paint inside a component instance: such changes read back correctly and then revert. Paints for tabs that are not current are therefore unbound white at 84 %, exactly as the desktop rail's own items that are not current are drawn. An alpha colour variable for this role (for example `text/on-rail-muted`) would let them be bound. It is proposed for PPO - Library and is not created here.

**Verification.** A script read back all 99 bars (23 component masters and variants, and 76 placed bars) against T1–T4. The first read found the 84 % opacity on bound paints had not been kept; after the change to unbound paint, every bar passed, and passed again about ten minutes later. The Sales, Projects, Estimating, Supply, Engineering and Finance bars were also checked by screenshot.

## 5. Records superseded

Each record below carries a note pointing here. Only the icon-only part of each named rule is superseded; the rest of each rule stands.

| Record | Superseded part |
|---|---|
| [Estimate reviews design](estimate-reviews-design.md) | The "Phone header and tab bar" source row and D8: icons only, with names hidden |
| [Leads design](leads-design.md) | L10: "icons only"; the no-current-tab rule stays |
| [My Work and Sales mobile r07 integration](my-work-sales-mobile-r07-integration.md) | M10: "five icon-only cells" |
| [Work orders design](work-orders-design.md) | W8: icon-only tabs with hidden accessible names |
| [Projects register design](projects-register-design.md) | P7: icon-only tabs; the phone label for Acceptance & closeout is Acceptance |
| [Phone header amendment](phone-header-amendment.md) | The note that the phone tab bar keeps five icon-only tabs |
| [My Work page design](my-work-page-design.md) | The icon-only tab bar in the phone pattern |
| [Figma UI implementation](figma-ui-implementation.md) | The icon-only navy bottom bar |
| [Fertigation Figma design](fertigation-figma-design.md) and [implementation](fertigation-figma-implementation.md) | The icon-only v2 Tab bar and icon-only navigation |
| [Estimating module refined UI proposal](estimating-module-refined-ui-proposal.md) | A3 and Q4: the mismatch they recorded is resolved in favour of labelled tabs |

The shell's working masters point here: the [application shell specification](../design/development/components/application-shell.md#mobile) (its Mobile rule, with the [binding note](../design/development/component-bindings/2026-11-10-phone-tab-bar.md) and the build gap `application-shell-phone-tab-bar-labels`) and the [shell system page](../design/development/systems/shell.md#phone-tab-bar-labels-and-rail-colours--10-november-2026). Their dated sections that describe the earlier icon-only bar are history and are not rewritten.

## 6. Build

Codex builds the application change from this record: visible labels in every phone bar (T2, T3, T5, T6), the phone labels in section 3, and the cell treatment in T4. Colours stay on the desktop rail's tokens (T1). The handover on this record's pull request carries the task and acceptance criteria. The build starts once this record is merged and Dean has saved the Sales named version in section 4. Where this record and that named version disagree, the build stops and reports the difference.

## 7. Limits

- No application code, test, route, permission, migration, seed or CSS token changes here. Until the build merges, the application still hides phone bar labels (`src/app/styles/figma-shell.css`, and `src/app/styles/projects-register.css` for Projects).
- Dean directed the colours and adopted the labels in words. He has not yet reviewed the redrawn bars in Figma, and the proposal files are not accepted by this record; their tab bars follow these rules when each proposal is accepted.
- Dean's visual review, functional proof of the build and deployment stay separate claims.
- All 78 parent requirement IDs remain.

Reverse by: a later [DEAN] comment or owner decision.
