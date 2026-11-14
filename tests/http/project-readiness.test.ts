import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { httpAcceptance } from "../helpers/acceptance-http";
import { readinessFixture } from "../helpers/project-readiness";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
const h = httpAcceptance(localConfig().origin);

test("PJ07-HTTP01 compiled route exposes protected native evidence, bounded counts and explicit non-release", async () => {
  const f = await readinessFixture();
  const route = `projects/${f.project.id}/readiness`;
  const read = await h.call("coordinator", route);
  assert.equal(read.status, 200);
  assert.equal(read.body.schema_version, 1);
  assert.equal(read.body.synthetic, true);
  assert.equal(read.body.summary.state, "Blocked");
  assert.equal(read.body.summary.can_release, false);
  assert.equal(read.body.summary.full_scope_assessed, false);
  const material = read.body.sources.find(
    (s: { kind: string }) => s.kind === "MaterialDemand",
  );
  assert.equal(material.items[0].id, f.demand.id);
  assert.equal(material.items[0].version, 1);
  assert.equal(material.count_scope, "PermittedCandidateWindow");
  assert.match(material.items[0].source_hash, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    (await h.call("coordinator", route)).body.sources,
    read.body.sources,
  );
  assert.equal((await h.call("second-company", route)).status, 404);
  assert.equal(
    (await h.call("coordinator", route + "?state=Ready")).status,
    422,
  );
  assert.equal(
    (await h.call("coordinator", "projects/invalid/readiness")).status,
    422,
  );
});
