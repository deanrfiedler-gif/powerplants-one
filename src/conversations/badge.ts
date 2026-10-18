// D7 (PPO-CONV-T1C-DESIGN 10.1): the top-bar badge shows the count, "9+" above nine, and nothing at zero.
export function conversationBadgeLabel(count: number | undefined) {
  return !count || count < 1 ? null : count > 9 ? "9+" : String(count);
}
