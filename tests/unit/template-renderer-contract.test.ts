import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  currentRenderer,
  definition,
  parseDefinition,
  supportedPackHtml,
  supportedTemplateDefinition,
} from "../../src/documents/publication/contracts";
import {
  escapeHtml,
  rendererVersion,
  type PackSnapshot,
} from "../../src/documents/render";
import { digest } from "../../src/documents/store";
import * as retained from "../../src/documents/publication/definition";
import { supportedTemplateDefinition as legacy } from "../../src/documents/p11-template";
import {
  lockVersion,
  mirror,
  note,
  unrelated,
  within,
  type Change,
} from "../helpers/template-manifest";

const body = {
  schema_version: 1 as const,
  title: "Synthetic title",
  audience: "Internal" as const,
  fields: [
    { key: "site", label: "Site", binding: "site.name", required: true },
  ],
};
const origin = () => ({
  proposal_id: randomUUID(),
  revision_id: randomUUID(),
  content_hash: "a".repeat(64),
});
const supported = async (text: string) =>
  (await supportedTemplateDefinition("OUT-09", 3, text)) === text;

test("DK06-OUT09-2 fingerprints rendering sources and names its Playwright versions while the dispatcher retains every earlier definition", async () => {
  const o = origin(),
    two = await definition("DK06-OUT09-2", 3, body, o),
    d = JSON.parse(two),
    lock = JSON.parse(await readFile("package-lock.json", "utf8"));
  assert.equal(currentRenderer, "DK06-OUT09-2");
  assert.equal(d.renderer, "DK06-OUT09-2");
  assert.deepEqual(
    d.sources.map((s: { path: string }) => s.path),
    [
      "src/documents/publication/dk06-out09-2.ts",
      "src/documents/render.ts",
      "src/documents/validation.ts",
      "public/brand/Roboto-variable.woff",
      "public/brand/Roboto-output-provenance.json",
      "public/brand/powerplants-logo-green-white.png",
    ],
  );
  assert.deepEqual(d.dependencies, [
    {
      name: "playwright",
      version: lock.packages["node_modules/playwright"].version,
    },
    {
      name: "playwright-core",
      version: lock.packages["node_modules/playwright-core"].version,
    },
  ]);
  assert.ok(await supported(two));
  assert.deepEqual(parseDefinition(two), {
    renderer: "DK06-OUT09-2",
    version: 3,
    body,
    origin: o,
  });
  const one = await retained.definition(3, body, o);
  assert.equal(await definition("DK06-OUT09-1", 3, body, o), one);
  assert.ok(await supported(one));
  assert.equal(parseDefinition(one).renderer, "DK06-OUT09-1");
  for (const family of ["OUT-09", "OUT-10", "OUT-14"] as const)
    for (const v of [1, 2])
      assert.equal(
        await supportedTemplateDefinition(family, v),
        await legacy(family, v),
      );
  for (const family of ["OUT-10", "OUT-14"] as const)
    assert.equal(await supportedTemplateDefinition(family, 3, two), null);
  assert.equal(await supportedTemplateDefinition("OUT-09", 4, two), null);
  assert.equal(await supportedTemplateDefinition("OUT-09", 3), null);
  for (const changed of [
    { ...d, renderer: "DK06-OUT09-3" },
    { ...d, body: { ...body, audience: "Customer" } },
    { ...d, extra: true },
  ]) {
    assert.throws(() => parseDefinition(JSON.stringify(changed)));
    assert.equal(
      await supportedTemplateDefinition("OUT-09", 3, JSON.stringify(changed)),
      null,
    );
  }
  for (const changed of [
    { ...d, dependencies: [] },
    { ...d, sources: d.sources.slice(1) },
  ])
    assert.equal(await supported(JSON.stringify(changed)), false);
});

test("G5: unrelated dependency, platform, validation and browser-runtime changes keep DK06-OUT09-2 supported; DK06-OUT09-1 keeps its own list", async () => {
  const o = origin(),
    two = await definition("DK06-OUT09-2", 3, body, o),
    one = await retained.definition(3, body, o);
  for (const [path, change] of Object.entries(unrelated))
    await within(await mirror({ [path]: change }), async () => {
      assert.ok(await supported(two), path);
      assert.equal(await supported(one), false, path);
    });
  await within(await mirror(unrelated), async () => {
    assert.ok(await supported(two));
  });
});

test("rendering source, branding and Playwright changes withdraw DK06-OUT09-2 support", async () => {
  const two = await definition("DK06-OUT09-2", 3, body, origin()),
    byte: Change = (b) => Buffer.concat([b, Buffer.from([0])]);
  const rendering: Record<string, Change> = {
    "src/documents/publication/dk06-out09-2.ts": note,
    "src/documents/render.ts": note,
    "src/documents/validation.ts": note,
    "public/brand/Roboto-variable.woff": byte,
    "public/brand/Roboto-output-provenance.json": byte,
    "public/brand/powerplants-logo-green-white.png": byte,
  };
  for (const [path, change] of Object.entries(rendering))
    await within(await mirror({ [path]: change }), async () => {
      assert.equal(await supported(two), false, path);
    });
  for (const name of ["playwright", "playwright-core"])
    await within(
      await mirror({ "package-lock.json": lockVersion(name, "1.99.0") }),
      async () => {
        assert.equal(await supported(two), false, name);
      },
    );
});

// Carries #506 (DOC-5) into DK06-OUT09-2: String.replace reads "$&", "$`", "$'"
// and "$$" in a replacement string as patterns, so published text must be
// inserted by a replacer function.
test("DK06-OUT09-2 inserts published text literally, never as replacement patterns", async () => {
  const fixture = JSON.parse(
    await readFile("tests/fixtures/job-pack-read.json", "utf8"),
  ).items[0];
  const saved = fixture.revisions.find(
    (r: { id: string }) => r.id === fixture.current_revision_id,
  ).snapshot as PackSnapshot;
  const patterns = "$& $` $' $$ $1",
    title = `SYN pack ${patterns}`,
    label = `SYN site ${patterns}`,
    site = `SYN Banksia ${patterns}`;
  const text = await definition(
    "DK06-OUT09-2",
    3,
    {
      ...body,
      title,
      fields: [{ key: "site", label, binding: "site.name", required: true }],
    },
    origin(),
  );
  const html = await supportedPackHtml({
    ...saved,
    site: { ...saved.site, name: site },
    template: {
      ...saved.template,
      version: 3,
      definition: text,
      hash: digest(text),
      renderer_version: rendererVersion,
    },
  });
  assert.ok(
    html.includes('<meta name="ppo-output-template" content="DK06-OUT09-2">'),
  );
  assert.equal(html.match(/<h1>/g)?.length, 1);
  assert.ok(html.includes(`<h1>${escapeHtml(title)}</h1>`));
  assert.ok(
    html.includes(`<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(site)}</dd>`),
  );
});
