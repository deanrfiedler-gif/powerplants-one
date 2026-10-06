import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "./crm";
import {
  recordFields,
  factSpecs,
  type RecordKind,
  type FactKind,
  type Fields,
} from "../../src/supply/model";
export const supplyBase = () => ({
  ...crmBase(),
  reason: "SYN Supply Chain verification",
});
export function supplyInput(
  kind: RecordKind = "Demand",
  extra: Record<string, unknown> = {},
) {
  const id = randomUUID();
  const data: Fields = Object.fromEntries(
    recordFields[kind].map((f) => [
      f.key,
      f.required
        ? (f.choices?.[0] ??
          (f.type === "quantity"
            ? "0"
            : f.type === "id"
              ? randomUUID()
              : "SYN evidence"))
        : null,
    ]),
  );
  if (kind === "Demand")
    Object.assign(data, {
      demand_class: "Approved",
      origin_kind: "OtherApproved",
      origin_reference: "SYN independent demand",
      authority: "SYN explicit prototype authority",
      required_on: "2026-10-01",
      timezone: "Australia/Sydney",
      source_revision: "1",
    });
  if (kind === "Supply")
    Object.assign(data, {
      supply_kind: "Stock",
      on_hand: "10",
      available: "10",
      reserved: "0",
      held: "0",
      usable: "10",
      eta_basis: "Unknown",
    });
  return {
    ...supplyBase(),
    id,
    kind,
    company_id: CRM.company,
    site_id: CRM.site,
    reference: `SYN-PPO-SC-${id}`,
    title: `SYN ${kind} verification`,
    item: "SYN-PART-CABLE",
    unit: "EA",
    quantity: "10",
    owner_id: CRM.owner,
    next_action: "SYN Review exact evidence",
    data,
    completeness: "Complete",
    observed_at: "2026-09-24T00:00:00.000Z",
    source_reference: "SYN manually observed evidence",
    external_key: null,
    ...extra,
  };
}
export function supplyFact(
  kind: FactKind,
  expected_version: number,
  data: Fields = {},
) {
  const defaults: Fields = Object.fromEntries(
    factSpecs[kind].fields.map((f) => [
      f.key,
      f.required
        ? (f.choices?.[0] ??
          (f.type === "quantity"
            ? "0"
            : f.type === "instant"
              ? "2026-09-24T00:00:00.000Z"
              : f.type === "date"
                ? "2026-09-30"
                : f.type === "id"
                  ? randomUUID()
                  : "SYN evidence"))
        : null,
    ]),
  );
  return {
    ...supplyBase(),
    id: randomUUID(),
    expected_version,
    kind,
    data: { ...defaults, ...data },
    predecessor_id: null as string | null,
    evidence: "SYN retained observation",
    observed_at: "2026-09-24T00:00:00.000Z",
    completeness: "Complete",
    attachment_id: null as string | null,
  };
}
