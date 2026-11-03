import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildCatalog, readGuideSources, readMaster, guideReviewState, guidePath, markdownGuideDocument, readReference, resourcesFor } from "../src/development/catalog";
import { buildComponentLibrary } from "../src/development/component-catalog";
import { fileHistories } from "../src/development/history";
import { snapshotPath, type DevelopmentSnapshot } from "../src/development/snapshot";
import { createHash } from "node:crypto";

const commit = process.env.PPO_BUILD_COMMIT;
if (!commit || !/^[0-9a-f]{40}$/.test(commit)) throw Error("PPO_BUILD_COMMIT must identify the exact image source commit.");
const root = process.cwd(), catalog = await buildCatalog(root);
if (catalog.checkout_commit !== commit) throw Error("Source checkout does not match the selected build commit.");
const components = await buildComponentLibrary(root, catalog);
if (catalog.errors.length || components.errors.length) throw Error([...catalog.errors, ...components.errors].join("\n"));
for (const resource of resourcesFor(catalog).filter(r => !r.missing)) {
  const bytes = await readReference(root, resource.path);
  if (createHash("sha256").update(bytes).digest("hex") !== resource.sha256) throw Error("Reference changed during packaging.");
}
// guides.json shares one file history; each Markdown guide has its own file's history.
const sources = await readGuideSources(root, (await readMaster(root)).entries);
const histories = await fileHistories(root, [guidePath, ...sources.markdown.map(g => g.path)]);
const history = histories.get(guidePath)!;
const markdownGuides = sources.markdown.map(g => markdownGuideDocument(g, histories.get(g.path)!));
if ([history, ...markdownGuides.map(g => g.history), ...resourcesFor(catalog).map(r => r.history)].some(h => h.state === "Uncommitted changes")) throw Error("Commit working reference changes before packaging a release.");
const guides = [...sources.json.map(g => ({ ...g, history, review_state: guideReviewState(g) })), ...markdownGuides];
catalog.release = { mode: "hosted", commit, packaged_at: new Date().toISOString() };
const value: DevelopmentSnapshot = { schema_version: 1, commit, catalog, components, guides };
await mkdir(dirname(join(root, snapshotPath)), { recursive: true });
await writeFile(join(root, snapshotPath), JSON.stringify(value));
console.log(`Packaged design workspace: ${catalog.entries.length} entries, ${components.entries.length} components, ${markdownGuides.length} Markdown guides; source ${commit}.`);
