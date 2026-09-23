// Server/build only. The deployed image contains a validated, immutable catalogue.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Catalog, GuideDocument } from "./model";
import type { ComponentLibrary } from "./component-model";

export const snapshotPath = ".ppo-development/snapshot.json";
export type DevelopmentSnapshot = {
  schema_version: 1;
  commit: string;
  catalog: Catalog;
  components: ComponentLibrary;
  guides: GuideDocument[];
};
export async function readDevelopmentSnapshot(root: string, commit: string | undefined): Promise<DevelopmentSnapshot> {
  if (!commit || !/^[0-9a-f]{40}$/.test(commit)) throw Error("A verified deployment commit is required.");
  const value = JSON.parse(await readFile(join(root, snapshotPath), "utf8")) as DevelopmentSnapshot;
  if (value.schema_version !== 1 || value.commit !== commit || value.catalog?.checkout_commit !== commit ||
      value.catalog.schema_version !== 2 || value.components?.checkout_commit !== commit ||
      value.catalog.errors.length || value.components.errors.length || !Array.isArray(value.guides))
    throw Error("The deployed development snapshot does not match this release.");
  return value;
}
