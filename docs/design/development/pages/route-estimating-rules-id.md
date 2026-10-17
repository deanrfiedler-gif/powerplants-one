# Rule and release authoring — CPQ design contract

<!-- versioning: git; committed history is authoritative -->

Stable key: `route:/estimating/rules/[id]`. Scopes ES-02/ES-03; parent requirements EST-02–EST-09 preserved. Owner: Dean Fiedler. Visual acceptance pending. r20 page type: Work queue + persistent detail; supporting Form / guided workflow and Review / comparison.

## Purpose and reference

Author typed conditions, safe formulas, parameters, parts, options, structures, decision tables, capacities and milestone proposals, with immutable rule and release versions.

Private Figma supplied 13 October 2026; pages 464:2–464:7, exact frames 486:641, 488:1029, 489:1398, 490:1678, 491:2594, 492:2572, 492:2722, 493:3027, 493:3444, 496:3355, 497:3789, 508:1123. The implementation session inspected design context and rendered frames. Dean confirmed the named Figma version “CPQ — Configure & price and Rules studio, accepted” on 13 October. The [44 retained icon-free reference images](../../../reference/ui/estimating/cpq-figma-design-r01/README.md) and [accepted design decision](../../../decisions/cpq-figma-design.md) are now linked into the page register. Preserve these reference bytes; application screenshots are separate implementation evidence. See [implementation decision](../../../decisions/cpq-figma-ui.md).

## Desktop

At 1440 × 960 retain the existing 64 px shell header and 240 px rail. CPQ outline is 240 px; rule definition starts with it collapsed. Header, readiness and view tabs precede the scroll region. Configure has a 380 px summary; rule authoring has a 380 px quick test. Why uses a 400 px drawer. White cards, #e1e5eb borders, #f6f7f9 background, Roboto 14/20 body and 20/26 page title. Option cards use #e9f1fa with a #365d8b selected border. Reuse scoped shared buttons and product icons.

## Mobile

At 390 × 844 and 320 px, replace the outline with the native selector/menu overlay, stack fields and line cards, and keep Save/Use actions reachable in the footer. Summary and Why fill the screen; confirmation becomes a bottom sheet. No horizontal page overflow. Inputs/targets use at least 44 px. Tab navigation, condition reordering buttons, modal Escape and focus return remain usable. Browser emulation does not establish device or screen-reader acceptance.

## States, reusable components and handovers

Opening an older active version from the register retains its exact immutable definition and disables authoring. Return to working draft explicitly restores the current draft; publication and company activation remain separate states.

Reuse SecondaryMenuFrame, Button/ButtonLink, RegisterTable for registers, the existing session and receipt recovery. CPQ host controls supply typed fields, condition groups, tabs, explanations and native dialogs. Required states: loading, empty, read-only, incomplete draft, live preview, Ready/Blocked, pricing Requires approval, saved historical evaluation, changed source, retained stale adjustment, conflict, network-uncertain outcome and revoked access. Loading or error must not substitute a previous company’s data.

Incoming: selected complete discovery, active company release, explicit synthetic price sources. Outgoing: exact saved run and native estimate version, with milestone proposals remaining unresolved. ES-04/ES-05 retain review and quotation approval. No order, customer communication or real schedule is created.

## Departures and proof

Breadcrumb ([shell top bar amendment](../../../decisions/shell-top-bar-amendment.md), table `1040:62` row "CPQ · Rule editor"): on desktop the header reads "Rules studio / <rule key>", such as "Rules studio / INST-SUP-001", the owner linking to the register and the key marked as the current page (R2, R4); the tab title is "<rule key> · <rule description> · Rules studio · Estimating & quotation". The editor publishes the key only while All rules shows a rule that the loaded, authorised release (or the inspected revision) holds. A key being typed, a rule added in a draft, a new rule set and the other views (Fact dictionary, Releases and the rest) publish nothing and show "Rules studio" alone, as do loading, errors and denial; no ID is taken from the URL. Not built: the Release row's "Releases / Screen systems R6" (R3), because the Releases view is a view of this page, not its own route. Phone keeps the page name only (R7).

The existing application shell retains its saved navigation preference. Fixture record labels, owner names, counts and amounts derive from saved data rather than copied design literals. Unit sell prices retain native cent rounding before extension, so Figma examples with sub-cent unit prices may differ by cents. Price books/FX are frozen authored evidence; there is no live MYOB lookup. Shared costs use explicit part scope. All accepted synthetic policies remain distinguishable from operational approval.

Fixture/state definitions: `docs/design/development/cpq-fixtures.json`; browser host: `tests/browser/cpq.spec.ts`. Functional and viewport evidence belongs in [handover](../../../delivery/cpq-ui-handover.md). Review fingerprints remain unset until a complete recorded paired review; no source presence or passing test implies deployment or owner acceptance.

Below “Applies when” the Definition view follows frames 486:641 and 488:1029 ([alignment decision](../../../decisions/cpq-rule-editor-design-alignment.md)): the joined applies-mode control, the rule-and-segment condition groups, inline row actions, the keyboard note, the incomplete summary, and the Actions card with its token formula, read-only product/unit/rounding and resolution group. Explicit departures: Add action is unavailable because a release rule holds one action; Installed unit and Rounding are read only because the part fixes the unit and rounding exists only in the formula; the formula is edited only in its dialog; the Release parameters editor is retained.

Above “Applies when”, the Quick test and the draft bar follow the same frames (the follow-up in the same decision). CPQ / Context header has a 40 px title row with the “More rule actions” (⋯) menu, and the meta line reads rule key · ruleset · you (you) · save state with its dot. The rule picker and “+ Rule” moved into that menu as “Switch rule…” (a dialog) and “Add a rule”, and “Release and publication” replaces the Release button. The rule state strip shows Draft, Validation, Tests and Published as separate CPQ / State items (icon and text). View tabs carry Record / View tab counts as descriptions: Test bench, Where used and History. Rule details gain the description line. Quick test is 380 px beside the definition at desktop width and moves into the Test bench below 1100 px (frame 39). It shows a draft-version chip, a Scenario control with its note, Inputs with units, and a Draft result card with the rule’s quantity, substitution, published or saved comparison and per-condition True / False / Unknown lines, then Run all and the not-evidence note. It runs the selected scenario on the exact draft through the read-only validator after a 0.5 s pause and never changes the Tests state. The 65 px draft bar shows the save state with dot and revision and a state-specific reason. Save draft is primary only with unsaved changes. Create version is unavailable, with its reason as description, until every scenario passes. Explicit departures: version names come from saved rule and release versions, and Release author / Independent review replace Owner / Reviewer because the model holds neither. Scenarios are release-wide, and the open menu’s contents are a PPO decision. Phone Conditions / Actions / Test tabs and the drawn side-menu filters are not built.

Formula editing uses the dedicated frame-05 dialog with searchable insertions and a server-backed scenario test. It supports bounded min/max and explicit rounding places as well as ceil/floor. Closing without Apply preserves the prior draft; applying still requires the complete test bench before a version.
