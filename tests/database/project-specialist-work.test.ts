import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import {
  commandWork,
  readWork,
} from "../../src/projects/specialist/work/service";
import { readOperation } from "../../src/shared/receipts";
import {
  reviseDocument,
  withdrawDocument,
  createDocument,
} from "../../src/library/commands";
import {
  sourceCommand,
  releaseCommand,
} from "../../src/engineering/materials/commands";
import { commandPackage } from "../../src/projects/specialist/commands";
import { packageAction } from "../helpers/project-specialist";
import {
  grantLibrary,
  successor,
  base,
  libraryInput,
} from "../helpers/library";
import {
  specialistWorkFixture,
  workAction,
} from "../helpers/project-specialist-work";
import { handoverAction } from "../helpers/project-specialist-handover";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (s: string) => (e: unknown) => (e as { code: string }).code === s;
const rows = async (sql: string, args: unknown[] = []) =>
  (await database().query(sql, args)).rows;
const snapshot = async () =>
  Promise.all(
    [
      "project_specialist_work",
      "project_specialist_work_events",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
      "business_identities",
      "material_handovers",
      "supply_records",
    ].map((t) =>
      rows(`SELECT to_jsonb(x) row FROM ppo.${t} x ORDER BY to_jsonb(x)::text`),
    ),
  );
test("PJ06-R3-01 exact accepted handover/document, independent scoped acceptance and unchanged downstream units/history", async () => {
  const f = await specialistWorkFixture(),
    before = await rows("SELECT to_jsonb(h) row FROM ppo.material_handovers h"),
    saved = await commandWork(f.owner, f.project.id, f.submit);
  const decision = workAction(f.submit.id),
    accepted = await commandWork(f.reviewer, f.project.id, decision);
  const view = (await readWork(f.reviewer, f.project.id, { id: f.submit.id }))
    .current!;
  assert.equal(view.state, "Accepted");
  assert.equal(view.version, 2);
  assert.equal(view.source_status, "Current");
  assert.equal(view.scope, f.submit.scope);
  assert.equal(view.limitations, f.submit.limitations);
  assert.equal(view.source.document.revision_id, f.document.revision_id);
  assert.equal(view.source.handover.id, f.prepare.id);
  assert.equal(view.history.length, 2);
  assert.deepEqual(
    await rows("SELECT to_jsonb(h) row FROM ppo.material_handovers h"),
    before,
  );
  const stable = await snapshot();
  assert.deepEqual(
    (await commandWork(f.owner, f.project.id, f.submit)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    (await commandWork(f.reviewer, f.project.id, decision)).receipt,
    accepted.receipt,
  );
  assert.deepEqual(
    await readOperation(f.reviewer, decision.operation_id),
    accepted.receipt,
  );
  assert.deepEqual(await snapshot(), stable);
  await assert.rejects(
    commandWork(f.reviewer, f.project.id, {
      ...decision,
      note: "changed intent",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.project_specialist_work SET limitations='rewrite' WHERE id=$1",
      [f.submit.id],
    ),
  );
  await assert.rejects(
    rows("DELETE FROM ppo.project_specialist_work_events WHERE work_id=$1", [
      f.submit.id,
    ]),
  );
});
test("PJ06-R3-02 source drift blocks acceptance but preserves Return, terminal correction and original recovery", async () => {
  const f = await specialistWorkFixture();
  const submitted = await commandWork(f.owner, f.project.id, f.submit);
  const rev = successor(f.document, 1);
  await reviseDocument(f.owner, f.document.id, rev);
  await assert.rejects(
    commandWork(f.reviewer, f.project.id, workAction(f.submit.id)),
    code("WorkEvidenceSourceChanged"),
  );
  assert.equal(
    (await readWork(f.owner, f.project.id, { id: f.submit.id })).current!
      .source_status,
    "Changed",
  );
  await commandWork(
    f.reviewer,
    f.project.id,
    workAction(f.submit.id, "Return"),
  );
  const correction = {
    ...f.submit,
    id: randomUUID(),
    operation_id: randomUUID(),
    revision_id: rev.revision_id,
    predecessor_id: f.submit.id,
  };
  await commandWork(f.owner, f.project.id, correction);
  await assert.rejects(
    commandWork(f.owner, f.project.id, {
      ...correction,
      id: randomUUID(),
      operation_id: randomUUID(),
    }),
    code("RelationshipConflict"),
  );
  await commandWork(f.reviewer, f.project.id, workAction(correction.id));
  // Fixture-only closed context, retaining the native version and exact schedule
  // event required by deferred guards. Work evidence never closes the Project.
  await transaction(async (c) => {
    await c.query(
      "UPDATE ppo.projects SET lifecycle='Closed',version=version+1 WHERE id=$1",
      [f.project.id],
    );
    await c.query(
      `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot)
      SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'ProjectAcceptanceChanged','SYN closed-context recovery fixture',to_jsonb(p) FROM ppo.projects p WHERE id=$4`,
      [randomUUID(), f.owner.actor_id, randomUUID(), f.project.id],
    );
  });
  assert.deepEqual(
    (await commandWork(f.owner, f.project.id, f.submit)).receipt,
    submitted.receipt,
  );
  assert.deepEqual(
    await readOperation(f.owner, f.submit.operation_id),
    submitted.receipt,
  );
});
test("PJ06-R3-03 review permission, independence, company isolation and revoked document privacy", async () => {
  const f = await specialistWorkFixture();
  await grantLibrary(f.owner, ["project.specialist.work.review"]);
  await assert.rejects(
    commandWork(f.owner, f.project.id, {
      ...f.submit,
      reviewer_id: f.owner.actor_id,
    }),
    code("IndependentWorkReviewRequired"),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='project.specialist.work.review'",
    [f.reviewer.actor_id],
  );
  await assert.rejects(
    commandWork(f.owner, f.project.id, f.submit),
    code("RecordUnavailable"),
  );
  await grantLibrary(f.reviewer, ["project.specialist.work.review"]);
  await commandWork(f.owner, f.project.id, f.submit);
  await assert.rejects(
    commandWork(f.owner, f.project.id, workAction(f.submit.id)),
    code("RecordUnavailable"),
  );
  const outsider = (await createSession("second-company")).principal;
  await assert.rejects(readWork(outsider, f.project.id, { id: f.submit.id }));
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='document.read'",
    [f.owner.actor_id],
  );
  await assert.rejects(
    readWork(f.owner, f.project.id, { id: f.submit.id }),
    code("RecordUnavailable"),
  );
  assert.deepEqual((await readWork(f.owner, f.project.id)).items, []);
  await assert.rejects(
    readOperation(f.owner, f.submit.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    commandWork(f.owner, f.project.id, f.submit),
    code("RecordUnavailable"),
  );
});
test("PJ06-R3-04 races and late receipt failure roll back every effect", async () => {
  const f = await specialistWorkFixture(),
    before = await snapshot();
  await rows(
    `CREATE FUNCTION ppo.fail_work_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN late receipt failure'; END $$; CREATE TRIGGER fail_work_receipt BEFORE INSERT ON ppo.operation_receipts FOR EACH ROW EXECUTE FUNCTION ppo.fail_work_receipt()`,
  );
  await assert.rejects(commandWork(f.owner, f.project.id, f.submit));
  await rows(
    "DROP TRIGGER fail_work_receipt ON ppo.operation_receipts; DROP FUNCTION ppo.fail_work_receipt()",
  );
  assert.deepEqual(await snapshot(), before);
  const twins = await Promise.all([
    commandWork(f.owner, f.project.id, f.submit),
    commandWork(f.owner, f.project.id, f.submit),
  ]);
  assert.equal(twins.filter((x) => x.replayed).length, 1);
  assert.deepEqual(twins[0].receipt, twins[1].receipt);
  const decisions = await Promise.allSettled([
    commandWork(f.reviewer, f.project.id, workAction(f.submit.id)),
    commandWork(f.reviewer, f.project.id, workAction(f.submit.id, "Return")),
  ]);
  assert.equal(decisions.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (
      await rows(
        "SELECT * FROM ppo.project_specialist_work_events WHERE work_id=$1",
        [f.submit.id],
      )
    ).length,
    2,
  );
});
test("PJ06-R3-05 withdrawn evidence and withdrawn native demand cannot receive positive acceptance", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  await withdrawDocument(f.owner, f.document.id, {
    ...base(),
    expected_version: 1,
    revision_id: f.document.revision_id,
  });
  await assert.rejects(
    commandWork(f.reviewer, f.project.id, workAction(f.submit.id)),
    code("WorkEvidenceSourceChanged"),
  );
  await commandWork(f.owner, f.project.id, workAction(f.submit.id, "Withdraw"));
  const fresh = await specialistWorkFixture();
  await commandWork(fresh.owner, fresh.project.id, fresh.submit);
  await sourceCommand(
    fresh.owner,
    fresh.engineering.id,
    handoverAction({
      action: "withdraw",
      source_id: fresh.sources.demand,
    }),
  );
  await assert.rejects(
    commandWork(fresh.reviewer, fresh.project.id, workAction(fresh.submit.id)),
    code("WorkEvidenceSourceChanged"),
  );
  await commandWork(
    fresh.reviewer,
    fresh.project.id,
    workAction(fresh.submit.id, "Return"),
  );
});

test("PJ06-R3-06 missing exact bytes, evidence authorship and forged SQL snapshots are refused atomically", async () => {
  const f = await specialistWorkFixture();
  const directory =
    process.env.PPO_DOCUMENT_DIRECTORY ??
    join(homedir(), ".ppo-synthetic-documents");
  assert.ok(directory && isAbsolute(directory));
  const path = join(directory, f.owner.workspace_id, f.document.operation_id);
  const bytes = await readFile(path),
    before = await snapshot();
  try {
    await writeFile(
      path,
      Buffer.concat([bytes, Buffer.from("SYN corruption")]),
    );
    await assert.rejects(
      commandWork(f.owner, f.project.id, f.submit),
      code("ExactDocumentUnavailable"),
    );
    assert.deepEqual(await snapshot(), before);
  } finally {
    await writeFile(path, bytes);
  }
  await grantLibrary(f.reviewer, ["document.register"]);
  const selfAuthored = libraryInput(f.reviewer.actor_id);
  await createDocument(f.reviewer, selfAuthored);
  await assert.rejects(
    commandWork(f.owner, f.project.id, {
      ...f.submit,
      document_id: selfAuthored.id,
      revision_id: selfAuthored.revision_id,
    }),
    code("IndependentWorkReviewRequired"),
  );
  await commandWork(f.owner, f.project.id, f.submit);
  const stable = await snapshot();
  await assert.rejects(
    rows(
      `INSERT INTO ppo.project_specialist_work(id,workspace_id,company_id,project_id,handover_id,document_id,revision_id,reviewer_id,scope,limitations,predecessor_id,source,source_hash,created_by)
    SELECT $2,workspace_id,company_id,project_id,handover_id,document_id,revision_id,reviewer_id,scope,limitations,NULL,source||'{"unapproved":true}'::jsonb,source_hash,created_by FROM ppo.project_specialist_work WHERE id=$1`,
      [f.submit.id, randomUUID()],
    ),
    code("23514"),
  );
  assert.deepEqual(await snapshot(), stable);
});

const cloneWork = (id: string, next = randomUUID()) =>
  rows(
    `INSERT INTO ppo.project_specialist_work(id,workspace_id,company_id,project_id,handover_id,document_id,revision_id,reviewer_id,scope,limitations,source,source_hash,created_by)
  SELECT $2,workspace_id,company_id,project_id,handover_id,document_id,revision_id,reviewer_id,scope,limitations,source,source_hash,created_by FROM ppo.project_specialist_work WHERE id=$1`,
    [id, next],
  );
const directAccept = (f: Awaited<ReturnType<typeof specialistWorkFixture>>) =>
  rows(
    `INSERT INTO ppo.project_specialist_work_events(workspace_id,work_id,version,command,state,note,reason,created_by,operation_id)
  VALUES($1,$2,2,'Accept','Accepted','SYN direct-write probe','SYN direct-write probe',$3,$4)`,
    [f.owner.workspace_id, f.submit.id, f.reviewer.actor_id, randomUUID()],
  );
test("PJ06-R3-07 direct orphan records cannot commit without their original submission", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  const before = await snapshot();
  await assert.rejects(
    cloneWork(f.submit.id),
    /Initial work submission required/,
  );
  assert.deepEqual(await snapshot(), before);
});
test("PJ06-R3-08 direct decisions cannot commit without matching receipt, audit and outbox", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  const before = await snapshot();
  await assert.rejects(
    directAccept(f),
    /Exact work audit, receipt and outbox required/,
  );
  assert.deepEqual(await snapshot(), before);
});
test("PJ06-R3-09 direct positive decisions refuse a withdrawn native demand before operation evidence", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  await sourceCommand(
    f.owner,
    f.engineering.id,
    handoverAction({ action: "withdraw", source_id: f.sources.demand }),
  );
  const before = await snapshot();
  await assert.rejects(
    directAccept(f),
    /Current approved handover demand required/,
  );
  assert.deepEqual(await snapshot(), before);
  await commandWork(
    f.reviewer,
    f.project.id,
    workAction(f.submit.id, "Return"),
  );
});
test("PJ06-R3-10 direct positive decisions refuse an accepted successor brief and retain historical return", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  const next = {
    ...f.package,
    id: randomUUID(),
    operation_id: randomUUID(),
    predecessor_id: f.package.id,
  };
  await commandPackage(f.owner, f.project.id, next);
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(next.id, 1, "Submit"),
  );
  await commandPackage(
    f.reviewer,
    f.project.id,
    packageAction(next.id, 2, "Accept"),
  );
  const before = await snapshot();
  await assert.rejects(
    directAccept(f),
    /Current accepted specialist brief required/,
  );
  await assert.rejects(
    commandWork(f.reviewer, f.project.id, workAction(f.submit.id)),
    code("WorkEvidenceSourceChanged"),
  );
  assert.deepEqual(await snapshot(), before);
  await commandWork(
    f.reviewer,
    f.project.id,
    workAction(f.submit.id, "Return"),
  );
});
test("PJ06-R3-11 direct positive decisions refuse a withdrawn issued release", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  await releaseCommand(
    f.releaser,
    f.engineering.id,
    handoverAction({
      action: "withdraw",
      release_id: f.release,
      expected_version: 5,
    }),
  );
  const before = await snapshot();
  await assert.rejects(
    directAccept(f),
    /Current exact issued release required/,
  );
  assert.deepEqual(await snapshot(), before);
  await commandWork(f.owner, f.project.id, workAction(f.submit.id, "Withdraw"));
});
test("PJ06-R3-12 direct positive decisions refuse a changed release drawing", async () => {
  const f = await specialistWorkFixture();
  await commandWork(f.owner, f.project.id, f.submit);
  await sourceCommand(
    f.owner,
    f.engineering.id,
    handoverAction({ action: "withdraw", source_id: f.sources.drawing }),
  );
  const before = await snapshot();
  await assert.rejects(
    directAccept(f),
    /Current exact issued release required/,
  );
  assert.deepEqual(await snapshot(), before);
  await commandWork(
    f.reviewer,
    f.project.id,
    workAction(f.submit.id, "Return"),
  );
});
