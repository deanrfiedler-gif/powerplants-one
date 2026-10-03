import { crmBase } from "./crm";
import {
  responseFixture,
  response,
  responseCommand,
} from "./quotation-response";
import {
  recordResponse,
  prepareResponseHandover,
} from "../../src/estimating/response/service";
import { readResponse } from "../../src/estimating/response/reads";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  receiveQuotation,
  resolveQuotationItem,
  reviewConversionPlan,
} from "../../src/estimating/conversion/service";
export type ConversionDetail = Awaited<ReturnType<typeof readConversion>>;
export const conversionCommand = (d: ConversionDetail) => ({
  ...crmBase(),
  synthetic_only: true,
  issue_id: d.issue.id,
  output_hash: d.issue.output_hash,
  preparation_id: d.preparation!.id,
  response_id: d.preparation!.response_id,
  expected_sequence: d.sequence,
  evidence: "SYN exact retained receiving evidence",
});
export const receiving = (d: ConversionDetail, owner: string) => ({
  ...conversionCommand(d),
  predecessor_id: d.receiving?.id ?? null,
  decision: "Received",
  owner_id: owner,
  due_date: "2026-10-12",
  next_action: "Review synthetic demand before any procurement or work release",
});
export const resolution = (d: ConversionDetail, line = d.lines[0]) => ({
  ...conversionCommand(d),
  predecessor_id: line.resolution?.id ?? null,
  line_id: line.source.id,
  state: "OneOff",
  label: line.source.description,
  unit: line.source.unit,
  company_id: d.company_id,
  entity: "SupplyDemand",
});
export const plan = (d: ConversionDetail) => ({
  ...conversionCommand(d),
  predecessor_id: d.plan?.id ?? null,
  basis_hash: d.basis_hash,
  decision: "Reviewed",
});
export const conversion = (d: ConversionDetail) => ({
  ...conversionCommand(d),
  plan_id: d.plan!.id,
  plan_hash: d.plan!.plan_hash,
});
export async function conversionFixture(extraProducts = 0) {
  const f = await responseFixture(extraProducts);
  await recordResponse(f.owner, f.id, response(f.d));
  const d = await readResponse(f.owner, f.id);
  await prepareResponseHandover(f.owner, f.id, {
    ...responseCommand(d),
    owner_id: f.owner.actor_id,
    due_date: "2026-10-12",
    note: "SYN prepare exact source for independent receiving command",
  });
  return { ...f, d: await readConversion(f.owner, f.id) };
}
export async function plannedFixture(extraProducts = 0) {
  const f = await conversionFixture(extraProducts);
  await receiveQuotation(f.owner, f.id, receiving(f.d, f.owner.actor_id));
  let d = await readConversion(f.owner, f.id);
  for (const line of d.lines) {
    await resolveQuotationItem(f.owner, f.id, resolution(d, line));
    d = await readConversion(f.owner, f.id);
  }
  await reviewConversionPlan(f.owner, f.id, plan(d));
  return { ...f, d: await readConversion(f.owner, f.id) };
}
