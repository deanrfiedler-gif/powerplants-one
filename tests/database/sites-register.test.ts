import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDatabase, database } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { reset } from "../../scripts/database";
import { sitesRegister, siteOverview } from "../../src/shared/sites";
import { listShared, readShared } from "../../src/shared/reads";
import { CRM } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);

test("CS04 public and previous references resolve the same scoped site without rewriting storage", async () => {
  const p = (await createSession("coordinator")).principal;
  const stored = (
    await database().query(
      "SELECT display_number FROM ppo.sites WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, CRM.site],
    )
  ).rows[0].display_number;
  const record = await readShared(p, "Site", CRM.site);
  assert.ok("legacy_display_number" in record);
  assert.equal(record.legacy_display_number, stored);
  assert.equal(
    record.display_number,
    stored.replace("SYN-PPO-SITE-", "SYN-SITE-"),
  );
  for (const q of [record.display_number, stored]) {
    const result = await sitesRegister(p, { q });
    assert.deepEqual(
      result.items.map((s) => s.id),
      [CRM.site],
    );
    assert.equal(result.counts.All, 1);
    assert.equal((await listShared(p, "Site", { q })).items[0].id, CRM.site);
  }
  assert.equal(
    (
      await database().query(
        "SELECT display_number FROM ppo.sites WHERE id=$1",
        [CRM.site],
      )
    ).rows[0].display_number,
    stored,
  );
});

test("CS04 already-short facility Site references remain searchable without changing storage", async () => {
  const p = (await createSession("coordinator")).principal;
  const sites = (await database().query("SELECT id,display_number FROM ppo.sites WHERE workspace_id=$1 AND display_number LIKE 'SYN-SITE-%' ORDER BY id", [p.workspace_id])).rows;
  assert.ok(sites.length, "CS-05 supplies Sites already stored with their short reference");
  for (const row of sites) {
    const found = await sitesRegister(p, { q: row.display_number });
    assert.deepEqual(found.items.map(item => item.id), [row.id]);
    assert.equal(found.items[0].legacy_display_number, row.display_number);
  }
});

test("CS04 exact filtered counts, signed pagination and missing source facts", async () => {
  const p = (await createSession("coordinator")).principal;
  const all = await sitesRegister(p, { limit: 200 });
  assert.equal(all.total, all.items.length);
  assert.equal(
    all.counts.Biosecurity,
    all.items.filter((s) => !s.biosecurity_recorded).length,
  );
  assert.equal(
    all.counts.Address,
    all.items.filter((s) => !s.address_recorded).length,
  );
  assert.equal(
    all.counts.Readiness,
    all.items.filter((s) => s.next_visit).length,
  );
  for (const view of ["Biosecurity", "Address", "Readiness"] as const) {
    const result = await sitesRegister(p, { view, limit: 200 });
    assert.equal(result.total, all.counts[view]);
  }
  const first = await sitesRegister(p, { limit: 1 });
  assert.ok(first.next_cursor);
  const second = await sitesRegister(p, {
    limit: 1,
    cursor: first.next_cursor,
  });
  assert.notEqual(first.items[0].id, second.items[0].id);
  await assert.rejects(
    sitesRegister(p, { limit: 1, cursor: first.next_cursor, view: "Address" }),
    { code: "InvalidData" },
  );
  await assert.rejects(sitesRegister(p, { q: "x".repeat(201) }), {
    code: "InvalidData",
  });
  assert.equal(
    (await sitesRegister(p, { q: "SYN no matching site 635" })).total,
    0,
  );
  const scoped = await withWorkingCompany(p.actor_id, CRM.company, () =>
    sitesRegister(p, { limit: 200 }),
  );
  assert.ok(scoped.items.every((s) => s.company_id === CRM.company));
  assert.ok(
    scoped.items.every((s) => s.display_number.startsWith("SYN-SITE-")),
  );
});

test("CS04 revoked visit and related-source permissions clear fields and never imply P4 confirmation", async () => {
  const p = (await createSession("coordinator")).principal;
  const before = await sitesRegister(p, { limit: 200 });
  assert.ok(before.items.some((s) => s.next_visit));
  for (const row of before.items) assert.ok(!/confirmed/i.test(row.readiness));
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability IN ('schedule.read','activity.read','service.work_order.read') RETURNING *",
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  try {
    const result = await sitesRegister(p, { limit: 200 });
    assert.equal(result.counts.Readiness, 0);
    assert.ok(
      result.items.every(
        (s) =>
          s.next_visit === null &&
          s.last_visit === null &&
          s.visits_state === "Restricted",
      ),
    );
    const overview = await siteOverview(p, CRM.site);
    assert.equal(
      overview.sources.find((s) => s.name === "Work orders")?.state,
      "Restricted",
    );
    assert.equal(
      overview.sources.find((s) => s.name === "Follow-ups")?.state,
      "Restricted",
    );
    assert.ok(
      overview.sources
        .filter((s) => s.state === "Restricted")
        .every((s) => s.items.length === 0),
    );
  } finally {
    for (const grant of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1::jsonb)",
        [JSON.stringify(grant)],
      );
  }
  const readGrants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='shared.read' RETURNING *",
      [p.workspace_id, p.actor_id],
    )
  ).rows;
  try {
    await assert.rejects(sitesRegister(p), { status: 403 });
    await assert.rejects(siteOverview(p, CRM.site));
  } finally {
    for (const grant of readGrants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1::jsonb)",
        [JSON.stringify(grant)],
      );
  }
});
