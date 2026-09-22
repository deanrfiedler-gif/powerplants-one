import { calculate } from "./engine";
import type { Scope } from "./types";

/** Read-only alternatives over one shared physical proposal, never combined duty. */
export function compareOperatingScenarios(scope: Scope, ids: string[]) {
  if (ids.length < 2 || ids.length > 4 || new Set(ids).size !== ids.length)
    throw new Error("Choose between two and four different scenarios.");
  return ids.map((id) => {
    const scenario = scope.scenarios.find((row) => row.id === id);
    if (!scenario)
      throw new Error("A selected scenario is no longer in this proposal.");
    return {
      scenario: structuredClone(scenario),
      calculation: calculate({ ...scope, selected_scenario_id: id }),
    };
  });
}
