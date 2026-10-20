import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { queued } from "../helpers/packs";
import {
  createProposal,
  reviewProposal,
} from "../../src/documents/drafts/commands";
import {
  setupDraft,
  draftInput,
  reviewCommand,
} from "../helpers/template-drafts";
import { readOperation } from "../../src/shared/receipts";
import { recoverSchema } from "../helpers/recover-schema";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
after(closeDatabase);
test("R3 populated 0092 upgrade preserves exact output reservations, authority and ledgers; reapplication is inert", async () => {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(92);
  await seed(92);
  const q = await queued();
  const { p, reviewer } = await setupDraft(),
    input = await draftInput(p);
  await createProposal(p, input);
  await reviewProposal(
    reviewer,
    input.id,
    await reviewCommand(reviewer, input.id),
  );
  const tables = [
    "template_proposals",
    "template_proposal_revisions",
    "template_proposal_reviews",
    "template_proposal_events",
    "pack_templates",
    "report_templates",
    "finance_templates",
    "pack_policy",
    "report_template_policy",
    "finance_template_policy",
    "pack_revisions",
    "pack_render_jobs",
    "pack_issues",
    "operation_receipts",
    "permission_grants",
    "users",
    "seed_receipts",
  ];
  const rows = async (sql: string) => (await database().query(sql)).rows;
  const snapshot = () =>
    Promise.all(
      tables.map((t) =>
        rows(
          // Seeds 107 (SYN-PPO-P04 v2, field readiness gate) and 108 (Conversations grants) are the only later seeds; readiness-gate.test.ts and conversations-upgrade.test.ts prove them.
          `SELECT to_jsonb(r) AS value FROM ppo.${t} r${t === "seed_receipts" ? " WHERE r.version NOT IN (107,108)" : t === "permission_grants" ? " WHERE r.capability NOT LIKE 'conversation.%'" : ""} ORDER BY to_jsonb(r)::text`,
        ),
      ),
    );
  const original = await snapshot(),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  const afterLedger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    afterLedger.filter((r) => r.version <= 92),
    ledger,
  );
  assert.deepEqual(
    afterLedger.filter((r) => r.version > 92).map((r) => r.version),
    [93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 111],
  );
  assert.deepEqual(await rows("SELECT * FROM ppo.template_publications"), []);
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.permission_grants WHERE capability='template.publish'",
    ),
    [],
  );
  assert.deepEqual(
    await readOperation(q.p, q.cmd.operation_id),
    q.receipt.receipt,
  );
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    afterLedger,
  );
});
