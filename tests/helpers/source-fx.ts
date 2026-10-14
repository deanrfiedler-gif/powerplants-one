// Explicit synthetic evidence; these numbers are not market exchange rates.
export const fxEvidence = () => ({
  policy: "SYN-EST-FX-01",
  currency: "USD",
  rate: "1.500000",
  rate_date: "2026-10-01",
  effective_from: "2026-10-01",
  valid_until: "2026-10-31",
  evidence_reference: "SYN-FX-RATE-ONE",
  evidence_excerpt:
    "Authored fictional AUD per USD rate for deterministic proof; no market feed.",
  tiers: [
    { minimum_quantity: "1", unit_cost: "0.67" },
    { minimum_quantity: "2", unit_cost: "0.50" },
  ],
});
