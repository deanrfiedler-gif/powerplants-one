export const componentCategories = [
  "Foundations",
  "Tables & grids",
  "Boards & cards",
  "Gantt",
  "Scheduling",
  "Forms",
  "Navigation",
  "Dialogs & overlays",
  "Feedback",
  "Mobile",
] as const;
export const exampleIds = [
  "products",
  "foundations",
  "buttons",
  "sales-table",
  "register-table",
  "area-editor",
  "sales-board",
  "forecast",
  "gantt",
  "planner",
  "appointment",
  "fields",
  "lookup",
  "validation",
  "tabs",
  "menu",
  "dialog",
  "drawer",
  "read-state",
  "status",
  "mobile-form",
] as const;
export type ExampleId = (typeof exampleIds)[number];
export const figmaMappingStates = [
  "Mapped",
  "Partial",
  "Proposal only",
  "None",
] as const;
export type ComponentRecord = {
  id: string;
  title: string;
  category: (typeof componentCategories)[number];
  module: string;
  purpose: string;
  owner: string;
  example: ExampleId | null;
  coverage: "Runnable" | "Host example" | "Reference only";
  states: { id: string; label: string; description: string }[];
  implementation: { path: string; symbol: string }[];
  dependencies: string[];
  reference: { path: string; anchor: string; status: string };
  specification: string;
  used_on: string[];
  desktop: string;
  mobile: string;
  keyboard: string;
  limitations: string;
  gaps: {
    id: string;
    expected: string;
    actual: string;
    action: string;
    priority: "High" | "Medium" | "Low";
    owner: string;
  }[];
  // Main components in the "PPO - Design" Figma file, cited by node ID only;
  // the file link stays out of the public repository (ADR-0053).
  figma: {
    status: (typeof figmaMappingStates)[number];
    location: string;
    components: { node: string; name: string }[];
    note: string;
  };
  review: {
    fingerprint: string;
    reviewer: string;
    date: string;
    evidence: string[];
    result: "Aligned" | "Differences recorded" | "Accepted exception";
  } | null;
};
export type ComponentManifest = {
  schema_version: 1;
  entries: ComponentRecord[];
};
// A page change records the components it uses in its own binding file under
// docs/design/development/component-bindings/ instead of appending to components.json, which
// is frozen (PPO-MERGE-CONFLICT-DEC, 27 October 2026 amendment). applyComponentBindings sets the order.
export const componentBindingLists = [
  "states",
  "dependencies",
  "used_on",
  "gaps",
] as const;
type BindingList = (typeof componentBindingLists)[number];
export type ComponentBinding = {
  schema_version: 1;
  entries?: ComponentRecord[];
  bindings?: Record<string, Partial<Pick<ComponentRecord, BindingList>>>;
};
// Copies keep every key in place: the component fingerprint hashes the record as written.
const copyLists = (entry: ComponentRecord): ComponentRecord => {
  const copy = { ...entry } as Record<BindingList, unknown[]>;
  for (const list of componentBindingLists)
    if (Array.isArray(entry[list])) copy[list] = [...entry[list]];
  return copy as unknown as ComponentRecord;
};
// Canonical order, not landing order: components.json's records stay first; then every file's
// new records, then every file's bound items, each in file-name order. All records are known
// before any binding applies, so a binding may name a component defined in any file.
export function applyComponentBindings(
  manifest: ComponentManifest,
  files: { path: string; binding: ComponentBinding }[],
): ComponentManifest {
  const entries = manifest.entries.map(copyLists);
  const failure =
    (path: string) =>
    (message: string): never => {
      throw Error(path + ": " + message);
    };
  for (const { path, binding } of files) {
    const fail = failure(path);
    if (binding.schema_version !== 1)
      fail("unsupported component binding schema.");
    for (const key of Object.keys(binding))
      if (!["schema_version", "entries", "bindings"].includes(key))
        fail("unknown key: " + key);
    for (const record of binding.entries ?? []) {
      if (entries.some((e) => e.id === record.id))
        fail("component already defined: " + record.id);
      entries.push(copyLists(record));
    }
  }
  for (const { path, binding } of files) {
    const fail = failure(path);
    for (const [id, lists] of Object.entries(binding.bindings ?? {})) {
      const entry =
        entries.find((e) => e.id === id) ?? fail("unknown component: " + id);
      for (const [key, items] of Object.entries(lists)) {
        if (!componentBindingLists.includes(key as BindingList))
          fail(
            id +
              ": only states, dependencies, used_on and gaps can be bound, not " +
              key,
          );
        if (!Array.isArray(items)) fail(id + ": " + key + " must be a list.");
        const list = entry[key as BindingList] as unknown[] | undefined;
        if (!Array.isArray(list))
          fail(id + ": the component has no " + key + " list.");
        list!.push(...items);
      }
    }
  }
  return { ...manifest, entries };
}
// Size of components.json when bindings were introduced. Existing items may be corrected in
// place; a new component or consumer item goes in a binding file.
export const frozenComponentManifest = {
  entries: 52,
  states: 427,
  dependencies: 647,
  used_on: 1082,
  gaps: 299,
} as const;
export function frozenComponentManifestErrors(
  manifest: ComponentManifest,
): string[] {
  const sizes: Record<keyof typeof frozenComponentManifest, number> = {
    entries: manifest.entries.length,
    states: 0,
    dependencies: 0,
    used_on: 0,
    gaps: 0,
  };
  for (const entry of manifest.entries)
    for (const list of componentBindingLists) sizes[list] += entry[list].length;
  return Object.entries(frozenComponentManifest)
    .filter(([key, limit]) => sizes[key as keyof typeof sizes] > limit)
    .map(
      ([key, limit]) =>
        `components.json holds ${sizes[key as keyof typeof sizes]} ${key === "entries" ? "components" : key + " items"}, more than the ${limit} it is frozen at; add them in a binding file in docs/design/development/component-bindings/.`,
    );
}
// A specification's size is its number of paragraph blocks (runs of non-blank lines). Page
// consumer notes used to be appended at the end; they now go in the binding's .md note.
export function specificationBlocks(text: string): number {
  let blocks = 0,
    inside = false;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    if (line.trim() && !inside) blocks++;
    inside = !!line.trim();
  }
  return blocks;
}
// frozen: blocks per specification file name when notes moved; texts: current file contents.
// Corrections in place keep the count. A change to the component's own rules that adds a
// paragraph raises that file's number in specification-sizes.json deliberately.
export function specificationGrowthErrors(
  frozen: Record<string, number>,
  texts: Record<string, string>,
): string[] {
  return Object.entries(frozen)
    .filter(([name, limit]) => specificationBlocks(texts[name] ?? "") > limit)
    .map(
      ([name, limit]) =>
        `components/${name} has ${specificationBlocks(texts[name])} paragraph blocks, more than the ${limit} it is frozen at; put a page's consumer note in its binding's .md file in docs/design/development/component-bindings/.`,
    );
}
export type ComponentView = ComponentRecord & {
  fingerprint: string;
  review_state: "Not reviewed" | "Current" | "Stale";
  source_url: string;
  history_url: string;
  reference_url: string;
};
export type ComponentLibrary = {
  entries: ComponentView[];
  errors: string[];
  checkout_commit: string | null;
  divergences: {
    token: string;
    values: Record<string, string>;
    status: string;
  }[];
};
export function componentReviewState(
  record: ComponentRecord,
  fingerprint: string,
): ComponentView["review_state"] {
  return !record.review ||
    !record.review.reviewer ||
    !record.review.date ||
    !record.review.evidence.length
    ? "Not reviewed"
    : record.review.fingerprint === fingerprint
      ? "Current"
      : "Stale";
}
