import { readFileSync, readdirSync } from "node:fs";

// ui-baselines.json keeps the module integrations it held on 27 October 2026. Each later one is its
// own file, docs/standards/ui-baselines/module-integrations/<id>.json, so two page builds no longer
// append to the same array (PPO-MERGE-CONFLICT-DEC, 27 October 2026 amendment).
export const uiBaselinesPath = "docs/standards/ui-baselines.json";
export const moduleIntegrationsFolder =
  "docs/standards/ui-baselines/module-integrations";
export type ModuleIntegration = {
  id: string;
  route: string;
  scope: string;
  layout: string;
  scroll_owner?: string;
  design: string;
  sha256: string;
  shared_design: string;
  shared_sha256: string;
  component_proof: string;
  application_proof: string;
  authority: string;
  adaptations: string;
};
export function moduleIntegrationFiles(): string[] {
  try {
    return readdirSync(moduleIntegrationsFolder)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .map((name) => moduleIntegrationsFolder + "/" + name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
// The shared array first, then each file in name order.
export function moduleIntegrations(): ModuleIntegration[] {
  const shared = JSON.parse(readFileSync(uiBaselinesPath, "utf8"))
    .module_integrations as ModuleIntegration[];
  return [
    ...shared,
    ...moduleIntegrationFiles().map(
      (path) => JSON.parse(readFileSync(path, "utf8")) as ModuleIntegration,
    ),
  ];
}
export const moduleIntegration = (id: string) =>
  moduleIntegrations().find((entry) => entry.id === id);
