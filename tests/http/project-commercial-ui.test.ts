import assert from "node:assert/strict";
import { after, test } from "node:test";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  commercialFixture,
  approvedBasis,
  variation,
} from "../helpers/project-commercial";
import { commandCommercial } from "../../src/projects/commercial/commands";
import { httpAcceptance } from "../helpers/acceptance-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("PJ05 HTTP page context, named reasons, source pickers and denied duties", async () => {
  const f = await commercialFixture();
  await approvedBasis(f);
  const v = variation(f, "100.00", "90.00");
  await commandCommercial(f.owner, f.project.id, v);
  const h = httpAcceptance(localConfig().origin),
    route = `projects/${f.project.id}/commercial`;
  const list = await h.call("coordinator", route);
  assert.equal(list.status, 200);
  assert.equal(list.body.context.project.id, f.project.id);
  assert.equal(list.body.counts.Variation, 1);
  const record = await h.call("coordinator", `${route}?id=${v.id}`);
  assert.equal(record.body.current.owner_name, f.owner.display_name);
  assert.equal(record.body.current.reason, v.reason);
  const options = await h.call(
    "coordinator",
    `${route}/basis-options?picker=quotations&handover_id=${f.handover}`,
  );
  assert.equal(options.status, 200);
  assert.ok(
    options.body.items.some((x: { id: string }) => x.id === f.release.id),
  );
  assert.equal(
    (await h.call("second-company", `${route}/basis-options?picker=documents`))
      .status,
    404,
  );
  assert.equal(
    (
      await h.call(
        "estimating-source-reviewer",
        `${route}/basis-options?picker=owners`,
      )
    ).status,
    404,
  );
});
