import { randomUUID } from "node:crypto";
import { createClaim, recoveryCommand } from "../../src/maintenance/recovery";
import { history } from "../../src/maintenance/context";
import { database } from "../../src/platform/database";
import { allocate, recordFact, saveRecord } from "../../src/supply/commands";
import { supplyRecord } from "../../src/supply/context";
import { warranty, base, CRM, asset } from "./maintenance";
import { supplyFact, supplyInput } from "./supply";

export async function warrantyReturnFixture(
  stage: "Authorised" | "NotRequired" = "Authorised",
) {
  const w = await warranty(),
    claimId = randomUUID();
  await createClaim(w.p, {
    ...base(),
    id: claimId,
    case_id: w.id,
    expected_case_version: w.version,
    assessment_id: w.entitlement,
    supplier_id: CRM.org,
    scope: "SYN return recovery",
    claimed_minor: 10000,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    owner_id: CRM.owner,
    due_date: "2026-12-01",
  });
  await recoveryCommand(w.p, claimId, {
    ...base(),
    expected_version: 1,
    action: "ReturnEvidence",
    data: {
      stage,
      reference: "SYN-RETURN-AUTHORITY",
      source_date: "2026-09-02",
      evidence: "SYN exact authority to arrange return; no receipt implied",
    },
  });
  const authorisation = (await history(database(), w.p, claimId)).find(
    (e) => e.action === "ReturnEvidence",
  )!;
  const demand = supplyInput("Demand");
  Object.assign(demand.data, { customer_id: CRM.org, asset_id: asset });
  await saveRecord(w.p, demand);
  const stock = supplyInput("Supply");
  await saveRecord(w.p, stock);
  await allocate(w.p, {
    ...base(),
    id: randomUUID(),
    expected_version: null,
    demand_id: demand.id,
    supply_id: stock.id,
    demand_version: 1,
    supply_version: 1,
    quantity: "10",
    unit: demand.unit,
    basis: "Usable",
  });
  const fact = async (
    kind: Parameters<typeof supplyFact>[0],
    data: Record<string, string>,
    predecessor_id: string | null = null,
  ) => {
    const row = await supplyRecord(database(), w.p, demand.id);
    const cmd = {
      ...supplyFact(kind, row.version, data),
      predecessor_id,
      observed_at: "2026-08-24T02:00:00.000Z",
    };
    await recordFact(w.p, demand.id, cmd);
    return cmd.id;
  };
  await fact("Pick", { quantity: "4" });
  await fact("Stage", { quantity: "4" });
  const dispatch = await fact("Dispatch", { state: "Prepared", quantity: "4" });
  await fact(
    "Dispatch",
    { state: "Moved", quantity: "4", movement_at: "2026-08-24T01:00:00.000Z" },
    dispatch,
  );
  const deliveryId = await fact("Delivery", {
    quantity: "4",
    delivered_at: "2026-08-24T02:00:00.000Z",
  });
  const delivered = await supplyRecord(database(), w.p, demand.id);
  const cmd = {
    ...base(),
    expected_version: 2,
    expected_case_version: w.version,
    expected_demand_version: delivered.version,
    delivery_fact_id: deliveryId,
    authorisation_event_id: authorisation.id,
    demand_id: demand.id,
    return_id: randomUUID(),
    supply_operation_id: randomUUID(),
    quantity: "2",
    owner_id: CRM.owner,
    identity_evidence: "SYN verified original asset and demand item",
    reported_symptom: "SYN intermittent indication",
    source_reference: "SYN original delivery reference",
  };
  return { ...w, claimId, authorisation, demand, cmd };
}
