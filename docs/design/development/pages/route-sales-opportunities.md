# Opportunities · Board / List / Forecast / Archive — design reference

Stable entry: `route:/sales/opportunities`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/opportunities`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The CR-04 workspace implements the accepted 24 October design in PR #699. Functional validation and application visual review are recorded separately; design acceptance does not imply application acceptance.

1. Use Board or List to inspect the same permitted worklist
2. Use Forecast to review timing and known values
3. Review Archive separately from active opportunities

## Desktop

Accepted design: the [Deals design decision](../../../decisions/deals-figma-design.md#acceptance--24-october-2026) of 24 October 2026 ("Deals · CR-04", Figma page `549:2`) covers Board, List, Forecast and Archive at 1440, the snapshot, filters, a two-row selection with its small panel, column settings, Add deal, Record Won with the handover prompt, Record Lost, a refused stage move and Pipeline settings as a labelled proposal, plus Board and List at 1024 with the rail collapsed. Captures 01–16 in [design r02](../../../reference/ui/crm/deals-design-r02/README.md).

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 17–19 in [design r02](../../../reference/ui/crm/deals-design-r02/README.md): the 390 and 320 lists with the compact phone header (P1–P9) and the Sales phone bar, and the 320 Search and filter screen. A row opens the Deal record CR-01 phone view. The phone Board with stage navigation is not drawn.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Implementation contract

Use `data-ppo-workspace="shared"` and the existing shell. Board remains the default. The toolbar is 54 px and the status row 44 px; five 228 px stages contain 212 × 264 px cards at 1440. The List uses shared RegisterTable, fixed 44 px selection/settings columns, activity-first columns, a visit-scoped chooser and existing pointer/keyboard resizing. Forecast splits each month by stage; Archive bands Won and Lost. No hidden or fabricated whole-result aggregate is used.

Counts and known-value subtotals cover the returned page, or all matching results only when the server says Complete. Selected CSV covers selected permitted rows on that page in displayed order and chosen column order, with a fresh access/source read before download. Unknown money remains blank in CSV. Filters, access, paging or changed rows clear selection. A changed background read clears the sequence controls and reports the cleared selection without closing an open snapshot or discarding a stage, information or outcome draft. Access denial still clears protected content. Sequential opening uses snapshots and preserves the worklist URL when opening a full record.

The Add deal modal uses `add=deal` over the current register and the native creation form; Back/Forward, dirty guards and uncertain-command recovery remain active. Direct `/sales/opportunities/new` entry remains. Won prompts the explicit CR-03 receiving handover; stage refusal uses the native reason and saved-version recovery. Pipeline settings and rotting remain proposals; no bulk stage changes, probabilities, Deal record rebuild or Insights rebuild.

Snapshot follow-through reads exact native estimate versions, issued quotation revisions and estimating/receiving handover versions through their existing authorities. Each section is bounded to 20 source candidates with explicit partial/unavailable states. Source hashes/IDs are retained by the API; absent permissions do not become zero counts. Advisory exit prompts never become transition gates or fabricated completed conditions. Follow-through is read once when its snapshot opens and again only on Reload follow-through or Retry follow-through; ordinary worklist polling and focus do not repeat the workspace-locked read. The server read contract is unchanged.

Undrawn adaptations use PPO controls: phone Board stage navigation, a Choose view sheet, phone selection sheet, tablet Forecast horizontal month scrolling, tablet Archive fixed-column scrolling, native menus and labelled drag targets with individual non-drag alternatives. Expected close filtering remains outstanding while design PR #790 is unmerged (checked 31 October 2026). Fixed design fixtures use 15 October 09:00 AEST; runtime attention and due wording use returned facts and observation time.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Deals design r02](../../../reference/ui/crm/deals-design-r02/README.md): the accepted Figma design, 28 icon-free captures (design compositions, not application captures)
- [Deals design r03](../../../reference/ui/crm/deals-design-r03/README.md): the Filters and phone Search and filter frames with Expected close, amended 31 October 2026; the other 26 r02 captures stay current
- [sales-deals-populated.png](../../../testing/evidence/department-navigation/sales-deals-populated.png)
- [ppo-deal-pipeline_r38.html](../../../reference/ui/crm/ppo-deal-pipeline_r38.html)

## Behaviour, handovers and verification

At desktop and phone widths, native URL changes must update controlled search during the input event even if framework rendering is deferred. Every typed character, focus and replace-history behaviour must survive; reload and Back/Forward restore the criteria. The 16 October [integration proof](../../../testing/evidence/pr-integration/README.md) adds an explicitly delayed framework fixture while retaining the native browser journeys. This is a behaviour correction; no visual review fingerprint is adopted.

The draft User Guide `guide.page.sales.opportunities` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

The [CR-04 application evidence](../../../testing/evidence/deals-cr04/README.md) records focused native and presentation tests, matching 1440/1024/390/320 captures and developer inspection against r02. Keyboard/non-drag changes, recovery, filter/history context, selection/export, fixed columns and grouped values are covered. Physical-device testing, a complete accessibility audit and owner visual acceptance remain pending. No review fingerprint or deployment is adopted.

## Native Sales implementation contract

Review stage history, next-action coverage and close-date movement over the same permitted result page as Deals.

- Board, List, Forecast and Archive preserve their existing controls.
- Pipeline insights opens the existing read-only review from the status row or the phone Choose view sheet.
- Coverage distinguishes known/unknown values and next-action states.
- Deal drill-through links retain the selected worklist URL.

Choose pipeline, company/site, owner, outcome and search filters. Read the observation time, count basis and complete/partial state before interpreting totals.

The denominator is the returned page, not a whole-company forecast. Amounts are unweighted AUD excluding GST; null is not zero. Stage ageing uses recorded entry time. Date movements compare recorded snapshots; positive moves accumulate as slipped days. Missing history stays unknown.

Insights are read-only arithmetic over authorised facts. No probabilities, forecast categories or financial policy are adopted.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.page.sales.opportunities` carries normal and recovery steps.

Historical native-integration evidence: `docs/delivery/sales-native-completion-handover.md` and the retained r38 reference. The accepted 24 October r02 captures now govern this workspace, including phone layouts. Current native estimating/quotation/receiving sources supply the bounded snapshot read; automatic downstream effects remain outside scope. Application acceptance is pending.

## Figma Deals proposal — 13 October 2026

Dean requested a Deals UI in the existing PPO Design file using the specifically supplied [r37 HTML](../../../reference/ui/deals/ppo-deal-pipeline_r37.html). The linked target was the accepted Leads page; that page was preserved and a dedicated Deals page (`549:2`) was created in the same file (named "Deals (proposal)" until 24 October 2026, now "Deals · CR-04"). This request does not replace the retained r38 application reference or grant design acceptance.

- Desktop: Board (`549:3`), List (`555:5333`), Snapshot (`555:6027`), Filters (`555:6470`) and Pipeline settings (`555:6765`), each 1440 x 960.
- Mobile: Phone list (`555:7107`), 390 x 844. Stacked rows are a proposed adaptation of the source List. No separate 320px or tablet capture was produced.
- Reuse: existing Sales rail, shared top bar, Button, Roboto text styles and PPO tokens; new local Deals card variants, list rows, phone rows, fields, checkbox and source SVG icon components.
- Fixtures: 18 source opportunities, 4/3/7/2/2 stage counts, $1,189,150.50 known open total; $500,690.25 weighted estimate remains illustrative. Unknown values retain “Not estimated”.
- Layout: collapsed 76px Sales rail; toolbar/status/worklist directly in the shared workspace with no extra module container. Five fitting stages use paired 8px chevron edges across 78px headers. Whole-pixel columns are 264px wide with 8px gutters/insets and 248 x 264px cards, retaining 1px inside neutral borders. The 1932px stack accommodates the final card and bottom padding in the longest stage. The 8px gutter is a proposed refinement of the issued 9px spacing. Right snapshot and full-height central filter form remain.
- 14 October user feedback: match the supplied stage/card screenshot; correct card spacing, activity icons, overlapping avatars and task counts. The list uses the accepted Leads Grid components: 40px rows/header, 14px Roboto, shared cell dividers, stage tags, checkboxes and number/action cells. Separate contact and due columns preserve the source data; the 1604px grid scrolls horizontally within 1364px. Phone composition remains a proposal.

[Decision and scope](../../../decisions/deals-figma-design.md), [visual evidence and limits](../../../testing/evidence/deals-figma/README.md). Editable-layer and visual inspection are design-delivery evidence only. Runtime filters, writes, drag/move commands, all HTML dialog families, accessibility/device acceptance and deployment were not implemented or verified by this Figma task. Owner/review status and existing fingerprints remain unchanged.

## Figma design accepted — 24 October 2026

Dean accepted the finished Deals page, renamed "Deals · CR-04" (`549:2`): "I accept the Deals · CR-04 design with your recommendations, including D1–D15 and the recommended answers to Q1–Q9. Proceed with the lock-in." It supersedes the 13–14 October proposal above as the design reference for this route; the r37 proposal evidence stays unchanged as history.

- **Reconciled with the code:** only what the app has is drawn as built (Board, List, Forecast, Archive, the five stages, unweighted values, "Not estimated", next activity, Won from Closing, Lost with a reason). Probabilities, weighted totals, forecast categories, rotting, health signals, waiting-on, task badges and the email shortcut are removed (R11 and the verdicts in the decision).
- **Shell:** the labelled Sales rail with Deals selected, the Conversations top bar with the centred search, the compact phone header and the Sales phone bar.
- **Frames:** 14 desktop (Board `549:3`, List `555:5333`, Forecast `2362:63797`, Archive `2366:6346`, Snapshot `555:6027`, Filters `555:6470`, two selected `2367:7589`, column settings `2367:8772`, Add deal `2368:8381`, Record Won `2369:11867`, Won recorded `2368:8653`, Record Lost `2369:12101`, refused stage move `2368:10058`, Pipeline settings as a labelled proposal `555:6765`); tablet Board `2369:815641` and List `2369:815999`; phone 390 list `555:7107`, 320 list `2361:6377` and 320 Search and filter `2369:818269`; nine states.
- **Departures D1–D15** (layout, Leads column order and fixed columns, Forecast stage groups, Archive bands, the selection panel, the column chooser, Add deal over the register, the Won notice, phone and tablet treatment) are listed in the decision with the app's current behaviour beside each.
- **Not drawn:** the phone Board with stage navigation, the Choose view sheet, phone selection, tablet Forecast and Archive, open menus and a drag in progress.

[Decision](../../../decisions/deals-figma-design.md#acceptance--24-october-2026), [captures r02](../../../reference/ui/crm/deals-design-r02/README.md). Visual status stays "Needs review": PR #699 implements the accepted workspace and bounded snapshot reads, with application captures linked above. Independent review and owner application acceptance remain separate from implementation and developer inspection.

**Amendment, 31 October 2026.** Filters `555:6470` gains an Expected close range with quick choices, so Deals and Pipeline insights keep the same filters. Open deals with no close date are left out unless No date is chosen. Sort and Page size stay. Phone 320 Search and filter `2369:818269` gains the same group, with larger quick choices and From and To stacked. The named Figma version "Deals · CR-04 — Expected close amendment, phone" holds both changes. [Amendment](../../../decisions/deals-figma-design.md#amendment--31-october-2026), [captures r03](../../../reference/ui/crm/deals-design-r03/README.md). The app has no such filter. PR #790 merged on 1 November after the CR-04 implementation was completed and published; Expected close filtering remains a separately recorded follow-up under the original conditional scope.
