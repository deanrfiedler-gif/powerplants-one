// Server/CLI only. Working files are read at request time; no browser file paths are accepted.
import { createHash } from "node:crypto";
import { posix } from "node:path";
import { readReference, resourceId } from "./catalog";
import { resourceHref, type Catalog } from "./model";
import {
  componentCategories,
  componentReviewState,
  exampleIds,
  type ComponentManifest,
  type ComponentLibrary,
} from "./component-model";
export const componentManifestPath = "docs/design/development/components.json";
export async function readComponentManifest(
  root: string,
): Promise<ComponentManifest> {
  const result = JSON.parse(
    (await readReference(root, componentManifestPath)).toString(),
  ) as ComponentManifest;
  if (result.schema_version !== 1 || !Array.isArray(result.entries))
    throw Error("Unsupported component catalogue schema.");
  return result;
}
const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export async function buildComponentLibrary(
  root: string,
  catalog: Catalog,
  supplied?: ComponentManifest,
): Promise<ComponentLibrary> {
  const manifest = supplied ?? (await readComponentManifest(root)),
    errors: string[] = [],
    cache = new Map<string, Promise<Buffer | null>>();
  const raw = (path: string) => {
    if (!cache.has(path))
      cache.set(
        path,
        readReference(root, path).catch(() => null),
      );
    return cache.get(path)!;
  };
  const dependencies = new Map<string, Promise<string[]>>();
  function imports(path: string): Promise<string[]> {
    if (!dependencies.has(path))
      dependencies.set(
        path,
        (async () => {
          if (!/\.[cm]?[jt]sx?$/.test(path)) return [];
          const source = (await raw(path))?.toString() ?? "",
            result: string[] = [];
          for (const match of source.matchAll(
            /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"](\.[^'"]+)['"]/g,
          )) {
            const base = posix.normalize(
              posix.join(posix.dirname(path), match[1]),
            );
            for (const suffix of [
              "",
              ".ts",
              ".tsx",
              ".js",
              ".jsx",
              ".css",
              ".json",
              "/index.ts",
              "/index.tsx",
            ]) {
              if (await raw(base + suffix)) {
                result.push(base + suffix);
                break;
              }
            }
          }
          return result;
        })(),
      );
    return dependencies.get(path)!;
  }
  const ids = manifest.entries.map((e) => e.id);
  if (new Set(ids).size !== ids.length) errors.push("Duplicate component IDs.");
  for (const category of componentCategories)
    if (!manifest.entries.some((e) => e.category === category))
      errors.push("Missing component category: " + category);
  for (const id of exampleIds)
    if (!manifest.entries.some((e) => e.example === id))
      errors.push("Unregistered example renderer: " + id);
  const entries = await Promise.all(
    manifest.entries.map(async (entry) => {
      const fail = (message: string) => errors.push(entry.id + ": " + message);
      if (
        !/^[a-z][a-z0-9-]*$/.test(entry.id) ||
        !entry.title ||
        !entry.owner ||
        !componentCategories.includes(entry.category)
      )
        fail("Invalid identity, owner or category.");
      if (
        !["Runnable", "Host example", "Reference only"].includes(entry.coverage)
      )
        fail("Invalid coverage.");
      if (
        entry.coverage === "Runnable" &&
        (!entry.example ||
          !exampleIds.includes(entry.example) ||
          !entry.states.length ||
          !entry.implementation.length)
      )
        fail(
          "Runnable coverage requires renderer, states and actual implementation.",
        );
      if (entry.coverage !== "Runnable" && entry.example)
        fail("Only runnable entries may have an isolated example.");
      if (
        new Set(entry.states.map((s) => s.id)).size !== entry.states.length ||
        entry.states.some((s) => !s.label || !s.description)
      )
        fail("State labels must be unique and documented.");
      for (const key of entry.used_on)
        if (!catalog.entries.some((e) => e.key === key))
          fail("Unknown consuming page: " + key);
      if (!entry.used_on.length) fail("An owning page or system is required.");
      for (const key of entry.used_on) {
        const consumer = catalog.entries.find((e) => e.key === key);
        if (consumer?.kind !== "route" || !entry.implementation.length)
          continue;
        const seen = new Set(consumer.source_paths),
          remaining = [...seen];
        while (remaining.length)
          for (const child of await imports(remaining.pop()!))
            if (!seen.has(child)) {
              seen.add(child);
              remaining.push(child);
            }
        if (!entry.implementation.some((i) => seen.has(i.path)))
          fail("Consumer does not import the mapped implementation: " + key);
      }
      const paths = new Set([
          entry.specification,
          entry.reference.path,
          ...entry.implementation.map((i) => i.path),
          ...entry.dependencies,
          ...(entry.review?.evidence ?? []),
        ]),
        pending = [...paths];
      while (pending.length)
        for (const child of await imports(pending.pop()!))
          if (!paths.has(child)) {
            paths.add(child);
            pending.push(child);
          }
      const parts = await Promise.all(
        [...paths].sort().map(async (path) => {
          const bytes = await raw(path);
          if (!bytes) fail("Missing source/reference: " + path);
          return (
            path +
            ":" +
            (bytes
              ? hash(
                  /\.(png|jpe?g|webp)$/.test(path)
                    ? bytes
                    : bytes.toString().replace(/\r\n/g, "\n"),
                )
              : "missing")
          );
        }),
      );
      for (const item of entry.implementation) {
        const source = (await raw(item.path))?.toString() ?? "";
        if (
          !new RegExp(
            `export\\s+(?:function|const|class)\\s+${item.symbol}\\b`,
          ).test(source)
        )
          fail("Application export missing: " + item.symbol);
      }
      const spec = (await raw(entry.specification))?.toString() ?? "";
      if (!/^## Desktop\s*$/m.test(spec) || !/^## Mobile\s*$/m.test(spec))
        fail("Desktop/mobile specification missing.");
      const ref = await raw(entry.reference.path);
      if (
        entry.reference.anchor &&
        !ref?.toString().includes(`id="${entry.reference.anchor}"`)
      )
        fail("Reference anchor missing.");
      if (
        entry.gaps.some(
          (g) => !g.owner || !g.action || !g.actual || !g.expected,
        )
      )
        fail("Alignment differences require owner, observation and action.");
      if (
        entry.review &&
        (!entry.review.reviewer ||
          !entry.review.date ||
          !entry.review.fingerprint ||
          !entry.review.evidence.length)
      )
        fail("Review requires reviewer, date, fingerprint and evidence.");
      const { review, ...content } = entry;
      void review;
      const fingerprint = hash(parts.join("\n") + JSON.stringify(content));
      const refAt = catalog.checkout_commit ?? "main",
        base = "https://github.com/deanrfiedler-gif/powerplants-one/";
      return {
        ...entry,
        fingerprint,
        review_state: componentReviewState(entry, fingerprint),
        source_url: base + "blob/" + refAt + "/",
        history_url: base + "commits/" + refAt + "/" + entry.specification,
        reference_url:
          resourceHref(
            resourceId(entry.reference.path),
            false,
            ref ? hash(ref) : "",
          ) + (entry.reference.anchor ? "#" + entry.reference.anchor : ""),
      };
    }),
  );
  const baselines = JSON.parse(
    (await readReference(root, "docs/standards/ui-baselines.json")).toString(),
  );
  return {
    entries,
    errors,
    checkout_commit: catalog.checkout_commit,
    divergences: baselines.known_divergences.entries,
  };
}
