// Server/CLI filesystem reader. Never import into a client component.
import { readFile, readdir, realpath } from "node:fs/promises";
import { resolve, relative, extname, isAbsolute, sep, posix } from "node:path";
import { createHash } from "node:crypto";
import type { Catalog, Entry, Guide, Register, Resource } from "./model";

export const registerPath = "docs/design/development/register.json";
export const guidePath = "docs/design/development/guides.json";
const digest = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export const resourceId = (path: string) => digest(path).slice(0, 24);
export async function containedPath(
  root: string,
  path: string,
): Promise<string> {
  if (
    isAbsolute(path) ||
    path.includes("\\") ||
    path.split("/").includes("..") ||
    !["docs", "src", "public", "reference", "scripts"].includes(
      path.split("/")[0],
    )
  )
    throw Error("Reference path is outside the registered workspace.");
  const base = await realpath(root),
    target = await realpath(resolve(base, path)),
    rel = relative(base, target);
  if (!rel || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel))
    throw Error("Reference path is outside the registered workspace.");
  return target;
}
export async function readReference(
  root: string,
  path: string,
): Promise<Buffer> {
  return readFile(await containedPath(root, path));
}
async function files(root: string, folder: string): Promise<string[]> {
  const children = await readdir(resolve(root, folder), {
    withFileTypes: true,
  });
  const lists = await Promise.all(
    children
      .filter((c) => !c.isSymbolicLink())
      .map((c) =>
        c.isDirectory()
          ? files(root, folder + "/" + c.name)
          : Promise.resolve([folder + "/" + c.name]),
      ),
  );
  return lists.flat().sort();
}
export async function sourceRoutes(root: string) {
  const routes = (await files(root, "src/app"))
    .filter((p) => p.endsWith("/page.tsx"))
    .map((source) => ({
      source,
      path:
        "/" +
        source
          .slice("src/app/".length, -"/page.tsx".length)
          .split("/")
          .filter((p) => !p.startsWith("("))
          .join("/"),
    }));
  const launcher = await readReference(root, "scripts/local-server.ts").catch(
    () => null,
  );
  if (launcher?.toString().includes("sendLoginPage"))
    routes.push({ source: "scripts/local-server.ts", path: "/login" });
  return routes;
}
export async function readMaster(root: string): Promise<Register> {
  const master = JSON.parse(
    (await readReference(root, registerPath)).toString(),
  ) as Register;
  if (
    master.schema_version !== 1 ||
    !Array.isArray(master.entries) ||
    !Array.isArray(master.shared_sources)
  )
    throw Error("Unsupported development-register schema.");
  return master;
}
export async function readGuides(root: string): Promise<Guide[]> {
  return JSON.parse((await readReference(root, guidePath)).toString()).guides;
}
export async function buildCatalog(root: string): Promise<Catalog> {
  const [master, guides, routes, journeyFiles, css] = await Promise.all([
    readMaster(root),
    readGuides(root),
    sourceRoutes(root),
    files(root, "docs/reference/ui/module-workflow-maps"),
    readReference(root, "src/app/globals.css"),
  ]);
  const errors: string[] = [],
    cache = new Map<string, Promise<Buffer | null>>();
  const raw = (path: string) => {
    if (!cache.has(path))
      cache.set(
        path,
        readReference(root, path).catch(() => null),
      );
    return cache.get(path)!;
  };
  const imports = new Map<string, Promise<string[]>>();
  const importsOf = (path: string): Promise<string[]> => {
    if (!imports.has(path))
      imports.set(
        path,
        (async () => {
          if (!/\.[cm]?[jt]sx?$/.test(path)) return [];
          const source = (await raw(path))?.toString() || "",
            result: string[] = [];
          // Follow literal relative imports/re-exports. Runtime-computed files belong in explicit dependencies.
          for (const match of source.matchAll(
            /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"](\.[^'"]+)['"]/g,
          )) {
            const base = posix.normalize(
              posix.join(posix.dirname(path), match[1]),
            );
            for (const candidate of [
              base,
              ...[
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
                ".css",
                ".json",
                "/index.ts",
                "/index.tsx",
              ].map((ext) => base + ext),
            ]) {
              if (await raw(candidate)) {
                result.push(candidate);
                break;
              }
            }
          }
          return result;
        })(),
      );
    return imports.get(path)!;
  };
  const dependenciesOf = async (paths: string[]) => {
    const seen = new Set(paths),
      pending = [...paths];
    while (pending.length) {
      for (const child of await importsOf(pending.pop()!))
        if (!seen.has(child)) {
          seen.add(child);
          pending.push(child);
        }
    }
    return [...seen].sort();
  };
  const resource = async (
    path: string,
    group: string,
    module: string | null,
  ): Promise<Resource> => {
    const bytes = await raw(path),
      extension = extname(path).toLowerCase();
    if (![".md", ".html", ".png", ".jpg", ".jpeg", ".webp"].includes(extension))
      throw Error("Unsupported published reference type: " + path);
    return {
      id: resourceId(path),
      path,
      title: path.split("/").at(-1)!.replace(/[-_]/g, " "),
      type:
        extension === ".html"
          ? "html"
          : [".png", ".jpg", ".jpeg", ".webp"].includes(extension)
            ? "image"
            : "markdown",
      sha256: bytes ? digest(bytes) : "",
      missing: !bytes,
      current: true,
      group,
      module,
    };
  };
  const entries = await Promise.all(
    master.entries.map(async (entry) => {
      const issues: string[] = [],
        guide = guides.find((g) => g.guide_key === entry.guide_key);
      const matchedSource = routes.find(
        (r) =>
          r.path === entry.path?.split("?")[0].replace(/\{([^}]+)\}/g, "[$1]"),
      )?.source;
      const paths = await dependenciesOf([
        ...new Set([
          ...master.shared_sources,
          ...entry.source_paths,
          ...(matchedSource ? [matchedSource] : []),
          ...entry.dependencies,
          entry.design_path,
          ...entry.image_paths,
          ...(entry.html_path ? [entry.html_path] : []),
        ]),
      ]);
      const hashes = await Promise.all(
        paths.map(async (path) => {
          const bytes = await raw(path);
          if (!bytes) issues.push("Missing reference: " + path);
          return (
            path +
            ":" +
            (bytes
              ? digest(
                  /\.(png|jpe?g|webp)$/i.test(path)
                    ? bytes
                    : bytes.toString().replace(/\r\n/g, "\n"),
                )
              : "missing")
          );
        }),
      );
      const fingerprint = digest(
        hashes.join("\n") + "\n" + JSON.stringify(guide || null),
      );
      const present =
        routes.some((r) => r.path === entry.path) ||
        entry.path === "/offline/index.html" ||
        (entry.kind === "system" &&
          entry.source_paths.some((p) => p.startsWith("src/")));
      if (entry.kind !== "system" && !guide) issues.push("User guide missing");
      if (!entry.image_paths.length) issues.push("UI image not linked");
      if (!entry.review_fingerprint)
        issues.push("Desktop/mobile visual review pending");
      else if (entry.review_fingerprint !== fingerprint)
        issues.push("Source or design changed since review");
      for (const key of entry.related_keys)
        if (!master.entries.some((e) => e.key === key))
          issues.push("Unknown related entry: " + key);
      const references = [
        entry.design_path,
        ...entry.image_paths,
        ...(entry.html_path ? [entry.html_path] : []),
      ];
      return {
        ...entry,
        source_present: present,
        fingerprint,
        review_state: !entry.review_fingerprint
          ? ("Not reviewed" as const)
          : entry.review_fingerprint === fingerprint
            ? ("Current" as const)
            : ("Stale" as const),
        guide_status: guide
          ? `${guide.status} ${guide.revision}`
          : entry.kind === "system"
            ? "Reference document"
            : "Missing",
        resources: await Promise.all(
          [...new Set(references)].map((p) =>
            resource(p, "Entry reference", entry.module),
          ),
        ),
        issues,
      };
    }),
  );
  const keys = entries.map((e) => e.key);
  if (new Set(keys).size !== keys.length)
    errors.push("Duplicate stable entry keys.");
  if (new Set(guides.map((g) => g.guide_key)).size !== guides.length)
    errors.push("Duplicate guide keys.");
  for (const guide of guides)
    if (
      !entries.some(
        (e) => e.key === guide.entry_key && e.guide_key === guide.guide_key,
      )
    )
      errors.push("Guide binding does not resolve: " + guide.guide_key);
  const unregistered = routes
    .filter(
      (r) =>
        !r.path.startsWith("/crm/") &&
        !entries.some((e) => e.kind === "route" && e.path === r.path),
    )
    .map((r) => r.path);
  if (unregistered.length)
    errors.push(`${unregistered.length} source route(s) require registration.`);
  for (const e of entries) {
    if (e.kind === "route" && !e.source_present)
      errors.push("Registered source route removed: " + e.path);
    for (const issue of e.issues)
      if (/^(Missing reference|User guide missing|Unknown related)/.test(issue))
        errors.push(e.key + ": " + issue);
  }
  const journeys = await Promise.all(
    journeyFiles
      .filter((p) => p.endsWith(".html"))
      .map((p) => resource(p, "Journey map", null)),
  );
  for (const item of journeys) {
    const family = item.path.replace(/-r\d+\.html$/i, "");
    const revision = Number(item.path.match(/-r(\d+)\.html$/i)?.[1] || 0);
    item.current = !journeys.some(
      (other) =>
        other.path.replace(/-r\d+\.html$/i, "") === family &&
        Number(other.path.match(/-r(\d+)\.html$/i)?.[1] || 0) > revision,
    );
  }
  const rootBlock = css.toString().match(/:root\s*\{([\s\S]*?)\}/)?.[1] || "";
  const tokens = [...rootBlock.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
    (m) => ({ name: m[1], value: m[2].trim() }),
  );
  return {
    schema_version: 1,
    title: master.title,
    source_baseline: master.source_baseline,
    observed_at: new Date().toISOString(),
    fingerprint: digest(JSON.stringify([entries, journeys, tokens])),
    local_base: master.local_base,
    live_base: master.live_base,
    entries,
    journeys,
    tokens,
    unregistered_routes: unregistered,
    errors,
  };
}
export function resourcesFor(catalog: Catalog): Resource[] {
  return [...catalog.entries.flatMap((e) => e.resources), ...catalog.journeys];
}
export function documentationSlug(entry: Pick<Entry, "key">): string {
  return entry.key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
}
