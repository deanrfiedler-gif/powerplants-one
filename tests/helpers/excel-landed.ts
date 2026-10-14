import { readEstimate } from "../../src/estimating/reads";
import { previewExcelSourcePricing } from "../../src/estimating/import/pricing";
import { crmBase } from "./crm";
import { landedCharges } from "./landed-costs";
import type { pricingSetup } from "./excel-source-pricing";
export async function landedPricing(
  s: Awaited<ReturnType<typeof pricingSetup>>,
  overrides: Record<string, unknown> = {},
) {
  const e = await readEstimate(s.p, s.e.id);
  const proposal = {
    estimate_version_id: e.saved.id,
    pricing_date: "2026-10-14",
    selections: e.saved.lines.map((l) => ({
      line_id: l.id,
      source_id: s.source.id,
      revision_id: s.source.revision.id,
      expected_source_version: s.source.version,
    })),
    landed_costs: landedCharges(
      e.saved.lines.map((l) => l.id),
      overrides,
    ),
  };
  const review = await previewExcelSourcePricing(s.p, e.id, proposal);
  return {
    proposal,
    review,
    command: {
      ...crmBase(),
      expected_version: e.version,
      proposal,
      comparison_hash: review.review_hash,
      reviewed: true,
    },
  };
}
