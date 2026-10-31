"use client";
import { FontAwesomeGlyph } from "./font-awesome";
import { ShellIcon, type ShellIconName } from "./shell-icon";
const fallback: Record<string, ShellIconName> = {
  list: "list", user: "contacts", "list-check": "work", "badge-check": "check",
  "circle-check": "check", clock: "calendar", "file-pen": "edit",
  "circle-exclamation": "warning", "calendar-exclamation": "calendar",
  "magnifying-glass": "search", plus: "plus", "rotate-left": "changes",
  ellipsis: "more", gear: "settings", "bars-filter": "filter", "chevron-right": "chevron-right",
  "chevron-left": "chevron-left", xmark: "close", building: "customers",
  "diagram-project": "projects", "arrow-right": "chevron-right", files: "documents",
  sitemap: "engineering", "layer-group": "products", "code-pull-request": "changes", gauge: "engineering",
};
export function EngineeringIcon({ name }: { name: string }) {
  return <FontAwesomeGlyph icon={name} className="er-icon" fallback={<span className="er-icon"><ShellIcon name={fallback[name] ?? "list"} /></span>} />;
}

