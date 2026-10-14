import { createSession } from "../../src/platform/identity";
import type { Principal } from "../../src/platform/identity";
import {
  createCostSource,
  decideCostSource,
} from "../../src/estimating/sources/commands";
import { readCostSource } from "../../src/estimating/sources/reads";
import { previewExcelSourcePricing } from "../../src/estimating/import/pricing";
import { commitExcelWorkbook } from "../../src/estimating/import/commit";
import { readEstimate } from "../../src/estimating/reads";
import { sourceInput } from "./estimating-sources";
import { crmBase } from "./crm";
import { excelImportSetup } from "./excel-import";
import { capacityWorkbook } from "./excel-capacity";
export async function pricingSource(
  p: Principal,
  unit: string,
  reviewed = true,
  overrides: Record<string, unknown> = {},
) {
  const input = sourceInput();
  input.content.unit = unit;
  input.content.tiers = [
    { minimum_quantity: "1", unit_cost: "0.75" },
    { minimum_quantity: "2", unit_cost: "0.60" },
  ];
  await createCostSource(p, {
    ...input,
    content: { ...input.content, ...overrides },
  });
  const source = await readCostSource(p, input.id);
  if (reviewed) {
    await decideCostSource(p, input.id, {
      ...crmBase(),
      expected_version: 1,
      revision_id: source.revision.id,
      action: "Submit",
    });
    const reviewer = (await createSession("estimating-source-reviewer"))
      .principal;
    await decideCostSource(reviewer, input.id, {
      ...crmBase(),
      expected_version: 2,
      revision_id: source.revision.id,
      action: "Reviewed",
      ...(source.fx_review_hash
        ? { fx_review_hash: source.fx_review_hash }
        : {}),
    });
  }
  const detail = await readCostSource(p, input.id);
  return { input, source: { ...detail.source, revision: detail.revision } };
}
export async function pricingSetup(count = 3) {
  const s = await excelImportSetup(undefined, (parts) =>
    capacityWorkbook(parts, count),
  );
  const imported = await commitExcelWorkbook(s.p, s.input.id, s.command);
  const e = await readEstimate(s.p, imported.receipt.record_id);
  const source = await pricingSource(s.p, e.saved.lines[0].unit);
  return {
    ...s,
    e,
    imported,
    source: source.source,
    sourceInput: source.input,
  };
}
export async function pricingProposal(
  s: Awaited<ReturnType<typeof pricingSetup>>,
  lineIds?: string[],
) {
  const e = await readEstimate(s.p, s.e.id);
  const proposal = {
    estimate_version_id: e.saved.id,
    pricing_date: "2026-10-14",
    selections: (lineIds ?? e.saved.lines.map((l) => l.id)).map((line_id) => ({
      line_id,
      source_id: s.source.id,
      revision_id: s.source.revision.id,
      expected_source_version: s.source.version,
    })),
  };
  const review = await previewExcelSourcePricing(s.p, e.id, proposal);
  const command = {
    ...crmBase(),
    expected_version: e.version,
    proposal,
    comparison_hash: review.review_hash,
    reviewed: true,
  };
  return { proposal, review, command };
}
