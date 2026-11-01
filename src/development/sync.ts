// Server/CLI only: `npm run studio:sync`. Never import into a client component.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  documentationSlug,
  readMaster,
  registerPath,
  sourceRoutes,
} from "./catalog";
import type { Entry } from "./model";

// The page guide stub for a newly discovered page (ADR-0065): a Draft Markdown guide under docs/guides/pages, bound to
// the new register entry. Every value is written as a JSON string, which YAML reads as a double-quoted scalar, so a
// route pattern's [ and ] stay quoted. guides.json is left as it is.
function guideStub(entry: Entry, guideKey: string, sourceCommit: string) {
  const value = JSON.stringify;
  return `---
guide_key: ${value(guideKey)}
entry_key: ${value(entry.key)}
title: ${value(entry.title)}
status: Draft
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: ${value(sourceCommit)}
---

## Purpose and applicability {#purpose}

${entry.summary}

This guide was registered when the source page was discovered. Confirm the exact workflow before operational use.

## Using this page {#quick-start}

1. Open the intended local environment and confirm the page context.
2. Read the available page instructions and required inputs.
3. Inspect the result and retain any unresolved question for the page owner.

## If something is unavailable {#recovery}

Return to the development register to inspect source and design references. Source presence is separate from deployment, permissions and acceptance.
`;
}

const exists = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "EEXIST";

// Registers every source route that the register does not hold yet, with a design brief and a Draft guide stub, and
// returns how many it added. Existing entries, guides and statuses are never changed.
export async function syncNewRoutes(root: string): Promise<number> {
  const [master, routes] = await Promise.all([
    readMaster(root),
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
      guideKey = "guide." + documentationSlug({ key }),
      guideFile = "docs/guides/pages/" + guideKey + ".md";
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
      reviewer: null,
      owner: "Dean Fiedler",
      build_rank: null,
      related_keys: [],
    };
    master.entries.push(entry);
    await mkdir(dirname(resolve(root, guideFile)), { recursive: true });
    // A guide file an author already wrote for this page is kept.
    await writeFile(
      resolve(root, guideFile),
      guideStub(entry, guideKey, master.source_baseline),
      { flag: "wx" },
    ).catch((error) => {
      if (!exists(error)) throw error;
    });
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
  return added;
}
