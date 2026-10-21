import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { migrate, seed } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  publishTemplate,
  readPublication,
} from "../../src/documents/publication/service";
import { assignUse } from "../../src/documents/use/service";
import { readOperation } from "../../src/shared/receipts";
import { processRenderJob, readBundle } from "../../src/documents/worker";
import { assignmentFixture, assignmentCommand } from "../helpers/template-use";
import { reviewedDraft } from "../helpers/template-publication";
import { queued, rows } from "../helpers/packs";
import { mirror, unrelated, within } from "../helpers/template-manifest";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
const renderer = (text: string) => JSON.parse(text).renderer;
test("Populated 0102 upgrade retains an assigned DK06-OUT09-1 publication and queued pack unchanged; its successor publishes as DK06-OUT09-2", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(102);
  await seed(102);
  const f = await assignmentFixture();
  await assignUse(f.publisher, f.use);
  const original = await readPublication(f.publisher, f.command.id),
    q = await queued();
  assert.equal(renderer(original.publication.definition), "DK06-OUT09-1");
  const tables = [
    "template_publications",
    "template_proposals",
    "template_proposal_revisions",
    "template_proposal_reviews",
    "template_use_policies",
    "template_use_assignments",
    "pack_templates",
    "pack_policy",
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
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108,110)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
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
  assert.deepEqual(upgraded.slice(0, ledger.length), ledger);
  assert.deepEqual(
    upgraded.slice(ledger.length).map((r) => r.version),
    [103, 104, 105, 106, 107, 108, 109, 110, 113],
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    upgraded,
  );
  // DK06-OUT09-1 stays supported while its own twelve files are unchanged.
  assert.deepEqual(await readPublication(f.publisher, f.command.id), original);
  assert.equal(original.runtime_support, "Supported");
  const output = await processRenderJob(q.pack.jobs[0].id);
  assert.ok("issue_id" in output, JSON.stringify(output));
  const issue = (
    await rows("SELECT * FROM ppo.pack_issues WHERE id=$1", [output.issue_id])
  )[0];
  assert.equal(issue.manifest.template.use_assignment_id, f.use.id);
  assert.ok(
    (await readBundle(q.p, issue.manifest)).html.includes(
      '<meta name="ppo-output-template" content="DK06-OUT09-1">',
    ),
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  // An unrelated edit still withdraws DK06-OUT09-1, as R3 designed. Its
  // replacement is a reviewed DK06-OUT09-2 successor, which is unaffected.
  const next = await reviewedDraft();
  await publishTemplate(next.publisher, next.input.id, next.command);
  const successor = await readPublication(next.publisher, next.command.id);
  assert.equal(renderer(successor.publication.definition), "DK06-OUT09-2");
  await assignUse(f.publisher, {
    ...(await assignmentCommand(f.publisher, next)),
    predecessor_id: f.use.id,
  });
  await within(await mirror(unrelated), async () => {
    assert.equal(
      (await readPublication(f.publisher, f.command.id)).runtime_support,
      "DefinitionChanged",
    );
    assert.equal(
      (await readPublication(next.publisher, next.command.id)).runtime_support,
      "Supported",
    );
    const later = await queued(10),
      issued = await processRenderJob(later.pack.jobs[0].id);
    assert.ok("issue_id" in issued, JSON.stringify(issued));
  });
});
