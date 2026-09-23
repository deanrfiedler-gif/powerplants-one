import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  buildComponentLibrary,
  readComponentManifest,
} from "../../src/development/component-catalog";
import { buildCatalog } from "../../src/development/catalog";
import {
  componentCategories,
  exampleIds,
  type ComponentManifest,
} from "../../src/development/component-model";
import type { Catalog } from "../../src/development/model";

test("working catalogue binds all renderers, reference anchors and consumer keys", async () => {
  const catalog = await buildCatalog(process.cwd()),
    library = await buildComponentLibrary(process.cwd(), catalog);
  assert.deepEqual(library.errors, []);
  assert.equal(
    new Set(library.entries.map((e) => e.category)).size,
    componentCategories.length,
  );
  for (const id of exampleIds)
    assert(library.entries.some((e) => e.example === id));
  assert(
    library.entries.some(
      (e) => e.coverage === "Reference only" && e.example === null,
    ),
  );
  assert(
    library.entries
      .filter((e) => e.coverage === "Runnable")
      .every((e) => e.implementation.length && e.states.length),
  );
  for (const entry of library.entries)
    assert(
      catalog.component_resources?.some((r) => r.path === entry.reference.path),
    );
});
test("dependency edits invalidate recorded reviews; newline normalisation preserves them", async () => {
  const root = await mkdtemp(join(tmpdir(), "ppo-component-"));
  const put = async (path: string, text: string) => {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  };
  try {
    const original = (await readComponentManifest(process.cwd())).entries.find(
      (e) => e.id === "buttons",
    )!;
    const entry = {
      ...original,
      implementation: [{ path: "src/button.tsx", symbol: "Button" }],
      dependencies: [],
      reference: {
        ...original.reference,
        path: "docs/reference.html",
        anchor: "controls",
      },
      specification: "docs/rules.md",
      used_on: ["system:theme"],
    };
    const manifest: ComponentManifest = { schema_version: 1, entries: [entry] };
    const catalog = {
      entries: [{ key: "system:theme" }],
      checkout_commit: null,
    } as Catalog;
    await put(
      "src/button.tsx",
      'import "./controls.css";\nexport function Button() {}\n',
    );
    await put("src/controls.css", "button { color: navy; }\n");
    await put(
      "docs/reference.html",
      '<section id="controls">Reference</section>',
    );
    await put(
      "docs/rules.md",
      "# Rules\n\n## Desktop\nKeep label.\n## Mobile\nWrap.\n",
    );
    await put(
      "docs/standards/ui-baselines.json",
      '{"known_divergences":{"entries":[]}}',
    );
    await put("docs/evidence.md", "Synthetic review evidence for test only.");
    entry.review = {
      fingerprint: "pending",
      reviewer: "Synthetic reviewer",
      date: "2026-09-23",
      evidence: ["docs/evidence.md"],
      result: "Differences recorded",
    };
    const before = (await buildComponentLibrary(root, catalog, manifest))
      .entries[0];
    entry.review = {
      fingerprint: before.fingerprint,
      reviewer: "Synthetic reviewer",
      date: "2026-09-23",
      evidence: ["docs/evidence.md"],
      result: "Differences recorded",
    };
    assert.equal(
      (await buildComponentLibrary(root, catalog, manifest)).entries[0]
        .review_state,
      "Current",
    );
    await put("src/controls.css", "button { color: navy; }\r\n");
    assert.equal(
      (await buildComponentLibrary(root, catalog, manifest)).entries[0]
        .review_state,
      "Current",
    );
    await put("src/controls.css", "button { color: green; }\n");
    assert.equal(
      (await buildComponentLibrary(root, catalog, manifest)).entries[0]
        .review_state,
      "Stale",
    );
    entry.used_on = ["route:/missing"];
    entry.reference.anchor = "missing";
    entry.implementation[0].symbol = "Gone";
    entry.states = [];
    entry.review.evidence = [];
    const broken = await buildComponentLibrary(root, catalog, {
      ...manifest,
      entries: [entry, entry],
    });
    for (const message of [
      "Duplicate component IDs",
      "Unknown consuming page",
      "Reference anchor missing",
      "Application export missing",
      "Runnable coverage requires",
      "Review requires",
    ])
      assert(
        broken.errors.some((e) => e.includes(message)),
        message,
      );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
