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
  previewDiscoveryChange,
  changeDiscoveryWorkspace,
} from "../../src/estimating/discovery-workspaces";
import { saveEstimate, prepareQuote } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  saveRelease,
  reviewRelease,
  activateRelease,
  testRelease,
  sealRelease,
} from "../../src/cpq/releases";
import { saveDraft, readDraft, listDrafts } from "../../src/cpq/drafts";
import { ruleRegister } from "../../src/cpq/ui-reads";
import { definition as validateDefinition } from "../../src/cpq/validation";
import {
  readRelease,
  readRun,
  listReleases,
  runHistory,
  compareRuns,
} from "../../src/cpq/reads";
import {
  previewCalculation,
  evaluatePreview,
  calculateRun,
  previewAdoption,
  adoptRun,
} from "../../src/cpq/runs";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { discoveryInput } from "../helpers/estimating-discovery";
import { cpqDefinition, cpqInput } from "../helpers/cpq";
import { arithmeticPolicy } from "../../src/estimating/math";
import {
  previewDiscoveryCosting,
  adoptDiscoveryCosting,
} from "../../src/estimating/cost-basis-service";
import { manualLines } from "../helpers/estimating";
import {
  productFixture,
  publishProduct,
  productInput,
  productContentFixture,
  relationshipFixture,
} from "../helpers/products";
import {
  createProduct,
  reviseProduct,
  decideProduct,
} from "../../src/products/commands";
import { readProduct } from "../../src/products/reads";
import {
  createRelationship,
  reviewRelationship,
} from "../../src/products/relationships";
import { readEstimateProducts } from "../../src/cpq/reads";
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
async function grant(
  actor: string,
  caps: import("../../src/platform/permissions").Capability[],
) {
  for (const cap of caps)
    await rows(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,$4,'Company',$3)",
      [CRM.workspace, actor, CRM.company, cap],
    );
}
async function setup(definition = cpqDefinition()) {
  const p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("products-reviewer")).principal,
    publisher = (await createSession("products-publisher")).principal;
  await grant(p.actor_id, ["cpq.read", "cpq.author", "cpq.calculate"]);
  await grant(reviewer.actor_id, ["cpq.read", "cpq.review"]);
  await grant(publisher.actor_id, ["cpq.read", "cpq.publish"]);
  if (definition.schema_version === 2)
    for (const actor of [p, reviewer, publisher])
      await rows(
        "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'products.read','Company',$3) ON CONFLICT DO NOTHING",
        [CRM.workspace, actor.actor_id, CRM.company],
      );
  const release_id = randomUUID(),
    created = await saveRelease(p, {
      ...crmBase(),
      id: release_id,
      company_id: CRM.company,
      expected_version: 0,
      definition,
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
async function published(definition = cpqDefinition()) {
  const s = await setup(definition);
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
async function discovery(
  p: Awaited<ReturnType<typeof setup>>["p"],
  opportunity = crmCreate(),
) {
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
async function calculated(definition = cpqDefinition()) {
  const s = await published(definition),
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

test("design contract retains drafts, immutable rule versions and separate seals; live head changes only on activation", async () => {
  const s = await setup();
  const content = validateDefinition({
    ...cpqDefinition(),
    schema_version: 3,
    design: {
      option_sets: [],
      structure: [],
      shared_capacity: [],
      decision_tables: [],
      pricing: { mode: "Catalog", percent: "0", allow_override: true },
    },
  });
  const draftInput = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    kind: "Rules",
    release_id: s.release_id,
    estimating_workspace_id: null,
    option_id: null,
    discovery_revision_id: null,
    base_revision_id: s.view.current.id,
    base_run_id: null,
    binding_hash: null,
    label: content.label,
    expected_version: 0,
    content: {
      ...content,
      rules: [{ ...content.rules[0], quantity: "ceil(" }],
    },
  };
  const saved = await saveDraft(s.p, draftInput);
  assert.equal(saved.receipt.state, "Working");
  assert.equal(
    (await readDraft(s.p, draftInput.id)).draft.content.rules instanceof Array,
    true,
  );
  assert.equal((await saveDraft(s.p, draftInput)).replayed, true);
  assert.equal(
    (await readOperation(s.p, draftInput.operation_id)).record_id,
    draftInput.id,
  );
  assert.equal(
    (await listDrafts(s.p, { company_id: CRM.company, kind: "Rules" })).items
      .length,
    1,
  );
  assert.equal(
    (await readRelease(s.p, s.release_id)).current.id,
    s.view.current.id,
  );
  await assert.rejects(
    saveDraft(s.p, {
      ...draftInput,
      ...crmBase(),
      content,
      expected_version: 0,
    }),
    code("VersionConflict"),
  );
  await saveDraft(s.p, {
    ...draftInput,
    ...crmBase(),
    content,
    expected_version: 1,
  });
  assert.equal((await readDraft(s.p, draftInput.id)).history.length, 2);
  const made = await saveRelease(s.p, {
    ...crmBase(),
    id: s.release_id,
    company_id: CRM.company,
    expected_version: 1,
    definition: content,
    draft: { id: draftInput.id, expected_version: 2 },
  });
  const v = await readRelease(s.p, s.release_id);
  assert.equal(
    (await readDraft(s.p, draftInput.id)).draft.base_revision_id,
    v.current.id,
  );
  assert.equal((await readDraft(s.p, draftInput.id)).history.length, 3);
  assert.equal(v.rule_versions.length, 2);
  assert.equal(v.members.length, 2);
  const reviewed = await reviewRelease(s.reviewer, s.release_id, {
    ...crmBase(),
    expected_version: made.receipt.record_version,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
    outcome: "Approved",
  });
  const activate = {
    ...crmBase(),
    expected_version: reviewed.receipt.record_version,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
    expected_activation_version: 0,
  };
  await assert.rejects(
    activateRelease(s.publisher, s.release_id, activate),
    code("CpqRevisionChanged"),
  );
  const seal = {
    ...crmBase(),
    expected_version: reviewed.receipt.record_version,
    revision_id: v.current.id,
    content_hash: v.current.content_hash,
  };
  const sealed = await sealRelease(s.publisher, s.release_id, seal);
  assert.equal((await readRelease(s.p, s.release_id)).active, null);
  assert.equal(
    (await ruleRegister(s.p, { company_id: CRM.company })).items.some(
      (r) => r.is_active,
    ),
    false,
  );
  assert.equal(
    (await sealRelease(s.publisher, s.release_id, seal)).replayed,
    true,
  );
  assert.equal(
    (await readOperation(s.publisher, seal.operation_id)).state,
    "Sealed",
  );
  await activateRelease(s.publisher, s.release_id, {
    ...activate,
    ...crmBase(),
    expected_version: sealed.receipt.record_version,
  });
  const before = await readRelease(s.p, s.release_id);
  const activeRows = (await ruleRegister(s.p, { company_id: CRM.company }))
    .items;
  assert.equal(activeRows.length, content.rules.length);
  assert.ok(
    activeRows.every(
      (r) => r.is_active && r.is_current && r.revision_id === v.current.id,
    ),
  );
  content.rules[0].description = "SYN new explanation";
  await saveRelease(s.p, {
    ...crmBase(),
    id: s.release_id,
    company_id: CRM.company,
    expected_version: before.release.version,
    definition: content,
  });
  const after = await readRelease(s.p, s.release_id);
  assert.equal(after.rule_versions.length, 3);
  assert.equal(after.active?.revision.id, v.current.id);
  assert.equal(after.seals.length, 1);
  const concurrentRows = (await ruleRegister(s.p, { company_id: CRM.company }))
    .items;
  assert.equal(concurrentRows.length, content.rules.length * 2);
  assert.ok(
    concurrentRows
      .filter((r) => r.is_active)
      .every(
        (r) =>
          !r.is_current &&
          r.revision_id === v.current.id &&
          r.state === "Published",
      ),
  );
  assert.ok(
    concurrentRows
      .filter((r) => r.is_current)
      .every(
        (r) =>
          !r.is_active &&
          r.revision_id === after.current.id &&
          r.state === "Draft",
      ),
  );
  assert.equal(
    concurrentRows.find(
      (r) => r.is_active && r.rule.key === content.rules[0].key,
    )?.rule.description,
    v.current.definition.rules[0].description,
  );
  await saveRelease(s.p, {
    ...crmBase(),
    id: s.release_id,
    company_id: CRM.company,
    expected_version: after.release.version,
    definition: v.current.definition,
  });
  const reused = await readRelease(s.p, s.release_id);
  assert.equal(reused.rule_versions.length, 3);
  assert.deepEqual(
    reused.members.map((m) => m.rule_version_id).sort(),
    v.members.map((m) => m.rule_version_id).sort(),
  );
  await assert.rejects(
    rows(
      "UPDATE ppo.cpq_rule_versions SET reason='changed' WHERE workspace_id=$1",
      [CRM.workspace],
    ),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='cpq.author'",
    [CRM.workspace, s.p.actor_id],
  );
  await assert.rejects(readOperation(s.p, draftInput.operation_id));
});

test("rule register distinguishes inactive published releases from the exact company activation", async () => {
  const s = await published();
  const otherId = randomUUID();
  const saved = await saveRelease(s.p, {
    ...crmBase(),
    id: otherId,
    company_id: CRM.company,
    expected_version: 0,
    definition: { ...cpqDefinition(), label: "SYN replacement release" },
  });
  const other = await readRelease(s.p, otherId);
  const reviewed = await reviewRelease(s.reviewer, otherId, {
    ...crmBase(),
    expected_version: saved.receipt.record_version,
    revision_id: other.current.id,
    content_hash: other.current.content_hash,
    outcome: "Approved",
  });
  await activateRelease(s.publisher, otherId, {
    ...crmBase(),
    expected_version: reviewed.receipt.record_version,
    revision_id: other.current.id,
    content_hash: other.current.content_hash,
    expected_activation_version: 1,
  });
  const registry = await ruleRegister(s.p, { company_id: CRM.company });
  assert.equal(
    registry.items.filter((r) => r.is_active).length,
    other.current.definition.rules.length,
  );
  assert.ok(
    registry.items
      .filter((r) => r.is_active)
      .every(
        (r) => r.release_id === otherId && r.revision_id === other.current.id,
      ),
  );
  const previous = registry.items.filter((r) => r.release_id === s.release_id);
  assert.equal(previous.length, s.view.current.definition.rules.length);
  assert.ok(
    previous.every(
      (r) => r.state === "Published" && r.is_current && !r.is_active,
    ),
  );
  await assert.rejects(ruleRegister(s.p, { company_id: CRM.companyB }));
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
test("live preview creates no evidence; Save atomically retains the working draft and immutable run with CAS rollback", async () => {
  const s = await calculated();
  const snapshot = async () =>
    rows(
      "SELECT (SELECT count(*) FROM ppo.cpq_runs)::int AS runs,(SELECT count(*) FROM ppo.audit_events)::int AS audits,(SELECT count(*) FROM ppo.operation_receipts)::int AS receipts",
    );
  const before = await snapshot();
  const preview = await evaluatePreview(s.p, s.g.id, {
    option_id: s.g.option_id,
    revision_id: s.g.revision_id,
    binding_hash: s.command.binding_hash,
    input: cpqInput(),
  });
  assert.equal(preview.result.ready, true);
  assert.deepEqual(await snapshot(), before);
  const command = {
    ...s.command,
    ...crmBase(),
    id: randomUUID(),
    parent_id: s.run.id,
    draft: {
      id: randomUUID(),
      expected_version: 0,
      label: "SYN saved configuration",
    },
  };
  await calculateRun(s.p, s.g.id, command);
  const saved = await readDraft(s.p, command.draft.id);
  assert.equal(saved.draft.base_run_id, command.id);
  assert.equal(saved.draft.version, 1);
  assert.deepEqual(saved.draft.content, (await readRun(s.p, command.id)).input);
  assert.equal((await calculateRun(s.p, s.g.id, command)).replayed, true);
  const stable = await snapshot(),
    bad = { ...command, ...crmBase(), id: randomUUID() };
  await assert.rejects(calculateRun(s.p, s.g.id, bad), code("VersionConflict"));
  assert.deepEqual(await snapshot(), stable);
  assert.equal((await readDraft(s.p, command.draft.id)).history.length, 1);
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
    [86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
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

test("0091 preserves populated 0086 CPQ releases, runs, adoption and identity history", async () => {
  await database().query(
    await readFile(
      new URL("../../db/migrations/0001-recover.sql", import.meta.url),
      "utf8",
    ),
  );
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(86);
  await seed(86);
  // The prior contract's service paths do not require the new read projections.
  const p = (await createSession("coordinator")).principal,
    reviewer = (await createSession("products-reviewer")).principal,
    publisher = (await createSession("products-publisher")).principal;
  await grant(p.actor_id, ["cpq.read", "cpq.author", "cpq.calculate"]);
  await grant(reviewer.actor_id, ["cpq.read", "cpq.review"]);
  await grant(publisher.actor_id, ["cpq.read", "cpq.publish"]);
  const id = randomUUID();
  await saveRelease(p, {
    ...crmBase(),
    id,
    company_id: CRM.company,
    expected_version: 0,
    definition: cpqDefinition(),
  });
  const v = (
    await rows("SELECT * FROM ppo.cpq_revisions WHERE release_id=$1", [id])
  )[0];
  await reviewRelease(reviewer, id, {
    ...crmBase(),
    expected_version: 1,
    revision_id: v.id,
    content_hash: v.content_hash,
    outcome: "Approved",
  });
  await activateRelease(publisher, id, {
    ...crmBase(),
    expected_version: 2,
    revision_id: v.id,
    content_hash: v.content_hash,
    expected_activation_version: 0,
  });
  const g = await discovery(p),
    basis = await previewCalculation(p, g.id, {
      option_id: g.option_id,
      revision_id: g.revision_id,
    }),
    runId = randomUUID();
  await calculateRun(p, g.id, {
    ...crmBase(),
    id: runId,
    option_id: g.option_id,
    revision_id: g.revision_id,
    parent_id: null,
    binding_hash: basis.binding_hash,
    input: cpqInput(),
  });
  await adoptRun(p, runId, adoption(await previewAdoption(p, runId)));
  const tables = [
    "cpq_releases",
    "cpq_revisions",
    "cpq_reviews",
    "cpq_activations",
    "cpq_heads",
    "cpq_runs",
    "cpq_adoptions",
    "business_identities",
    "permission_grants",
    "estimate_versions",
  ];
  const snapshots = await Promise.all(
    tables.map((t) =>
      rows(
        `SELECT to_jsonb(t) AS row FROM ppo.${t} t ORDER BY to_jsonb(t)::text`,
      ),
    ),
  );
  const ledger = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  await migrate();
  await seed();
  for (let i = 0; i < tables.length; i++)
    assert.deepEqual(
      await rows(
        `SELECT to_jsonb(t) AS row FROM ppo.${tables[i]} t ORDER BY to_jsonb(t)::text`,
      ),
      snapshots[i],
    );
  const current = await rows(
    "SELECT * FROM public.ppo_migrations ORDER BY version",
  );
  assert.deepEqual(
    current.filter((r) => r.version <= 86),
    ledger,
  );
  assert.deepEqual(
    current.filter((r) => r.version > 86).map((r) => r.version),
    [87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
  );
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    current,
  );
  assert.equal((await readRelease(p, id)).current.content_hash, v.content_hash);
});

async function mappedProduct() {
  const f = await productFixture();
  const product = await publishProduct(f.author.p, f.reviewer.p, f.variant.id);
  const definition = cpqDefinition();
  definition.schema_version = 2;
  definition.parts[0].product = {
    product_id: product.product.id,
    revision_id: product.revision.id,
    content_hash: product.revision.content_hash,
    relationships: [],
  };
  return { f, product, definition };
}
async function withdrawProduct(
  f: Awaited<ReturnType<typeof mappedProduct>>["f"],
) {
  const current = await readProduct(f.author.p, f.variant.id);
  await decideProduct(f.author.p, f.variant.id, {
    ...crmBase(),
    expected_version: current.product.version,
    revision_id: current.product.published_revision_id,
    action: "Withdrawn",
  });
}

test("mapped CPQ preserves exact conditional compatibility and refuses replacement, unresolved, foreign-endpoint and superseded evidence", async () => {
  const m = await mappedProduct();
  const second = await publishProduct(
    m.f.author.p,
    m.f.reviewer.p,
    m.f.similar.id,
  );
  m.definition.parts.push({
    ...m.definition.parts[0],
    key: "companion",
    product: {
      product_id: second.product.id,
      revision_id: second.revision.id,
      content_hash: second.revision.content_hash,
      relationships: [],
    },
  });
  const s = await setup();
  await grant(s.p.actor_id, ["products.read"]);
  async function relation(
    type: "Compatibility" | "CandidateReplacement",
    outcome: "Conditional" | "Unresolved",
    from = m.product.revision.id,
  ) {
    const input = {
      ...crmBase(),
      id: randomUUID(),
      from: { product_id: m.product.product.id, revision_id: from },
      to: { product_id: second.product.id, revision_id: second.revision.id },
      predecessor_id: null,
      content: relationshipFixture({
        type,
        criteria: [
          {
            criterion: "Synthetic voltage",
            outcome: outcome === "Conditional" ? "Met" : "Unknown",
            evidence: "SYN conditional only",
            owner: "SYN technical owner",
          },
        ],
      }),
    };
    await createRelationship(m.f.author.p, input);
    const row = (
      await rows("SELECT * FROM ppo.product_relationships WHERE id=$1", [
        input.id,
      ])
    )[0];
    await reviewRelationship(m.f.reviewer.p, input.id, {
      ...crmBase(),
      expected_version: 1,
      content_hash: row.content_hash,
      outcome,
    });
    const review = (
      await rows(
        "SELECT * FROM ppo.product_relationship_reviews WHERE relationship_id=$1",
        [input.id],
      )
    )[0];
    return {
      input,
      ref: {
        id: input.id,
        content_hash: row.content_hash,
        review_id: review.id,
      },
    };
  }
  for (const [type, outcome] of [
    ["Compatibility", "Unresolved"],
    ["CandidateReplacement", "Conditional"],
  ] as const) {
    const rel = await relation(type, outcome);
    m.definition.parts[0].product!.relationships = [rel.ref];
    await assert.rejects(
      saveRelease(s.p, {
        ...crmBase(),
        id: randomUUID(),
        company_id: CRM.company,
        expected_version: 0,
        definition: m.definition,
      }),
      code("CpqProductCompatibilityReviewRequired"),
    );
  }
  const rel = await relation("Compatibility", "Conditional");
  m.definition.parts[0].product!.relationships = [rel.ref];
  const withoutEndpoint = structuredClone(m.definition);
  withoutEndpoint.parts.pop();
  await assert.rejects(
    saveRelease(s.p, {
      ...crmBase(),
      id: randomUUID(),
      company_id: CRM.company,
      expected_version: 0,
      definition: withoutEndpoint,
    }),
    code("CpqProductRelationshipMismatch"),
  );
  // Reuse the already provisioned CPQ duties without creating duplicate grants.
  await rows("DELETE FROM ppo.permission_grants WHERE capability LIKE 'cpq.%'");
  const saved = await calculated(m.definition);
  const product = saved.run.binding.products![0];
  assert.equal(product.compatibility, "ConditionalEvidence");
  assert.equal(product.supplier_lead_time, "Unknown");
  assert.deepEqual(product.relationship_evidence[0].content, rel.input.content);
  const preview = await previewAdoption(saved.p, saved.run.id);
  assert.deepEqual(preview.product_provenance![0].product, product);
  await createRelationship(m.f.author.p, {
    ...rel.input,
    ...crmBase(),
    id: randomUUID(),
    predecessor_id: rel.input.id,
    content: {
      ...rel.input.content,
      evidence: "SYN successor requires reassessment",
    },
  });
  await assert.rejects(
    adoptRun(saved.p, saved.run.id, adoption(preview)),
    code("CpqProductRelationshipSuperseded"),
  );
  assert.deepEqual(await readRun(saved.p, saved.run.id), saved.run);
});

test("mapped CPQ adoption rolls back fully, races once, retains exact estimate provenance and excludes it from quotation", async () => {
  const m = await mappedProduct(),
    s = await calculated(m.definition);
  const preview = await previewAdoption(s.p, s.run.id),
    input = adoption(preview);
  const snapshot = async () => {
    const result: Record<string, unknown> = {};
    for (const table of [
      "estimates",
      "estimate_versions",
      "cpq_adoptions",
      "audit_events",
      "outbox_jobs",
      "operation_receipts",
      "business_identities",
    ])
      result[table] = await rows(`SELECT * FROM ppo.${table} ORDER BY id`);
    return result;
  };
  const before = await snapshot();
  await rows(
    "CREATE FUNCTION ppo.cpq_product_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYN rollback after native estimate'; END $$",
  );
  await rows(
    "CREATE TRIGGER cpq_product_fail BEFORE INSERT ON ppo.cpq_adoptions FOR EACH ROW EXECUTE FUNCTION ppo.cpq_product_fail()",
  );
  await assert.rejects(adoptRun(s.p, s.run.id, input));
  assert.deepEqual(await snapshot(), before);
  await rows("DROP TRIGGER cpq_product_fail ON ppo.cpq_adoptions");
  const [a, b] = await Promise.all([
    adoptRun(s.p, s.run.id, input),
    adoptRun(s.p, s.run.id, input),
  ]);
  assert.deepEqual(a.receipt, b.receipt);
  assert.notEqual(a.replayed, b.replayed);
  await assert.rejects(
    adoptRun(s.p, s.run.id, { ...input, ...crmBase() }),
    code("CpqBasisChanged"),
  );
  const estimate = await readEstimate(s.p, input.estimate_id);
  const evidence = await readEstimateProducts(s.p, estimate.id, {
    version_id: estimate.current_saved.id,
  });
  assert.equal(evidence.status, "ExactAdoption");
  assert.deepEqual(evidence.product_provenance, preview.product_provenance);
  await prepareQuote(s.p, estimate.id, {
    ...crmBase(),
    id: randomUUID(),
    estimate_version_id: estimate.current_saved.id,
    expected_version: estimate.version,
    expected_quote_version: 0,
    choices: estimate.current_saved.lines.map((l) => ({
      line_id: l.id,
      included: true,
      print: true,
    })),
  });
  const safe = JSON.stringify(
    (
      await rows(
        "SELECT safe_snapshot FROM ppo.draft_quote_revisions WHERE estimate_id=$1",
        [estimate.id],
      )
    )[0],
  );
  for (const secret of [
    m.product.revision.id,
    m.product.product.id,
    m.product.revision.content_hash,
    "publication",
    "relationship_evidence",
    "unit_cost",
    "source_reference",
  ])
    assert(!safe.includes(secret));
  await withdrawProduct(m.f);
  assert.deepEqual(
    await readEstimateProducts(s.p, estimate.id, {
      version_id: estimate.current_saved.id,
    }),
    evidence,
  );
  assert.deepEqual(await readOperation(s.p, input.operation_id), a.receipt);
  await assert.rejects(
    rows("UPDATE ppo.cpq_runs SET binding='{}' WHERE id=$1", [s.run.id]),
    code("55000"),
  );
  await assert.rejects(
    rows("DELETE FROM ppo.cpq_adoptions WHERE run_id=$1", [s.run.id]),
    code("55000"),
  );
  const ledger = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    ),
    seeds = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
    graph = await snapshot();
  await migrate();
  await seed();
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    ledger,
  );
  assert.deepEqual(
    await rows("SELECT * FROM ppo.seed_receipts ORDER BY version"),
    seeds,
  );
  assert.deepEqual(await snapshot(), graph);
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  await assert.rejects(
    readEstimateProducts(s.p, estimate.id, {
      version_id: estimate.current_saved.id,
    }),
    code("RecordUnavailable"),
  );
});

test("mapped CPQ freezes published variant evidence, tolerates a draft successor and rejects superseded adoption atomically", async () => {
  const m = await mappedProduct(),
    s = await calculated(m.definition);
  const products = s.run.binding.products!;
  assert.equal(products.length, 1);
  assert.equal(products[0].part_key, "sensor");
  assert.deepEqual(products[0].content, m.product.revision.content);
  assert.equal(products[0].availability, "Unknown");
  assert.equal(products[0].compatibility, "NotAssessed");
  const preview = await previewAdoption(s.p, s.run.id);
  const input = adoption(preview);
  await reviseProduct(m.f.author.p, m.f.variant.id, {
    ...crmBase(),
    expected_version: m.product.product.version,
    content: productContentFixture({
      technical_revision: "TECH-B",
      title: "SYN successor draft",
    }),
  });
  assert.deepEqual(await previewAdoption(s.p, s.run.id), preview);
  // New publication changes eligibility, never the retained run or reviewed release.
  await publishProduct(m.f.author.p, m.f.reviewer.p, m.f.variant.id);
  assert.deepEqual(await readRun(s.p, s.run.id), s.run);
  await assert.rejects(
    previewAdoption(s.p, s.run.id),
    code("CpqProductPublicationChanged"),
  );
  await assert.rejects(
    adoptRun(s.p, s.run.id, input),
    code("CpqProductPublicationChanged"),
  );
  await assert.rejects(
    calculateRun(s.p, s.g.id, { ...s.command, ...crmBase(), id: randomUUID() }),
    code("CpqProductPublicationChanged"),
  );
  assert.equal(
    (
      await rows("SELECT count(*)::int AS n FROM ppo.estimates WHERE id=$1", [
        input.estimate_id,
      ])
    )[0].n,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
        [input.operation_id],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.audit_events WHERE operation_id=$1",
        [input.operation_id],
      )
    )[0].n,
    0,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.outbox_jobs WHERE operation_id=$1",
        [input.operation_id],
      )
    )[0].n,
    0,
  );
});

test("mapped CPQ historical reads and completed receipts survive withdrawal but recheck Products access", async () => {
  const m = await mappedProduct(),
    s = await calculated(m.definition);
  const input = adoption(await previewAdoption(s.p, s.run.id));
  const accepted = await adoptRun(s.p, s.run.id, input);
  await withdrawProduct(m.f);
  assert.deepEqual(await readRun(s.p, s.run.id), s.run);
  assert.equal(
    (await activateRelease(s.publisher, s.release_id, s.activate)).replayed,
    true,
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.publisher.actor_id],
  );
  await assert.rejects(
    activateRelease(s.publisher, s.release_id, s.activate),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(s.publisher, s.activate.operation_id),
    code("RecordUnavailable"),
  );
  assert.deepEqual(
    await readOperation(s.p, input.operation_id),
    accepted.receipt,
  );
  assert.equal((await adoptRun(s.p, s.run.id, input)).replayed, true);
  assert.equal((await calculateRun(s.p, s.g.id, s.command)).replayed, true);
  await assert.rejects(
    previewCalculation(s.p, s.g.id, {
      option_id: s.g.option_id,
      revision_id: s.g.revision_id,
    }),
    code("CpqProductPublicationChanged"),
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  for (const attempt of [
    () => readRun(s.p, s.run.id),
    () => readRelease(s.p, s.release_id),
    () => readOperation(s.p, input.operation_id),
    () => adoptRun(s.p, s.run.id, input),
    () => calculateRun(s.p, s.g.id, s.command),
    () => readOperation(s.p, s.command.operation_id),
  ])
    await assert.rejects(attempt, code("RecordUnavailable"));
  await grant(s.p.actor_id, ["products.read"]);
  assert.deepEqual(
    await readOperation(s.p, input.operation_id),
    accepted.receipt,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int AS n FROM ppo.cpq_adoptions WHERE run_id=$1",
        [s.run.id],
      )
    )[0].n,
    1,
  );
});

test("mapped CPQ refuses foreign, wrong-kind, wrong-hash, mismatched-unit and unpublished bindings without writes", async () => {
  const m = await mappedProduct(),
    s = await setup();
  await grant(s.p.actor_id, ["products.read"]);
  const family = await readProduct(m.f.author.p, m.f.family.id);
  const unpublished = await readProduct(m.f.author.p, m.f.similar.id);
  const foreign = productInput({ company_id: CRM.companyB });
  await createProduct(m.f.other.p, foreign);
  const other = await readProduct(m.f.other.p, foreign.id);
  // Even an actor with read access to both companies cannot cross-bind them.
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id) VALUES($1,$2,$3,'products.read','Company',$3),($1,$2,$3,'shared.read','Company',$3)",
    [CRM.workspace, s.p.actor_id, CRM.companyB],
  );
  for (const [product, unit, expected] of [
    [
      {
        product_id: family.product.id,
        revision_id: family.revision.id,
        content_hash: family.revision.content_hash,
      },
      "each",
      "CpqProductVariantRequired",
    ],
    [
      {
        product_id: other.product.id,
        revision_id: other.revision.id,
        content_hash: other.revision.content_hash,
      },
      "each",
      "RecordUnavailable",
    ],
    [
      { ...m.definition.parts[0].product!, content_hash: "0".repeat(64) },
      "each",
      "CpqProductEvidenceChanged",
    ],
    [m.definition.parts[0].product!, "m", "CpqProductUnitMismatch"],
    [
      {
        product_id: unpublished.product.id,
        revision_id: unpublished.revision.id,
        content_hash: unpublished.revision.content_hash,
      },
      "each",
      "CpqProductPublicationChanged",
    ],
    [
      { ...m.definition.parts[0].product!, revision_id: family.revision.id },
      "each",
      "RecordUnavailable",
    ],
  ] as const) {
    const id = randomUUID(),
      operation_id = randomUUID();
    const definition = structuredClone(m.definition);
    definition.parts[0] = {
      ...definition.parts[0],
      product: { relationships: [], ...product },
      unit,
    };
    await assert.rejects(
      saveRelease(s.p, {
        ...crmBase(),
        id,
        operation_id,
        company_id: CRM.company,
        expected_version: 0,
        definition,
      }),
      code(expected),
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int AS n FROM ppo.cpq_releases WHERE id=$1",
          [id],
        )
      )[0].n,
      0,
    );
    assert.equal(
      (
        await rows(
          "SELECT count(*)::int AS n FROM ppo.operation_receipts WHERE operation_id=$1",
          [operation_id],
        )
      )[0].n,
      0,
    );
  }
});

test("mapped CPQ review and activation recheck publication and original receipt access", async () => {
  const m = await mappedProduct(),
    s = await setup(m.definition);
  const review = await reviewRelease(s.reviewer, s.release_id, s.reviewInput);
  const activation = {
    ...crmBase(),
    expected_version: review.receipt.record_version,
    revision_id: s.view.current.id,
    content_hash: s.view.current.content_hash,
    expected_activation_version: 0,
  };
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.reviewer.actor_id],
  );
  await assert.rejects(
    activateRelease(s.publisher, s.release_id, activation),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    reviewRelease(s.reviewer, s.release_id, s.reviewInput),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(s.reviewer, s.reviewInput.operation_id),
    code("RecordUnavailable"),
  );
  await grant(s.reviewer.actor_id, ["products.read"]);
  // A separately saved draft cannot be approved after source withdrawal.
  const draft = {
    ...crmBase(),
    id: randomUUID(),
    company_id: CRM.company,
    expected_version: 0,
    definition: m.definition,
  };
  await saveRelease(s.p, draft);
  const view = await readRelease(s.p, draft.id);
  await withdrawProduct(m.f);
  assert.equal(
    (await reviewRelease(s.reviewer, s.release_id, s.reviewInput)).replayed,
    true,
  );
  assert.deepEqual(
    await readOperation(s.reviewer, s.reviewInput.operation_id),
    review.receipt,
  );
  assert.equal((await saveRelease(s.p, draft)).replayed, true);
  await assert.rejects(
    activateRelease(s.publisher, s.release_id, activation),
    code("CpqProductPublicationChanged"),
  );
  await assert.rejects(
    reviewRelease(s.reviewer, draft.id, {
      ...crmBase(),
      expected_version: 1,
      revision_id: view.current.id,
      content_hash: view.current.content_hash,
      outcome: "Approved",
    }),
    code("CpqProductPublicationChanged"),
  );
  assert.equal(
    (await rows("SELECT count(*)::int AS n FROM ppo.cpq_activations"))[0].n,
    0,
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  await assert.rejects(saveRelease(s.p, draft), code("RecordUnavailable"));
  await assert.rejects(
    readOperation(s.p, draft.operation_id),
    code("RecordUnavailable"),
  );
});

test("mapped CPQ recalculation retains manual costs, replaces owned lines and blocks stale estimate snapshots", async () => {
  const s = await calculated((await mappedProduct()).definition),
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
  const changedLines = e.current_saved.lines.map((l) =>
    l.id === manual.id
      ? l
      : { ...l, description: "SYN manually edited CPQ line" },
  );
  await saveEstimate(s.p, e.id, {
    ...crmBase(),
    schema_version: 2,
    expected_version: e.version,
    title: e.current_saved.title,
    scope: e.current_saved.scope,
    lines: changedLines,
    policy: arithmeticPolicy,
  });
  const fresh = await previewCalculation(s.p, s.g.id, {
    option_id: s.g.option_id,
    revision_id: s.g.revision_id,
  });
  const third = {
    ...second,
    ...crmBase(),
    id: randomUUID(),
    parent_id: second.id,
    binding_hash: fresh.binding_hash,
  };
  await calculateRun(s.p, s.g.id, third);
  await assert.rejects(
    previewAdoption(s.p, third.id),
    code("CpqOwnedLineChanged"),
  );
  assert.equal((await runHistory(s.p, s.g.id)).items.length, 3);
  assert.equal(
    (await compareRuns(s.p, s.run.id, { with: second.id })).changes.length,
    2,
  );
});

test("provenance access requires Products authority for legacy adoption and no-adoption status", async () => {
  const s = await calculated(),
    input = adoption(await previewAdoption(s.p, s.run.id));
  await adoptRun(s.p, s.run.id, input);
  const e = await readEstimate(s.p, input.estimate_id),
    original = e.current_saved.id;
  await assert.rejects(
    readEstimateProducts(s.p, e.id, { version_id: original }),
    code("RecordUnavailable"),
  );
  await grant(s.p.actor_id, ["products.read"]);
  assert.equal(
    (await readEstimateProducts(s.p, e.id, { version_id: original })).status,
    "ExactAdoption",
  );
  await saveEstimate(s.p, e.id, {
    ...crmBase(),
    schema_version: 2,
    expected_version: e.version,
    title: e.current_saved.title,
    scope: e.current_saved.scope,
    lines: e.current_saved.lines,
    policy: e.current_saved.policy,
  });
  const current = (await readEstimate(s.p, e.id)).current_saved.id;
  assert.equal(
    (await readEstimateProducts(s.p, e.id, { version_id: current })).status,
    "NoCpqAdoption",
  );
  await rows(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='products.read'",
    [s.p.actor_id],
  );
  for (const version_id of [original, current])
    await assert.rejects(
      readEstimateProducts(s.p, e.id, { version_id }),
      code("RecordUnavailable"),
    );
});

test("provenance access authorizes the requested historical discovery site before returning status", async () => {
  const s = await setup(),
    estimateId = randomUUID(),
    site2 = "70000000-0000-4000-8000-000000000002";
  await rows(
    "INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from) VALUES($1,$2,$3,$3,$4,$5,$6,'BillingParty','2026-01-01')",
    [randomUUID(), CRM.workspace, s.p.actor_id, CRM.company, site2, CRM.org],
  );
  const g = await discovery(s.p, { ...crmCreate(), site_id: site2 });
  await grant(s.p.actor_id, ["products.read"]);
  const adopt = async (
    revisionId: string,
    workspaceVersion: number,
    estimateVersion: number,
  ) => {
    const basis = await previewDiscoveryCosting(s.p, g.id, {
      option_id: g.option_id,
      revision_id: revisionId,
    });
    await adoptDiscoveryCosting(s.p, g.id, {
      ...crmBase(),
      estimate_id: estimateId,
      option_id: g.option_id,
      revision_id: revisionId,
      expected_workspace_version: workspaceVersion,
      expected_estimate_version: estimateVersion,
      context_hash: basis.context_hash,
      title: "SYN exact site authority",
      scope: {
        included: "Synthetic product supply",
        excluded: "Other work",
        assumptions: "Synthetic verification only",
      },
      lines: manualLines().map((line) => ({ ...line, allowance: false })),
      policy: arithmeticPolicy,
    });
  };
  await adopt(g.revision_id, 1, 0);
  const original = (await readEstimate(s.p, estimateId)).current_saved.id;
  const next = discoveryInput();
  next.scope = {
    ...next.scope,
    site_id: site2,
    facility_ids: [],
    equipment_ids: [],
    systems: [{ tag: "ProductSupply", facility_ids: [] }],
  };
  const proposal = {
    kind: "Save",
    option_id: g.option_id,
    expected_version: 1,
    expected_revision_id: g.revision_id,
    discovery: next,
  };
  const preview = await previewDiscoveryChange(s.p, g.id, proposal),
    revisionId = randomUUID();
  await changeDiscoveryWorkspace(s.p, g.id, {
    ...crmBase(),
    ...proposal,
    revision_id: revisionId,
    context_hash: preview.context_hash,
    comparison_hash: preview.comparison_hash,
    confirmed_question_ids: preview.required_confirmation_ids,
    configuration_confirmations: preview.configuration_confirmations,
  });
  await adopt(revisionId, 2, 1);
  const current = (await readEstimate(s.p, estimateId)).current_saved.id;
  await rows(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [s.p.actor_id],
  );
  await rows(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id,site_id,valid_from) VALUES($1,$2,$3,'estimating.read','Site',$4,$4,'2026-01-01')",
    [CRM.workspace, s.p.actor_id, CRM.company, site2],
  );
  assert.equal(
    (await readEstimateProducts(s.p, estimateId, { version_id: current }))
      .status,
    "NoCpqAdoption",
  );
  await assert.rejects(
    readEstimateProducts(s.p, estimateId, { version_id: original }),
    code("RecordUnavailable"),
  );
});
