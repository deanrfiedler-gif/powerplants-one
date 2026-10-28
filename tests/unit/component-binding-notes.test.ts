import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  componentBindingNotes,
  componentBindingsPath,
  componentManifestPath,
  specificationSizesPath,
} from "../../src/development/catalog";
import { buildComponentLibrary } from "../../src/development/component-catalog";
import {
  specificationBlocks,
  specificationGrowthErrors,
  type ComponentManifest,
} from "../../src/development/component-model";
import type { Catalog } from "../../src/development/model";

test("a specification's size is its count of paragraph blocks", () => {
  assert.equal(specificationBlocks(""), 0);
  assert.equal(specificationBlocks("# Title\n\nOne line.\nSame block.\n"), 2);
  assert.equal(
    specificationBlocks("# Title\r\n\r\nPara\r\n\r\n\r\n## Next\r\n"),
    3,
  );
});

test("specifications are frozen at their size; corrections in place still pass", async () => {
  const frozen = JSON.parse(await readFile(specificationSizesPath, "utf8"))
      .blocks as Record<string, number>,
    texts: Record<string, string> = {};
  for (const name of Object.keys(frozen))
    texts[name] = await readFile(
      "docs/design/development/components/" + name,
      "utf8",
    );
  assert.equal(Object.keys(frozen).length, 52);
  assert.deepEqual(specificationGrowthErrors(frozen, texts), []);
  const appended = {
    ...texts,
    "buttons.md":
      texts["buttons.md"] + "\n\n## New page consumer\n\nUses it.\n",
  };
  assert.match(
    specificationGrowthErrors(frozen, appended).join("\n"),
    /buttons\.md.*component-bindings/,
  );
  const corrected = {
    ...texts,
    "buttons.md": texts["buttons.md"].replace("Button", "Buttons"),
  };
  assert.deepEqual(specificationGrowthErrors(frozen, corrected), []);
  // A new component's specification is not in the frozen list.
  assert.deepEqual(
    specificationGrowthErrors(frozen, { ...texts, "new.md": "A\n\nB\n\nC" }),
    [],
  );
});

test("a binding note is hashed into the fingerprint of every component its binding names", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-binding-notes-"));
  const put = async (path: string, data: string) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), data);
  };
  try {
    const original = (
      JSON.parse(
        await readFile(componentManifestPath, "utf8"),
      ) as ComponentManifest
    ).entries.find((e) => e.id === "buttons")!;
    const entry = {
      ...original,
      implementation: [],
      dependencies: [],
      coverage: "Host example" as const,
      example: null,
      used_on: ["route:/sample"],
      reference: {
        ...original.reference,
        path: "docs/reference.html",
        anchor: "",
      },
      specification: "docs/spec.md",
      review: null,
    };
    const manifest: ComponentManifest = { schema_version: 1, entries: [entry] };
    await put("docs/spec.md", "## Desktop\n\n## Mobile");
    await put("docs/reference.html", "<p>Fixture</p>");
    await put(
      "docs/standards/ui-baselines.json",
      JSON.stringify({ known_divergences: { entries: [] } }),
    );
    const catalog = {
      entries: [{ key: "route:/sample", kind: "route", source_paths: [] }],
      checkout_commit: null,
    } as unknown as Catalog;
    const fingerprint = async () =>
      (await buildComponentLibrary(root, catalog, manifest)).entries[0]
        .fingerprint;

    assert.deepEqual(await componentBindingNotes(root), new Map());
    const without = await fingerprint();
    await put(
      componentBindingsPath + "/2026-10-27-sample.json",
      JSON.stringify({
        schema_version: 1,
        bindings: { buttons: { used_on: [] } },
      }),
    );
    assert.equal(await fingerprint(), without, "no note yet");
    await put(
      componentBindingsPath + "/2026-10-27-sample.md",
      "# Sample consumer\n\n## Buttons\n\nThe sample page uses Buttons.\n",
    );
    assert.deepEqual((await componentBindingNotes(root)).get("buttons"), [
      componentBindingsPath + "/2026-10-27-sample.md",
    ]);
    const noted = await fingerprint();
    assert.notEqual(noted, without);
    await put(
      componentBindingsPath + "/2026-10-27-sample.md",
      "# Sample consumer\n\n## Buttons\n\nChanged.\n",
    );
    assert.notEqual(await fingerprint(), noted);

    await put(componentBindingsPath + "/README.md", "# Not a note");
    await put(componentBindingsPath + "/2026-10-28-orphan.md", "# Orphan");
    await assert.rejects(
      componentBindingNotes(root),
      /binding note needs its binding file: .*2026-10-28-orphan\.md/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
