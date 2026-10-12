import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  readDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { saveEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  saveRelease,
  reviewRelease,
  activateRelease,
  testRelease,
} from "../../src/cpq/releases";
import {
  readRelease,
  readRun,
  listReleases,
  runHistory,
  compareRuns,
} from "../../src/cpq/reads";
import {
  previewCalculation,
  calculateRun,
  previewAdoption,
  adoptRun,
} from "../../src/cpq/runs";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import { arithmeticPolicy } from "../../src/estimating/math";
import type { Duty } from "../../src/cpq/context";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const rows = async (q: string, v: unknown[] = []) =>
  (await database().query(q, v)).rows;
const code = (code: string) => (e: unknown) =>
  (e as { code: string }).code === code;
async function grant(actor: string, caps: Duty[]) {
  for (const cap of caps)
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, actor, CRM.company, cap],
    );
}
async function setup() {
  const p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("products-reviewer")).principal,
    publisher = (await createSession("products-publisher")).principal;
  await grant(p.actor_id, ["cpq.read", "cpq.author", "cpq.calculate"]);
  await grant(reviewer.actor_id, ["cpq.read", "cpq.review"]);
  await grant(publisher.actor_id, ["cpq.read", "cpq.publish"]);
  const release_id = randomUUID(),
    created = await saveRelease(p, {
      ...crmBase(),
      id: release_id,
      company_id: CRM.company,
      expected_version: 0,
      definition: cpqDefinition(),
    });
  const view = await readRelease(p, release_id),
    reviewInput = {
      ...crmBase(),
      expected_version: created.receipt.record_version,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      outcome: "Approved",
    };
  return { p, reviewer, publisher, release_id, view, reviewInput };
}
async function published() {
  const s = await setup();
  const review = await reviewRelease(s.reviewer, s.release_id, s.reviewInput);
  const activate = {
    ...crmBase(),
    expected_version: review.receipt.record_version,
    revision_id: s.view.current.id,
    content_hash: s.view.current.content_hash,
    expected_activation_version: 0,
  };
  await activateRelease(s.publisher, s.release_id, activate);
  return { ...s, activate };
}
async function discovery(p: Awaited<ReturnType<typeof setup>>["p"]) {
  const opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput();
  const preview = await previewDiscoveryCreate(p, {
    opportunity_id: opportunity.id,
    discovery,
  });
  const input = {
    ...crmBase(),
    id: randomUUID(),
    option_id: randomUUID(),
    revision_id: randomUUID(),
    opportunity_id: opportunity.id,
    discovery,
    expected_opportunity_version: preview.expected_opportunity_version,
    context_hash: preview.context_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
  };
  await createDiscoveryWorkspace(p, input);
  const view = await readDiscoveryWorkspace(p, input.id);
  return {
    id: input.id,
    option_id: view.workspace.selected_option_id,
    revision_id: input.revision_id,
  };
}
async function calculated() {
  const s = await published(),
    g = await discovery(s.p),
    preview = await previewCalculation(s.p, g.id, {
      option_id: g.option_id,
      revision_id: g.revision_id,
    });
  const command = {
    ...crmBase(),
    id: randomUUID(),
    option_id: g.option_id,
    revision_id: g.revision_id,
    binding_hash: preview.binding_hash,
    parent_id: null,
    input: cpqInput(),
  };
  const receipt = await calculateRun(s.p, g.id, command);
  return { ...s, g, command, receipt, run: await readRun(s.p, command.id) };
}
const adoption = (preview: Awaited<ReturnType<typeof previewAdoption>>) => ({
  ...crmBase(),
  preview_hash: preview.preview_hash,
  result_hash: preview.result_hash,
  estimate_id: preview.binding.estimate_id ?? randomUUID(),
  title: "SYN CPQ scoped proposal",
  scope: {
    included: "SYN sensor package",
    excluded: "SYN no other work",
    assumptions: "SYN software verification only",
  },
});

test("CPQ release review/publication is independent, hash-bound, replayable and revoked before recovery", async () => {
  const s = await setup();
  assert.equal(
    (await testRelease(s.p, s.view.current.id)).results[0].passed,
    true,
  );
  await grant(s.p.actor_id, ["cpq.review", "cpq.publish"]);
  await assert.rejects(
    reviewRelease(s.p, s.release_id, s.reviewInput),
    code("CpqIndependentReview"),
  );
  await assert.rejects(
    reviewRelease(s.reviewer, s.release_id, {
      ...s.reviewInput,
      content_hash: "0".repeat(64),
    }),
    code("CpqRevisionChanged"),
  );
  const a = await reviewRelease(s.reviewer, s.release_id, s.reviewInput);
  assert.equal(
    (await reviewRelease(s.reviewer, s.release_id, s.reviewInput)).replayed,
    true,
  );
  const activate = {
    ...crmBase(),
    expected_version: a.receipt.record_version,
    revision_id: s.view.current.id,
    content_hash: s.view.current.content_hash,
    expected_activation_version: 0,
  };
  await assert.rejects(
    activateRelease(s.p, s.release_id, activate),
    code("CpqIndependentPublication"),
  );
  const accepted = await activateRelease(s.publisher, s.release_id, activate);
  assert.deepEqual(
    await readOperation(s.publisher, activate.operation_id),
    accepted.receipt,
  );
  assert.equal(
    (await listReleases(s.p, { company_id: CRM.company })).active?.revision_id,
    s.view.current.id,
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='cpq.publish'",
    [s.publisher.actor_id],
  );
  await assert.rejects(
    activateRelease(s.publisher, s.release_id, activate),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(s.publisher, activate.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    rows("UPDATE ppo.cpq_revisions SET definition='{}' WHERE id=$1", [
      s.view.current.id,
    ]),
    code("55000"),
  );
});
test("failing fixtures cannot be approved and a revision invalidates prior approval", async () => {
  const s = await setup(),
    d = cpqDefinition();
  d.fixtures[0].expected.sell = "0.00";
  await saveRelease(s.p, {
    ...crmBase(),
    id: s.release_id,
    company_id: CRM.company,
    expected_version: 1,
    definition: d,
  });
  let v = await readRelease(s.p, s.release_id);
  await assert.rejects(
    reviewRelease(s.reviewer, s.release_id, {
      ...crmBase(),
      expected_version: v.release.version,
      revision_id: v.current.id,
      content_hash: v.current.content_hash,
      outcome: "Approved",
    }),
    code("CpqFixturesFailed"),
  );
  await assert.rejects(
    reviewRelease(s.reviewer, s.release_id, s.reviewInput),
    code("VersionConflict"),
  );
  assert.equal((await testRelease(s.p, v.current.id)).results[0].passed, false);
  const forbidden = (await createSession("observer")).principal;
  await assert.rejects(
    readRelease(forbidden, s.release_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    listReleases(s.p, { company_id: CRM.companyB }),
    code("RecordUnavailable"),
  );
  v = await readRelease(s.p, s.release_id);
  assert.equal(v.revisions.length, 2);
});
test("saved calculations and exact atomic adoption replay without duplicating estimates and preserve quote projection", async () => {
  const s = await calculated();
  assert.equal(s.run.state, "Ready");
  assert.equal(s.run.result.totals.sell, "105.00");
  assert.equal((await calculateRun(s.p, s.g.id, s.command)).replayed, true);
  await assert.rejects(
    calculateRun(s.p, s.g.id, { ...s.command, reason: "SYN changed replay" }),
    code("OperationConflict"),
  );
  const preview = await previewAdoption(s.p, s.run.id),
    input = adoption(preview),
    before = (
      await rows("SELECT count(*)::int AS n FROM ppo.estimate_versions")
    )[0].n;
  const [a, b] = await Promise.all([
    adoptRun(s.p, s.run.id, input),
    adoptRun(s.p, s.run.id, input),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.notEqual(a.replayed, b.replayed);
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.estimate_versions"))[0].n,
    before + 1,
  );
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.cpq_adoptions"))[0].n,
    1,
  );
  assert.deepEqual(await readOperation(s.p, input.operation_id), a.receipt);
  const e = await readEstimate(s.p, input.estimate_id);
  assert.equal(e.current_saved.lines.length, 2);
  await prepareQuote(s.p, input.estimate_id, {
    ...crmBase(),
    id: randomUUID(),
    estimate_version_id: e.current_saved.id,
    expected_version: e.version,
    expected_quote_version: 0,
    choices: e.current_saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  });
  const safe = JSON.stringify(
    (
      await rows(
        "SELECT safe_snapshot FROM ppo.draft_quote_revisions WHERE estimate_id=$1",
        [input.estimate_id],
      )
    )[0].safe_snapshot,
  );
  for (const privateKey of [
    "unit_cost",
    "contributions",
    "bom_sensor",
    "basis_hash",
  ])
    assert(!safe.includes(privateKey));
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='cpq.calculate'",
    [s.p.actor_id],
  );
  await assert.rejects(
    adoptRun(s.p, s.run.id, input),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(s.p, input.operation_id),
    code("RecordUnavailable"),
  );
});
test("recalculation retains manual costs, replaces owned lines and blocks stale estimate snapshots", async () => {
  const s = await calculated(),
    first = adoption(await previewAdoption(s.p, s.run.id));
  await adoptRun(s.p, s.run.id, first);
  let e = await readEstimate(s.p, first.estimate_id);
  const manual = {
    ...e.current_saved.lines[0],
    id: randomUUID(),
    description: "SYN retained freight",
    category: "Freight" as const,
    quantity: "1.000",
    unit_cost: "2.00",
    unit_sell: "3.00",
  };
  await saveEstimate(s.p, e.id, {
    ...crmBase(),
    schema_version: 2,
    expected_version: e.version,
    title: e.current_saved.title,
    scope: e.current_saved.scope,
    lines: [...e.current_saved.lines, manual],
    policy: arithmeticPolicy,
  });
  await assert.rejects(previewAdoption(s.p, s.run.id), code("CpqBasisChanged"));
  const preview = await previewCalculation(s.p, s.g.id, {
      option_id: s.g.option_id,
      revision_id: s.g.revision_id,
    }),
    input = cpqInput();
  input.instances[0].facts.count = "4";
  const second = {
    ...crmBase(),
    id: randomUUID(),
    option_id: s.g.option_id,
    revision_id: s.g.revision_id,
    binding_hash: preview.binding_hash,
    parent_id: s.run.id,
    input,
  };
  await calculateRun(s.p, s.g.id, second);
  const receiving = await previewAdoption(s.p, second.id);
  assert.deepEqual(receiving.retained_lines, [manual]);
  await adoptRun(s.p, second.id, adoption(receiving));
  e = await readEstimate(s.p, first.estimate_id);
  assert.equal(e.current_saved.lines.length, 3);
  assert.deepEqual(
    e.current_saved.lines.find((l) => l.id === manual.id),
    manual,
  );
  assert.equal((await runHistory(s.p, s.g.id)).items.length, 2);
  assert.equal(
    (await compareRuns(s.p, s.run.id, { with: second.id })).changes.length,
    2,
  );
});
test("blocked results, active-release changes and adoption rollback cannot create accepted costs", async () => {
  const s = await calculated(),
    input = cpqInput();
  input.instances[0].facts.count = null;
  const blocked = { ...s.command, ...crmBase(), id: randomUUID(), input };
  await calculateRun(s.p, s.g.id, blocked);
  assert.equal((await readRun(s.p, blocked.id)).state, "Blocked");
  await assert.rejects(previewAdoption(s.p, blocked.id), code("CpqRunBlocked"));
  const preview = await previewAdoption(s.p, s.run.id),
    adopt = adoption(preview);
  await rows(
    "CREATE FUNCTION ppo.cpq_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN atomic rollback'; END $$",
  );
  await rows(
    "CREATE TRIGGER cpq_test_fail BEFORE INSERT ON ppo.cpq_adoptions FOR EACH ROW EXECUTE FUNCTION ppo.cpq_test_fail()",
  );
  await assert.rejects(adoptRun(s.p, s.run.id, adopt));
  assert.equal(
    (
      await rows("SELECT count(*)::int AS n FROM ppo.estimates WHERE id=$1", [
        adopt.estimate_id,
      ])
    )[0].n,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
        [adopt.operation_id],
      )
    )[0].n,
    0,
  );
  await rows("DROP TRIGGER cpq_test_fail ON ppo.cpq_adoptions");
  await rows("DROP FUNCTION ppo.cpq_test_fail()");
  const latest = await readRelease(s.publisher, s.release_id);
  await activateRelease(s.publisher, s.release_id, {
    ...s.activate,
    ...crmBase(),
    expected_version: latest.release.version,
    expected_activation_version: 1,
  });
  await assert.rejects(previewAdoption(s.p, s.run.id), code("CpqBasisChanged"));
  await assert.rejects(
    calculateRun(s.p, s.g.id, { ...s.command, ...crmBase(), id: randomUUID() }),
    code("CpqBasisChanged"),
  );
});
test("0086 preserves populated history and grants; migrate and seed are repeatable", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(85);
  await seed(85);
  const p = (await createSession("coordinator")).principal,
    g = await discovery(p);
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    before = await readDiscoveryWorkspace(p, g.id);
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    grants,
  );
  assert.deepEqual(await readDiscoveryWorkspace(p, g.id), before);
  const after = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    after.filter((r) => r.version <= 85),
    ledger,
  );
  assert.deepEqual(
    after.filter((r) => r.version > 85).map((r) => r.version),
    [86],
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    after,
  );
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.cpq_releases"))[0].n,
    0,
  );
});
