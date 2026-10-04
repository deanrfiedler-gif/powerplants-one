import { randomUUID } from "node:crypto";
import {
  completedHttpFixture,
  conversionDetail,
  json,
} from "./quotation-disposition-http";
import { nativeRevision } from "./quotation-disposition";
import { supplyInput } from "./supply";
import { crmBase } from "./crm";
import {
  referral,
  acknowledgement,
  supplyReview,
} from "./quotation-supply-followup";
export {
  conversionDetail,
  json,
  request,
  session,
} from "./quotation-disposition-http";
export {
  referral,
  acknowledgement,
  supplyReview,
  supplyApply,
} from "./quotation-supply-followup";
export async function allocatedHttpFixture() {
  const f = await completedHttpFixture(),
    t = f.d.dispositions[0],
    r = t.basis.target;
  await json(
    f.owner,
    `supply/records/${r.id}`,
    nativeRevision(t, {
      data: {
        ...r.data,
        demand_class: "Approved",
        authority: "SYN existing Supply classification",
      },
    }),
  );
  const supply = supplyInput("Supply", {
    item: r.item,
    unit: r.unit,
    owner_id: r.owner_id,
  });
  await json(f.owner, "supply/records", supply);
  const other = supplyInput("Demand", {
    item: r.item,
    unit: r.unit,
    owner_id: r.owner_id,
    quantity: "8",
  });
  await json(f.owner, "supply/records", other);
  for (const [id, amount] of [
    [r.id, "2"],
    [other.id, "8"],
  ]) {
    const d = (await json(f.owner, `supply/records/${id}`)).record,
      s = (await json(f.owner, `supply/records/${supply.id}`)).record;
    await json(f.owner, "supply/allocations", {
      ...crmBase(),
      id: randomUUID(),
      expected_version: null,
      demand_id: id,
      supply_id: supply.id,
      demand_version: d.version,
      supply_version: s.version,
      quantity: amount,
      unit: r.unit,
      basis: "Usable",
    });
  }
  return { ...f, supply, other, d: await conversionDetail(f.owner, f.id) };
}
export async function reviewedHttpFixture() {
  const f = await allocatedHttpFixture();
  await json(f.owner, f.path + "/supply-refer", referral(f.d.followups[0]));
  let d = await conversionDetail(f.owner, f.id);
  await json(
    f.owner,
    f.path + "/supply-receive",
    acknowledgement(d.followups[0]),
  );
  d = await conversionDetail(f.owner, f.id);
  await json(
    f.owner,
    f.path + "/supply-review",
    supplyReview(d.followups[0], "AdjustAllocation", "1.375001"),
  );
  return { ...f, d: await conversionDetail(f.owner, f.id) };
}
