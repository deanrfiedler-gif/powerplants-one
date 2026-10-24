import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { migrate, seed } from "../../scripts/database";
import { createCs, csAction, readCs } from "../../src/shared/cs/service";
import { createOrganisation } from "../../src/shared/commands";
import { CRM, crmBase as base } from "../helpers/crm";
import { agentAskSeedGrants } from "../helpers/engineering-materials-grants";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
test("0114 preserves populated 0109 references, ledgers and immutable survey snapshots; concurrent new numbers continue their counters", async () => {
  const c = database();
  await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
  await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(109);
  await seed(109);
  const p = (await createSession("coordinator")).principal,
    id = randomUUID();
  const content = {
    schema_version: 1,
    purpose: "SYN retained as-found scope",
    facility_ids: [],
    asset_ids: [],
    observations: [
      {
        id: randomUUID(),
        title: "SYN measured pressure",
        kind: "Measured",
        facility_id: null,
        asset_id: null,
        value: "0",
        unit: "kPa",
        detail: "Recorded zero",
        observer: "SYN observer",
        captured_on: "2026-10-20",
        method_source: "SYN gauge",
        significant: true,
        insignificant_reason: null,
        activity_id: null,
      },
    ],
  };
  await createCs(p, "Survey", {
    ...base(),
    id,
    context_id: CRM.site,
    name: "SYN legacy unnumbered survey",
    owner_id: p.actor_id,
    content,
  });
  await csAction(p, "Survey", id, {
    ...base(),
    expected_version: 1,
    action: "submit",
  });
  const snapshot = async (table: string) =>
    (
      await c.query(
        "SELECT to_jsonb(x) AS row FROM ppo." +
          table +
          " x ORDER BY to_jsonb(x)::text",
      )
    ).rows;
  const tables = [
    "cs_snapshots",
    "cs_record_revisions",
    "cs_record_events",
    "permission_grants",
    "seed_receipts",
    "operation_receipts",
    "audit_events",
  ];
  const originals = await Promise.all(tables.map(snapshot)),
    identities = await snapshot("business_identities");
  const survey = (
    await c.query(
      "SELECT to_jsonb(s) AS row FROM ppo.site_surveys s WHERE id=$1",
      [id],
    )
  ).rows[0].row;
  const ledger = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  const orgCounter = Number(
    (
      await c.query(
        "SELECT last_value FROM ppo.reference_counters WHERE workspace_id=$1 AND record_type='ORG' AND namespace='SYN-PPO'",
        [p.workspace_id],
      )
    ).rows[0].last_value,
  );
  await migrate();
  await seed();
  const upgraded = await Promise.all(tables.map(snapshot));
  for (const [i, table] of tables.entries()) {
    if (table === "permission_grants") {
      const originalGrants = originals[i].map(x => x.row), afterGrants = upgraded[i].map(x => x.row);
      const ids = new Set(originalGrants.map(g => g.id));
      assert.deepEqual(afterGrants.filter(g => ids.has(g.id)), originalGrants);
      const shape = (grants: Record<string, unknown>[]) => grants.map(g => JSON.stringify(g)).sort();
      assert.deepEqual(shape(afterGrants.filter(g => !ids.has(g.id))), shape(agentAskSeedGrants(originalGrants)));
    } else if (table === "seed_receipts") {
      assert.deepEqual(upgraded[i].filter(x => x.row.version <= 109), originals[i]);
      assert.deepEqual(upgraded[i].filter(x => x.row.version > 109).map(x => x.row.version), [110]);
    } else assert.deepEqual(upgraded[i], originals[i]);
  }
  assert.deepEqual(
    (await snapshot("business_identities")).filter((x) => x.row.id !== id),
    identities.filter((x) => x.row.id !== id),
  );
  const after = (
    await c.query(
      "SELECT to_jsonb(s) AS row FROM ppo.site_surveys s WHERE id=$1",
      [id],
    )
  ).rows[0].row;
  assert.match(after.display_number, /^SYN-SRV-\d{6,}$/);
  const { display_number, ...preserved } = after;
  assert.deepEqual(preserved, survey);
  assert.equal(
    (
      await c.query(
        "SELECT display_number FROM ppo.business_identities WHERE id=$1",
        [id],
      )
    ).rows[0].display_number,
    display_number,
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT * FROM public.ppo_migrations WHERE version<=109 ORDER BY version",
      )
    ).rows,
    ledger,
  );
  assert.deepEqual(
    (
      await c.query(
        "SELECT version FROM public.ppo_migrations WHERE version>109 ORDER BY version",
      )
    ).rows,
    [{ version: 110 }, { version: 111 }, { version: 112 }, { version: 113 }, { version: 114 }, { version: 115 }, { version: 116 }, { version: 117 }, { version: 119 }],
  );
  const orgId = randomUUID();
  await createOrganisation(p, {
    ...base(),
    id: orgId,
    company_id: CRM.company,
    display_name: "SYN new short reference",
    relationship_status: "Active",
    owner_id: p.actor_id,
  });
  assert.equal(
    (
      await c.query(
        "SELECT display_number FROM ppo.organisations WHERE id=$1",
        [orgId],
      )
    ).rows[0].display_number,
    "SYN-ORG-" + String(orgCounter + 1).padStart(6, "0"),
  );
  const ids = Array.from({ length: 12 }, () => randomUUID());
  await Promise.all(
    ids.map((newId) =>
      createCs(p, "Survey", {
        ...base(),
        id: newId,
        context_id: CRM.site,
        name: "SYN concurrent survey",
        owner_id: p.actor_id,
      }),
    ),
  );
  const refs = (
    await c.query(
      "SELECT display_number FROM ppo.site_surveys WHERE id=ANY($1::uuid[])",
      [ids],
    )
  ).rows.map((x) => String(x.display_number));
  assert.equal(new Set(refs).size, 12);
  assert.ok(refs.every((x) => /^SYN-SRV-\d{6,}$/.test(x)));
  await assert.rejects(
    c.query(
      "UPDATE ppo.site_surveys SET display_number='SYN-SRV-999999' WHERE id=$1",
      [id],
    ),
  );
  const current = await readCs(p, "Survey", id);
  assert.equal(current.record.display_number, display_number);
  assert.ok(!("visit" in current.record.content));
  assert.deepEqual(current.snapshots[0].basis, originals[0][0].row.basis);
  const repeatOriginals = await Promise.all(tables.slice(0, 5).map(snapshot));
  const repeatLedger = (
    await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(
    (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version"))
      .rows,
    repeatLedger,
  );
  assert.deepEqual(
    await Promise.all(tables.slice(0, 5).map(snapshot)),
    repeatOriginals,
  );
});
