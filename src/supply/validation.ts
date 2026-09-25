import {
  choice,
  common,
  commonKeys,
  dateOnly,
  instant,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import {
  decimal,
  quantity,
  kinds,
  completeness,
  recordFields,
  factSpecs,
  type FieldSpec,
  type Fields,
  type ExternalSourceKey,
  type FactKind,
} from "./model";
export function exactQuantity(value: unknown, field: string, positive = false) {
  if (typeof value !== "string")
    invalid(field, "Use an exact decimal string, not a floating-point number.");
  try {
    const n = decimal(value);
    if (positive && n === 0n)
      throw Error("Enter a quantity greater than zero.");
    return quantity(n);
  } catch (e) {
    return invalid(field, (e as Error).message);
  }
}
export function fields(value: unknown, specs: FieldSpec[]): Fields {
  const r = object(
    value,
    specs.map((f) => f.key),
  );
  const result: Fields = {};
  for (const f of specs) {
    const v = r[f.key];
    if (v === undefined || v === null || v === "") {
      if (f.required) invalid(f.key, `${f.label} is required.`);
      result[f.key] = null;
      continue;
    }
    result[f.key] = f.choices
      ? choice(v, f.key, f.choices)
      : f.type === "quantity"
        ? exactQuantity(v, f.key)
        : f.type === "id"
          ? uuid(v, f.key)
          : f.type === "date"
            ? dateOnly(v, f.key)
            : f.type === "instant"
              ? instant(v, f.key)
              : label(v, f.key, 1000);
  }
  return result;
}
function external(value: unknown): ExternalSourceKey | null {
  if (value === undefined || value === null) return null;
  const r = object(value, [
    "provider",
    "configuration",
    "company",
    "entity",
    "key",
  ]);
  return {
    provider: choice(r.provider, "provider", ["Manual", "Synthetic"]),
    configuration: label(r.configuration, "configuration", 200),
    company: label(r.company, "company", 200),
    entity: label(r.entity, "entity", 200),
    key: label(r.key, "key", 200),
  };
}
export function recordCommand(input: unknown, update = false) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "kind",
    "company_id",
    "site_id",
    "reference",
    "title",
    "item",
    "unit",
    "quantity",
    "owner_id",
    "next_action",
    "data",
    "completeness",
    "observed_at",
    "source_reference",
    "external_key",
  ]);
  const kind = choice(r.kind, "kind", kinds),
    data = fields(r.data, recordFields[kind]);
  if (kind === "Demand") {
    if (data.demand_class === "Approved" && !data.authority)
      invalid("authority", "Approval needs explicit authority and evidence.");
    if (data.origin_kind !== "OtherApproved" && !data.origin_id)
      invalid("origin_id", "Select the existing Project or work order.");
    if (data.origin_kind === "OtherApproved" && !data.origin_reference)
      invalid(
        "origin_reference",
        "Name the approved source; do not invent a source record.",
      );
    if (!data.required_on && !data.date_needed_reason)
      invalid(
        "required_on",
        "Provide a required date or explain why it is needed.",
      );
    try {
      new Intl.DateTimeFormat("en-AU", { timeZone: data.timezone! }).format();
    } catch {
      invalid("timezone", "Use a recognised IANA timezone.");
    }
  }
  if (kind === "Supply" && data.supply_kind === "Shipment" && !data.shipment_id)
    invalid(
      "shipment_id",
      "Shipment identity must be shared by its individual lines.",
    );
  const reference = label(r.reference, "reference", 90);
  if (!/^SYN-PPO-SC-[A-Za-z0-9-]{1,64}$/.test(reference))
    invalid("reference", "Use a SYN-PPO-SC- reference.");
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    expected_version: update ? version(r.expected_version) : null,
    kind,
    company_id: uuid(r.company_id, "company_id"),
    site_id: optionalId(r.site_id, "site_id"),
    reference,
    title: label(r.title, "title", 200),
    item: label(r.item, "item", 200),
    unit: label(r.unit, "unit", 30),
    quantity: exactQuantity(r.quantity, "quantity", true),
    owner_id: uuid(r.owner_id, "owner_id"),
    next_action: label(r.next_action, "next_action", 1000),
    data,
    completeness: choice(r.completeness, "completeness", completeness),
    observed_at: instant(r.observed_at, "observed_at"),
    source_reference: label(r.source_reference, "source_reference", 1000),
    external_key: external(r.external_key),
  };
}
export function factCommand(input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "kind",
    "data",
    "predecessor_id",
    "evidence",
    "observed_at",
    "completeness",
    "attachment_id",
  ]);
  const kind = choice(r.kind, "kind", Object.keys(factSpecs) as FactKind[]);
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    expected_version: version(r.expected_version),
    kind,
    data: fields(r.data, factSpecs[kind].fields),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    evidence: label(r.evidence, "evidence", 1000),
    observed_at: instant(r.observed_at, "observed_at"),
    completeness: choice(r.completeness, "completeness", completeness),
    attachment_id: optionalId(r.attachment_id, "attachment_id"),
  };
}
export function allocationCommand(input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "expected_version",
    "demand_id",
    "supply_id",
    "demand_version",
    "supply_version",
    "quantity",
    "unit",
    "basis",
  ]);
  return {
    ...common(r),
    id: uuid(r.id, "id"),
    expected_version:
      r.expected_version === null ? null : version(r.expected_version),
    demand_id: uuid(r.demand_id, "demand_id"),
    supply_id: uuid(r.supply_id, "supply_id"),
    demand_version: version(r.demand_version),
    supply_version: version(r.supply_version),
    quantity: exactQuantity(r.quantity, "quantity"),
    unit: label(r.unit, "unit", 30),
    basis: choice(r.basis, "basis", ["Incoming", "Usable"]),
  };
}
