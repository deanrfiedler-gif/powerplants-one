# Customer 360 summary tile

Owner: Dean Fiedler. Stable component: `customer-360-summary`. **Reference only; proposed.**
Consumer: `scope:CS-01`. Figma local component `555:161360`; no runtime implementation or adoption is asserted.

## Desktop

Four 332 px cards per row inside the 1376 px workspace, with 16 px gaps. Each card exposes Label, Value and Scope text properties, Roboto type, PPO surface/border/radius variables and a source-register destination. The label is 14 px, the value 24 px and the scope 12 px. Counts always carry population and source limitations. Two rows show the eight CS-01 summaries.

The current prototype navigates to the full owning register. Runtime adoption must apply the exact counted scope and visibly represent active filters; the Figma navigation alone does not prove that behaviour.

## Mobile

Stack cards in a 358 px content region at a 390 px viewport. Text wraps with no clipped scope. Phone Overview links its order summary to Phone Sales orders. Other sections are visual specifications, not a completed mobile prototype.

## Fixtures and states

`../customer-360-summary-fixtures.json` retains the source date, population and evidence meaning for normal open orders, unknown conversion and restricted Finance. Fixtures are synthetic design examples, not runtime seeds. The issued model remains `docs/design/customer-360/model.js`.

Restricted Finance displays the word Restricted and no financial amount, count or balance. An accepted quotation whose conversion is unknown is never counted as an ERP order. Unknown supply is never rendered as zero.

## Adoption and verification

Reuse the current Button/Tag and PPO text/colour foundations. Native implementation must provide keyboard activation, focus visibility, a descriptive accessible name including scope, exact filtering and permission enforcement. No keyboard, screen-reader or device proof is claimed by a Figma frame.

Owner review, a named saved Figma version, paired native rendering and runtime scope/permission tests remain open. Preserve existing review fingerprints and the distinction between source presence, agent visual inspection, functional proof and deployment.

