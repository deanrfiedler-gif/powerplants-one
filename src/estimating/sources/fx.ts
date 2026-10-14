import { createHash } from "node:crypto";
import { canonical } from "../../platform/operations";
import {
  choice,
  dateOnly,
  invalid,
  label,
  narrative,
  object,
} from "../../shared/validation";
import { amount } from "../validation";
import { decimal, halfUp, scaled } from "../math";

export const fxPolicy = "SYN-EST-FX-01";
export const fxCurrencies = ["USD", "EUR", "GBP", "NZD", "CAD", "CNY"] as const;
function sixPlaces(value: unknown, field: string, positive = false) {
  let n: bigint;
  try {
    if (typeof value !== "string") throw Error();
    n = scaled(value, 6);
  } catch {
    return invalid(field, "Enter an explicit decimal with at most six places.");
  }
  if (n < (positive ? 1n : 0n) || n > 1000000000000n)
    invalid(
      field,
      "Use a value through 1,000,000; an exchange rate must be positive.",
    );
  return decimal(n, 6);
}
export function fxContent(value: unknown) {
  const r = object(value, [
    "policy",
    "currency",
    "rate",
    "rate_date",
    "effective_from",
    "valid_until",
    "evidence_reference",
    "evidence_excerpt",
    "tiers",
  ]);
  const rate_date = dateOnly(r.rate_date, "fx.rate_date"),
    effective_from = dateOnly(r.effective_from, "fx.effective_from"),
    valid_until = dateOnly(r.valid_until, "fx.valid_until");
  if (rate_date > effective_from || valid_until < effective_from)
    invalid(
      "fx",
      "Rate date must precede or equal its effective start; explicit expiry cannot precede that start.",
    );
  if (!Array.isArray(r.tiers) || !r.tiers.length || r.tiers.length > 20)
    invalid(
      "fx.tiers",
      "Retain one to twenty original supplier quantity tiers.",
    );
  let previous = 0n;
  const tiers = r.tiers.map((value, i) => {
    const t = object(value, ["minimum_quantity", "unit_cost"]);
    const minimum_quantity = amount(
      t.minimum_quantity,
      `fx.tiers.${i}.minimum_quantity`,
      true,
    );
    const n = scaled(minimum_quantity, 3);
    if (n <= previous)
      invalid(
        "fx.tiers",
        "Original quantity tiers must be unique and increasing.",
      );
    previous = n;
    return {
      minimum_quantity,
      unit_cost: sixPlaces(t.unit_cost, `fx.tiers.${i}.unit_cost`),
    };
  });
  return {
    policy: choice(r.policy, "fx.policy", [fxPolicy] as const),
    currency: choice(r.currency, "fx.currency", fxCurrencies),
    rate: sixPlaces(r.rate, "fx.rate", true),
    rate_date,
    effective_from,
    valid_until,
    evidence_reference: label(
      r.evidence_reference,
      "fx.evidence_reference",
      300,
    ),
    evidence_excerpt: narrative(
      r.evidence_excerpt,
      "fx.evidence_excerpt",
      2000,
    ),
    tiers,
  };
}
export type FxContent = ReturnType<typeof fxContent>;
export const fxReviewHash = (fx: FxContent) =>
  createHash("sha256").update(canonical(fx)).digest("hex");
export function convertedTiers(fx: FxContent) {
  return fx.tiers.map((t) => {
    // Six-place foreign price * six-place AUD-per-foreign rate -> AUD cents.
    const cents = halfUp(
      scaled(t.unit_cost, 6) * scaled(fx.rate, 6),
      10000000000n,
    );
    if (cents > 100000000n)
      invalid("fx", "The converted AUD unit price exceeds 1,000,000.");
    return { minimum_quantity: t.minimum_quantity, unit_cost: decimal(cents) };
  });
}
