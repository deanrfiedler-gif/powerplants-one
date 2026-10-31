import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import {
  createHandover,
  commandHandover,
  readHandover,
} from "../../src/sales/handover-service";
import { emptyHandover } from "../../src/sales/handover-model";
import { listEstimates } from "../../src/estimating/reads";
import { readEstimatingWorkload } from "../../src/estimating/workload";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
} from "../../src/estimating/discovery-workspaces";
import { crmBase, crmCreate, crmDiscovery, CRM } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import { discoveryInput } from "../helpers/estimating-discovery";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

async function setup() {
  const p = (await createSession("coordinator")).principal;
  const opportunity = { ...crmCreate(), title: `SYN ES01 ${randomUUID()}` };
  await createOpportunity(p, opportunity);
  return { p, opportunity };
}

test("ES01 joins canonical briefs without fabricating allocation, deadline, acceptance, prices or effects", async () => {
  const { p, opportunity } = await setup();
  const before = await database().query(
    "SELECT count(*) FROM ppo.operation_receipts",
  );
  const result = await readEstimatingWorkload(p, { q: opportunity.title });
  assert.equal(result.items.length, 1);
  const row = result.items[0];
  assert.equal(row.opportunity.id, opportunity.id);
  assert.equal(row.opportunity.need_summary, opportunity.need_summary);
  assert.equal(row.opportunity.version, 1);
  assert.equal(row.estimating_owner_id, null);
  assert.equal(row.state, "unstarted");
  assert.equal(row.intake_acceptance, "NotConfigured");
  assert.equal(row.response_date, null);
  assert.equal(row.sales_action?.due_at, null);
  assert.equal(row.can_start, true);
  assert.deepEqual(row.estimates, []);
  assert.equal(
    (await readEstimatingWorkload(p, { owner: "mine" })).items.some(
      (i) => i.opportunity.id === opportunity.id,
    ),
    false,
  );
  assert.deepEqual(
    (await database().query("SELECT count(*) FROM ppo.operation_receipts"))
      .rows,
    before.rows,
  );
  assert.equal(
    (await readEstimatingWorkload(p, { q: "%" })).items.length,
    0,
    "search is literal, not a SQL wildcard",
  );
});

test("ES01 selected discovery and saved legacy cost identities remain exact; saved costs are not inferred from readiness", async () => {
  const { p, opportunity } = await setup();
  const discovery = discoveryInput(),
    preview = await previewDiscoveryCreate(p, {
      opportunity_id: opportunity.id,
      discovery,
    });
  const command = {
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
  await createDiscoveryWorkspace(p, command);
  const row = (
    await readEstimatingWorkload(p, {
      q: opportunity.title,
      view: "ready",
      owner: "mine",
    })
  ).items[0];
  assert.equal(row.workspace?.id, command.id);
  assert.equal(row.workspace?.options[0].revision_id, command.revision_id);
  assert.equal(row.estimating_owner_id, p.actor_id);
  assert.equal(row.state, "ready");
  assert.deepEqual(row.estimates, []);
  assert.equal(row.can_start, false);
  const other = { ...crmCreate(), title: `SYN ES01 legacy ${randomUUID()}` };
  await createOpportunity(p, other);
  const cost = estimateInput(other.id);
  await createEstimate(p, cost);
  const legacy = (
    await readEstimatingWorkload(p, { q: other.title, view: "legacy" })
  ).items[0];
  assert.equal(legacy.estimates[0].id, cost.id);
  assert.equal(legacy.estimates[0].version, 1);
  const saved = (
    await listEstimates(p, { q: legacy.estimates[0].display_number })
  ).items[0];
  assert.equal(saved.version_id, legacy.estimates[0].version_id);
  assert.equal(legacy.estimates[0].discovery_revision, null);
  assert.equal("cost_total" in legacy.estimates[0], false);
});

test("ES01 scope and capability revocation removes source rows and action text without exposing hidden counts", async () => {
  const { p, opportunity } = await setup();
  const second = (await createSession("second-company")).principal;
  assert.deepEqual(
    (await readEstimatingWorkload(second, { q: opportunity.title })).items,
    [],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.read'",
    [CRM.owner],
  );
  assert.equal(
    (await readEstimatingWorkload(p, { q: opportunity.title })).items[0]
      .sales_action,
    null,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [CRM.owner],
  );
  assert.equal(
    (await readEstimatingWorkload(p, { q: opportunity.title })).items[0]
      .can_start,
    false,
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read'",
    [CRM.owner],
  );
  assert.deepEqual(
    (await readEstimatingWorkload(p, { q: opportunity.title })).items,
    [],
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.read'",
    [CRM.owner],
  );
  await assert.rejects(
    readEstimatingWorkload(p),
    (error: unknown) => (error as { status: number }).status === 403,
  );
});

test("ES01 readiness counts cover the permitted search and owner window before the readiness view", async () => {
  const p = (await createSession("coordinator")).principal;
  const prefix = `SYN ES01 counts ${randomUUID()}`;
  const opportunity = async (suffix: string) => {
    const value = { ...crmCreate(), title: `${prefix} ${suffix}` };
    await createOpportunity(p, value);
    return value;
  };
  const discover = async (id: string, incomplete: boolean) => {
    const discovery = discoveryInput();
    if (incomplete)
      discovery.scope.unsupported_scope = {
        owner_id: CRM.owner,
        reason: "SYN confirm sensor wiring before costing",
      };
    const preview = await previewDiscoveryCreate(p, {
      opportunity_id: id,
      discovery,
    });
    await createDiscoveryWorkspace(p, {
      ...crmBase(),
      id: randomUUID(),
      option_id: randomUUID(),
      revision_id: randomUUID(),
      opportunity_id: id,
      discovery,
      expected_opportunity_version: preview.expected_opportunity_version,
      context_hash: preview.context_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
    });
  };
  await opportunity("unstarted one");
  await opportunity("unstarted two");
  await discover((await opportunity("clarification")).id, true);
  await discover((await opportunity("ready")).id, false);
  await createEstimate(p, estimateInput((await opportunity("legacy")).id));
  const expected = { unstarted: 2, clarification: 1, ready: 1, legacy: 1 };
  const all = await readEstimatingWorkload(p, { q: prefix });
  assert.deepEqual(all.counts, expected);
  assert.deepEqual(all.owner_counts, { all: 5, mine: 3 });
  const clarification = all.items.find((i) => i.state === "clarification")!;
  assert.equal(
    clarification.readiness_reasons[0].follow_up.reason,
    "SYN confirm sensor wiring before costing",
  );
  assert.equal(all.items.length, 5);
  for (const view of [
    "unstarted",
    "clarification",
    "ready",
    "legacy",
  ] as const) {
    const result = await readEstimatingWorkload(p, { q: prefix, view });
    assert.deepEqual(
      result.counts,
      expected,
      "the view does not narrow counts",
    );
    assert.equal(result.items.length, expected[view]);
    assert.ok(result.items.every((item) => item.state === view));
  }
  assert.deepEqual(
    (await readEstimatingWorkload(p, { q: prefix, owner: "mine" })).counts,
    { unstarted: 0, clarification: 1, ready: 1, legacy: 1 },
    "counts follow the estimating-owner filter",
  );
  const second = (await createSession("second-company")).principal;
  assert.deepEqual(
    (await readEstimatingWorkload(second, { q: prefix })).counts,
    { unstarted: 0, clarification: 0, ready: 0, legacy: 0 },
    "hidden rows are never counted",
  );
});

test("ES01 All/My counts retain separate SQL-before-limit windows and use the workspace owner", async () => {
  const p = (await createSession("coordinator")).principal;
  const sales = (await createSession("assigned-technician")).principal;
  const prefix = `SYN ES01 bounded ${randomUUID()}`;
  const owned: string[] = [];
  for (let i = 0; i < 2; i++) {
    const o = { ...crmCreate(), title: `${prefix} older owned ${i}` };
    await createOpportunity(p, o);
    const discovery = discoveryInput(),
      preview = await previewDiscoveryCreate(p, {
        opportunity_id: o.id,
        discovery,
      });
    await createDiscoveryWorkspace(p, {
      ...crmBase(),
      id: randomUUID(),
      option_id: randomUUID(),
      revision_id: randomUUID(),
      opportunity_id: o.id,
      discovery,
      expected_opportunity_version: preview.expected_opportunity_version,
      context_hash: preview.context_hash,
      confirmed_question_ids: preview.required_confirmation_ids,
    });
    await database().query(
      "UPDATE ppo.opportunities SET owner_id=$1 WHERE id=$2",
      [sales.actor_id, o.id],
    );
    owned.push(o.id);
  }
  // Newer opportunities owned by the Sales actor do not become estimating work.
  for (let i = 0; i < 101; i++)
    await createOpportunity(p, {
      ...crmCreate(),
      title: `${prefix} recent ${i}`,
    });
  for (const sort of ["updated", "customer"]) {
    const all = await readEstimatingWorkload(p, { q: prefix, sort });
    assert.equal(all.items.length, 100);
    assert.deepEqual(all.owner_counts, { all: 100, mine: 2 });
    assert.deepEqual(all.counts, {
      unstarted: 100,
      clarification: 0,
      ready: 0,
      legacy: 0,
    });
    const mine = await readEstimatingWorkload(p, {
      q: prefix,
      sort,
      owner: "mine",
      view: "ready",
    });
    assert.deepEqual(mine.owner_counts, all.owner_counts);
    assert.deepEqual(
      mine.items.map((x) => x.opportunity.id).sort(),
      owned.sort(),
    );
    assert.deepEqual(mine.counts, {
      unstarted: 0,
      clarification: 0,
      ready: 2,
      legacy: 0,
    });
    assert.ok(
      mine.items.every(
        (x) =>
          x.estimating_owner_id === p.actor_id &&
          x.sales_owner !== x.estimating_owner,
      ),
    );
    const filtered = await readEstimatingWorkload(p, {
      q: prefix,
      sort,
      view: "ready",
    });
    assert.equal(filtered.items.length, 0);
    assert.deepEqual(filtered.counts, all.counts);
    assert.deepEqual(filtered.owner_counts, all.owner_counts);
  }
  const narrowed = await readEstimatingWorkload(p, {
    q: prefix + " older owned",
  });
  assert.equal(
    narrowed.items.length,
    2,
    "search applies before the bounded window",
  );
  assert.deepEqual(narrowed.owner_counts, { all: 2, mine: 2 });
});

test("ES01 Sales context reports exact acceptance without accepting or linking; changed accepted sources block Start", async () => {
  const p = (await createSession("coordinator")).principal,
    o = { ...crmDiscovery(), title: `SYN ES01 brief ${randomUUID()}` };
  o.initial_action.due_at = "2031-10-01T00:00:00.000Z";
  o.initial_action.due_needed = false;
  await createOpportunity(p, o);
  const id = randomUUID();
  await createHandover(p, {
    ...crmBase(),
    id,
    opportunity_id: o.id,
    kind: "Estimating",
  });
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Save",
    expected_version: 1,
    receiving_owner_id: p.actor_id,
    note: "SYN ES01 prepared",
    content: {
      ...emptyHandover(),
      problem: "SYN reported problem",
      outcome: "SYN desired outcome",
      included_scope: "SYN controls",
      exclusions: "None",
      assumptions: "None",
      unknowns: "SYN scope to discover",
      requested_date: "2031-10-01",
      date_reason: "SYN requested",
      next_activity_id: o.initial_action.id,
    },
  });
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Submit",
    expected_version: 2,
    note: "SYN submitted",
  });
  const before = (
    await database().query("SELECT count(*) FROM ppo.operation_receipts")
  ).rows;
  const submitted = (await readEstimatingWorkload(p, { q: o.title })).items[0];
  assert.ok(submitted.sales_brief && submitted.sales_brief !== "Unavailable");
  assert.equal(submitted.sales_brief.state, "Submitted");
  assert.equal(submitted.sales_brief.selection, null);
  assert.deepEqual(
    (await database().query("SELECT count(*) FROM ppo.operation_receipts"))
      .rows,
    before,
  );
  assert.equal((await readHandover(p, id)).record.state, "Submitted");
  const brief = await readHandover(p, id);
  await commandHandover(p, id, {
    ...crmBase(),
    action: "Accept",
    expected_version: 3,
    source_hash: brief.record.source_hash,
    note: "SYN receiver acceptance",
  });
  const accepted = (await readEstimatingWorkload(p, { q: o.title })).items[0];
  assert.ok(accepted.sales_brief && accepted.sales_brief !== "Unavailable");
  assert.equal(accepted.sales_brief.selection?.handover_id, id);
  assert.ok(accepted.sales_brief.selection?.acceptance_event_id);
  assert.equal(accepted.can_start, true);
  await database().query(
    "UPDATE ppo.opportunities SET need_summary=need_summary || ' source changed' WHERE id=$1",
    [o.id],
  );
  const changed = (await readEstimatingWorkload(p, { q: o.title })).items[0];
  assert.ok(changed.sales_brief && changed.sales_brief !== "Unavailable");
  assert.equal(changed.sales_brief.source_changed, true);
  assert.equal(changed.can_start, false);
  assert.equal(changed.workspace, null);
});
