# Customer 360 summary tile

Owner: Dean Fiedler. Stable component: `customer-360-summary`. **Reference only; proposed.**
Consumer: `scope:CS-01`. Figma local component `555:161360`; no runtime implementation or adoption is asserted.

## Figma components

**Status:** Proposal only · **Location:** Customer 360 (proposal) 554:2, in the private "PPO - Design" Figma file

- CS-01 / Summary tile (proposal) `555:161360`

Stays on the proposal page until Customer 360 is accepted. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Four 228 × 112 px cells per row inside a 912 px white summary panel, within the 960 px customer workspace and full 1440 × 900 PPO shell. Two rows show the eight CS-01 summaries. Cell dividers replace the earlier separate-card gaps. The panel uses the shared 7 px card radius; each cell has 12 px padding.

Each cell exposes Label, Value and Scope text properties, Roboto type, PPO surface/border variables and a source-register destination. Value and label share an auto-layout row. The label is 14 px, numeric value 24 px and scope 12 px. Restricted uses 14 px text with no amount or count. Counts always carry population and source limitations. The stable Figma component ID is retained; this is the 14 October visual refinement, not runtime adoption.

The current prototype navigates to the full owning register. Runtime adoption must apply the exact counted scope and visibly represent active filters; the Figma navigation alone does not prove that behaviour.

## Mobile

Use compact full-width rows in the 390 × 844 phone shell, with 16 px side padding, leading icon, value/label, scope and trailing chevron. These rows are page-local compositions using shared PPO type and icons; they are not instances of the desktop Summary tile. Phone Overview links its order summary to Phone Sales orders. Both pages use the shared phone header/bottom navigation and open the customer-view drawer. Other phone destinations remain visual specifications.

## Fixtures and states

`../customer-360-summary-fixtures.json` retains the source date, population and evidence meaning for normal open orders, unknown conversion and restricted Finance. Fixtures are synthetic design examples, not runtime seeds. The issued model remains `docs/design/customer-360/model.js`.

Restricted Finance displays the word Restricted and no financial amount, count or balance. An accepted quotation whose conversion is unknown is never counted as an ERP order. Unknown supply is never rendered as zero.

## Adoption and verification

Reuse the current Button/Tag and PPO text/colour foundations. Native implementation must provide keyboard activation, focus visibility, a descriptive accessible name including scope, exact filtering and permission enforcement. No keyboard, screen-reader or device proof is claimed by a Figma frame.

Owner review, a named saved Figma version, paired native rendering and runtime scope/permission tests remain open. Preserve existing review fingerprints and the distinction between source presence, agent visual inspection, functional proof and deployment.
