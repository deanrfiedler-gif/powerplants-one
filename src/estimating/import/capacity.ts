// Explicit internal receiving profile; public manual/CPQ contracts retain their own bounds.
export const EXCEL_CAPACITY = Object.freeze({
  version: "PPO-EXCEL-CAPACITY-1",
  lines: 500,
  receiverBytes: 1024 * 1024,
  quoteRequestBytes: 128 * 1024,
});
