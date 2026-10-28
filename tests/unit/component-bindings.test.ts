import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  buildCatalog,
  componentBindingsPath,
  componentManifestPath,
  readComponentManifest,
} from "../../src/development/catalog";
import {
  applyComponentBindings,
  frozenComponentManifestErrors,
  type ComponentBinding,
  type ComponentManifest,
  type ComponentRecord,
} from "../../src/development/component-model";
import type { Entry, Register } from "../../src/development/model";

const record = (id: string): ComponentRecord => ({
  id,
  title: id,
  category: "Foundations",
  module: "Test",
  purpose: "Test",
  owner: "Fixture",
  example: null,
  coverage: "Host example",
  states: [{ id: "base", label: "Base", description: "Base state" }],
  implementation: [],
  dependencies: ["src/base.ts"],
  reference: { path: "docs/reference.html", anchor: "", status: "Fixture" },
  specification: "docs/spec.md",
  used_on: ["route:/base"],
  desktop: "Desktop",
  mobile: "Mobile",
  keyboard: "Keyboard",
  limitations: "None",
  gaps: [],
  figma: { status: "None", location: "None", components: [], note: "None" },
  review: null,
});
const manifest = (): ComponentManifest => ({
  schema_version: 1,
  entries: [record("buttons"), record("menu")],
});
const gap = (id: string) => ({
  id,
  expected: "Expected",
  actual: "Actual",
  action: "Action",
  priority: "Low" as const,
  owner: "Fixture",
});

test("bindings append to the four consumer lists in file order and add new records", () => {
  const first: ComponentBinding = {
      schema_version: 1,
      bindings: {
        buttons: {
          states: [{ id: "a", label: "A", description: "First host" }],
          used_on: ["route:/a"],
        },
      },
    },
    second: ComponentBinding = {
      schema_version: 1,
      entries: [record("register")],
      bindings: {
        buttons: {
          states: [{ id: "b", label: "B", description: "Second host" }],
          dependencies: ["src/b.ts"],
          used_on: ["route:/b"],
          gaps: [gap("buttons-b")],
        },
        register: { used_on: ["route:/b"] },
      },
    };
  const input = manifest(),
    before = JSON.stringify(input);
  const merged = applyComponentBindings(input, [
    { path: "2026-10-27-a.json", binding: first },
    { path: "2026-10-28-b.json", binding: second },
  ]);
  assert.equal(JSON.stringify(input), before, "the input is not changed");
  const buttons = merged.entries.find((e) => e.id === "buttons")!;
  assert.deepEqual(
    buttons.states.map((s) => s.id),
    ["base", "a", "b"],
  );
  assert.deepEqual(buttons.dependencies, ["src/base.ts", "src/b.ts"]);
  assert.deepEqual(buttons.used_on, ["route:/base", "route:/a", "route:/b"]);
  assert.deepEqual(buttons.gaps, [gap("buttons-b")]);
  assert.deepEqual(
    merged.entries.map((e) => e.id),
    ["buttons", "menu", "register"],
  );
  assert.deepEqual(merged.entries[2].used_on, ["route:/base", "route:/b"]);
  // Key order feeds the component fingerprint, so a bound record keeps it.
  assert.deepEqual(Object.keys(buttons), Object.keys(record("buttons")));
});

test("a binding may name a component whose definition file sorts after it", () => {
  // scripts/test_documentation_component_bindings.py holds the same fixture for the Python reader.
  const merged = applyComponentBindings(manifest(), [
    {
      path: "2026-10-27-a-consumer.json",
      binding: {
        schema_version: 1,
        bindings: {
          "future-widget": { used_on: ["route:/new"] },
          buttons: { used_on: ["route:/new"] },
        },
      },
    },
    {
      path: "2026-10-27-z-widget.json",
      binding: {
        schema_version: 1,
        entries: [record("future-widget")],
        bindings: { "future-widget": { used_on: ["route:/later"] } },
      },
    },
  ]);
  assert.deepEqual(
    merged.entries.map((e) => e.id),
    ["buttons", "menu", "future-widget"],
  );
  const widget = merged.entries.find((e) => e.id === "future-widget")!;
  assert.deepEqual(widget.used_on, ["route:/base", "route:/new", "route:/later"]);
  assert.deepEqual(merged.entries[0].used_on, ["route:/base", "route:/new"]);
});

test("a component is defined once, in components.json or one binding file", () => {
  const define = (path: string, id: string) => ({
    path,
    binding: { schema_version: 1, entries: [record(id)] } as ComponentBinding,
  });
  assert.throws(
    () =>
      applyComponentBindings(manifest(), [
        define("2026-10-27-a.json", "buttons"),
      ]),
    /2026-10-27-a\.json: component already defined: buttons/,
  );
  assert.throws(
    () =>
      applyComponentBindings(manifest(), [
        define("2026-10-27-a.json", "widget"),
        define("2026-10-28-b.json", "widget"),
      ]),
    /2026-10-28-b\.json: component already defined: widget/,
  );
});

test("a binding names a known component, a known list and the current schema", () => {
  const apply = (binding: unknown) =>
    applyComponentBindings(manifest(), [
      { path: "2026-10-27-x.json", binding: binding as ComponentBinding },
    ]);
  assert.throws(
    () => apply({ schema_version: 1, bindings: { missing: { used_on: [] } } }),
    /2026-10-27-x\.json: unknown component: missing/,
  );
  assert.throws(
    () => apply({ schema_version: 1, bindings: { buttons: { title: [] } } }),
    /2026-10-27-x\.json: buttons: only states, dependencies, used_on and gaps can be bound/,
  );
  assert.throws(
    () =>
      apply({
        schema_version: 1,
        bindings: { buttons: { used_on: "route:/a" } },
      }),
    /buttons: used_on must be a list/,
  );
  assert.throws(
    () => apply({ schema_version: 2, bindings: {} }),
    /unsupported component binding schema/,
  );
  assert.throws(
    () => apply({ schema_version: 1, consumers: {} }),
    /unknown key: consumers/,
  );
});

test("components.json is frozen at its size; corrections in place still pass", async () => {
  const shared = JSON.parse(
    await readFile(componentManifestPath, "utf8"),
  ) as ComponentManifest;
  assert.deepEqual(frozenComponentManifestErrors(shared), []);
  const grown = structuredClone(shared);
  grown.entries[0].used_on.push("route:/new");
  assert.match(
    frozenComponentManifestErrors(grown).join("\n"),
    /used_on.*docs\/design\/development\/component-bindings/,
  );
  const added = structuredClone(shared);
  added.entries.push(record("new-component"));
  // One more component, state, dependency and consumer; the fixture has no gaps.
  assert.equal(frozenComponentManifestErrors(added).length, 4);
  const corrected = structuredClone(shared);
  corrected.entries[0].used_on[0] = "route:/corrected";
  assert.deepEqual(frozenComponentManifestErrors(corrected), []);
});

test("the catalogue reads binding files by name and hashes them with the manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-component-bindings-"));
  const put = async (path: string, data: string) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  };
  try {
    const entry: Entry = {
      key: "route:/development/design-system",
      title: "Design system",
      kind: "route",
      module: "Development",
      summary: "Fixture",
      path: "/development/design-system",
      source_paths: ["src/app/development/design-system/page.tsx"],
      guide_key: "design-system",
      design_path: "docs/spec.md",
      html_path: null,
      image_paths: [],
      dependencies: [componentManifestPath],
      scope_status: "Source",
      visual_status: "Pending",
      functional_status: "Pending",
      deployment_status: "Unknown",
      review_fingerprint: null,
      reviewed_at: null,
      reviewer: null,
      owner: "Fixture",
      build_rank: null,
      related_keys: [],
    };
    const master: Register = {
      schema_version: 2,
      title: "Fixture",
      source_baseline: "fixture",
      local_base: "http://127.0.0.1:3000",
      live_base: "https://example.com",
      shared_sources: ["src/app/globals.css"],
      entries: [entry],
    };
    await put("docs/design/development/register.json", JSON.stringify(master));
    await put(
      "docs/design/development/guides.json",
      JSON.stringify({
        schema_version: 2,
        guides: [
          {
            guide_key: "design-system",
            entry_key: entry.key,
            status: "Draft",
            owner_role: "Fixture owner",
          },
        ],
      }),
    );
    await put(
      "src/app/development/design-system/page.tsx",
      "export default function Page() {}",
    );
    await put("src/app/globals.css", ":root{--navy:#242a37;}");
    await put("docs/spec.md", "## Desktop\n\n## Mobile");
    await put("docs/reference.html", "<p>Fixture</p>");
    await mkdir(join(root, "docs/reference/ui/module-workflow-maps"), {
      recursive: true,
    });
    await put(componentManifestPath, JSON.stringify(manifest()));

    // No binding folder: the manifest is components.json as it stands.
    assert.deepEqual(await readComponentManifest(root), manifest());
    const unbound = (await buildCatalog(root)).entries[0].fingerprint;

    await put(
      componentBindingsPath + "/2026-10-27-sample.json",
      JSON.stringify({
        schema_version: 1,
        bindings: { menu: { used_on: ["route:/development/design-system"] } },
      }),
    );
    await put(componentBindingsPath + "/README.md", "# Not a binding");
    const read = await readComponentManifest(root);
    assert.deepEqual(read.entries[1].used_on, [
      "route:/base",
      "route:/development/design-system",
    ]);
    const catalog = await buildCatalog(root);
    assert.deepEqual(catalog.errors, []);
    assert.deepEqual(
      catalog.component_links?.find((l) => l.id === "menu")?.used_on,
      read.entries[1].used_on,
    );
    const bound = catalog.entries[0].fingerprint;
    assert.notEqual(bound, unbound, "a binding file is part of the manifest");

    await put(
      componentBindingsPath + "/2026-10-27-sample.json",
      JSON.stringify({
        schema_version: 1,
        bindings: { menu: { used_on: [] } },
      }),
    );
    assert.notEqual((await buildCatalog(root)).entries[0].fingerprint, bound);

    await put(componentBindingsPath + "/sample.json", "{}");
    await assert.rejects(
      readComponentManifest(root),
      /Component binding name must be YYYY-MM-DD-slug\.json/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
