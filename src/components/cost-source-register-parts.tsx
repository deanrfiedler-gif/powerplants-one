"use client";
import { FontAwesomeGlyph } from "./font-awesome";
import { ShellIcon, type ShellIconName } from "./shell-icon";
import { RegisterChip } from "./ui/register-table";
import { Button } from "./ui/button";
import { denied } from "./crm-state";
import { sourceDate, sourceStateLabel, type CostSourceRow } from "../estimating/cost-source-register-model";

export function CostSourceIcon({ name }: { name: string }) {
  const fallback: Record<string, ShellIconName> = { xmark: "close", plus: "plus", ellipsis: "more", user: "contacts", "magnifying-glass": "search", "circle-check": "check", "circle-exclamation": "warning", "chevron-right": "chevron-right", "chevron-down": "down", "rotate-left": "changes", files: "documents", building: "customers", calendar: "calendar", "calendar-exclamation": "calendar", gear: "settings", "bars-filter": "filter", lock: "lock" };
  return <FontAwesomeGlyph icon={name} className="cs-icon" fallback={<ShellIcon name={fallback[name] ?? "list"} />} />;
}
export const stateIcon = (state: string, own = false) => own ? "lock" : ({ Draft: "file-pen", Submitted: "clock", Reviewed: "circle-check", Returned: "rotate-left", Rejected: "xmark" })[state] ?? "file-pen";
export function CostSourceState({ row }: { row: Pick<CostSourceRow, "state" | "your_submission"> }) {
  return <span className="cs-state" data-state={row.state}><RegisterChip tone={row.state === "Returned" ? "attention" : "neutral"} icon={<CostSourceIcon name={stateIcon(row.state, row.your_submission)} />}>{sourceStateLabel(row)}</RegisterChip></span>;
}
export function CostSourceExpiry({ row, phone = false }: { row: Pick<CostSourceRow, "expiry_unknown" | "expiry_past" | "valid_until">; phone?: boolean }) {
  const warning = row.expiry_unknown || row.expiry_past;
  return <span className={warning ? "cs-warning" : ""}>{warning && !phone && <CostSourceIcon name="circle-exclamation" />}{phone ? row.expiry_unknown ? "Expiry unknown" : `${row.expiry_past ? "Expired" : "To"} ${sourceDate(row.valid_until)}` : sourceDate(row.valid_until)}</span>;
}
export function CostSourceReadNotice({ error, loading, reload }: { error: unknown; loading: boolean; reload: () => void }) {
  if (error) return <div className="cs-notice" role="alert"><strong>{denied(error) ? "Cost sources are outside your access" : (error as { code?: string }).code === "CostSourceRegisterChanged" ? "Cost sources changed during this read" : "Cost sources could not be loaded"}</strong><p>{denied(error) ? "Source evidence and counts have been removed. Choose a permitted identity or check access with your administrator." : "Refresh to read current evidence and permissions. Saved estimates and quotations are unchanged."}</p><Button onClick={reload}>Retry loading</Button></div>;
  return loading ? <div className="cs-notice" role="status">Loading permitted cost sources…</div> : null;
}
