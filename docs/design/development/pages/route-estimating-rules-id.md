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

Reuse SecondaryMenuFrame, Button/ButtonLink, RegisterTable for registers, the existing session and receipt recovery. CPQ host controls supply typed fields, condition groups, tabs, explanations and native dialogs. Required states: loading, empty, read-only, incomplete draft, live preview, Ready/Blocked, pricing Requires approval, saved historical evaluation, changed source, retained stale adjustment, conflict, network-uncertain outcome and revoked access. Loading or error must not substitute a previous company’s data.

Incoming: selected complete discovery, active company release, explicit synthetic price sources. Outgoing: exact saved run and native estimate version, with milestone proposals remaining unresolved. ES-04/ES-05 retain review and quotation approval. No order, customer communication or real schedule is created.

## Departures and proof

The existing application shell retains its saved navigation preference. Fixture record labels, owner names, counts and amounts derive from saved data rather than copied design literals. Unit sell prices retain native cent rounding before extension, so Figma examples with sub-cent unit prices may differ by cents. Price books/FX are frozen authored evidence; there is no live MYOB lookup. Shared costs use explicit part scope. All accepted synthetic policies remain distinguishable from operational approval.

Fixture/state definitions: `docs/design/development/cpq-fixtures.json`; browser host: `tests/browser/cpq.spec.ts`. Functional and viewport evidence belongs in [handover](../../../delivery/cpq-ui-handover.md). Review fingerprints remain unset until a complete recorded paired review; no source presence or passing test implies deployment or owner acceptance.

Formula editing uses the dedicated frame-05 dialog with searchable insertions and a server-backed scenario test. It supports bounded min/max and explicit rounding places as well as ceil/floor. Closing without Apply preserves the prior draft; applying still requires the complete test bench before a version.
