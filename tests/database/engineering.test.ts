import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, after, afterEach, test } from "node:test";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createProject } from "../../src/projects/service";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createEngineeringRequest,
  coordinateEngineering,
  addEngineeringNote,
  readEngineering,
  listEngineering,
  engineeringOptions,
} from "../../src/engineering/service";
import { readOperation } from "../../src/shared/receipts";
import { shellSearch } from "../../src/shell/reads";
import { AppError } from "../../src/platform/errors";
import { projectInput } from "../helpers/projects";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";
import { crmBase, crmCreate, CRM } from "../helpers/crm";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
afterEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (code: string) => (e: unknown) =>
  e instanceof AppError && e.code === code;
async function fixture() {
  const p = await principal(),
    project = projectInput();
  await createProject(p, project);
  return { p, project, input: engineeringInput(project.id) };
}
test("engineering requests and coordination persist with exact history, idempotent originals and safe seed reruns", async () => {
  const { p, input } = await fixture(),
    created = await createEngineeringRequest(p, input);
  assert.equal((await createEngineeringRequest(p, input)).replayed, true);
  assert.deepEqual(await readOperation(p, input.operation_id), created.receipt);
  await coordinateEngineering(p, input.id, engineeringUpdate());
  const note = {
    ...crmBase(),
    expected_version: 2,
    note: "SYN Check service clearance.",
  };
  await addEngineeringNote(p, input.id, note);
  await addEngineeringNote(p, input.id, note);
  await closeDatabase();
  const saved = await readEngineering(p, input.id);
  assert.equal(saved.package.version, 3);
  assert.equal(saved.package.state, "In design");
  assert.equal(saved.package.required_date, "2028-03-31");
  assert.equal(saved.package.action_due, "2028-03-21");
  assert.equal(saved.events.length, 3);
  assert.equal(saved.events[0].note, note.note);
  assert.ok(
    (await shellSearch(p, { q: input.id })).items.some(
      (i) => i.href === "/engineering/" + input.id,
    ),
  );
  await migrate();
  await seed();
  assert.deepEqual(await readEngineering(p, input.id), saved);
});
test("engineering accepts a permitted presales opportunity and rejects fabricated scope and owners", async () => {
  const p = await principal(),
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const input = engineeringInput(opportunity.id, "Opportunity");
  await createEngineeringRequest(p, input);
  assert.equal(
    (await readEngineering(p, input.id)).package.context_kind,
    "Opportunity",
  );
  assert.ok(
    (await engineeringOptions(p, { context_kind: "Opportunity" })).items.some(
      (i) => i.id === opportunity.id,
    ),
  );
  await assert.rejects(
    createEngineeringRequest(p, {
      ...input,
      ...crmBase(),
      id: randomUUID(),
      owner_id: "30000000-0000-4000-8000-000000000006",
    }),
  );
  await assert.rejects(
    createEngineeringRequest(p, {
      ...input,
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.companyB,
    }),
  );
});
test("scope and revocation protect detail, filtered reads, options, mutation and original receipts", async () => {
  const { p, input } = await fixture();
  await createEngineeringRequest(p, input);
  const other = await principal("second-company");
  assert.equal((await listEngineering(other, {})).items.length, 0);
  for (const action of [
    () => readEngineering(other, input.id),
    () => coordinateEngineering(other, input.id, engineeringUpdate()),
    () =>
      engineeringOptions(other, {
        kind: "owner",
        context_kind: "Project",
        context_id: input.context_id,
      }),
  ])
    await assert.rejects(action);
  const observer = await principal("observer");
  await assert.rejects(listEngineering(observer, {}));
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='engineering.create'",
    [p.workspace_id, p.actor_id],
  );
  await assert.rejects(createEngineeringRequest(p, input));
  await assert.rejects(readOperation(p, input.operation_id));
  assert.equal((await readEngineering(p, input.id)).package.id, input.id);
});
test("changed originals and stale concurrent updates cannot produce duplicate history", async () => {
  const { p, input } = await fixture();
  await createEngineeringRequest(p, input);
  await assert.rejects(
    createEngineeringRequest(p, { ...input, title: "SYN Changed original" }),
    code("OperationConflict"),
  );
  const outcomes = await Promise.allSettled([
    coordinateEngineering(p, input.id, engineeringUpdate()),
    coordinateEngineering(p, input.id, engineeringUpdate()),
  ]);
  assert.equal(outcomes.filter((v) => v.status === "fulfilled").length, 1);
  const rejected = outcomes.find((v) => v.status === "rejected");
  assert.ok(
    rejected?.status === "rejected" &&
      rejected.reason.code === "VersionConflict",
  );
  assert.equal((await readEngineering(p, input.id)).events.length, 2);
});
test("database evidence cannot be rewritten and package versions cannot advance without their exact event", async () => {
  const { p, input } = await fixture();
  await createEngineeringRequest(p, input);
  await assert.rejects(
    database().query(
      "UPDATE ppo.engineering_events SET reason='Changed' WHERE package_id=$1",
      [input.id],
    ),
  );
  await assert.rejects(
    transaction((c) =>
      c.query(
        "UPDATE ppo.engineering_packages SET version=version+1 WHERE id=$1",
        [input.id],
      ),
    ),
  );
  assert.equal((await readEngineering(p, input.id)).package.version, 1);
});
