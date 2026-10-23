import type { Usage } from "./model";

export type Price = {
  adapter: string; model: string; input_micro_per_mtok: number; output_micro_per_mtok: number;
  version: string; checked: string;
};
const simulated: Price = Object.freeze({
  adapter: "Simulated", model: "simulated-1", input_micro_per_mtok: 0, output_micro_per_mtok: 0,
  version: "simulated-1-zero", checked: "2026-10-20",
});
// ADR-0062: global standard, no cache/tools; checked against official pricing 2026-10-22.
const claude: Price = Object.freeze({
  adapter: "Claude", model: "claude-sonnet-5-5", input_micro_per_mtok: 2_000_000, output_micro_per_mtok: 10_000_000,
  version: "anthropic-sonnet-5-5-global-2026-10-22", checked: "2026-10-22",
});
export function priceFor(adapter: string, model: string): Price | null {
  return [simulated, claude].find(p => p.adapter === adapter && p.model === model) ?? null;
}
function integer(value: number): bigint {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Invalid price or token count");
  return BigInt(value);
}
export function costMicro(price: Price, usage: Usage): number {
  // Round the combined cost up once, with integer arithmetic even at the boundary.
  const numerator = integer(price.input_micro_per_mtok) * integer(usage.input_tokens)
    + integer(price.output_micro_per_mtok) * integer(usage.output_tokens);
  const amount = (numerator + 999_999n) / 1_000_000n;
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Cost exceeds safe integer range");
  return Number(amount);
}
export const maxCallMicro = costMicro;
