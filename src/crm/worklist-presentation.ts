import type { WorklistItem } from "./worklist";

// Presentation of the current authorised result page. No probability, stale
// threshold or historical stage movement is inferred from last-updated time.
export function forecastGroups(items: readonly WorklistItem[], asOf: string, months = 3) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(asOf));
  const [year, month] = today.split("-").map(Number);
  const start = year * 12 + month - 1;
  const groups: { id: string; label: string; items: WorklistItem[] }[] = [{ id: "overdue", label: "Overdue", items: [] }];
  for (let i = 0; i < months; i++) {
    const date = new Date(Date.UTC(year, month - 1 + i, 1));
    groups.push({ id: String(start + i), label: new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(date), items: [] });
  }
  groups.push({ id: "later", label: "Later", items: [] }, { id: "undated", label: "No close date", items: [] });
  for (const item of items) {
    const date = item.expected_close_date;
    const n = date ? Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1 : NaN;
    const id = !date ? "undated" : date < today ? "overdue" : n >= start && n < start + months ? String(n) : "later";
    groups.find(group => group.id === id)!.items.push(item);
  }
  return groups.filter(group => group.items.length || !["overdue", "later", "undated"].includes(group.id));
}

export const actionLabels = { Needed: "No next activity", DueNeeded: "Activity date needed", Overdue: "Overdue activity", Upcoming: "Next activity planned", Unavailable: "Activity unavailable" };
export const needsAttention = (item: WorklistItem) => item.close_outcome === "Open" && ["Needed", "DueNeeded", "Overdue"].includes(item.next_action_state);

export function worklistCsv(items: readonly WorklistItem[]) {
  const cell = (value: string | number | null) => {
    const text = String(value ?? "");
    // User-controlled titles must remain text when opened in a spreadsheet.
    return '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
  };
  const rows = [
    ["PPO reference", "Opportunity", "Organisation", "Primary contact", "Owner", "Stage", "Outcome", "Value AUD ex GST", "Expected close", "Next activity", "Activity owner", "Activity due", "Saved version"],
    ...items.map(item => [item.display_number, item.title, item.organisation_name, item.contact_name, item.owner_name, item.stage_id, item.close_outcome, item.value_amount, item.expected_close_date, item.next_action_summary, item.action_owner_name, item.due_at, item.version]),
  ];
  return "\ufeff" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
