import { buildComponentLibrary } from "../src/development/component-catalog";
import {
  frozenComponentManifestErrors,
  specificationGrowthErrors,
} from "../src/development/component-model";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildCatalog,
  componentManifestPath,
  specificationSizesPath,
} from "../src/development/catalog";
import { syncNewRoutes } from "../src/development/sync";
const root = process.cwd();
if (process.argv.includes("--sync")) {
  const added = await syncNewRoutes(root);
  console.log(
    `Registered ${added} newly discovered pages, each with a Draft guide stub under docs/guides/pages. Existing editorial content and statuses retained.`,
  );
}
const catalog = await buildCatalog(root);
const components = await buildComponentLibrary(root, catalog);
catalog.errors.push(...components.errors);
// components.json is frozen; new components and consumer items go in binding files.
catalog.errors.push(
  ...frozenComponentManifestErrors(
    JSON.parse(await readFile(resolve(root, componentManifestPath), "utf8")),
  ),
);
// So are the specifications' sizes; a page's consumer note goes beside its binding file.
const specificationSizes: Record<string, number> = JSON.parse(
  await readFile(resolve(root, specificationSizesPath), "utf8"),
).blocks;
const specifications: Record<string, string> = {};
for (const name of Object.keys(specificationSizes))
  specifications[name] = await readFile(
    resolve(root, "docs/design/development/components", name),
    "utf8",
  ).catch(() => "");
catalog.errors.push(
  ...specificationGrowthErrors(specificationSizes, specifications),
);
for (const entry of catalog.entries) {
  const spec = await readFile(resolve(root, entry.design_path), "utf8");
  if (!/^## Desktop\s*$/m.test(spec) || !/^## Mobile\s*$/m.test(spec))
    catalog.errors.push(
      entry.key + ": design reference needs Desktop and Mobile sections.",
    );
}
console.log(
  JSON.stringify(
    {
      entries: catalog.entries.length,
      component_entries: components.entries.length,
      runnable_components: components.entries.filter(e=>e.coverage === "Runnable").length,
      component_reviews_pending: components.entries.filter(e=>e.review_state !== "Current").length,
      journeys: catalog.journeys.length,
      current_journeys: catalog.journeys.filter((j) => j.current).length,
      source_routes: catalog.entries.filter((e) => e.kind === "route").length,
      errors: catalog.errors,
      unreviewed: catalog.entries.filter(
        (e) => e.review_state === "Not reviewed",
      ).length,
      stale: catalog.entries.filter((e) => e.review_state === "Stale").length,
      stale_entries: catalog.entries
        .filter((e) => e.review_state === "Stale")
        .map((e) => e.key),
      scope:
        "Coverage and reference integrity; visual/functional acceptance is separately recorded.",
    },
    null,
    2,
  ),
);
if (catalog.errors.length) process.exitCode = 1;
