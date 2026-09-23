import type { ImportPreview } from "./interchange";

/** Client-safe placement rules for held legacy fields (ADR-0044). */
export type PlacementDisposition =
  "keep_as_note" | "covered_by_discovery_binding";
export interface Placement {
  path: string;
  disposition: PlacementDisposition;
}

/** Only the project's identity fields are owned by the Discovery binding. */
export const bindingPaths = [
  "project.reference",
  "project.customer",
  "project.site",
] as const;

export const placeableSchemas: ImportPreview["source_schema"][] = [
  "standalone_1",
  "standalone_2",
];

/** Default placement a reviewer starts from; every one is shown before use. */
export const proposedPlacement = (path: string): PlacementDisposition =>
  (bindingPaths as readonly string[]).includes(path)
    ? "covered_by_discovery_binding"
    : "keep_as_note";
