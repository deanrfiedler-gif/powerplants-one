import { pricingSetup, pricingSource } from "./excel-source-pricing";
import { fxEvidence } from "./source-fx";
export async function fxSetup(count = 3, reviewed = true) {
  const s = await pricingSetup(count);
  const converted = await pricingSource(
    s.p,
    s.e.saved.lines[0].unit,
    reviewed,
    { tiers: undefined, fx: fxEvidence() },
  );
  return { ...s, source: converted.source, fxSourceInput: converted.input };
}
