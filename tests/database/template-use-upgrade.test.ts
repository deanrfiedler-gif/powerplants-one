import assert from "node:assert/strict";
import { after, test } from "node:test";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { publishedUse, assignmentCommand } from "../helpers/template-use";
import { grantDraft } from "../helpers/template-drafts";
import { queued, rows } from "../helpers/packs";
import { readPublication } from "../../src/documents/publication/service";
import { assignUse } from "../../src/documents/use/service";
import { selectedTemplate, serverTime } from "../../src/documents/use/policy";
import { readOperation } from "../../src/shared/receipts";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
test("R4 populated 0093 upgrade preserves publications, exact ledgers and queued legacy output; future use retains the pinned baseline until activation", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(93);
  await seed(93);
  const f = await publishedUse(),
    q = await queued();
  const tables = [
    "template_publications",
    "template_proposals",
    "template_proposal_revisions",
    "template_proposal_reviews",
    "pack_templates",
    "report_templates",
    "finance_templates",
    "pack_policy",
    "report_template_policy",
    "finance_template_policy",
    "pack_revisions",
    "pack_render_jobs",
    "pack_issues",
    "business_identities",
    "operation_receipts",
    "audit_events",
    "outbox_jobs",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const before = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  const upgraded = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    upgraded.filter((r) => r.version <= 93),
    ledger,
  );
  assert.deepEqual(
    upgraded.filter((r) => r.version > 93).map((r) => r.version),
    [94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 111, 113],
  );
  for (const t of ["template_use_policies", "template_use_assignments"])
    assert.deepEqual(await rows(`SELECT * FROM ppo.${t}`), []);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.permission_grants WHERE capability='template.assign'",
    ),
    [],
  );
  assert.equal(
    (await readPublication(f.publisher, f.command.id)).runtime_support,
    "Supported",
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    upgraded,
  );
  await grantDraft(f.publisher, ["template.assign"]);
  const use = {
    ...(await assignmentCommand(f.publisher, f)),
    effective_from: new Date(
      (await serverTime(database())).getTime() + 3600000,
    ).toISOString(),
  };
  await assignUse(f.publisher, use);
  const completed = await processRenderJob(q.pack.jobs[0].id);
  assert.ok("issue_id" in completed, JSON.stringify(completed));
  const issue = (
      await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [
        completed.issue_id,
      ])
    )[0],
    bytes = await readBundle(q.p, issue.manifest);
  assert.equal(issue.manifest.template.use_assignment_id, undefined);
  assert.notEqual(issue.manifest.template.id, f.command.template_id);
  await database().query(
    "UPDATE ppo.pack_policy SET version=version+1 WHERE workspace_id=$1",
    [f.p.workspace_id],
  );
  await assert.rejects(
    selectedTemplate(database(), f.p.workspace_id, f.input),
    { code: "TemplateBaselineChanged" },
  );
  assert.deepEqual((await readBundle(q.p, issue.manifest)).pdf, bytes.pdf);
});
