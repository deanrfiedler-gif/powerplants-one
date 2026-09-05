import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, seed, migrate } from "../../scripts/database";
import {
  addAffiliation,
  addSiteParty,
  createAsset,
  createFacility,
  createOrganisation,
  createPerson,
  createSite,
  proposeMapping,
  recordHistory,
  renameOrganisation,
  reviseAssetIdentity,
} from "../../src/shared/commands";
import {
  assetContext,
  assetHistory,
  customerContext,
  listShared,
  mappingViews,
  readShared,
  siteContext,
} from "../../src/shared/reads";
import { readOperation } from "../../src/shared/receipts";
const id = (type: number, n = 1) =>
  `${type}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const company = id(20),
  site = id(70),
  org = id(50),
  asset = id(80),
  person = id(60);
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P02 verification",
});
const orgCommand = () => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  display_name: "SYN repeated name",
  relationship_status: "Prospect",
  owner_id: id(30),
});
const siteCommand = () => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  display_name: "SYN new site",
  location_description: "Fictional location",
  timezone: "Australia/Brisbane",
  owner_id: id(30),
});
const assetCommand = () => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  site_id: site,
  description: "SYN device",
  identity_status: "Unresolved",
  serial: null,
  effective_at: "2026-09-01T00:00:00Z",
  configuration: "SYN pending review",
});
const code = (c: string) => (e: unknown) => (e as { code?: string }).code === c;
const rows = async (q: string, values: unknown[] = []) =>
  (await database().query(q, values)).rows;
test("P01 schema, fixtures and accepted evidence upgrade without changing identifiers, source keys or checksums", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(1);
  await database().query(await readFile("db/seed-p01.sql", "utf8"));
  const operation = randomUUID(),
    receipt = randomUUID();
  await transaction(async (c) => {
    await c.query(
      "UPDATE ppo.tickets SET summary='SYN P01 preserved deliberate edit',version=2 WHERE id=$1",
      [id(40)],
    );
    await c.query(
      "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,operation_id,outcome,reason,details) VALUES($1,$2,$3,'Ticket',$4,$5,'Accepted','SYN P01 upgrade evidence','{}')",
      [randomUUID(), id(10), id(30), id(40), operation],
    );
    await c.query(
      "INSERT INTO ppo.operation_receipts(id,workspace_id,actor_id,operation_id,record_id,payload_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        receipt,
        id(10),
        id(30),
        operation,
        id(40),
        createHash("sha256").update("P01 original payload").digest("hex"),
        { record_id: id(40), record_version: 2, receipt_id: receipt },
      ],
    );
    await c.query(
      "INSERT INTO ppo.outbox_jobs(id,workspace_id,actor_id,operation_id,correlation_id,kind,payload_version,payload) VALUES($1,$2,$3,$4,$4,'TicketDraftSaved',1,'{}')",
      [randomUUID(), id(10), id(30), operation],
    );
  });
  const before = {
    tickets: await rows("SELECT * FROM ppo.tickets ORDER BY id"),
    audit: await rows("SELECT * FROM ppo.audit_events"),
    receipt: await rows("SELECT * FROM ppo.operation_receipts"),
    outbox: await rows("SELECT * FROM ppo.outbox_jobs"),
    migration: await rows("SELECT * FROM public.ppo_migrations"),
    companies: await rows(
      "SELECT id,erp_connection_id AS legacy_erp_connection_key,erp_company_id FROM ppo.companies ORDER BY id",
    ),
  };
  await migrate();
  await seed();
  await seed();
  await migrate();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.tickets ORDER BY id"),
    before.tickets,
  );
  for (const [table, key] of [
    ["audit_events", "audit"],
    ["operation_receipts", "receipt"],
    ["outbox_jobs", "outbox"],
  ] as const)
    assert.deepEqual(await rows(`SELECT * FROM ppo.${table}`), before[key]);
  assert.deepEqual(
    await rows("SELECT * FROM public.ppo_migrations WHERE version=1"),
    before.migration,
  );
  assert.deepEqual(
    await rows(
      "SELECT id,legacy_erp_connection_key,erp_company_id FROM ppo.companies ORDER BY id",
    ),
    before.companies,
  );
  assert.deepEqual(
    (
      await rows(
        "SELECT last_value::int FROM ppo.reference_counters WHERE workspace_id=$1 AND record_type='TKT'",
        [id(10)],
      )
    )[0],
    { last_value: 2 },
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    2,
  );
  console.log(
    "P02 upgrade: P01 tickets/audit/receipt/outbox/migration bytes and exact source keys preserved",
  );
});
test("workspace/company/site scopes apply to detail, list, filter, pagination and relationship projections", async () => {
  const p = await principal(),
    obs = await principal("observer"),
    siteOnly = await principal("site-observer"),
    finance = await principal("finance");
  assert.equal((await listShared(p, "Organisation")).items.length, 3);
  assert.equal(
    (await listShared(p, "Organisation", { company_id: id(20, 2) })).items
      .length,
    0,
  );
  for (const target of [id(50, 3), id(50, 4), randomUUID()])
    await assert.rejects(
      readShared(p, "Organisation", target),
      code("RecordUnavailable"),
    );
  for (const profile of ["systems", "technician"])
    await assert.rejects(
      listShared(await principal(profile), "Organisation"),
      code("Forbidden"),
    );
  assert.equal(
    (await listShared(await principal("workspace-observer"), "Organisation"))
      .items.length,
    4,
  );
  assert.equal(
    (await listShared(await principal("other-workspace"), "Organisation")).items
      .length,
    1,
  );
  await assert.rejects(
    readShared(siteOnly, "Site", id(70, 2)),
    code("RecordUnavailable"),
  );
  const context = await siteContext(siteOnly, site);
  assert.equal(context.assets.items.length, 2);
  const customer = await customerContext(siteOnly, org);
  assert.equal(customer.sites.length, 1);
  assert.equal(customer.contacts.length, 0);
  assert.equal(customer.mappings.length, 0);
  assert.ok(!("notes" in customer));
  assert.ok(
    !JSON.stringify(await customerContext(obs, org)).includes(
      "internal relationship note",
    ),
  );
  assert.equal((await assetHistory(p, asset)).items.length, 2);
  assert.equal((await assetHistory(siteOnly, asset)).items.length, 1); // Previous-site history is independently scoped.
  assert.equal((await assetHistory(finance, asset)).items.length, 3);
  assert.equal((await assetContext(siteOnly, asset)).locations.length, 0); // No previous-site ID through move events.
  const first = await listShared(p, "Organisation", { limit: 1 });
  assert.ok(first.next_cursor);
  const second = await listShared(p, "Organisation", {
    limit: 1,
    cursor: first.next_cursor,
  });
  assert.notDeepEqual(first.items, second.items);
  await assert.rejects(
    listShared(obs, "Organisation", { limit: 1, cursor: first.next_cursor }),
    code("InvalidData"),
  );
  await assert.rejects(
    listShared(p, "Organisation", { limit: 2, cursor: first.next_cursor }),
    code("InvalidData"),
  );
  await assert.rejects(
    listShared(p, "Organisation", { cursor: "fake" }),
    code("InvalidData"),
  );
  const cp = await customerContext(p, org);
  assert.equal(cp.contacts.length, 1);
  assert.ok(!JSON.stringify(cp).includes("supplier liaison"));
});
test("same names stay distinct; external identifiers preserve case/punctuation/zeros and wrong company is refused", async () => {
  const p = await principal();
  const a = await createOrganisation(p, orgCommand()),
    b = await createOrganisation(p, orgCommand());
  assert.notEqual(a.receipt.record_id, b.receipt.record_id);
  const c = (await mappingViews(p, org))[0];
  assert.equal(c.customer_id, "000Ab-C.01");
  assert.equal(c.external_connection_key, "PPO-SIM");
  assert.ok(
    !(
      "customer_id" in (await mappingViews(await principal("observer"), org))[0]
    ),
  );
  const cmd = {
    ...base(),
    id: randomUUID(),
    expected_version: 1,
    erp_connection_id: c.erp_connection_id,
    erp_company_id: "SYN-A",
    entity_type: "Customer",
    customer_id: "000aB-C.01",
    valid_from: "2026-09-01T00:00:00Z",
  };
  await proposeMapping(p, org, cmd);
  assert.equal(
    (await mappingViews(p, org)).find((x) => x.id === cmd.id)?.customer_id,
    "000aB-C.01",
  );
  await assert.rejects(
    proposeMapping(p, org, {
      ...cmd,
      ...base(),
      id: randomUUID(),
      expected_version: 2,
      erp_company_id: "SYN-B",
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    proposeMapping(p, org, {
      ...cmd,
      ...base(),
      id: randomUUID(),
      expected_version: 2,
      customer_id: "000Ab-C.01",
    }),
    code("RelationshipConflict"),
  );
  assert.equal((await readShared(p, "Organisation", org)).version, 2);
});
test("shared person identity supports several authorised company affiliations without identity duplication", async () => {
  const p = await principal("workspace-observer");
  assert.equal((await listShared(p, "Person")).items.length, 1);
  const second = await principal("second-company");
  const affiliation = {
    ...base(),
    id: randomUUID(),
    expected_version: 1,
    person_id: person,
    role_label: "SYN alternate role",
    valid_from: "2026-09-01",
  };
  await addAffiliation(second, id(50, 3), affiliation);
  assert.equal((await customerContext(second, id(50, 3))).contacts.length, 2);
  await assert.rejects(
    addAffiliation(await principal(), org, {
      ...affiliation,
      ...base(),
      id: randomUUID(),
      person_id: id(60, 2),
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createPerson(await principal(), {
      ...base(),
      id: randomUUID(),
      company_ids: [company, id(20, 2)],
      display_name: "SYN illicit scope",
    }),
    code("RecordUnavailable"),
  );
  const created = await createPerson(await principal(), {
    ...base(),
    id: randomUUID(),
    company_ids: [company],
    display_name: "SYN new contact",
    email: "new@example.invalid",
  });
  assert.equal(
    (await readShared(await principal(), "Person", created.receipt.record_id))
      .version,
    1,
  );
});
test("atomic references survive concurrent creates, duplicate/conflicting operations, reseeding and attempted rewinds", async () => {
  const p = await principal(),
    cmd = orgCommand();
  const both = await Promise.all([
    createOrganisation(p, cmd),
    createOrganisation(p, { ...cmd }),
  ]);
  assert.deepEqual(both[0].receipt, both[1].receipt);
  assert.equal(both.filter((x) => !x.replayed).length, 1);
  await assert.rejects(
    createOrganisation(p, { ...cmd, display_name: "SYN different" }),
    code("OperationConflict"),
  );
  const results = await Promise.all(
    Array.from({ length: 12 }, () => createOrganisation(p, orgCommand())),
  );
  const refs = await rows(
    "SELECT display_number FROM ppo.organisations WHERE id=ANY($1::uuid[])",
    [results.map((x) => x.receipt.record_id)],
  );
  assert.equal(new Set(refs.map((x) => x.display_number)).size, 12);
  const counters = await rows(
    "SELECT * FROM ppo.reference_counters ORDER BY workspace_id,record_type",
  );
  await seed();
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.reference_counters ORDER BY workspace_id,record_type",
    ),
    counters,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.reference_counters SET last_value=1 WHERE record_type='ORG'",
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.organisations SET display_number='SYN-PPO-ORG-999999' WHERE id=$1",
      [cmd.id],
    ),
    code("55000"),
  );
  await assert.rejects(
    createSite(p, { ...siteCommand(), id: cmd.id }),
    code("RelationshipConflict"),
  );
  await assert.rejects(
    database().query("DELETE FROM ppo.organisations WHERE id=$1", [cmd.id]),
    code("55000"),
  );
  await closeDatabase();
  assert.equal((await readShared(p, "Organisation", cmd.id)).id, cmd.id);
  console.log(
    "P02 references: 12 parallel distinct creations; 1 effect for identical concurrent operation; no seed rewind",
  );
});
test("stale edits and current-permission replay preserve original accepted result", async () => {
  const p = await principal(),
    cmd = {
      ...base(),
      expected_version: 1,
      display_name: "SYN renamed",
      parent_organisation_id: null,
    };
  const first = await renameOrganisation(p, org, cmd);
  assert.equal(first.receipt.record_version, 2);
  assert.deepEqual(await readOperation(p, cmd.operation_id), first.receipt);
  assert.deepEqual(
    (await renameOrganisation(p, org, cmd)).receipt,
    first.receipt,
  );
  await assert.rejects(
    renameOrganisation(p, org, { ...cmd, ...base() }),
    code("VersionConflict"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to='2026-02-01' WHERE user_id=$1 AND capability='shared.edit'",
    [p.actor_id],
  );
  await assert.rejects(renameOrganisation(p, org, cmd), code("Forbidden"));
  await seed();
  await assert.rejects(
    readOperation(p, cmd.operation_id),
    code("RecordUnavailable"),
  );
  await assert.rejects(renameOrganisation(p, org, cmd), code("Forbidden"));
  assert.equal((await readShared(p, "Organisation", org)).version, 2);
});
test("overlapping periods, invalid dates, cross-scope links and hierarchy cycles fail; adjacent operators succeed", async () => {
  const p = await principal();
  await assert.rejects(
    createSite(p, {
      ...siteCommand(),
      parties: [
        {
          organisation_id: id(50, 3),
          role: "Operator",
          valid_from: "2026-01-01T00:00:00Z",
        },
      ],
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    addSiteParty(p, site, {
      ...base(),
      id: randomUUID(),
      expected_version: 1,
      organisation_id: id(50, 2),
      role: "Operator",
      valid_from: "2026-08-02T00:00:00Z",
    }),
    code("RelationshipConflict"),
  );
  await assert.rejects(
    createSite(p, { ...siteCommand(), timezone: "Invalid/Zone" }),
    code("InvalidData"),
  );
  await assert.rejects(
    createAsset(p, { ...assetCommand(), installed_on: "2026-02-30" }),
    code("InvalidData"),
  );
  await assert.rejects(
    createAsset(p, {
      ...assetCommand(),
      site_id: id(70, 2),
      parent_asset_id: asset,
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    createAsset(p, {
      ...assetCommand(),
      site_id: id(70, 2),
      facility_id: id(72),
    }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    renameOrganisation(p, org, {
      ...base(),
      expected_version: 1,
      display_name: "SYN cycle",
      parent_organisation_id: org,
    }),
    code("InvalidRelationship"),
  );
  await renameOrganisation(p, id(50, 2), {
    ...base(),
    expected_version: 1,
    display_name: "SYN prior operator revised",
    parent_organisation_id: org,
  });
  await assert.rejects(
    renameOrganisation(p, org, {
      ...base(),
      expected_version: 1,
      display_name: "SYN cycle",
      parent_organisation_id: id(50, 2),
    }),
    code("InvalidRelationship"),
  );
  await assert.rejects(
    reviseAssetIdentity(p, asset, {
      ...base(),
      expected_version: 1,
      identity_status: "Verified",
      serial: "001",
      parent_asset_id: id(80, 2),
    }),
    code("InvalidRelationship"),
  );
  const newSite = await createSite(p, {
    ...siteCommand(),
    parties: [
      {
        organisation_id: org,
        role: "Operator",
        valid_from: "2026-01-01T00:00:00Z",
        valid_to: "2026-08-01T00:00:00Z",
      },
      {
        organisation_id: id(50, 2),
        role: "Operator",
        valid_from: "2026-08-01T00:00:00Z",
      },
    ],
  });
  assert.equal(
    (await siteContext(p, newSite.receipt.record_id)).parties.length,
    2,
  );
  const f = await createFacility(p, {
    ...base(),
    id: randomUUID(),
    company_id: company,
    site_id: site,
    name: "SYN nested bay",
    parent_facility_id: id(72),
  });
  assert.ok(f.receipt.record_id);
  await assert.rejects(
    database().query(
      "UPDATE ppo.facilities SET parent_facility_id=$1 WHERE id=$2",
      [f.receipt.record_id, id(72)],
    ),
    code("23514"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.permission_grants SET scope_type='Assignment' WHERE user_id=$1",
      [p.actor_id],
    ),
    code("23514"),
  );
});
test("concurrent opposite hierarchy changes cannot commit a cycle", async () => {
  const p = await principal();
  const outcomes = await Promise.allSettled([
    renameOrganisation(p, org, {
      ...base(),
      expected_version: 1,
      display_name: "SYN A",
      parent_organisation_id: id(50, 2),
    }),
    renameOrganisation(p, id(50, 2), {
      ...base(),
      expected_version: 1,
      display_name: "SYN B",
      parent_organisation_id: org,
    }),
  ]);
  assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((x) => x.status === "rejected").length, 1);
});
test("history keeps previous site/operator, author, uncertainty and exact source attribution after current changes", async () => {
  const p = await principal(),
    before = await assetHistory(p, asset);
  await renameOrganisation(p, id(50, 2), {
    ...base(),
    expected_version: 1,
    display_name: "SYN renamed past operator",
    parent_organisation_id: null,
  });
  await reviseAssetIdentity(p, id(80, 2), {
    ...base(),
    expected_version: 1,
    identity_status: "Verified",
    serial: "000New-aB",
    parent_asset_id: asset,
  });
  assert.deepEqual((await assetHistory(p, asset)).items, before.items);
  const h = (await assetHistory(p, id(80, 2))).items as {
    asset_identity_status: string;
  }[];
  assert.equal(h[0].asset_identity_status, "Unresolved");
  assert.ok(JSON.stringify(before).includes("SYN Former Technician"));
  assert.ok(JSON.stringify(before).includes("000Hist-Ab.01"));
  assert.ok(JSON.stringify(before).includes("SYN Previous Operator"));
  const recorded = await recordHistory(p, site, {
    ...base(),
    id: randomUUID(),
    expected_version: 1,
    asset_id: asset,
    occurred_at: "2026-08-15T00:00:00Z",
    author_label: "SYN historical author",
    kind: "AttemptedFix",
    summary: "SYN unsuccessful fix; source not verified",
    confidence: "Suspected",
  });
  assert.equal(recorded.receipt.state, "Recorded");
  await assert.rejects(
    recordHistory(p, site, {
      ...base(),
      id: randomUUID(),
      expected_version: 2,
      asset_id: asset,
      occurred_at: "2026-06-01T00:00:00Z",
      author_label: "SYN author",
      kind: "KnownIssue",
      summary: "Wrong historical site",
      confidence: "Reported",
    }),
    code("InvalidRelationship"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.history_records SET author_label='replacement'",
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.asset_configurations SET description='replacement'",
    ),
    code("55000"),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.assets SET site_id=$1,facility_id=NULL,parent_asset_id=NULL WHERE id=$2",
      [id(70, 2), id(80, 2)],
    ),
    code("23514"),
  );
});
test("final outbox failure rolls back created record, relationships, reference, audit and receipt together", async () => {
  const p = await principal(),
    cmd = {
      ...siteCommand(),
      parties: [
        {
          organisation_id: org,
          role: "Operator",
          valid_from: "2026-01-01T00:00:00Z",
        },
      ],
    };
  await database().query(
    "CREATE FUNCTION ppo.force_p02_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P02 test failure'; END $$; CREATE TRIGGER force_p02_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.force_p02_failure()",
  );
  await assert.rejects(createSite(p, cmd));
  for (const table of ["sites", "business_identities"])
    assert.equal(
      (
        await rows(`SELECT count(*)::int n FROM ppo.${table} WHERE id=$1`, [
          cmd.id,
        ])
      )[0].n,
      0,
    );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.site_parties WHERE site_id=$1",
        [cmd.id],
      )
    )[0].n,
    0,
  );
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal(
      (
        await rows(
          `SELECT count(*)::int n FROM ppo.${table} WHERE operation_id=$1`,
          [cmd.operation_id],
        )
      )[0].n,
      0,
    );
  await database().query(
    "DROP TRIGGER force_p02_failure ON ppo.outbox_jobs;DROP FUNCTION ppo.force_p02_failure()",
  );
  assert.equal((await createSite(p, cmd)).receipt.record_version, 1);
  // A later constraint failure must also leave the earlier relationship and site uncommitted.
  const bad = { ...siteCommand(), parties: [...cmd.parties, ...cmd.parties] };
  await assert.rejects(createSite(p, bad), code("RelationshipConflict"));
  assert.equal(
    (
      await rows("SELECT count(*)::int n FROM ppo.sites WHERE id=$1", [bad.id])
    )[0].n,
    0,
  );
  const a = await createAsset(p, assetCommand());
  assert.equal(
    (await assetContext(p, a.receipt.record_id)).configurations.length,
    1,
  );
});
