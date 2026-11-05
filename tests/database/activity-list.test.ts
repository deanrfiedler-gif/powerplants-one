import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import type { Principal } from "../../src/platform/identity";
import {
  createActivity,
  listActivities,
  readActivity,
} from "../../src/activities/activities";
import { withWorkingCompany } from "../../src/platform/working-company";
import { escalationFixture, principal } from "../helpers/service-escalations";
import { CRM, crmBase, crmCreate } from "../helpers/crm";
import { createOpportunity } from "../../src/crm/opportunities";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

const denied = (e: unknown) =>
  [403, 404].includes((e as { status: number }).status);
const activity = (fields: Record<string, unknown> = {}) => ({
  ...crmBase(),
  id: randomUUID(),
  company_id: CRM.company,
  site_id: CRM.site,
  kind: "TechnicalFollowUp",
  owner_id: CRM.owner,
  summary: "SYN batch equivalence",
  due_at: null,
  due_needed: true,
  access_class: "RestrictedService",
  links: [{ object_type: "Site", object_id: CRM.site }],
  ...fields,
});
async function directPage(p: Principal) {
  const ids = (
    await database().query<{ id: string }>(
      "SELECT id FROM ppo.activities WHERE workspace_id=$1 ORDER BY id",
      [p.workspace_id],
    )
  ).rows;
  const visible: Awaited<ReturnType<typeof readActivity>>[] = [];
  for (const { id } of ids) {
    try {
      visible.push(await readActivity(p, id));
    } catch (e) {
      if (!denied(e)) throw e;
    }
  }
  return visible;
}
async function equivalent(p: Principal) {
  const expected = await directPage(p);
  const whole = await listActivities(p, { limit: 100 });
  assert.deepEqual(whole.items, expected.slice(0, 100));
  assert.equal(whole.next_cursor, null);
  const actual: typeof expected = [];
  let cursor: string | undefined;
  do {
    const page = await listActivities(p, {
      limit: 3,
      ...(cursor ? { cursor } : {}),
    });
    assert.deepEqual(
      page.items,
      expected.slice(actual.length, actual.length + 3),
    );
    assert.equal(!!page.next_cursor, actual.length + 3 < expected.length);
    actual.push(...page.items);
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
  assert.deepEqual(actual, expected);
  return expected;
}

test("activity list preserves direct DTOs, all-target visibility, owners, assignments, sources and cursors across principals and revocation", async () => {
  const f = await escalationFixture(); // Native appointment, current crew and schedule finding.
  const siteOnly = await principal("site-observer"),
    assigned = await principal("assigned-technician");
  const owned = activity({
    owner_id: assigned.actor_id,
    activity_type: "Call",
  });
  const mixed = activity({
    site_id: null,
    links: [
      { object_type: "Site", object_id: CRM.site },
      {
        object_type: "Site",
        object_id: "70000000-0000-4000-8000-000000000002",
      },
    ],
  });
  const linked = activity({
    links: [
      { object_type: "Organisation", object_id: CRM.org },
      { object_type: "Asset", object_id: f.asset.id },
      { object_type: "Site", object_id: CRM.site },
    ],
  });
  const chase = activity({
    links: [{ object_type: "Asset", object_id: f.asset.id }],
  });
  for (const input of [owned, mixed, linked, chase])
    await createActivity(f.p, input);
  await createOpportunity(f.p, crmCreate());
  const otherCompany = await principal("second-company");
  const other = activity({
    company_id: CRM.companyB,
    site_id: null,
    owner_id: otherCompany.actor_id,
    links: [{ object_type: "Organisation", object_id: CRM.orgB }],
  });
  await createActivity(otherCompany, other);
  // Synthetic retained association isolates the chase projection without needing
  // a PDF renderer; it is not a claim that a manufacturer message was sent.
  await database().query(
    "UPDATE ppo.service_escalation_cases SET chase_activity_id=$1,version=version+1 WHERE id=$2",
    [chase.id, f.id],
  );
  await database().query(
    "INSERT INTO ppo.service_finding_action_details(workspace_id,activity_id,required_evidence,updated_by) VALUES($1,$2,$3,$4)",
    [
      CRM.workspace,
      linked.id,
      "SYN retain measured readings and source evidence",
      f.p.actor_id,
    ],
  );
  assert.ok(
    (
      await database().query(
        "SELECT 1 FROM ppo.activities WHERE workspace_id=$1 AND company_id<>$2",
        [CRM.workspace, CRM.company],
      )
    ).rowCount,
  );
  const broad = await equivalent(f.p),
    narrow = await equivalent(siteOnly),
    crew = await equivalent(assigned);
  assert.notDeepEqual(
    broad.map((a) => a.id),
    narrow.map((a) => a.id),
  );
  assert.ok(broad.some((a) => a.id === mixed.id));
  assert.ok(!broad.some((a) => a.id === other.id));
  assert.ok((await equivalent(otherCompany)).some((a) => a.id === other.id));
  assert.ok(!narrow.some((a) => a.id === mixed.id));
  assert.equal(
    broad.find((a) => a.id === chase.id)?.escalation_source?.id,
    f.id,
  );
  assert.equal(broad.find((a) => a.id === chase.id)?.can_edit, false);
  assert.equal(
    broad.find((a) => a.id === linked.id)?.required_evidence,
    "SYN retain measured readings and source evidence",
  );
  assert.equal(broad.find((a) => a.id === owned.id)?.can_complete, false);
  assert.equal(crew.find((a) => a.id === owned.id)?.can_complete, true);
  await withWorkingCompany(f.p.actor_id, CRM.companyB, () => equivalent(f.p));
  const first = await listActivities(f.p, { limit: 3 });
  assert.ok(first.next_cursor);
  await assert.rejects(
    listActivities(siteOnly, { limit: 3, cursor: first.next_cursor }),
    (e: unknown) =>
      (e as { field_errors?: { field: string }[] }).field_errors?.some(
        (f) => f.field === "cursor",
      ) === true,
  );
  // Revoked source access hides its destination while preserving the activity
  // and its case-owned edit restriction. No lookup survives the request.
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='service_escalation.record' AND valid_to IS NULL",
    [CRM.workspace, f.p.actor_id],
  );
  const revoked = await equivalent(f.p);
  assert.equal(revoked.find((a) => a.id === chase.id)?.escalation_source, null);
  assert.equal(revoked.find((a) => a.id === chase.id)?.can_edit, false);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.read' AND valid_to IS NULL",
    [CRM.workspace, siteOnly.actor_id],
  );
  assert.deepEqual(await equivalent(siteOnly), []);
});

test("activity list batches a full 100-row page and keeps a final one-row cursor page", async () => {
  const p = await principal();
  const ids: string[] = [];
  for (let n = 0; n < 101; n++) {
    const input = activity({ summary: `SYN full-page batch ${n}` });
    await createActivity(p, input);
    ids.push(input.id);
  }
  ids.sort();
  let acquisitions = 0;
  const acquired = () => {
    acquisitions++;
  };
  database().on("acquire", acquired);
  let first: Awaited<ReturnType<typeof listActivities>>;
  try {
    first = await listActivities(p, { q: "SYN full-page batch", limit: 100 });
  } finally {
    database().off("acquire", acquired);
  }
  assert.equal(
    acquisitions,
    1,
    "The full page must not acquire one client per Activity",
  );
  assert.deepEqual(
    first.items,
    await Promise.all(ids.slice(0, 100).map((id) => readActivity(p, id))),
  );
  assert.ok(first.next_cursor);
  const last = await listActivities(p, {
    q: "SYN full-page batch",
    limit: 100,
    cursor: first.next_cursor,
  });
  assert.deepEqual(last.items, [await readActivity(p, ids[100])]);
  assert.equal(last.next_cursor, null);
});
