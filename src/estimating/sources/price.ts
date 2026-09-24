import { AppError } from "../../platform/errors";
import { scaled } from "../math";
import type { SourceContent } from "./validation";

// No FX, unit conversion, extrapolation below a supplier minimum or inferred
// validity. This is an explicit comparison date, not a moving fixture clock.
export function sourcePrice(
  content: SourceContent,
  quantity: string,
  unit: string,
  pricingDate: string,
) {
  if (content.unit !== unit)
    throw new AppError(
      422,
      "SourceUnitMismatch",
      "Source and estimate units must match exactly. Unit conversion is Not configured.",
    );
  if (
    pricingDate < content.effective_from ||
    (content.valid_until !== null && pricingDate > content.valid_until)
  )
    throw new AppError(
      422,
      "SourceOutsideValidity",
      "The chosen pricing date is outside the recorded source dates.",
    );
  const n = scaled(quantity, 3);
  const tier = content.tiers.findLast(
    (t) => scaled(t.minimum_quantity, 3) <= n,
  );
  if (!tier)
    throw new AppError(
      422,
      "SourceQuantityBelowMinimum",
      "The line quantity is below the first recorded source tier.",
    );
  return {
    ...tier,
    validity_end: content.valid_until,
    validity_warning:
      content.valid_until === null
        ? "Supplier expiry is Unknown; review this limitation before saving a successor."
        : null,
  };
}
