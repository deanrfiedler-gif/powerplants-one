# Product catalogue patterns

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Catalogue key: `product-patterns`. Review: **Pending owner acceptance**.

## Source and consumers

Runnable exports `TechnicalContent`, `ProductContext` and `Comparison` in `src/products/components/shared.tsx` serve PD-01–PD-05. Exact consumer/dependency bindings live in `../components.json`. The isolated `products` fixture renders real TechnicalContent with default mixed evidence, empty attributes/documents and retired lifecycle states; it has no business services or implicit grants.

Retained references: [theme r22 Products](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#products), [Products r04](../../../reference/ui/products/PPO-Products-Preview-r04.html). The native composition uses current shell tokens and shared controls. No issued source is rewritten.

## Desktop

Desktop context separates catalogue revision, explicit technical revision and source as-at date. Attributes use labelled cards with units, evidence state and clarification owner; controlled documents expose type, revision and applicability. Comparisons show exact Before/After content.

## Mobile

At 390/320 px cards and comparisons stack; long identifiers and evidence wrap, inputs remain 16 px and actions keep touch targets. Effective 200% reflow uses 720 CSS px from 1440 px.

## Keyboard and states

Native heading levels, lists, facts and labelled controls retain reading order. Shared Button/Field/SelectField and visible focus cover keyboard use; no drag or component modal is introduced. Empty information remains unknown; retired does not rewrite references. Reviewed attributes do not imply installation suitability. Commercial values are absent from the technical fixture and technical API projection.

## Boundaries, verification and maintenance

The fixture proves presentation only. The owning routes use shared read-error, validation, unsaved-change and recoverable-command mechanisms. Database, HTTP, browser and actual restart evidence lives in [Products evidence](../../../testing/evidence/products-native/README.md); visual inspection and owner/device acceptance remain separate. Keep exact reference bytes, fixture states, consumer bindings and alignment gap visible. No current dependency fingerprint is recorded as accepted.

## Completion refinement

ProductContext retains catalogue, technical and source basis prominently and moves internal UUIDs into a labelled native disclosure. Open disclosures leave space below the keyboard focus outline so it does not touch the revealed text. The selected historical revision remains exact when opening pricing. The real fixture states and Products desktop/phone journeys exercise these exports; review observations are recorded in the completion evidence, with owner acceptance separate.

Products recovery accepts the bounded product-plus-revision pricing target. A committed source binding whose response is lost restores its original receipt and opens that same revision; additional or external return-target queries remain refused.
