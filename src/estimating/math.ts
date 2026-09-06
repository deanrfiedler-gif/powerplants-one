// SYN-EST-ARITHMETIC-01. Exact base-10 arithmetic; no binary-float money.
export const arithmeticPolicy = "SYN-EST-ARITHMETIC-01";
export type CostLine = {
  id: string; description: string; category: "Product" | "Labour" | "Freight";
  quantity: string; unit: string; unit_cost: string; unit_sell: string;
  source: string; effective_date: string;
};
export type QuoteChoice = { line_id: string; included: boolean; print: boolean };
export function scaled(value: string, places: number): bigint {
  if (!new RegExp(`^(0|[1-9][0-9]*)(\\.[0-9]{1,${places}})?$`).test(value)) throw Error("Invalid decimal");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, "0"));
}
export function decimal(value: bigint, places = 2): string {
  const negative = value < 0n, n = negative ? -value : value;
  const s = n.toString().padStart(places + 1, "0");
  return `${negative ? "-" : ""}${s.slice(0, -places)}.${s.slice(-places)}`;
}
export function halfUp(n: bigint, divisor: bigint): bigint {
  const sign = n < 0n ? -1n : 1n, abs = n < 0n ? -n : n;
  return sign * ((abs + divisor / 2n) / divisor);
}
export function extended(quantity: string, unitAmount: string): bigint {
  return halfUp(scaled(quantity, 3) * scaled(unitAmount, 2), 1000n);
}
export function calculate(lines: CostLine[]) {
  let cost = 0n, sell = 0n;
  const items = lines.map(line => {
    const c = extended(line.quantity, line.unit_cost), s = extended(line.quantity, line.unit_sell);
    cost += c; sell += s;
    return { ...line, cost_total: decimal(c), sell_total: decimal(s) };
  });
  return { policy: arithmeticPolicy, currency: "AUD", tax_basis: "ExcludingTax", tax_calculated: false,
    complete: lines.length > 0, cost: lines.length ? decimal(cost) : null, sell: lines.length ? decimal(sell) : null,
    difference: lines.length ? decimal(sell - cost) : null,
    margin_percent: sell ? decimal(halfUp((sell - cost) * 10000n, sell)) : null,
    markup_percent: cost ? decimal(halfUp((sell - cost) * 10000n, cost)) : null, items };
}
export function quoteAmounts(lines: CostLine[], choices: QuoteChoice[]) {
  let total = 0n, hidden = 0n;
  const items: { description: string; quantity: string | null; unit: string | null; amount: string }[] = [];
  for (const line of lines) {
    const choice = choices.find(c => c.line_id === line.id);
    if (!choice?.included) continue;
    const amount = extended(line.quantity, line.unit_sell); total += amount;
    if (choice.print) items.push({ description: line.description, quantity: line.quantity, unit: line.unit, amount: decimal(amount) });
    else hidden += amount;
  }
  if (choices.some(c => c.included && !c.print)) items.push({ description: "Included scope allowance", quantity: null, unit: null, amount: decimal(hidden) });
  return { items, total: decimal(total), currency: "AUD", tax_basis: "ExcludingTax", tax_calculated: false };
}
