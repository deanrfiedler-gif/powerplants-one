import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  definition,
  supportedTemplateDefinition,
  parseDefinition,
} from "../../src/documents/publication/definition";
import { supportedTemplateDefinition as legacy } from "../../src/documents/p11-template";
test("R3 supports only exact OUT-09 schema and dependencies while retaining all legacy definitions", async () => {
  const body = {
    schema_version: 1 as const,
    title: "Synthetic title",
    audience: "Internal" as const,
    fields: [
      { key: "site", label: "Site", binding: "site.name", required: true },
    ],
  };
  const d = await definition(3, body, {
    proposal_id: randomUUID(),
    revision_id: randomUUID(),
    content_hash: "a".repeat(64),
  });
  assert.equal(await supportedTemplateDefinition("OUT-09", 3, d), d);
  for (const family of ["OUT-09", "OUT-10", "OUT-14"] as const)
    for (const v of [1, 2])
      assert.equal(
        await supportedTemplateDefinition(family, v),
        await legacy(family, v),
      );
  for (const family of ["OUT-10", "OUT-14"] as const)
    assert.equal(await supportedTemplateDefinition(family, 3, d), null);
  assert.equal(await supportedTemplateDefinition("OUT-09", 4, d), null);
  assert.equal(await supportedTemplateDefinition("OUT-09", 3), null);
  assert.throws(() =>
    parseDefinition(
      JSON.stringify({
        ...JSON.parse(d),
        body: { ...body, audience: "Customer" },
      }),
    ),
  );
  assert.throws(() =>
    parseDefinition(
      JSON.stringify({
        ...JSON.parse(d),
        body: {
          ...body,
          fields: [{ ...body.fields[0], binding: "__proto__.secret" }],
        },
      }),
    ),
  );
  const changed = JSON.parse(d);
  changed.sources[0].sha256 = "0".repeat(64);
  assert.notEqual(
    await supportedTemplateDefinition("OUT-09", 3, JSON.stringify(changed)),
    JSON.stringify(changed),
  );
});
