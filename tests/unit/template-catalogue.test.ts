import assert from "node:assert/strict";
import { test } from "node:test";
import {
  templateDependencies,
  listTemplates,
  readTemplate,
  templateUsage,
} from "../../src/documents/template-catalogue";
const p = {
  actor_id: "30000000-0000-4000-8000-000000000001",
  workspace_id: "10000000-0000-4000-8000-000000000001",
  display_name: "Synthetic",
};
test("DK06 dependency evidence distinguishes unrecorded v1 text from malformed manifests", () => {
  assert.deepEqual(templateDependencies("Retained v1 definition"), {
    state: "NotRecorded",
    items: [],
  });
  assert.equal(templateDependencies('{"sources":[').state, "Invalid");
  assert.equal(
    templateDependencies(
      JSON.stringify({
        sources: [
          { path: "src/example.ts", sha256: "a".repeat(64), byte_count: -1 },
        ],
      }),
    ).state,
    "Invalid",
  );
  const dependency = {
    path: "src/example.ts",
    sha256: "a".repeat(64),
    byte_count: 12,
  };
  assert.deepEqual(
    templateDependencies(
      JSON.stringify({ sources: [{ ...dependency, secret: "excluded" }] }),
    ),
    { state: "Recorded", items: [dependency] },
  );
});
test("DK06 strict family, page, detail and usage contracts refuse before database access", async () => {
  const invalid = { code: "InvalidData" };
  await assert.rejects(listTemplates(p), invalid);
  for (const limit of ["0", "51", "NaN", "1e1", " 2", "1.5"])
    await assert.rejects(
      listTemplates(p, { family: "OUT-09", limit }),
      invalid,
    );
  await assert.rejects(
    listTemplates(p, { family: "OUT-09", publish: "true" }),
    invalid,
  );
  await assert.rejects(
    readTemplate(p, p.actor_id, { family: "OUT-09", limit: "1" }),
    invalid,
  );
  await assert.rejects(
    templateUsage(p, p.actor_id, { family: "OUT-14", kind: "PackRevision" }),
    invalid,
  );
  await assert.rejects(
    templateUsage(p, p.actor_id, { family: "OUT-09", kind: "Unknown" }),
    invalid,
  );
});
