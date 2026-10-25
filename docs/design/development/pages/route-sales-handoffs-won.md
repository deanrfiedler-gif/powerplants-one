# Won-deal receiving handover worklist — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/sales/handoffs/won`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-03. Route: `/sales/handoffs/won`.

## Native Sales implementation contract

Prepare and receive a precise delivery handover while preserving the immutable Won handover-due obligation.

- Won worklist: source deal and current receiving state.
- Brief: selected delivery items, exact evidence, destination basis and release prerequisites.
- Review: source fingerprint and independent return/accept decision.
- History: immutable Won obligation, submitted revisions and successor evidence.

Start with a Won opportunity. Preparation requires current deal ownership and edit access. A designated Projects or Service receiver needs its existing command capability and source visibility. Parts receiving has no implemented contract.

Customer acceptance, CRM Won, conversion, receiving, work release, scheduling, delivery and Finance are separate. Exact quotation issue, response/preparation and native conversion are implemented; preserve their separate contracts and links under [lead-to-delivery continuity](../../../contracts/lead-to-delivery-continuity.md). No routing thresholds are inferred.

Receiving creates no Project, Service work order, sales order, stock movement, booking or ERP/Finance transaction.

## Desktop

 retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

## Mobile

 stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-sales-handoffs-won` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ADR-0046 records the earlier implementation checkpoint; current quotation and LC-16 continuity contracts govern their implemented flows. Receiving still implies no automatic downstream creation or release. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

## R10 receiving navigation and command boundary

Follow the [CR-03 workflow reconciliation](../../../decisions/r10-workflow-reconciliation.md#cr-03--one-receiving-workflow-with-explicit-accountability): one canonical record with permission-aware Projects/Service/My Work entry; named eligible receiver and destination ownership; separate native creation and reviewed linking with original recovery. Parts is unsupported. These are working requirements, not a claim that new entry points or the R10 visual baseline are accepted. Preserve the existing LC-16 implementation and review fingerprints.
