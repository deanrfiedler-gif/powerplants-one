import { canOpen, pageForPath, type WorkspaceId } from "./navigation";
import type { QuickAction } from "./model";

// Presentation metadata only. Available actions still come from the server and
// destination readiness/workspace membership still comes from navigation.ts.
const shared = new Set(["customer", "contact", "site", "equipment"]);
const accelerators: Readonly<Record<string, string>> = {
  opportunity: "D",
  lead: "L",
  activity: "A",
  contact: "C",
  customer: "O",
  site: "S",
};
export type RefinedAction = QuickAction & { accelerator?: string };
export function refinedActionGroups(
  actions: QuickAction[],
  workspace: WorkspaceId,
  permitted: readonly string[],
  hosted: boolean,
) {
  const groups: {
    current: RefinedAction[];
    shared: RefinedAction[];
    other: RefinedAction[];
  } = { current: [], shared: [], other: [] };
  for (const action of actions) {
    const page = pageForPath(action.href.split("?")[0]);
    if (
      !page ||
      page.readiness !== "ready" ||
      !canOpen(page, permitted, hosted)
    )
      continue;
    const group = shared.has(action.id)
      ? groups.shared
      : page.workspace === workspace || action.id === "activity"
        ? groups.current
        : groups.other;
    group.push({
      ...action,
      label:
        action.id === "opportunity"
          ? "Deal"
          : action.id === "customer"
            ? "Organisation"
            : action.label,
      accelerator: accelerators[action.id],
    });
  }
  return groups;
}
