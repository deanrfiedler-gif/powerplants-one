import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { withWorkingCompany } from "../../src/platform/working-company";
import {
  listTemplates,
  readTemplate,
  templateUsage,
} from "../../src/documents/template-catalogue";
import {
  supportedTemplateDefinition,
  type OutputFamily,
} from "../../src/documents/p11-template";
import { digest } from "../../src/documents/store";
import { prepared, principal, rows, base, id } from "../helpers/packs";
import { reconciledFinance, readFinance } from "../helpers/finance";
import {
  requestFinanceEvidence,
  processFinanceJob,
} from "../../src/finance/worker";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const templateId = (family: OutputFamily, n = 2) =>
  id(family === "OUT-09" ? "c1" : family === "OUT-10" ? "e1" : "f3", n);
const forbidden = { code: "Forbidden" };

test("DK06 exact historical/current catalogue preserves definition hashes and separates policy from runtime support", async () => {
  for (const family of ["OUT-09", "OUT-10", "OUT-14"] as const) {
    const p = await principal(family === "OUT-14" ? "finance" : "coordinator");
    const result = await listTemplates(p, { family });
    assert.equal(result.items.length, 2);
    assert.equal(result.completeness, "Complete");
    for (const t of result.items) {
      const detail = await readTemplate(p, t.id, { family });
      assert.equal(
        detail.definition,
        await supportedTemplateDefinition(family, t.version),
      );
      assert.equal(detail.content_hash, digest(detail.definition!));
      assert.equal(detail.runtime_support, "Supported");
      assert.equal(detail.selected_by_policy, t.version === 2);
      assert.equal(detail.definition_eligible, t.version === 2);
      assert.equal(
        detail.dependencies.state,
        t.version === 1 && family === "OUT-09" ? "NotRecorded" : "Recorded",
      );
    }
  }
});
test("DK06 signed pages bind actor, family, size and working company; foreign identities stay unavailable", async () => {
  const p = await principal(),
    q = { family: "OUT-09", limit: "1" };
  const first = await listTemplates(p, q);
  assert.equal(first.completeness, "Partial");
  const cursor = first.next_cursor!;
  const second = await listTemplates(p, { ...q, cursor });
  assert.equal(second.completeness, "Complete");
  assert.notEqual(first.items[0].id, second.items[0].id);
  for (const changed of [
    { ...q, family: "OUT-10" },
    { ...q, limit: "2" },
  ])
    await assert.rejects(listTemplates(p, { ...changed, cursor }), {
      code: "InvalidData",
    });
  await assert.rejects(
    listTemplates(await principal("observer"), { ...q, cursor }),
    { code: "InvalidData" },
  );
  await assert.rejects(
    withWorkingCompany(p.actor_id, id("20", 2), () =>
      listTemplates(p, { ...q, cursor }),
    ),
    { code: "InvalidData" },
  );
  await assert.rejects(readTemplate(p, templateId("OUT-10"), q), {
    code: "InvalidData",
  });
  await assert.rejects(
    readTemplate(p, templateId("OUT-10"), { family: "OUT-09" }),
    { code: "RecordUnavailable" },
  );
  await assert.rejects(
    readTemplate(await principal("other-workspace"), templateId("OUT-09"), {
      family: "OUT-09",
    }),
    forbidden,
  );
});
test("DK06 current family grants, working company and Finance confidentiality govern metadata", async () => {
  const p = await principal();
  await assert.rejects(listTemplates(p, { family: "OUT-14" }), forbidden);
  await assert.rejects(
    withWorkingCompany(p.actor_id, id("20", 2), () =>
      listTemplates(p, { family: "OUT-09" }),
    ),
    forbidden,
  );
  const grants = await rows(
    "SELECT id,valid_to FROM ppo.permission_grants WHERE user_id=$1 AND capability='pack.read'",
    [p.actor_id],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='pack.read'",
    [p.actor_id],
  );
  try {
    await assert.rejects(listTemplates(p, { family: "OUT-09" }), forbidden);
  } finally {
    for (const g of grants)
      await database().query(
        "UPDATE ppo.permission_grants SET valid_to=$2 WHERE id=$1",
        [g.id, g.valid_to],
      );
  }
});
test("DK06 unsupported and changed definitions remain inspectable without becoming eligible or rewriting history", async () => {
  const p = await principal("finance"),
    current = await readTemplate(p, templateId("OUT-14"), { family: "OUT-14" });
  const unsupported = randomUUID(),
    changed = randomUUID();
  for (const [tid, version, definition] of [
    [unsupported, 99, "SYN unsupported proposal"],
    [changed, 2, "SYN old retained renderer bytes"],
  ] as const)
    await database().query(
      "INSERT INTO ppo.finance_templates(id,workspace_id,version,definition,content_hash) VALUES($1,$2,$3,$4,$5)",
      [tid, p.workspace_id, version, definition, digest(definition)],
    );
  assert.equal(
    (await readTemplate(p, unsupported, { family: "OUT-14" })).runtime_support,
    "UnsupportedVersion",
  );
  const stale = await readTemplate(p, changed, { family: "OUT-14" });
  assert.equal(stale.runtime_support, "DefinitionChanged");
  assert.equal(stale.definition_eligible, false);
  assert.deepEqual(
    await readTemplate(p, templateId("OUT-14"), { family: "OUT-14" }),
    current,
  );
});
test("DK06 saved pack usage excludes crew drafts, preserves exact basis and returns no hidden counts", async () => {
  const pack = await prepared(10),
    p = await principal(),
    tid = templateId("OUT-09");
  const q = { family: "OUT-09", kind: "PackRevision" };
  const result = await templateUsage(p, tid, q);
  const use = result.items.find((x) => x.record_id === pack.id)!;
  assert.ok(use);
  assert.equal(use.revision_id, pack.current_revision_id);
  assert.equal(use.exact_definition_match, true);
  const crew = await templateUsage(
    await principal("assigned-technician"),
    tid,
    q,
  );
  assert.equal(
    crew.items.some((x) => x.record_id === pack.id),
    false,
  );
  assert.equal("total" in crew, false);
  const old = await templateUsage(p, templateId("OUT-09", 1), q);
  assert.equal(
    old.items.some((x) => x.record_id === pack.id),
    false,
  );
});
test("DK06 native pack/report/Finance issue and reserved-job lineage; repeat reads change no business rows", async () => {
  const q = await reconciledFinance(),
    r = await readFinance(q.reconciler, q.id);
  const v = (
    await rows("SELECT id FROM ppo.finance_reviews WHERE handoff_id=$1", [q.id])
  )[0];
  const recon = (
    await rows(
      "SELECT id FROM ppo.finance_reconciliations WHERE handoff_id=$1",
      [q.id],
    )
  )[0];
  await requestFinanceEvidence(q.reconciler, q.id, {
    ...base(),
    expected_version: r.handoff.version,
    revision_id: r.handoff.current_revision_id,
    review_id: v.id,
    reconciliation_id: recon.id,
  });
  const job = (
    await rows("SELECT id FROM ppo.finance_render_jobs WHERE handoff_id=$1", [
      q.id,
    ])
  )[0];
  assert.equal(
    (
      await templateUsage(q.p, templateId("OUT-14"), {
        family: "OUT-14",
        kind: "RenderJob",
      })
    ).items.find((x) => x.id === job.id)?.state,
    "Queued",
  );
  const issued = await processFinanceJob(job.id);
  assert.ok("issue_id" in issued, JSON.stringify(issued));
  const principals = [await principal(), await principal("finance")];
  const snapshot = async () => {
    const names = await rows(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' AND tablename<>'sessions' ORDER BY tablename",
    );
    const values = [];
    for (const { tablename } of names)
      values.push([
        tablename,
        await rows(
          `SELECT to_jsonb(t) AS row FROM ppo."${tablename}" t ORDER BY to_jsonb(t)::text`,
        ),
      ]);
    return values;
  };
  const beforeRows = await snapshot();
  for (const family of ["OUT-09", "OUT-10", "OUT-14"] as const) {
    const p = principals[family === "OUT-14" ? 1 : 0];
    for (const kind of ["RenderJob", "Issue"]) {
      const result = await templateUsage(p, templateId(family), {
        family,
        kind,
      });
      assert.ok(result.items.length > 0, family + kind);
      assert.ok(result.items.every((x) => x.exact_definition_match));
      assert.deepEqual(
        (await templateUsage(p, templateId(family), { family, kind })).items,
        result.items,
      );
    }
  }
  assert.deepEqual(await snapshot(), beforeRows);
  await closeDatabase();
  assert.equal(
    (
      await templateUsage(q.p, templateId("OUT-14"), {
        family: "OUT-14",
        kind: "Issue",
      })
    ).items[0].record_id,
    q.id,
  );
});
