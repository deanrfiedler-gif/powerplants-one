import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { httpAcceptance } from "../helpers/acceptance-http";
import { localConfig } from "../../src/platform/config";
import { closeDatabase } from "../../src/platform/database";
import {readFile,writeFile} from 'node:fs/promises';
import {PJ} from '../helpers/acceptance';
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("PJ-09 HTTP proof requires ppo_synthetic_test");
after(closeDatabase);
const origin = localConfig().origin,
  h = httpAcceptance(origin);
test("PJ09-26/27/29/30/31/35/36/38/40/44/47/48/53: connected HTTP journey, strict envelopes and independent closeout", async () => {
  const j = await h.readyJourney();
  const candidate=await h.act('coordinator',j.project,j.stage,'prepare',{id:randomUUID(),audience:'Customer',recipient_id:PJ.person,purpose:'SYN template currentness proof'});
  const templatePath='src/projects/acceptance/outputs.ts',original=await readFile(templatePath),current=await h.read(j.project,j.stage);
  try{await writeFile(templatePath,Buffer.concat([original,Buffer.from('\n// SYN controlled template change during review\n')]));const refused=await h.call('materials-release','projects/acceptance',{operation_id:randomUUID(),schema_version:1,reason:'SYN changed template must not issue',action:'issue',project_id:j.project,stage_id:j.stage,expected_version:current.selected!.stage.version,facts_hash:current.selected!.facts_hash,fields:{id:candidate.body.fields.id}});assert.equal(refused.status,409);assert.equal(refused.body.code,'PreparedSourceChanged');}finally{await writeFile(templatePath,original);}
  const closed = await h.act("coordinator", j.project, j.stage, "closeStage");
  const replay = await h.call(
    "coordinator",
    "projects/acceptance",
    closed.body,
  );
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, closed.receipt);
  assert.equal(
    (
      await h.call("coordinator", "projects/acceptance", {
        ...closed.body,
        reason: "SYN changed payload",
      })
    ).status,
    409,
  );
  assert.equal(
    (await h.call("second-company", "projects/acceptance?project=" + j.project))
      .status,
    404,
  );
  assert.equal(
    (await h.call("second-company", `projects/acceptance/stages/${j.stage}`))
      .status,
    404,
  );
  assert.equal(
    (
      await h.call(
        "materials-author",
        `projects/acceptance/intents/${closed.body.operation_id}`,
      )
    ).status,
    404,
  );
  for (const fields of [
    { actor_id: PJ_ACTOR },
    { approved: true },
    { stage_id: randomUUID() },
  ]) {
    const r = await h.call("coordinator", "projects/acceptance", {
      ...closed.body,
      operation_id: randomUUID(),
      ...fields,
    });
    assert([404, 422].includes(r.status));
  }
  const cookie = await h.cookie("coordinator");
  const noOrigin = await fetch(origin + "/api/v1/projects/acceptance", {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify(closed.body),
  });
  assert.equal(noOrigin.status, 403);
  await h.act("finance-reviewer", j.project, null, "commercial", {
    source_id: j.commercial.id,
    outcome: "Complete",
    evidence: "SYN complete whole-project basis",
  });
  await h.act("coordinator", j.project, null, "closeProject");
  assert.equal((await h.read(j.project)).project.lifecycle, "Closed");
  await h.act("coordinator", j.project, null, "reopen", { unit_ids: [j.unit] });
  assert.equal((await h.read(j.project)).project.lifecycle, "Active");
  const files = await fetch(
    origin + `/api/v1/projects/acceptance/files/${j.customer.id}?format=pdf`,
    { headers: { cookie } },
  );
  assert.equal(files.status, 200);
  assert.equal(
    Buffer.from(await files.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
});
const PJ_ACTOR = "30000000-0000-4000-8000-000000000001";
