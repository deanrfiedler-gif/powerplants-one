import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readMaster } from "../../src/development/catalog";
import { readGuideLibrary } from "../../src/guides/library";
import type { CompiledGuide } from "../../src/guides/model";
import { GuideArticle } from "../../src/guides/render";

// User guide stage 1 (ADR-0065, decision 7): the guides carried over from the TypeScript page guides render the
// accepted panel's markup. fixtures/released-guide-markup.json holds, for each guide_key, the markup of the accepted
// panel (guide-render-accepted.tsx, a verbatim copy of src/components/shell-page-guide.tsx) rendering the TypeScript
// guide, recorded before those modules were retired. It was generated, never written by hand: if a carried-over
// guide stops matching, fix the guide or the renderer, not the fixture. A reviewed rewrite removes carried_over_from
// from its guide and deletes its fixture line in the same change.
const root = process.cwd();
const collapse = (markup: string) => markup.replace(/>\s+</g, "><");
// The shell guide opens as the user guide; every other guide opens as a page guide.
const eyebrowOf = (guide: CompiledGuide) => (guide.front.entry_key === "system:shell" ? "User guide" : "Page guide");

async function carriedOver() {
  const { entries } = await readMaster(root);
  const library = await readGuideLibrary(root, entries);
  const fixture: Record<string, string> = JSON.parse(await readFile(join(root, "tests/unit/fixtures/released-guide-markup.json"), "utf8"));
  return { library, fixture, guides: library.guides.filter((guide) => guide.front.carried_over_from !== null) };
}

test("carried-over guides render today's panel markup", async () => {
  const { library, fixture, guides } = await carriedOver();
  assert.deepEqual(library.errors, []);
  assert.ok(guides.length > 0, "the library holds the carried-over guides");
  for (const guide of guides) {
    const key = guide.front.guide_key;
    assert.ok(Object.hasOwn(fixture, key), `${guide.path}: the fixture has no line for ${key}`);
    const markup = collapse(renderToStaticMarkup(createElement(GuideArticle, { guide, eyebrow: eyebrowOf(guide) })));
    assert.equal(markup, fixture[key], `${guide.path} renders different markup from the accepted panel`);
  }
});

test("fixture has no orphan lines", async () => {
  const { fixture, guides } = await carriedOver();
  const keys = new Set(guides.map((guide) => guide.front.guide_key));
  const orphans = Object.keys(fixture).filter((key) => !keys.has(key));
  assert.deepEqual(orphans, [], "every fixture line belongs to a carried-over guide in the library");
});
