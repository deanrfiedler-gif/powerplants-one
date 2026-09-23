import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildCatalog,
  readMaster,
  readGuides,
  sourceRoutes,
  registerPath,
  guidePath,
  documentationSlug,
} from "../src/development/catalog";
import type { Entry, Guide } from "../src/development/model";
const root = process.cwd();
if (process.argv.includes("--sync")) {
  const [master, guides, routes] = await Promise.all([
    readMaster(root),
    readGuides(root),
    sourceRoutes(root),
  ]);
  let added = 0;
  for (const route of routes) {
    if (
      route.path.startsWith("/crm/") ||
      master.entries.some((e) => e.kind === "route" && e.path === route.path)
    )
      continue;
    const key = "route:" + route.path,
      title =
        route.path
          .split("/")
          .filter(Boolean)
          .map((p) => p.replace(/[-[\]]/g, " "))
          .join(" / ") || "Home";
    const design =
        "docs/design/development/pages/" + documentationSlug({ key }) + ".md",
      guideKey = "guide." + documentationSlug({ key });
    const entry: Entry = {
      key,
      title,
      kind: "route",
      module: route.path.startsWith("/development")
        ? "Development"
        : "Unassigned",
      summary:
        "New source page. Confirm its scope, guide and desktop/mobile design in this change.",
      path: route.path,
      source_paths: [route.source],
      guide_key: guideKey,
      design_path: design,
      html_path: null,
      image_paths: [],
      dependencies: [],
      scope_status: "New source; editorial review pending",
      visual_status: "Needs review",
      functional_status: "Not recorded here",
      deployment_status: "Not verified",
      review_fingerprint: null,
      reviewed_at: null,
      owner: "Dean Fiedler",
      build_rank: null,
      related_keys: [],
    };
    master.entries.push(entry);
    const guide: Guide = {
      guide_key: guideKey,
      entry_key: key,
      title,
      status: "Draft",
      revision: "r01",
      content_mode: "New source; review needed",
      source_commit: master.source_baseline,
      related_entry_keys: [],
      sections: [
        {
          section_id: "purpose",
          title: "Purpose and applicability",
          paragraphs: [
            entry.summary,
            "This guide was registered when the source page was discovered. Confirm the exact workflow before operational use.",
          ],
          steps: [],
          headers: [],
          rows: [],
        },
        {
          section_id: "quick-start",
          title: "Using this page",
          paragraphs: [],
          steps: [
            "Open the intended local environment and confirm the page context.",
            "Read the available page instructions and required inputs.",
            "Inspect the result and retain any unresolved question for the page owner.",
          ],
          headers: [],
          rows: [],
        },
        {
          section_id: "recovery",
          title: "If something is unavailable",
          paragraphs: [
            "Return to the development register to inspect source and design references. Source presence is separate from deployment, permissions and acceptance.",
          ],
          steps: [],
          headers: [],
          rows: [],
        },
      ],
    };
    guides.push(guide);
    await mkdir(dirname(resolve(root, design)), { recursive: true });
    await writeFile(
      resolve(root, design),
      `# ${title} — design reference\n\nStable entry: ${key}. Draft; owner review pending.\n\n## Desktop\n\nUse the existing shell and shared controls. Retain one scrolling owner, visible page context, descriptive actions and the relevant source/reference links. Verify 1440 × 960 and 1024 × 768.\n\n## Mobile\n\nStack dense content at 390 × 844 and 320 CSS px. Preserve every task, visible focus, readable labels and reachable close actions. Verify long content and 200% zoom.\n\n## Evidence and boundaries\n\nSource: ${route.source}. Visual review, functional checks and deployment remain separately recorded. Replace this discovery brief with the page-specific contract in the same implementation PR.\n`,
    );
    added++;
  }
  await writeFile(
    resolve(root, registerPath),
    JSON.stringify(master, null, 2) + "\n",
  );
  await writeFile(
    resolve(root, guidePath),
    JSON.stringify({ schema_version: 1, guides }, null, 2) + "\n",
  );
  console.log(
    `Registered ${added} newly discovered pages. Existing editorial content and statuses retained.`,
  );
}
const catalog = await buildCatalog(root);
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
      journeys: catalog.journeys.length,
      current_journeys: catalog.journeys.filter((j) => j.current).length,
      source_routes: catalog.entries.filter((e) => e.kind === "route").length,
      errors: catalog.errors,
      unreviewed: catalog.entries.filter(
        (e) => e.review_state === "Not reviewed",
      ).length,
      stale: catalog.entries.filter((e) => e.review_state === "Stale").length,
      scope:
        "Coverage and reference integrity; visual/functional acceptance is separately recorded.",
    },
    null,
    2,
  ),
);
if (catalog.errors.length) process.exitCode = 1;
