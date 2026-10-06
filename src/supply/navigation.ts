import type { FactKind, RecordKind } from "./model";
export type SupplyPage = {
  scope: string;
  slug: string;
  title: string;
  kind: RecordKind;
  intro: string;
  actions: FactKind[];
  rail: string;
};
export const supplyPages: SupplyPage[] = [
  {
    scope: "SC-01",
    slug: "material-readiness",
    title: "Material demand & readiness",
    kind: "Demand",
    intro: "Review the exact material scope, usable supply and owned blockers.",
    actions: ["Assessment", "Promise", "Impact"],
    rail: "supply",
  },
  {
    scope: "SC-02",
    slug: "purchasing",
    title: "Purchasing & supplier commitments",
    kind: "Demand",
    intro:
      "Keep authorised demand, purchasing requests and observed supplier outcomes distinct.",
    actions: ["Purchase", "Promise", "ExternalOutcome"],
    rail: "purchasing",
  },
  {
    scope: "SC-03",
    slug: "shipments",
    title: "Inbound shipments",
    kind: "Supply",
    intro:
      "Coordinate shipment lines, split allocations and dated ETA evidence.",
    actions: ["ExternalOutcome"],
    rail: "inbound",
  },
  {
    scope: "SC-04",
    slug: "receipts",
    title: "Receiving & inspection",
    kind: "Supply",
    intro:
      "Capture physical receipt and inspection. Arrival and quarantine do not establish usable stock.",
    actions: ["Receipt", "ExternalOutcome"],
    rail: "receiving",
  },
  {
    scope: "SC-05",
    slug: "stock",
    title: "Stock & reservations",
    kind: "Supply",
    intro:
      "Dated source observations, explicit units and completeness. Live reservations are not configured.",
    actions: ["ExternalOutcome"],
    rail: "stock",
  },
  {
    scope: "SC-06",
    slug: "dispatch",
    title: "Picking & dispatch",
    kind: "Demand",
    intro:
      "Pick, stage, prepare and record movement against evidenced usable allocation.",
    actions: [
      "Reservation",
      "Pick",
      "Stage",
      "Substitution",
      "Dispatch",
      "ExternalOutcome",
    ],
    rail: "deliveries",
  },
  {
    scope: "SC-07",
    slug: "deliveries",
    title: "Customer deliveries",
    kind: "Demand",
    intro:
      "Record physical delivery, exceptions and separate customer acknowledgement.",
    actions: ["Delivery", "Acknowledgement", "ExternalOutcome"],
    rail: "deliveries",
  },
  {
    scope: "SC-08",
    slug: "returns",
    title: "Returns & claims",
    kind: "Return",
    intro:
      "Follow the goods, customer remedy, supplier recovery and credits separately.",
    actions: [
      "ReturnAuthorisation",
      "ReturnReceipt",
      "Disposition",
      "CustomerOutcome",
      "Claim",
      "SupplierMovement",
      "Credit",
      "ExternalOutcome",
    ],
    rail: "returns",
  },
  {
    scope: "SC-09",
    slug: "changes",
    title: "Material change-impact review",
    kind: "Demand",
    intro:
      "Review before and after evidence through the owning module. Bookings and issued packs remain unchanged.",
    actions: ["Impact"],
    rail: "supply",
  },
  {
    scope: "SC-10",
    slug: "service-stock",
    title: "Service stock custody",
    kind: "Custody",
    intro:
      "Reconcile warehouse → technician / van → job → outcome against exact Field evidence.",
    actions: ["Custody", "ExternalOutcome"],
    rail: "stock",
  },
];
export const returnViews = [
  { id: "register", label: "Returns register", kinds: [] },
  {
    id: "authorisation",
    label: "Return authorisation",
    kinds: ["ReturnAuthorisation"],
  },
  { id: "inspection", label: "Receipt & inspection", kinds: ["ReturnReceipt"] },
  {
    id: "disposition",
    label: "Disposition & customer outcome",
    kinds: ["Disposition", "CustomerOutcome"],
  },
  {
    id: "claims",
    label: "Supplier claims",
    kinds: ["Claim", "SupplierMovement"],
  },
  {
    id: "credits",
    label: "Credits & reconciliation",
    kinds: ["Credit", "ExternalOutcome"],
  },
] as const;
