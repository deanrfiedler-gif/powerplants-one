import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset } from "../../scripts/database";
import { createOpportunity } from "../../src/crm/opportunities";
import { CRM, crmCreate } from "../helpers/crm";
import {
  discoveryDefinitionHash,
  type DiscoveryInput,
  type Answer,
} from "../../src/estimating/discovery";
import {
  prepareDiscoveryTargets,
  readDiscoveryTargets,
  expectDiscoveryContext,
} from "../../src/estimating/discovery-context";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const facility = "72000000-0000-4000-8000-000000000001";
const equipment = "80000000-0000-4000-8000-000000000002";
const site2 = "70000000-0000-4000-8000-000000000002";
const denied = (e: unknown) =>
  (e as { code: string }).code === "RecordUnavailable";
const answer = (question_id: string, value: Answer["value"]): Answer => ({
  question_id,
  value,
  state: "Confirmed",
  source: "SYN recorded scope evidence",
  follow_up: null,
});
const fixture = (): DiscoveryInput => ({
  definition_id: "SYN-E2-QUESTIONS",
  definition_revision: "r01",
  definition_hash: discoveryDefinitionHash,
  effort: {
    value: "Express",
    source: "SYN estimator declared effort",
    follow_up: null,
  },
  scope: {
    mode: "Site",
    site_id: CRM.site,
    site_reason: null,
    follow_up: null,
    facility_ids: [facility],
    equipment_ids: [equipment],
    systems: [{ tag: "ProductSupply", facility_ids: [facility] }],
    unsupported_scope: null,
  },
  answers: [
    answer("Q01", "SYN replace one sensor"),
    answer("Q02", { choice: "NoneDeclared" }),
    answer("Q03", "SYN physical identity needs later technical verification"),
    answer("Q04", "NotRequired"),
    answer("Q05", "SYN sensor reference"),
    answer("Q06", 1),
  ],
});
async function setup() {
  const p = (await createSession("coordinator")).principal,
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  return { p, opportunity, input: fixture() };
}
async function observations() {
  return (
    await database().query(`SELECT
    (SELECT count(*) FROM ppo.activities)::int activities,
    (SELECT count(*) FROM ppo.audit_events)::int audit,
    (SELECT count(*) FROM ppo.operation_receipts)::int receipts,
    (SELECT count(*) FROM ppo.outbox_jobs)::int outbox,
    (SELECT count(*) FROM ppo.estimates)::int estimates`)
  ).rows[0];
}
async function allowCustomerAtSecondSite() {
  // This Site already has an operator. Add the customer's separate billing
  // relationship; retain the seeded operator and its exclusion constraint.
  await database().query(
    `INSERT INTO ppo.site_parties(id,workspace_id,created_by,updated_by,company_id,site_id,organisation_id,role,valid_from)
    VALUES($1,$2,$3,$3,$4,$5,$6,'BillingParty','2026-01-01')`,
    [randomUUID(), CRM.workspace, CRM.owner, CRM.company, site2, CRM.org],
  );
}

test("E2 context captures exact existing identities without implied membership, technical verification or business writes", async () => {
  const { p, opportunity, input } = await setup(),
    before = await observations();
  const captured = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(captured.references.opportunity.id, opportunity.id);
  assert.equal(captured.references.site?.id, CRM.site);
  assert.deepEqual(
    captured.references.facilities.map((x) => x.id),
    [facility],
  );
  assert.deepEqual(
    captured.references.equipment.map((x) => x.id),
    [equipment],
  );
  assert.equal(captured.references.equipment[0].identity_status, "Unresolved");
  assert.equal(captured.compiled.delivery_routing.status, "NotConfigured");
  assert.doesNotMatch(
    JSON.stringify(captured.references),
    /serial|warranty|external_equipment|parent_asset|facility_id|unit_cost|margin/,
  );
  assert.throws(() => {
    captured.references.facilities[0].name = "Altered";
  }, TypeError);
  input.scope.facility_ids = [];
  input.scope.systems[0].facility_ids = [];
  const unscopedFacility = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(unscopedFacility.references.facilities.length, 0);
  assert.equal(unscopedFacility.references.equipment.length, 1);
  assert.deepEqual(await observations(), before);
});

test("E2 context refuses unrelated identities and cannot gain estimating access from quote-only or other roles", async () => {
  const { p, opportunity, input } = await setup();
  for (const profile of [
    "systems",
    "assigned-technician",
    "second-company",
    "other-workspace",
    "observer",
  ]) {
    const other = (await createSession(profile)).principal;
    await assert.rejects(
      transaction((c) => readDiscoveryTargets(c, other, opportunity.id, input)),
      denied,
    );
  }
  for (const id of [
    "80000000-0000-4000-8000-000000000003",
    "80000000-0000-4000-8000-000000000004",
    randomUUID(),
  ]) {
    await assert.rejects(
      transaction((c) =>
        prepareDiscoveryTargets(c, p, opportunity.id, {
          ...input,
          scope: { ...input.scope, equipment_ids: [id] },
        }),
      ),
      denied,
    );
  }
});

test("E2 context rejects same-company equipment and Facilities belonging to another selected Site", async () => {
  const { p, opportunity, input } = await setup();
  await allowCustomerAtSecondSite();
  for (const scope of [
    {
      ...input.scope,
      site_id: site2,
      facility_ids: [],
      systems: [{ tag: "ProductSupply", facility_ids: [] }],
    },
    { ...input.scope, site_id: site2, equipment_ids: [] },
  ])
    await assert.rejects(
      transaction((c) =>
        prepareDiscoveryTargets(c, p, opportunity.id, { ...input, scope }),
      ),
      denied,
    );
});

test("E2 context checks customer relationships for both Opportunity and selected Site before returning captured names", async () => {
  const { p, opportunity, input } = await setup();
  input.scope = {
    ...input.scope,
    site_id: site2,
    facility_ids: [],
    equipment_ids: [],
    systems: [{ tag: "ProductSupply", facility_ids: [] }],
  };
  await assert.rejects(
    transaction((c) => prepareDiscoveryTargets(c, p, opportunity.id, input)),
    denied,
  );
  await allowCustomerAtSecondSite();
  const captured = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(captured.references.opportunity.site_id, CRM.site);
  assert.equal(captured.references.site?.id, site2);
  await database().query(
    "UPDATE ppo.site_parties SET valid_to=CURRENT_DATE WHERE workspace_id=$1 AND site_id=$2 AND organisation_id=$3",
    [CRM.workspace, site2, CRM.org],
  );
  await assert.rejects(
    transaction((c) =>
      readDiscoveryTargets(c, p, opportunity.id, captured.compiled.input),
    ),
    denied,
  );
});

test("E2 context rechecks current estimating and shared access rather than trusting a former successful snapshot", async () => {
  const { p, opportunity, input } = await setup();
  const captured = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='estimating.edit'",
    [p.actor_id],
  );
  await assert.rejects(
    transaction((c) => prepareDiscoveryTargets(c, p, opportunity.id, input)),
    denied,
  );
  const history = await transaction((c) =>
    readDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(history.context_hash, captured.context_hash);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.read'",
    [p.actor_id],
  );
  await assert.rejects(
    transaction((c) => readDiscoveryTargets(c, p, opportunity.id, input)),
    denied,
  );
});

test("E2 unresolved items require a currently eligible follow-up owner without creating or completing an Activity", async () => {
  const { p, opportunity, input } = await setup();
  input.effort = {
    value: "Unknown",
    source: null,
    follow_up: { owner_id: p.actor_id, reason: "SYN effort must be confirmed" },
  };
  const before = await observations();
  const captured = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(captured.compiled.input.effort.value, "Unknown");
  assert.deepEqual(await observations(), before);
  input.effort.follow_up!.owner_id = randomUUID();
  await assert.rejects(
    transaction((c) => prepareDiscoveryTargets(c, p, opportunity.id, input)),
    denied,
  );
  input.effort.follow_up!.owner_id = p.actor_id;
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='activity.edit'",
    [p.actor_id],
  );
  await assert.rejects(
    transaction((c) => prepareDiscoveryTargets(c, p, opportunity.id, input)),
    denied,
  );
  // Historical source remains readable under current record visibility. It
  // does not become a new eligible follow-up assignment by being displayed.
  assert.equal(
    (
      await transaction((c) =>
        readDiscoveryTargets(c, p, opportunity.id, input),
      )
    ).context_hash,
    captured.context_hash,
  );
});

test("E2 context detects a changed shared version while preserving the independently captured original", async () => {
  const { p, opportunity, input } = await setup();
  const original = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  expectDiscoveryContext(original.context_hash, original);
  await database().query(
    "UPDATE ppo.facilities SET name='SYN renamed bay',version=version+1,updated_at=clock_timestamp(),updated_by=$2 WHERE id=$1",
    [facility, p.actor_id],
  );
  const current = await transaction((c) =>
    prepareDiscoveryTargets(c, p, opportunity.id, input),
  );
  assert.equal(current.references.facilities[0].name, "SYN renamed bay");
  assert.equal(original.references.facilities[0].name, "SYN irrigation bay");
  assert.equal(
    current.references.facilities[0].version,
    original.references.facilities[0].version + 1,
  );
  assert.throws(
    () => expectDiscoveryContext(original.context_hash, current),
    (e: unknown) => (e as { code: string }).code === "DiscoveryContextChanged",
  );
  assert.throws(() => expectDiscoveryContext("", current));
});
