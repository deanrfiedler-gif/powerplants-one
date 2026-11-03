# EC-04 shared component consumer bindings

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: pending, separate from the accepted source design.

## application-shell

Customer messages binds the existing application-shell implementation in the queue, snapshot, record and classes view. Fixtures cover Prepared M1/M2, Held/Failed dimmed content, OutcomeUnknown reconciliation, send-duty denial, stale/failed reads, exact-operation recovery and reasoned switches. Desktop retains register columns and two-column detail; phone stacks sections and uses sheets with 48 px primary actions. No new shared rule or accepted fingerprint is asserted. See [page contract](../pages/scope-ec-04.md) and [execution evidence](../../../testing/evidence/customer-messages/README.md).

## buttons

Customer messages binds the existing buttons implementation in the queue, snapshot, record and classes view. Fixtures cover Prepared M1/M2, Held/Failed dimmed content, OutcomeUnknown reconciliation, send-duty denial, stale/failed reads, exact-operation recovery and reasoned switches. Desktop retains register columns and two-column detail; phone stacks sections and uses sheets with 48 px primary actions. No new shared rule or accepted fingerprint is asserted. See [page contract](../pages/scope-ec-04.md) and [execution evidence](../../../testing/evidence/customer-messages/README.md).

Refresh message remains a native Button in the phone record toolbar, while its navigation links are hidden. EC04-B05 exercises refresh after send-duty denial and requires obsolete content to clear on a failed read. The existing disabled rule protects busy, uncertain and loading states; no shared Button rule changes.

## register-table

Customer messages binds the existing register-table implementation in the queue, snapshot, record and classes view. Fixtures cover Prepared M1/M2, Held/Failed dimmed content, OutcomeUnknown reconciliation, send-duty denial, stale/failed reads, exact-operation recovery and reasoned switches. Desktop retains register columns and two-column detail; phone stacks sections and uses sheets with 48 px primary actions. No new shared rule or accepted fingerprint is asserted. See [page contract](../pages/scope-ec-04.md) and [execution evidence](../../../testing/evidence/customer-messages/README.md).

## dialog

Customer messages binds the existing dialog implementation in the queue, snapshot, record and classes view. Fixtures cover Prepared M1/M2, Held/Failed dimmed content, OutcomeUnknown reconciliation, send-duty denial, stale/failed reads, exact-operation recovery and reasoned switches. Desktop retains register columns and two-column detail; phone stacks sections and uses sheets with 48 px primary actions. No new shared rule or accepted fingerprint is asserted. See [page contract](../pages/scope-ec-04.md) and [execution evidence](../../../testing/evidence/customer-messages/README.md).

## read-state

Customer messages binds the existing read-state implementation in the queue, snapshot, record and classes view. Fixtures cover Prepared M1/M2, Held/Failed dimmed content, OutcomeUnknown reconciliation, send-duty denial, stale/failed reads, exact-operation recovery and reasoned switches. Desktop retains register columns and two-column detail; phone stacks sections and uses sheets with 48 px primary actions. No new shared rule or accepted fingerprint is asserted. See [page contract](../pages/scope-ec-04.md) and [execution evidence](../../../testing/evidence/customer-messages/README.md).
