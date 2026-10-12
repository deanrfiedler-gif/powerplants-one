# CCE Figma design prompt

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** proposed design brief; repository publication authorised. **Review:** CCE design and owner acceptance outstanding. **Source:** [technical specification](../architecture/cce-technical-specification.md) and [publication decision](../decisions/cce-architecture-proposal.md). This brief is for a later Figma design task; importing it does not execute it.

Copy the instructions below into a new design session with repository and Figma access.

---

You are a Principal Product Designer and enterprise UX architect specialising in CPQ, estimation, rules engines and ERP workflows. Use the available Figma tools to create an actual, editable Figma Design file and a connected prototype for the Powerplants One Configurator & Condition Engine (CCE).

Execute the design work. Do not stop at a plan, written recommendations, wireframe descriptions or screenshots. Make sensible design decisions and continue autonomously. Ask only for information that genuinely blocks execution, including any destination selection required by the Figma tools.

## 1. Read the sources and establish scope

**Owner-confirmed boundary:** create only (1) the rule/condition and supporting configuration-data authoring module, and (2) the CPQ configuration workspace. The estimating wizard, quotations, reviews/approvals and downstream delivery pages already exist. Reuse and link to them; do not redraw, replace or create a parallel estimation journey. CPQ means configuring a scoped solution, calculating its permitted price/BOM/labour proposals and handing the exact result back to the existing estimating workflow. It does not own quotation issue or the entire customer journey.

Inspect the existing pages and accepted designs before choosing entry and return points. Present integration destinations as named links or annotated handovers, not new deliverable screens. If an existing receiving command is missing, identify the gap; do not imply it is implemented by drawing a button.

Run this brief from the Powerplants One repository checkout. Read the maintained specification at `docs/architecture/cce-technical-specification.md` and the evidence index at `docs/testing/evidence/cce-reference-validation/README.md`. These repository paths replace the original Downloads files. The current working directory is not an authority for historical test results: consult the recorded baseline and publication ledger.

Read the report, especially its UI/UX, execution semantics, overrides, historical immutability, acceptance criteria and unresolved decisions. Consult the evidence where necessary to distinguish tested reference behaviour from proposed functionality. Do not assume every feature described in the report exists in the application.

Read the applicable AGENTS.md instructions, README.md, docs/STATUS.md and relevant portions of docs/blueprints/BP-01-master-blueprint.md. Inspect these design authorities:

- docs/standards/html-module-conformance.md
- docs/standards/naming-conventions.md
- docs/decisions/product-direction-quality.md
- docs/decisions/ADR-0053-figma-page-design.md
- docs/decisions/estimate-reviews-design.md
- docs/decisions/intake-workload-design.md
- docs/decisions/cost-sources-design.md
- docs/design/development/README.md
- docs/design/development/register.json
- docs/design/development/components.json
- Relevant pages/*.md, components/*.md and systems/*.md under docs/design/development/
- In particular, the application-shell, fields, buttons, drawer, dialog, estimation-journey and estimate-review component guidance
- src/app/globals.css and relevant shared controls under src/components/ui/

Follow the exact reference files linked by those records where relevant. If a source is unavailable, identify it honestly and continue with available evidence unless its absence prevents a coherent design. Do not invent source contents, requirement IDs, adopted policies or review approvals.

Use this source hierarchy: current user instructions and repository decisions; current scope and accepted design records (including ADR-0053 and its successors); the revised CCE report as a proposed module specification; historical references as supporting evidence. Record material conflicts and the design choice made.

Preserve existing parent requirement IDs and page scope boundaries. ES-04 owns estimate review, ES-05 owns quotation review/approval/issue/distribution, ES-06 owns customer response, and ES-07 owns item resolution/conversion. ES-08 remains the defined Screen Systems configuration family: do not rename the entire generic CCE as ES-08. Map CCE screens to existing scopes where supported. Identify broader rule-authoring surfaces as proposed extensions without inventing new official scope IDs.

MYOB Acumatica remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring. CREMS is historical context, not a prerequisite or a visual blueprint to reproduce.

This task authorises Figma design and design handover. It does not require application code, repository changes, migrations, live integrations, deployment or business transactions. The Figma file is a proposed design artifact; creating it does not grant owner acceptance or establish an adopted baseline.

## 2. Create the Figma deliverable

Use the installed Figma skills and supported tools, including their required prerequisites. Use the existing private “PPO - Design” file adopted in ADR-0053, unless I explicitly request a different destination. Locate it through authorised Figma access; do not invent its identifier. Create clearly named CCE pages without changing unrelated accepted designs or another session’s active page. Ask only if the authorised destination cannot be resolved. Do not create a competing shared library or a new file by default.

Create native, editable frames, text, components and instances. Use Auto Layout, reusable variants and variables/styles where supported. Do not substitute flattened screen images, a FigJam board, HTML output or a written specification for the requested UI.

Organise the CCE work into clearly named pages within that file; preserve its existing pages:

1. Read me, source mapping and decisions
2. Foundations and reusable components
3. Rules registry and authoring
4. CPQ configuration and results
5. CPQ comparison, history and overrides
6. Responsive examples and exceptional states

Organise connected prototype flows around the relevant frames. Avoid duplicate screens that differ only because they appear in another flow.

## 3. Visual direction and reusable components

Extend the existing PPO design language. Inspect the actual tokens, typography, controls and shell before choosing colours, spacing or navigation. Reuse the shared application shell; staff screens occupy its workspace interior and must not introduce a second global masthead.

Aim for a calm, precise enterprise workspace with clear hierarchy, readable tables, useful density and restrained semantic colour. Give the primary task enough space. Prefer meaningful controls and data over decorative dashboards, gradients or generic metric cards.

For register row inspection, consider the accepted right-aligned, capped record-window pattern and its later changes before choosing a drawer. A persistent formula/explanation panel may be a CCE-specific proposal; annotate that departure explicitly. Keep accepted design intent separate from what the app currently implements.

Use realistic Australian English: labour, catalogue, organisation. Use AUD for synthetic financial examples. Display business names and readable rule codes first; expose technical identifiers and hashes only in appropriate diagnostic detail.

Reuse existing library components for implemented patterns. Draw new CCE-only patterns on the CCE proposal pages and label them proposed; they join the shared library only after implementation, under ADR-0053. Cover:

- Workspace headers, navigation, tabs and contextual actions
- Search/filter toolbars, data tables, empty states and pagination
- Typed condition rows, nested condition groups and action cards
- Formula input, fact tokens, unit labels and validation messages
- Status indicators for persistence, validation and publication
- BOM rows, provenance badges and generated/manual/effective quantities
- Right-side explanation panels, semantic comparison rows and history entries
- Override dialogs, inline errors, error summaries and recovery banners

For each new pattern, identify an existing component being reused or explain the proposed extension. Do not label a reference-only or pending-review component as accepted.

Use 1440 × 960 for primary desktop designs, with a deliberate 1024 × 768 adaptation. Design representative mobile flows at 390 × 844 and check narrow behaviour at 320 CSS pixels. Mobile must transform dense layouts into workable tabs, disclosure groups, cards or full-screen panels rather than shrink desktop tables.

## 4. Design the authoring and CPQ workflow

### A. Authoring data and rules registry

Provide the entry point for maintaining rule metadata, typed fact definitions, allowed values/units, condition templates, supported actions and versioned rule/release relationships. Reference existing product, cost and labour sources rather than creating duplicate catalogue/ERP masters. Show ownership, source identity and whether each datum is editable here or maintained elsewhere.

### A.1 Rules registry

Create a searchable, filterable registry showing rule name/code, business scope, owner, latest published version, working-draft state, validation state and activation context. Provide create, inspect, edit draft, compare and test entry points. Distinguish an edited draft from the version currently used by an active release.

### B. Visual rule authoring

Use a main conditions/actions workspace with an adjacent test or explanation panel. Include rule context, typed nested ALL/ANY groups and an explicit NOT group with one child. Provide keyboard-operable alternatives to dragging. Unconditional rules require an explicit choice; an empty condition group must not silently mean “always”.

Drive field controls and operators from a fact dictionary. Numeric facts allow numeric comparisons; text facts allow appropriate text operators; booleans and enumerations use constrained controls. Show units beside numeric values.

Demonstrate changing “Distance greater than 100 m” to a text fact: clear the incompatible operator and value together, retain focus sensibly, and explain what needs completion. Inputs such as an empty string, “-” or “1.” remain incomplete rather than becoming zero.

Show independent persistence, validation and publication states. A draft can be saved while incomplete, and a published version can coexist with an invalid working draft. Editing after a successful test invalidates that test’s applicability to publication. Design saving, saved, save outcome unknown, concurrent-edit conflict and recovery states.

### C. Actions and formula assistance

Provide distinct forms for material quantities, labour hours, pricing/margin proposals and milestones. Do not require a SKU on a milestone action. Keep operational milestones separate from billing allocations. Distinguish margin from markup.

Include an assisted formula editor with searchable fact insertion, readable tokens, unit guidance, a supported-functions reference, substituted values and validation feedback. Treat formulas as a restricted mathematical language; do not imply arbitrary JavaScript or unrestricted code execution.

Show missing facts, incompatible units, invalid syntax, division by zero and an expression that exceeds execution limits. Record advanced or unimplemented language capabilities as proposals in annotations; do not imply the reference evaluator supports everything.

### D. Test bench, comparison and publication

Allow authors to select a synthetic scenario, inspect input facts, run a test and compare expected versus actual output. Show passed, failed and unknown condition results, matched rules, conflicts, suppressed contributions and rounding.

Create a semantic publication comparison covering conditions, actions, priority, formula, units and rounding. Bind validation and simulation evidence to the exact draft being published. Changing that draft must visibly require revalidation.

Distinguish publishing an immutable rule version, composing/publishing a ruleset release and activating that release for a scope. Publishing must not imply automatic activation. Show role restrictions and missing review evidence without inventing an approved organisational governance policy.

### E. CPQ configuration workspace

Open CPQ from an existing estimate/scope context or a synthetic authoring test. Show the selected equipment/options and configuration-specific facts, quantities and constraints that this module owns. Reuse facts already captured by the estimating wizard and show their source; do not ask for the whole enquiry or rebuild wizard steps. If a source fact must change, link back to its owning existing page and preserve the CPQ draft.

Keep estimate/scope identity and saved source version visible. When CPQ inputs change, retain the last saved configuration result and mark it as out of date. Include calculation pending, incomplete facts and failed-preview states.

### F. CPQ results and handover

Create the CPQ result view for generated materials, labour and permitted commercial proposals. Show milestone outputs only as proposed handover data where the report supports them, not a new planning or billing workspace. Include item, purpose, quantity, unit, provenance and permitted cost/price information. Missing cost is unknown, never zero; blocked results cannot masquerade as final approved values.

Compare the current CPQ preview with its prior saved result: added, removed, quantity changed, price changed, override needs review and unresolved. Provide “Use configuration” or an equivalent exact-result handover to the existing estimate page. Make stale source/version conflicts clear and return through the established workflow. Do not create quotation preview, quotation issue, approval, customer-response or project-delivery screens.

Annotate the missing production adoption command as an integration gap; the report's reference tests do not implement it. The Figma flow may show the intended receiving state without claiming an existing API.

### G. “Why this line?” explanation

Provide a visible, keyboard-accessible action on generated lines. Open a persistent right-side panel on desktop and a full-screen panel on mobile; do not put essential explanations only in hover tooltips.

Show:

- Scope and business purpose
- Saved rule/version, action and release
- Relevant facts, their sources, and passed/failed/unknown conditions
- Formula, substituted values, exact result and rounding
- Winning and suppressed contributions, with the resolution policy
- Generated quantity, manual override and effective quantity
- Cost source where permitted, assumptions and missing information

Historical explanations must use the saved calculation basis rather than current rule text. Design a restricted-access variant that preserves useful quantity provenance without exposing unauthorised commercial data.

### H. Manual overrides

Design quantity replacement, suppression/deletion and restoration of generated lines, with attributable reasons. Show clearly whether an override replaces a value or applies a delta. Persist the user's intent visibly in the conceptual model: a suppressed line must not silently reappear on reload.

Include a subsequent-input-change state showing the new generated proposal alongside the retained override and any required review. Provide explicit restore-to-generated behaviour and a clear orphaned-override state when the original generated target no longer exists. Do not imply that the Figma prototype implements database persistence.

### I. Collisions and history

Show additive and highest-priority resolution, and an unresolved equal-priority collision that blocks adoption. Explain the result in business language; priority is not a universal substitute for an explicit resolution policy.

Within CPQ, inspect saved configuration evaluations, their immutable explanations and an explicit comparison against a newer ruleset release. Link to the existing historical estimate page for the full estimate. Viewing either record must not silently refresh prices or rules. Hand a proposed successor configuration to the established estimate revision/review workflow.

### J. Handover boundaries

Include a concise CPQ handover summary for BOM, labour, commercial proposals and any supported milestone proposals. This is interface documentation and a result summary, not new ERP/project management screens. Keep Prepared, Sent, Received, Accepted and Converted distinct where relevant. Show destination mappings and missing mappings without inventing MYOB endpoints or claiming successful delivery.

Xero and QuickBooks may appear only as illustrative alternative adapters if useful; they must not displace MYOB as the intended authority. Do not broaden this task into a full accounting or project-management UI.

## 5. Use these coherent synthetic scenarios

Use one fictional project consistently across the principal flows. Mark the fixture and proposed policies in the file’s documentation and annotations, without cluttering every product screen with implementation disclaimers.

1. Material formula: distance 140 m, one bracket pair per 10 m, plus five spare brackets. `((140 / 10) * 2) + 5 = 33` brackets. Show the exact result and explicit whole-item rounding policy.
2. Illustrative commercial calculation: 33 brackets at AUD 2.40 unit cost gives AUD 79.20 cost. A proposed 20% gross margin gives AUD 99.00 selling value, excluding tax. Label this as an illustrative policy, not an adopted operating rule.
3. Override: replace 33 with 40 brackets and record a reason. Show generated 33, effective 40. At the same illustrative price policy, cost becomes AUD 96.00 and selling value AUD 120.00.
4. Changed basis: distance becomes 150 m, giving a generated quantity of 35. Keep the existing override visible and show its review state rather than silently replacing the salesperson’s choice.
5. Collision: Rule A proposes five cables at priority 100; Rule B proposes ten at priority 200. Under SUM, show 15; under HIGHEST_PRIORITY, show ten. Show a separate equal-priority conflict.
6. Labour: four equipment units × 4.5 person-hours = 18 person-hours. Do not present person-hours as elapsed project duration.
7. Missing input/cost: show an unknown quantity basis or cost, blocked finalisation, and the exact correction needed.
8. Historical version: show a saved estimate retaining its original rule release while a newer release is available for explicit comparison.

## 6. Connect the prototype

Create clearly labelled entry points for four complete journeys:

1. Author a typed rule → encounter and correct a validation error → test → compare → publish a version → review release activation.
2. Enter CPQ from an existing scope → configure equipment/options and module-owned facts → generate a preview → inspect the BOM and “Why this line?” → hand the exact configuration back to the existing estimate page.
3. Override or suppress a line → inspect the simulated reloaded state → change an input → review the retained override → restore generated behaviour.
4. Open a saved CPQ evaluation → compare with a newer ruleset release → encounter a missing-cost or collision blocker → resolve the illustrated issue → review the proposed successor configuration and its existing-estimate handover.

Wire navigation, tabs, panels, dialogs, cancel/back and recovery paths where supported. Where tool capabilities cannot express dynamic validation or conditions, use linked state frames and annotate the simulation. Report unsupported prototype interactions honestly instead of claiming they work.

## 7. Accessibility, verification and handover

Target WCAG 2.2 AA in the design, without claiming conformance certification from Figma. Include visible focus, labels, inline errors plus an error summary, non-colour status cues, accessible names and logical focus/reading-order annotations. Design mobile controls with 44 px touch targets where practical. Measure text contrast where possible; distinguish measured results from intentions. Specify close, Escape, focus return and error-focus behaviour for panels and dialogs.

Inspect rendered frames and read back the created Figma structure. Check clipping, overflowing tables, long names, empty data, loading, unknown outcomes, read-only access, stale inputs, conflicts and narrow layouts. Verify every prototype journey and entry point that the tools allow. Fix issues found before handing over. Do not describe static visual inspection as browser, screen-reader, database or business-rule testing.

Provide a private source-to-screen handover table with screen/frame links, existing scope or proposed extension, r20 page type, reused components, incoming/outgoing handovers and relevant report requirements. Preserve actual IDs; do not invent traceability.

Keep an explicit decision and limitation register covering missing sources, proposed policies, unresolved business choices, departures from existing patterns and interactions that remain untested. Keep technical implementation details in annotations and handover material unless they help the end user make a decision.

Keep private Figma URLs and licensed Font Awesome Pro artwork out of public repository material. Public handover records may cite file name, node IDs and named version; export captures only from copies with icons replaced by plain placeholders. Preserve the private originals. Record owner review separately; do not label your own completion as owner acceptance.

Finish in the private task conversation with:

- The actual Figma file URL and prototype entry links where available
- A concise inventory of screens, reusable components and responsive states created
- What was inspected or tested, with evidence where available
- Remaining decisions, limitations and suggested owner-review priorities

Do not declare the module production-ready or 100% validated. Deliver a coherent, polished and reviewable design that an engineering team can implement against the report and PPO’s existing product boundaries.
