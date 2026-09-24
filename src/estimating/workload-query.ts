import { invalid, object } from "../shared/validation";

export const workloadViews = [
  "all",
  "unstarted",
  "clarification",
  "ready",
  "legacy",
] as const;
export type WorkloadState = Exclude<(typeof workloadViews)[number], "all">;
export function workloadQuery(value: Record<string, string>) {
  const input = object(value, ["q", "view", "owner", "sort"]);
  const q = typeof input.q === "string" ? input.q.trim() : "";
  if (q.length > 100) invalid("q", "Use at most 100 characters.");
  const view = input.view ?? "all",
    owner = input.owner ?? "all",
    sort = input.sort ?? "updated";
  if (!workloadViews.includes(view as (typeof workloadViews)[number]))
    invalid("view", "Choose a workload view.");
  if (!["all", "mine"].includes(owner as string))
    invalid("owner", "Choose all owners or my estimating work.");
  if (!["updated", "customer"].includes(sort as string))
    invalid("sort", "Choose recently changed or customer.");
  return {
    q,
    view: view as (typeof workloadViews)[number],
    owner: owner as "all" | "mine",
    sort: sort as "updated" | "customer",
  };
}

export function workloadState(
  readiness: "NotRecorded" | "Incomplete" | "Complete" | null,
): WorkloadState {
  if (readiness === null) return "unstarted";
  if (readiness === "NotRecorded") return "legacy";
  return readiness === "Complete" ? "ready" : "clarification";
}

export const workloadLabels: Record<WorkloadState, string> = {
  unstarted: "Discovery not started",
  clarification: "Scope clarification",
  ready: "Discovery complete",
  legacy: "Legacy manual basis",
};
