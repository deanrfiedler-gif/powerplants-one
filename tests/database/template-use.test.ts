import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  assignUse,
  readAssignment,
  readUsePolicy,
} from "../../src/documents/use/service";
import { selectedTemplate, serverTime } from "../../src/documents/use/policy";
import { readOperation } from "../../src/shared/receipts";
import { readBundle, processRenderJob } from "../../src/documents/worker";
import { readPack } from "../../src/documents/packs";
import { withWorkingCompany } from "../../src/platform/working-company";
import { publishedUse, assignmentCommand, assignmentFixture } from "../helpers/template-use";
import { grantDraft } from "../helpers/template-drafts";
import { base, id, principal, queued, rows } from "../helpers/packs";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
after(closeDatabase);
const select = async (f: Awaited<ReturnType<typeof assignmentFixture>>) =>
  selectedTemplate(database(), f.p.workspace_id, f.input);
const query = (f: Awaited<ReturnType<typeof publishedUse>>) => ({
  company_id: f.input.company_id,
  site_id: f.input.site_id,
});
const until = async (at: string) => {
  await database().query(
    "SELECT pg_sleep(greatest(0,extract(epoch FROM $1::timestamptz-clock_timestamp())))",
    [at],
  );
};

test("R4 exact assignment is default-denied, scoped, immutable and independently recoverable after succession", async () => {
  await reset();
  const f = await publishedUse(),
    input = await assignmentCommand(f.publisher, f);
  assert.equal(
    (
      await rows(
        "SELECT 1 FROM ppo.permission_grants WHERE capability='template.assign'",
      )
    ).length,
    0,
  );
  await assert.rejects(assignUse(f.publisher, input), { status: 404 });
  await grantDraft(f.publisher, ["template.assign"]);
  await assert.rejects(
    assignUse(f.publisher, { ...input, site_id: id("70", 2) }),
    { status: 404 },
  );
  await assert.rejects(assignUse(f.publisher, { ...input, assign_all: true }), {
    status: 422,
  });
  const before = await rows(
      "SELECT * FROM ppo.pack_policy ORDER BY workspace_id",
    ),
    saved = await assignUse(f.publisher, input);
  assert.equal(saved.receipt.state, "Assigned");
  assert.equal(saved.receipt.record_version, 1);
  const original = await readAssignment(f.publisher, input.id),
    row = original.assignment;
  assert.equal(row.publication_id, f.command.id);
  assert.equal(row.template_id, f.command.template_id);
  assert.ok(row.effective_from <= row.recorded_at);
  assert.deepEqual(
    await rows("SELECT * FROM ppo.pack_policy ORDER BY workspace_id"),
    before,
  );
  assert.equal(
    (await readUsePolicy(f.publisher, query(f))).selection?.assignment_id,
    input.id,
  );
  const later = {
    ...(await assignmentCommand(f.publisher, f)),
    predecessor_id: input.id,
  };
  await assignUse(f.publisher, later);
  const first = await readAssignment(f.publisher, input.id),
    second = await readAssignment(f.publisher, later.id);
  assert.equal(first.assignment.effective_to, null);
  assert.equal(
    first.assignment.resolved_effective_to?.toISOString(),
    second.assignment.effective_from.toISOString(),
  );
  assert.deepEqual(
    (await assignUse(f.publisher, input)).receipt,
    saved.receipt,
  );
  assert.deepEqual(
    await readOperation(f.publisher, input.operation_id),
    saved.receipt,
  );
  await assert.rejects(
    assignUse(f.publisher, { ...input, approval_note: "Changed original" }),
    { code: "OperationConflict" },
  );
  await assert.rejects(readOperation(f.p, input.operation_id), { status: 404 });
  const event = (
    await rows("SELECT * FROM ppo.outbox_jobs WHERE operation_id=$1", [
      input.operation_id,
    ])
  )[0];
  assert.equal(event.kind, "TemplateUseAssigned");
  assert.equal(event.payload.object_type, "TemplateUseAssignment");
  for (const sql of [
    "DELETE FROM ppo.template_use_assignments WHERE id=$1",
    "UPDATE ppo.template_use_assignments SET approval_note='rewrite' WHERE id=$1",
  ])
    await assert.rejects(database().query(sql, [input.id]), { code: "55000" });
});

test("R4 server-timed half-open intervals retain legacy before activation, reject overlap and fail closed in gaps", async () => {
  await reset();
  const f = await assignmentFixture(),
    baseline = await select(f),
    now = await serverTime(database());
  const start = new Date(now.getTime() + 2500).toISOString(),
    end = new Date(now.getTime() + 5000).toISOString();
  const input = { ...f.use, effective_from: start, effective_to: end };
  await assignUse(f.publisher, input);
  assert.equal((await select(f)).id, baseline.id);
  const next = await assignmentCommand(f.publisher, f);
  await assert.rejects(
    assignUse(f.publisher, { ...next, effective_from: start }),
    { code: "AmbiguousTemplateUse" },
  );
  await assert.rejects(
    assignUse(f.publisher, {
      ...next,
      effective_from: new Date(now.getTime() - 1).toISOString(),
    }),
    { code: "InvalidEffectiveInterval" },
  );
  await assert.rejects(
    assignUse(f.publisher, {
      ...next,
      effective_from: start,
      effective_to: start,
    }),
    { code: "InvalidEffectiveInterval" },
  );
  await assert.rejects(
    assignUse(f.publisher, {
      ...next,
      effective_from: end,
      predecessor_id: input.id,
    }),
    { code: "InvalidPredecessor" },
  );
  await until(start);
  assert.equal((await select(f)).use_assignment_id, input.id);
  await until(end);
  await assert.rejects(select(f), { code: "TemplateUseUnavailable" });
  assert.equal(
    (await readUsePolicy(f.publisher, query(f))).hold,
    "TemplateUseUnavailable",
  );
  await assignUse(f.publisher, await assignmentCommand(f.publisher, f));
  assert.equal((await select(f)).policy_version, 2);
  assert.equal(
    (
      await selectedTemplate(database(), f.p.workspace_id, {
        ...f.input,
        site_id: id("70", 2),
      })
    ).id,
    baseline.id,
  );
});

test("R4 concurrent intents, atomic rollback and direct SQL cannot leave a partial or overlapping policy graph", async () => {
  await reset();
  const f = await assignmentFixture();
  await database().query(
    "CREATE FUNCTION ppo.reject_use_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='TemplateUseAssigned' THEN RAISE EXCEPTION 'SYN use fault'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_use_test BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.reject_use_test()",
  );
  try {
    await assert.rejects(assignUse(f.publisher, f.use), /SYN use fault/);
  } finally {
    await database().query(
      "DROP TRIGGER reject_use_test ON ppo.outbox_jobs; DROP FUNCTION ppo.reject_use_test()",
    );
  }
  for (const table of ["template_use_policies", "template_use_assignments"])
    assert.equal((await rows(`SELECT * FROM ppo.${table}`)).length, 0);
  assert.equal(
    (
      await rows("SELECT 1 FROM ppo.business_identities WHERE id=$1", [
        f.use.id,
      ])
    ).length,
    0,
  );
  const competing = { ...f.use, ...base(), id: randomUUID() };
  const outcomes = await Promise.allSettled([
    assignUse(f.publisher, f.use),
    assignUse(f.publisher, competing),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await readUsePolicy(f.publisher, query(f))).version, 1);
  await assert.rejects(
    database().query("UPDATE ppo.template_use_policies SET version=version+1"),
    { code: "23514" },
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.template_use_policies"),
    { code: "23514" },
  );
  await assert.rejects(
    transaction(async (c) => {
      await c.query("UPDATE ppo.template_use_policies SET version=version+1");
      await c.query(
        `INSERT INTO ppo.template_use_assignments SELECT (jsonb_populate_record(NULL::ppo.template_use_assignments,to_jsonb(a)||jsonb_build_object('id',$1::text,'policy_version',2,'operation_id',$2::text,'effective_from',clock_timestamp()))).* FROM ppo.template_use_assignments a LIMIT 1`,
        [randomUUID(), randomUUID()],
      );
    }),
    { code: "23514" },
  );
  assert.equal((await readUsePolicy(f.publisher, query(f))).version, 1);
});

test("R4 current permissions, working company, baseline and publication identity remain binding on reads and original recovery", async () => {
  await reset();
  const f = await assignmentFixture();
  await assert.rejects(
    assignUse(f.publisher, { ...f.use, baseline_hash: "0".repeat(64) }),
    { code: "StaleTemplateBaseline" },
  );
  await assert.rejects(
    assignUse(f.publisher, { ...f.use, definition_hash: "0".repeat(64) }),
    { code: "StaleTemplate" },
  );
  const accepted = await assignUse(f.publisher, f.use);
  await assert.rejects(
    withWorkingCompany(f.publisher.actor_id, id("20", 2), () =>
      readAssignment(f.publisher, f.use.id),
    ),
    { status: 404 },
  );
  await assert.rejects(
    readAssignment(await principal("other-workspace"), f.use.id),
    { status: 404 },
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='template.assign'",
    [f.publisher.actor_id],
  );
  assert.equal(
    (await readAssignment(f.publisher, f.use.id)).assignment.id,
    f.use.id,
  );
  await assert.rejects(assignUse(f.publisher, f.use), { status: 404 });
  await assert.rejects(readOperation(f.publisher, f.use.operation_id), {
    status: 404,
  });
  await grantDraft(f.publisher, ["template.assign"]);
  assert.deepEqual(
    await readOperation(f.publisher, f.use.operation_id),
    accepted.receipt,
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='shared.read'",
    [f.publisher.actor_id],
  );
  await assert.rejects(readAssignment(f.publisher, f.use.id), { status: 404 });
  await assert.rejects(readUsePolicy(f.publisher, query(f)), { status: 404 });
  await grantDraft(f.publisher, ["shared.read"]);
  assert.deepEqual(
    (await assignUse(f.publisher, f.use)).receipt,
    accepted.receipt,
  );
});

test("R4 native worker uses the assigned definition without template-management grants and preserves issued bytes through succession", async () => {
  await reset();
  const f = await assignmentFixture();
  await assignUse(f.publisher, f.use);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability LIKE 'template.%'",
    [f.p.actor_id],
  );
  const q = await queued(),
    job = q.pack.jobs[0],
    output = await processRenderJob(job.id);
  assert.ok("issue_id" in output, JSON.stringify(output));
  const issue = (
    await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [output.issue_id])
  )[0];
  assert.equal(issue.manifest.template.use_assignment_id, f.use.id);
  assert.equal(issue.manifest.template.id, f.command.template_id);
  const bytes = await readBundle(q.p, issue.manifest);
  assert.ok(bytes.html.includes(f.input.body.title));
  await assignUse(f.publisher, {
    ...(await assignmentCommand(f.publisher, f)),
    predecessor_id: f.use.id,
  });
  assert.deepEqual((await readBundle(q.p, issue.manifest)).pdf, bytes.pdf);
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  assert.equal(
    (await readPack(q.p, q.pack.id)).items[0].current_issue_id,
    issue.id,
  );
});

test("R4 policy change after storage refuses stale issue, preserves the original bundle and blocks direct stale reservations", async () => {
  await reset();
  const f = await assignmentFixture();
  await assignUse(f.publisher, f.use);
  const q = await queued(),
    job = q.pack.jobs[0];
  const result = await processRenderJob(job.id, {
    afterStore: async () => {
      await assignUse(f.publisher, {
        ...(await assignmentCommand(f.publisher, f)),
        predecessor_id: f.use.id,
      });
    },
  });
  assert.equal("state" in result && result.state, "StaleSource");
  const retained = (
    await rows("SELECT * FROM ppo.pack_render_jobs WHERE id=$1", [job.id])
  )[0];
  assert.ok(retained.output_manifest);
  assert.ok((await readBundle(q.p, retained.output_manifest)).pdf.length > 0);
  assert.equal(
    (await rows("SELECT * FROM ppo.pack_issues WHERE pack_id=$1", [q.pack.id]))
      .length,
    0,
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  await assert.rejects(
    database().query(
      `INSERT INTO ppo.pack_render_jobs SELECT (jsonb_populate_record(NULL::ppo.pack_render_jobs,to_jsonb(j)||jsonb_build_object('id',$1::text,'operation_id',$2::text))).* FROM ppo.pack_render_jobs j WHERE id=$3`,
      [randomUUID(), randomUUID(), job.id],
    ),
    { code: "23514", constraint: "template_use_current" },
  );
});
