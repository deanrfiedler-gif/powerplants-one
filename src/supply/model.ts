/** Closed synthetic coordination contracts. Quantities are exact decimal strings, never stock balances. */
export const kinds = ["Demand", "Supply", "Return", "Custody"] as const;
export type RecordKind = (typeof kinds)[number];
export const completeness = ["Complete", "Partial", "Unavailable"] as const;
export type Completeness = (typeof completeness)[number];
export type FieldSpec = {
  key: string;
  label: string;
  type?: "quantity" | "date" | "instant" | "id";
  required?: boolean;
  choices?: readonly string[];
  help?: string;
};
const f = (
  key: string,
  label: string,
  type?: FieldSpec["type"],
  required = false,
): FieldSpec => ({ key, label, type, required });
const e = (
  key: string,
  label: string,
  choices: readonly string[],
  required = true,
): FieldSpec => ({ key, label, choices, required });
export const recordFields: Record<RecordKind, FieldSpec[]> = {
  Demand: [
    e("demand_class", "Demand class", ["Forecast", "Approved"]),
    e("origin_kind", "Demand origin", [
      "Project",
      "WorkOrder",
      "OtherApproved",
    ]),
    f("origin_id", "Project or work order", "id"),
    f("origin_reference", "Other approved origin reference"),
    f("authority", "Approved demand authority and evidence"),
    f("required_on", "Required by (local date)", "date"),
    f("timezone", "Required-by timezone", undefined, true),
    f("date_needed_reason", "Reason required date is unknown"),
    f("source_revision", "Origin scope revision", undefined, true),
    f("customer_id", "Customer", "id"),
    f("facility_id", "Facility / growing area", "id"),
    f("asset_id", "Equipment", "id"),
    f("appointment_id", "Appointment / visit", "id"),
    f("engineering_id", "Engineering package", "id"),
    f("quote_reference", "Accepted quotation reference"),
    f("handover_reference", "Sales-to-delivery handover reference"),
    f("technical_release", "Technical release evidence / unresolved"),
    f("material_release", "Material release evidence / unresolved"),
    f("customer_commitment", "Evidenced customer commitment"),
  ],
  Supply: [
    e("supply_kind", "Supply basis", ["Shipment", "Stock"]),
    f("shipment_id", "Shipment identity (shared by its lines)", "id"),
    f("line_reference", "Shipment / stock line reference", undefined, true),
    f("supplier", "Supplier and source company context", undefined, true),
    f("purchase_reference", "Purchase order and line observation"),
    f("warehouse", "Warehouse", undefined, true),
    f("bin", "Bin / unresolved"),
    f("on_hand", "Source on hand", "quantity"),
    f("available", "Source-reported available", "quantity"),
    f("reserved", "Source-reported reserved", "quantity"),
    f("held", "Source held / quarantined", "quantity"),
    f("usable", "Evidenced usable", "quantity"),
    f(
      "availability_basis",
      "Availability and usable evidence basis",
      undefined,
      true,
    ),
    f("eta", "ETA (local date)", "date"),
    e("eta_basis", "ETA evidence", [
      "Estimated",
      "SupplierConfirmed",
      "Unknown",
    ]),
    f("eta_confidence", "Confidence basis, only if provided by source"),
    f("dispatch_evidence", "Supplier dispatch evidence"),
    f("manufacturing", "Manufacturing milestone evidence"),
    f("customs", "Customs / broker / import references"),
    f("freight_documents", "Freight / document evidence"),
    f("serial", "Serial identity"),
    f("batch", "Batch identity"),
  ],
  Return: [
    e("direction", "Return direction", ["Customer", "Supplier"]),
    f("demand_id", "Original demand line", "id", true),
    f(
      "identity_evidence",
      "Returned-item identity evidence / unresolved",
      undefined,
      true,
    ),
    e("identity_status", "Returned-item identity", ["Verified", "Unresolved"]),
    f("reported_symptom", "Reported symptom", undefined, true),
    f("warranty_reference", "MA-06 / MA-07 decision or claim reference"),
    f(
      "source_reference",
      "Original delivery / receipt reference",
      undefined,
      true,
    ),
  ],
  Custody: [
    f("demand_id", "Service demand line", "id", true),
    f("technician_id", "Custodian", "id", true),
    f("van", "Van / custody location", undefined, true),
    f("warehouse", "Issuing warehouse", undefined, true),
    f("appointment_id", "Work order appointment / visit", "id", true),
    f("serial", "Serial identity"),
    f("batch", "Batch identity"),
    f(
      "issue_reference",
      "Authoritative issue / transfer observation",
      undefined,
      true,
    ),
  ],
};

export const factSpecs = {
  Purchase: {
    kinds: ["Demand"],
    title: "Purchasing coordination",
    fields: [
      e("request_state", "Requisition state", [
        "Draft",
        "Requested",
        "Approved",
        "Returned",
      ]),
      f("requisition", "Requisition reference", undefined, true),
      f("approval_evidence", "Approval authority and evidence"),
      f("rfq", "RFQ / supplier quotations and comparison basis"),
      f("supplier", "Supplier", undefined, true),
      f("purchase_reference", "ERP purchase reference observation"),
      f("purchase_outcome", "Observed purchase outcome / unknown"),
      f("milestones", "Manufacturing milestones"),
      f("submittals", "Technical submittal obligations"),
      f("exception", "Procurement exception"),
    ],
  },
  Promise: {
    kinds: ["Demand"],
    title: "Supplier commitment",
    fields: [
      f("quantity", "Promised quantity", "quantity", true),
      f("promised_on", "Promised date", "date", true),
      e("basis", "Promise basis", ["Estimated", "SupplierConfirmed"]),
      f("supplier", "Supplier", undefined, true),
      f("confirmation_actor", "Confirmation actor / source", undefined, true),
    ],
  },
  Receipt: {
    kinds: ["Supply"],
    title: "Receipt and inspection",
    fields: [
      f("arrival_at", "Carrier arrival", "instant"),
      f("received", "Physically received", "quantity", true),
      f("inspected", "Inspected", "quantity", true),
      f("damaged", "Damaged (included in quarantine)", "quantity", true),
      f("quarantined", "Quarantined", "quantity", true),
      f("usable", "Evidenced usable", "quantity", true),
      f("short", "Short on this receipt", "quantity", true),
      f("erp_receipt", "ERP receipt observation"),
      f("inspection", "Inspection finding", undefined, true),
      f("disposition", "Disposition / unresolved", undefined, true),
      f("serial", "Serial evidence"),
      f("batch", "Batch evidence"),
      f("identity", "Item identity evidence / unresolved", undefined, true),
      e("identity_status", "Receipt item identity", ["Verified", "Unresolved"]),
    ],
  },
  Reservation: {
    kinds: ["Demand"],
    title: "Reservation observation",
    fields: [
      e("state", "Observed reservation state", [
        "Proposed",
        "Pending",
        "Confirmed",
        "Failed",
        "Unknown",
      ]),
      f("quantity", "Quantity", "quantity", true),
      f(
        "source_operation",
        "Original source operation / reference",
        undefined,
        true,
      ),
      f("source_reference", "Source reservation evidence", undefined, true),
    ],
  },
  Pick: {
    kinds: ["Demand"],
    title: "Pick goods",
    fields: [
      f("quantity", "Picked quantity", "quantity", true),
      f("location", "Warehouse / bin", undefined, true),
      f("serial", "Serial evidence"),
      f("batch", "Batch evidence"),
      f("finding", "Shortage / finding"),
    ],
  },
  Stage: {
    kinds: ["Demand"],
    title: "Stage goods",
    fields: [
      f("quantity", "Staged quantity", "quantity", true),
      f("location", "Staging location", undefined, true),
      f("packing", "Packing evidence", undefined, true),
    ],
  },
  Substitution: {
    kinds: ["Demand"],
    title: "Substitution review",
    fields: [
      e("state", "Coordination state", ["Proposed", "Approved", "Rejected"]),
      f("replacement", "Proposed replacement item", undefined, true),
      f("engineering_reference", "Engineering substitution decision / version"),
      f("scope_review", "Delivery / commercial scope review evidence"),
    ],
  },
  Dispatch: {
    kinds: ["Demand"],
    title: "Dispatch preparation and movement",
    fields: [
      e("state", "Dispatch state", ["Prepared", "Moved"]),
      f("quantity", "Quantity", "quantity", true),
      f("receiving_details", "Receiving details", undefined, true),
      f("documents", "Dispatch documentation", undefined, true),
      f("packing", "Packing / serial / batch evidence", undefined, true),
      f("movement_at", "Physical movement time", "instant"),
      f("source_shipment", "Separate source shipment observation"),
    ],
  },
  Delivery: {
    kinds: ["Demand"],
    title: "Delivery / POD capture",
    fields: [
      f("quantity", "Physically delivered", "quantity", true),
      f("arrival_at", "Carrier arrival", "instant"),
      f("delivered_at", "Physical delivery time", "instant", true),
      f("address", "Site delivery address", undefined, true),
      f("receiving_point", "Receiving point", undefined, true),
      f("use_area", "Intended installation / use area", undefined, true),
      f("instructions", "Delivery instructions"),
      f("damaged", "Damaged within delivered quantity", "quantity", true),
      f("missing", "Reported missing", "quantity", true),
      f(
        "excess",
        "Excess held for review (outside delivered quantity)",
        "quantity",
        true,
      ),
      f("received_by", "Physical recipient evidence", undefined, true),
    ],
  },
  Acknowledgement: {
    kinds: ["Demand"],
    title: "Customer acknowledgement",
    fields: [
      f("delivery_id", "Exact delivery capture", "id", true),
      e("state", "Customer response", ["Acknowledged", "Disputed", "Declined"]),
      f("actor", "Customer response actor", undefined, true),
      f("medium", "Recorded response medium", undefined, true),
      f("response_at", "Response time", "instant", true),
    ],
  },
  ReturnAuthorisation: {
    kinds: ["Return"],
    title: "Return authorisation",
    fields: [
      e("state", "Decision", ["Proposed", "Approved", "Rejected"]),
      f("quantity", "Authorised quantity", "quantity", true),
      f("authority", "Authority and conditions", undefined, true),
      f("movement", "Return travel arrangements", undefined, true),
    ],
  },
  ReturnReceipt: {
    kinds: ["Return"],
    title: "Return receipt and inspection",
    fields: [
      f("received", "Received quantity", "quantity", true),
      f("quarantined", "Quarantined quantity", "quantity", true),
      f("usable", "Evidenced usable (no inventory posting)", "quantity", true),
      f("observed_damage", "Observed damage", undefined, true),
      f("suspected_cause", "Suspected cause / unknown", undefined, true),
      f(
        "verified_finding",
        "Verified finding / not established",
        undefined,
        true,
      ),
      f("identity", "Identity evidence / unresolved", undefined, true),
    ],
  },
  Disposition: {
    kinds: ["Return"],
    title: "Disposition decision",
    fields: [
      e("state", "Disposition stage", ["Proposed", "Approved", "Executed"]),
      e("outcome", "Proposed outcome", [
        "Repair",
        "Replace",
        "ReturnToStock",
        "ReturnToSupplier",
        "Dispose",
        "Investigate",
      ]),
      f("quantity", "Quantity", "quantity", true),
      f("authority", "Decision / execution evidence", undefined, true),
    ],
  },
  CustomerOutcome: {
    kinds: ["Return"],
    title: "Customer remedy",
    fields: [
      e("state", "Customer outcome", ["Open", "Complete"]),
      f("remedy", "Remedy and owning module reference", undefined, true),
    ],
  },
  Claim: {
    kinds: ["Return"],
    title: "Supplier claim observation",
    fields: [
      e("state", "Supplier recovery", [
        "Open",
        "Submitted",
        "Responded",
        "Complete",
        "Unknown",
      ]),
      f(
        "claim_reference",
        "Original supplier / warranty claim identity",
        undefined,
        true,
      ),
      f("response", "Supplier response evidence", undefined, true),
    ],
  },
  SupplierMovement: {
    kinds: ["Return"],
    title: "Physical supplier return",
    fields: [
      f("quantity", "Moved quantity", "quantity", true),
      f("movement_at", "Physical movement", "instant", true),
      f(
        "source_reference",
        "Supplier movement / source observation",
        undefined,
        true,
      ),
    ],
  },
  Credit: {
    kinds: ["Return"],
    title: "Restricted credit observation",
    fields: [
      e("party", "Credit party", ["Customer", "Supplier"]),
      e("state", "Credit observation", [
        "Expected",
        "Observed",
        "Reconciled",
        "Unknown",
      ]),
      f("amount", "Amount (separate observation)", "quantity", true),
      f("currency", "Currency", undefined, true),
      f("basis", "Tax and amount basis", undefined, true),
      f("erp_reference", "Qualified ERP credit reference", undefined, true),
    ],
  },
  Custody: {
    kinds: ["Custody"],
    title: "Custody reconciliation",
    fields: [
      f("held", "Held in van / technician custody", "quantity", true),
      f("at_job", "Transferred to job, still held", "quantity", true),
      f("used", "Used", "quantity", true),
      f("returned", "Unused returned", "quantity", true),
      f("damaged", "Damaged", "quantity", true),
      f("quarantined", "Quarantined", "quantity", true),
      f("missing", "Missing / unexplained", "quantity", true),
      f("field_entry_id", "Exact Field parts capture", "id"),
      e("state", "Reconciliation state", ["Open", "Closed"]),
      f("inventory_reference", "Authoritative reconciliation observation"),
      f("inventory_observed_at", "Inventory evidence time", "instant"),
    ],
  },
  ExternalOutcome: {
    kinds: ["Demand", "Supply", "Return", "Custody"],
    title: "External outcome reconciliation",
    fields: [
      f(
        "source_operation",
        "Original external operation identity",
        undefined,
        true,
      ),
      e("effect", "Effect under investigation", [
        "Reservation",
        "Receipt",
        "Shipment",
        "Return",
        "Transfer",
      ]),
      e("state", "Observed outcome", [
        "Unknown",
        "Confirmed",
        "Failed",
        "Absent",
      ]),
      f(
        "lookup_evidence",
        "Original-operation lookup evidence",
        undefined,
        true,
      ),
    ],
  },
  Impact: {
    kinds: ["Demand"],
    title: "Material change-impact review",
    fields: [
      f("before_version", "Before version", undefined, true),
      f("after_version", "After version", undefined, true),
      f("change", "Change and reason", undefined, true),
      f(
        "affected",
        "Affected milestones, work orders, bookings, packs and commitments",
        undefined,
        true,
      ),
      e("state", "Owning-module review", ["Requested", "Reviewed"]),
      f("review_reference", "Owning-module review outcome"),
    ],
  },
  Assessment: {
    kinds: ["Demand"],
    title: "Readiness assessment",
    fields: [
      f("scope", "Exact material scope and exclusions", undefined, true),
    ],
  },
} satisfies Record<
  string,
  { kinds: string[]; title: string; fields: FieldSpec[] }
>;
export type FactKind = keyof typeof factSpecs;
export type Fields = Record<string, string | null>;
export type SupplyRecord = {
  id: string;
  kind: RecordKind;
  workspace_id: string;
  company_id: string;
  site_id: string | null;
  reference: string;
  title: string;
  item: string;
  unit: string;
  quantity: string;
  owner_id: string;
  next_action: string;
  version: number;
  data: Fields;
  completeness: Completeness;
  observed_at: string;
  source_reference: string;
  external_key: ExternalSourceKey | null;
  updated_at: string;
};
export type ExternalSourceKey = {
  provider: "Synthetic" | "Manual";
  configuration: string;
  company: string;
  entity: string;
  key: string;
};
export type Fact = {
  id: string;
  record_id: string;
  kind: FactKind;
  version: number;
  predecessor_id: string | null;
  data: Fields;
  evidence: string;
  observed_at: string;
  completeness: Completeness;
  attachment_id: string | null;
  activity_id: string | null;
};
export type Allocation = {
  id: string;
  demand_id: string;
  supply_id: string;
  quantity: string;
  unit: string;
  basis: "Incoming" | "Usable";
  version: number;
};
export function decimal(value: string): bigint {
  if (!/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(value))
    throw Error(
      "Enter a non-negative exact decimal with at most six decimal places.",
    );
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}
export function quantity(value: bigint): string {
  const sign = value < 0n ? "-" : "";
  const abs = value < 0n ? -value : value;
  return (
    sign +
    String(abs / 1_000_000n) +
    (abs % 1_000_000n
      ? "." +
        String(abs % 1_000_000n)
          .padStart(6, "0")
          .replace(/0+$/, "")
      : "")
  );
}
export const q = (data: Fields, key: string) => decimal(data[key] ?? "0");
export function currentFacts(facts: Fact[]) {
  const superseded = new Set(facts.map((f) => f.predecessor_id));
  return facts.filter((f) => !superseded.has(f.id));
}
export function sumFacts(facts: Fact[], kind: FactKind, key = "quantity") {
  return currentFacts(facts)
    .filter((f) => f.kind === kind)
    .reduce((n, f) => n + q(f.data, key), 0n);
}
export function latestFact(facts: Fact[], kind: FactKind) {
  return currentFacts(facts)
    .filter((f) => f.kind === kind)
    .at(-1);
}
export function receiptArithmetic(data: Fields) {
  if (
    q(data, "inspected") > q(data, "received") ||
    q(data, "damaged") > q(data, "quarantined") ||
    q(data, "usable") + q(data, "quarantined") > q(data, "inspected")
  )
    throw Error(
      "Usable plus quarantined cannot exceed inspected; inspected cannot exceed received. Damage remains within quarantine.",
    );
}
export function custodyArithmetic(issued: string, data: Fields) {
  if (
    [
      "held",
      "at_job",
      "used",
      "returned",
      "damaged",
      "quarantined",
      "missing",
    ].reduce((n, k) => n + q(data, k), 0n) !== decimal(issued)
  )
    throw Error(
      "Every issued quantity must have exactly one custody or outcome classification.",
    );
  if (
    data.state === "Closed" &&
    (q(data, "held") +
      q(data, "at_job") +
      q(data, "missing") +
      q(data, "quarantined") >
      0n ||
      !data.inventory_reference ||
      !data.inventory_observed_at)
  )
    throw Error(
      "Closure requires every outcome explained, no unresolved custody/quarantine and an authoritative inventory observation.",
    );
}
export function fulfilment(facts: Fact[], required: string) {
  const picked = sumFacts(facts, "Pick"),
    staged = sumFacts(facts, "Stage"),
    moved = sumFacts(
      facts.filter((f) => f.kind !== "Dispatch" || f.data.state === "Moved"),
      "Dispatch",
    ),
    delivered = sumFacts(facts, "Delivery");
  return {
    picked: quantity(picked),
    staged: quantity(staged),
    moved: quantity(moved),
    delivered: quantity(delivered),
    outstanding: quantity(decimal(required) - delivered),
  };
}
export function readiness(
  demand: SupplyRecord,
  allocated: string,
  sourcesComplete: boolean,
  facts: Fact[],
) {
  if (
    demand.completeness !== "Complete" ||
    !sourcesComplete ||
    !demand.data.required_on
  )
    return { state: "Evidence needed", shortage: null };
  const shortage = decimal(demand.quantity) - decimal(allocated);
  if (demand.data.demand_class !== "Approved")
    return {
      state: "Not assessed",
      shortage: quantity(shortage > 0n ? shortage : 0n),
    };
  const promise = latestFact(facts, "Promise");
  if (shortage > 0n)
    return {
      state:
        promise?.data.promised_on &&
        promise.data.promised_on > demand.data.required_on
          ? "At risk"
          : "Blocked",
      shortage: quantity(shortage),
    };
  return { state: "Ready for the stated material scope", shortage: "0" };
}
export function materialChanges(before: SupplyRecord, after: SupplyRecord) {
  const keys = ["quantity", "unit", "item", "completeness"] as const;
  return [
    ...keys.filter((k) => before[k] !== after[k]),
    ...[
      "required_on",
      "eta",
      "usable",
      "technical_release",
      "material_release",
      "demand_class",
    ].filter((k) => before.data[k] !== after.data[k]),
  ];
}
export const reservationPolicy = Object.freeze({
  state: "Not configured",
  reason:
    "Source reservation semantics and authority are unverified. Record evidence only.",
});
export function remainingReturn(entitlement: string, claimed: string) {
  const remaining = decimal(entitlement) - decimal(claimed);
  if (remaining < 0n) throw Error("The remaining return quantity is exceeded.");
  return quantity(remaining);
}
