// PostgreSQL numeric values arrive as decimal strings. Sum minor units exactly;
// unknown amounts remain distinct from a known zero. The caller owns the scope.
export function valueSummary(
  items: readonly { value_amount: string | null }[],
) {
  let cents = 0n,
    unknown = 0;
  for (const item of items) {
    if (item.value_amount === null) {
      unknown++;
      continue;
    }
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(item.value_amount);
    if (!match) throw Error("Invalid opportunity amount");
    cents += BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
  }
  const dollars = new Intl.NumberFormat("en-AU").format(cents / 100n);
  return {
    formatted: `$${dollars}.${String(cents % 100n).padStart(2, "0")}`,
    unknown,
  };
}
