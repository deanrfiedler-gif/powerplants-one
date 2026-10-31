import type { WorklistItem } from "./worklist";

// Stable presentation keys. These carry no record or permission state.
export const dealColumns = [
  { id: "title", label: "Deal", width: 250 },
  { id: "activity", label: "Next activity", width: 230 },
  { id: "due", label: "Next activity due", width: 160 },
  { id: "organisation", label: "Organisation", width: 210 },
  { id: "contact", label: "Contact", width: 140 },
  { id: "stage", label: "Stage", width: 130 },
  { id: "value", label: "Value", width: 132 },
  { id: "close", label: "Expected close", width: 136 },
  { id: "owner", label: "Owner", width: 128 },
  { id: "reference", label: "Reference", width: 190 },
  { id: "activityOwner", label: "Activity owner", width: 160 },
  { id: "site", label: "Site", width: 190 },
  { id: "updated", label: "Last updated", width: 180 },
] as const;
export type DealColumnId = (typeof dealColumns)[number]["id"];
export const defaultDealColumns: DealColumnId[] = dealColumns
  .slice(0, 9)
  .map((c) => c.id);

export function dealColumnValue(
  item: WorklistItem,
  column: DealColumnId,
): string | null {
  switch (column) {
    case "title":
      return item.title;
    case "activity":
      return item.next_action_state === "Needed"
        ? null
        : item.next_action_summary;
    case "due":
      return ["Upcoming", "Overdue", "DueNeeded"].includes(
        item.next_action_state,
      )
        ? item.due_at
        : null;
    case "organisation":
      return item.organisation_name;
    case "contact":
      return item.contact_name;
    case "stage":
      return item.stage_id;
    case "value":
      return item.value_amount;
    case "close":
      return item.expected_close_date;
    case "owner":
      return item.owner_name;
    case "reference":
      return item.display_number;
    case "activityOwner":
      return item.action_owner_name;
    case "site":
      return item.site_name;
    case "updated":
      return item.updated_at;
  }
}

// Selection is a subset of one current permitted page in the displayed order,
// never a cached record collection or an implied all-matches selection.
export function selectedDeals(
  items: readonly WorklistItem[],
  ids: readonly string[],
) {
  const selected = new Set(ids);
  return items.filter((item) => selected.has(item.id));
}
export function selectionBasis(items: readonly WorklistItem[]) {
  return JSON.stringify(items);
}
export function selectedWorklistCsv(
  items: readonly WorklistItem[],
  ids: readonly string[],
  columns: readonly DealColumnId[],
) {
  const cell = (value: string | null) => {
    const text = value ?? "";
    return (
      '"' +
      (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
      '"'
    );
  };
  return (
    "\ufeff" +
    [
      columns.map(
        (id) =>
          dealColumns.find((c) => c.id === id)!.label +
          (id === "value" ? " AUD excl. GST" : ""),
      ),
      ...selectedDeals(items, ids).map((item) =>
        columns.map((id) => dealColumnValue(item, id)),
      ),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
