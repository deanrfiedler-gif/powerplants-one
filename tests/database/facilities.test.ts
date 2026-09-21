import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import { createFacility } from "../../src/shared/commands";
import { readShared, listShared } from "../../src/shared/reads";
import { readOperation } from "../../src/shared/receipts";
import {
  createFacilityDetails,
  reviseFacilityDetails,
  previewChange,
  previewPin,
  setFacilityPin,
  addAssetServedFacility,
  endAssetServedFacility,
} from "../../src/shared/facilities/commands";
import {
  facilityWorkspace,
  facilityHistory,
  facilityEquipment,
  registerFacilities,
  sources,
} from "../../src/shared/facilities/reads";
import type { Preview } from "../../src/shared/facilities/definition";
import { createOpportunity } from "../../src/crm/opportunities";
import { createEstimate } from "../../src/estimating/service";
import { readEstimate } from "../../src/estimating/reads";
import {
  createDiscoveryWorkspace,
  previewDiscoveryCreate,
  readDiscoveryRevision,
} from "../../src/estimating/discovery-workspaces";
import { crmCreate } from "../helpers/crm";
import { estimateInput } from "../helpers/estimating";
import {
  discoveryInput,
  discoveryFacility,
} from "../helpers/estimating-discovery";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const company = "20000000-0000-4000-8000-000000000001",
  site = "70000000-0000-4000-8000-000000000001",
  workspace = "10000000-0000-4000-8000-000000000001";
const base = () => ({
  schema_version: 1,
  operation_id: randomUUID(),
  reason: "SYN CS-05 verification",
});
const actor = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const create = (details: Record<string, unknown> = {}) => ({
  ...base(),
  id: randomUUID(),
  company_id: company,
  site_id: site,
  details: {
    name: "SYN Glasshouse",
    structure_type: "greenhouse",
    greenhouse_cladding: "glass",
    bay_count: 8,
    use: "production",
    crop: "Tomatoes",
    context_observed_on: "2026-09-01",
    footprint_m2: "2400",
    ...details,
  },
});
const code = (v: string) => (e: unknown) => (e as { code: string }).code === v;
const review = (p: Preview) => ({
  target_id: p.target_id,
  version: p.version,
  proposal_hash: p.proposal_hash,
  dependency_hash: p.dependency_hash,
  acknowledgements: p.acknowledgements,
});
const counts = async () =>
  (
    await database().query(
      "SELECT (SELECT count(*) FROM ppo.audit_events) AS audit,(SELECT count(*) FROM ppo.operation_receipts) AS receipts,(SELECT count(*) FROM ppo.outbox_jobs) AS outbox,(SELECT count(*) FROM ppo.facility_sources) AS sources",
    )
  ).rows[0];

test("CS05-T66: equipment dependency review includes associations beyond its bounded display page", async () => {
  const p = await actor(),
    input = create();
  await createFacilityDetails(p, input);
  await transaction(async (c) => {
    await c.query(
      `INSERT INTO ppo.assets(id,workspace_id,company_id,site_id,facility_id,display_number,description,identity_status,lifecycle_status,created_by,updated_by)
    SELECT gen_random_uuid(),$1,$2,$3,$4,NULL,'SYN dependency equipment '||n,'Unresolved','Active',$5,$5 FROM generate_series(1,55) n`,
      [workspace, company, site, input.id, p.actor_id],
    );
    await c.query(
      `INSERT INTO ppo.asset_location_events(id,workspace_id,company_id,asset_id,to_site_id,effective_at,reason,created_by,updated_by)
      SELECT gen_random_uuid(),workspace_id,company_id,id,site_id,'2026-09-01T00:00:00Z','SYN dependency fixture',$2,$2 FROM ppo.assets WHERE facility_id=$1`,
      [input.id, p.actor_id],
    );
  });
  const proposal = {
    expected_version: 1,
    changes: { structure_type: "open_growing_area" },
  };
  const old = await previewChange(p, input.id, proposal);
  assert.equal(old.dependencies!.equipment.length, 50);
  assert.equal(old.dependencies!.equipment_more, true);
  const last = (
    await database().query(
      "SELECT id FROM ppo.assets WHERE facility_id=$1 ORDER BY id DESC LIMIT 1",
      [input.id],
    )
  ).rows[0].id;
  assert.ok(!old.dependencies!.equipment.some((a) => a.id === last));
  await database().query(
    "UPDATE ppo.assets SET description='SYN changed after displayed page' WHERE id=$1",
    [last],
  );
  await assert.rejects(
    reviseFacilityDetails(p, input.id, {
      ...base(),
      ...proposal,
      review: review(old),
    }),
    code("FacilityReviewChanged"),
  );
  const fresh = await previewChange(p, input.id, proposal);
  await reviseFacilityDetails(p, input.id, {
    ...base(),
    ...proposal,
    review: review(fresh),
  });
});

test("CS05-T49–50: E2 checks current Facility context but retained discovery and estimate versions remain byte-equivalent", async () => {
  const p = await actor(),
    opportunity = crmCreate();
  await createOpportunity(p, opportunity);
  const discovery = discoveryInput(),
    preview = await previewDiscoveryCreate(p, {
      opportunity_id: opportunity.id,
      discovery,
    });
  const input = {
    ...base(),
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
  const retained = await readDiscoveryRevision(p, input.id, input.revision_id);
  const other = crmCreate();
  await createOpportunity(p, other);
  const estimate = estimateInput(other.id);
  await createEstimate(p, estimate);
  const priced = await readEstimate(p, estimate.id);
  const old = (
    await database().query(
      "SELECT name,version FROM ppo.facilities WHERE id=$1",
      [discoveryFacility],
    )
  ).rows[0];
  const third = crmCreate();
  await createOpportunity(p, third);
  const beforeContext = await previewDiscoveryCreate(p, {
    opportunity_id: third.id,
    discovery,
  });
  const facilityChange = {
    expected_version: old.version,
    changes: {
      structure_type: "unknown",
      type_unknown_reason: "SYN not classified",
      name: "SYN revised exact Facility",
    },
  };
  await reviseFacilityDetails(p, discoveryFacility, {
    ...base(),
    ...facilityChange,
    review: review(await previewChange(p, discoveryFacility, facilityChange)),
  });
  assert.deepEqual(
    await readDiscoveryRevision(p, input.id, input.revision_id),
    retained,
  );
  assert.deepEqual((await readEstimate(p, estimate.id)).saved, priced.saved);
  assert.deepEqual((await readEstimate(p, estimate.id)).totals, priced.totals);
  const stale = await previewDiscoveryCreate(p, {
    opportunity_id: third.id,
    discovery,
  });
  assert.notEqual(stale.context_hash, beforeContext.context_hash);
  const v = (await facilityWorkspace(p, discoveryFacility)).version;
  await reviseFacilityDetails(p, discoveryFacility, {
    ...base(),
    expected_version: v,
    changes: {
      structure_type: "unknown",
      detail_notes: "SYN another revision",
    },
  });
  await assert.rejects(
    createDiscoveryWorkspace(p, {
      ...input,
      ...base(),
      id: randomUUID(),
      option_id: randomUUID(),
      revision_id: randomUUID(),
      opportunity_id: third.id,
      expected_opportunity_version: stale.expected_opportunity_version,
      context_hash: stale.context_hash,
      confirmed_question_ids: stale.required_confirmation_ids,
    }),
    code("DiscoveryContextChanged"),
  );
});

test("CS05-T01–06,T14–16,T21,T44–46,T63–65,T71: atomic create/revision, legacy, read-only preview, exact clearing and original replay", async () => {
  const p = await actor(),
    input = create({
      location_source: {
        kind: "reported_note",
        title: "SYN plan note",
        note: "East side\nReported only",
      },
    });
  const saved = await createFacilityDetails(p, input);
  assert.equal(saved.receipt.record_version, 1);
  const f = await facilityWorkspace(p, input.id);
  assert.equal(f.details.footprint_m2, "2400");
  assert.equal(f.details.bay_count, 8);
  assert.equal(f.reference, null);
  assert.equal((await readShared(p, "Facility", input.id)).id, input.id);
  const before = await counts(),
    changes = {
      structure_type: "open_growing_area",
      use: "non_growing",
      context_observed_on: "2026-09-02",
    };
  const preview = await previewChange(p, input.id, {
    expected_version: 1,
    changes,
  });
  assert.deepEqual(await counts(), before);
  assert.deepEqual(preview.clearing.map((c) => c.field).sort(), [
    "bay_count",
    "crop",
    "greenhouse_cladding",
  ]);
  await assert.rejects(
    reviseFacilityDetails(p, input.id, {
      ...base(),
      expected_version: 1,
      changes,
    }),
    code("FacilityReviewChanged"),
  );
  await assert.rejects(
    reviseFacilityDetails(p, input.id, {
      ...base(),
      expected_version: 1,
      changes,
      review: { ...review(preview), proposal_hash: "a".repeat(64) },
    }),
    code("FacilityReviewChanged"),
  );
  assert.deepEqual(await counts(), before);
  const cmd = {
      ...base(),
      expected_version: 1,
      changes,
      review: review(preview),
    },
    accepted = await reviseFacilityDetails(p, input.id, cmd);
  assert.deepEqual(
    (await reviseFacilityDetails(p, input.id, cmd)).receipt,
    accepted.receipt,
  );
  await assert.rejects(
    reviseFacilityDetails(p, input.id, { ...cmd, reason: "Changed content" }),
    code("OperationConflict"),
  );
  const current = await facilityWorkspace(p, input.id);
  assert.equal(current.version, 2);
  assert.equal(current.details.crop, null);
  assert.equal(current.details.greenhouse_cladding, null);
  assert.equal(current.details.footprint_m2, "2400");
  assert.deepEqual(await readOperation(p, cmd.operation_id), accepted.receipt);
  await assert.rejects(
    reviseFacilityDetails(p, input.id, {
      ...base(),
      expected_version: 2,
      changes: { structure_type: "open_growing_area" },
    }),
    code("InvalidData"),
  );
  const notes = {
    ...base(),
    expected_version: 2,
    changes: {
      structure_type: "open_growing_area",
      detail_notes: "Keep this note",
    },
  };
  await reviseFacilityDetails(p, input.id, notes);
  assert.equal(
    (await facilityWorkspace(p, input.id)).details.context_observed_on,
    "2026-09-02",
  );
  assert.deepEqual(
    (await reviseFacilityDetails(p, input.id, cmd)).receipt,
    accepted.receipt,
  );
  const history = await facilityHistory(p, input.id);
  assert.equal(history.items.length, 3);
  assert.equal(history.items[0].details.context_observation, false);
  assert.equal(history.items[1].details.before.crop, "Tomatoes");
  const legacy = {
    ...base(),
    id: randomUUID(),
    company_id: company,
    site_id: site,
    name: "SYN Legacy",
  };
  await createFacility(p, legacy);
  assert.equal(
    (await facilityWorkspace(p, legacy.id)).details.structure_type,
    null,
  );
  assert.ok(
    (await listShared(p, "Facility", { q: "SYN Legacy" })).items.some(
      (r) => r.id === legacy.id,
    ),
  );
  await assert.rejects(
    createFacility(p, { ...legacy, structure_type: "greenhouse" }),
    code("InvalidData"),
  );
});
test("CS05-T07–12,T22,T74: every conditional type, strict primitive/applicability validation and direct SQL precision", async () => {
  const p = await actor();
  const variants = [
    {
      structure_type: "polytunnel",
      polytunnel_cover: "other",
      polytunnel_cover_description: "SYN film",
      tunnel_count: 10000,
    },
    { structure_type: "shade_net_house", shade_house_cover: "insect_net" },
    { structure_type: "open_growing_area", open_area_layout: "rows" },
    { structure_type: "indoor_growing_room", growing_levels: 100 },
    {
      structure_type: "non_growing_facility",
      facility_function: "other",
      facility_function_description: "SYN store",
    },
    { structure_type: "other", type_description: "SYN uncommon structure" },
    { structure_type: "unknown", type_unknown_reason: "Awaiting source" },
  ];
  for (const details of variants) {
    const input = create({
      ...details,
      greenhouse_cladding: null,
      bay_count: null,
    });
    await createFacilityDetails(p, input);
    assert.equal(
      (await facilityWorkspace(p, input.id)).details.structure_type,
      details.structure_type,
    );
  }
  for (const details of [
    { bay_count: 0 },
    { footprint_m2: "1.001" },
    { length_m: "1e3" },
    { structure_type: "polytunnel" },
    { crop: "x", use: null },
    { structure_type: "unknown" },
    { context_observed_on: "2999-01-01" },
    { unrecognised: true },
  ])
    await assert.rejects(
      createFacilityDetails(p, create(details)),
      code("InvalidData"),
    );
  const input = create();
  await createFacilityDetails(p, input);
  for (const [column, value] of [
    ["footprint_m2", "1.001"],
    ["footprint_m2", "NaN"],
    ["length_m", "1.0001"],
    ["polytunnel_cover", "net"],
    ["growing_levels", 1],
  ])
    await assert.rejects(
      database().query(`UPDATE ppo.facilities SET ${column}=$2 WHERE id=$1`, [
        input.id,
        value,
      ]),
      code("23514"),
    );
});
test("CS05-T17–20,T43,T66: complete ancestry, concurrent cycles and parent-label freshness under workspace lock", async () => {
  const p = await actor(),
    a = create({ name: "SYN A" }),
    b = create({ name: "SYN B" });
  await createFacilityDetails(p, a);
  await createFacilityDetails(p, b);
  const ca = {
      structure_type: "greenhouse",
      parent_facility_id: b.id,
      parent_relationship: "grouping",
    },
    cb = {
      structure_type: "greenhouse",
      parent_facility_id: a.id,
      parent_relationship: "physically_within",
    };
  const pa = await previewChange(p, a.id, { expected_version: 1, changes: ca }),
    pb = await previewChange(p, b.id, { expected_version: 1, changes: cb });
  const results = await Promise.allSettled([
    reviseFacilityDetails(p, a.id, {
      ...base(),
      expected_version: 1,
      changes: ca,
      review: review(pa),
    }),
    reviseFacilityDetails(p, b.id, {
      ...base(),
      expected_version: 1,
      changes: cb,
      review: review(pb),
    }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const c = create({ name: "SYN C" });
  await createFacilityDetails(p, c);
  const pc = await previewChange(p, c.id, {
    expected_version: 1,
    changes: {
      structure_type: "greenhouse",
      parent_facility_id: a.id,
      parent_relationship: "grouping",
    },
  });
  const av = (await facilityWorkspace(p, a.id)).version;
  await reviseFacilityDetails(p, a.id, {
    ...base(),
    expected_version: av,
    changes: { structure_type: "greenhouse", name: "SYN renamed A" },
  });
  await assert.rejects(
    reviseFacilityDetails(p, c.id, {
      ...base(),
      expected_version: 1,
      changes: {
        structure_type: "greenhouse",
        parent_facility_id: a.id,
        parent_relationship: "grouping",
      },
      review: review(pc),
    }),
    code("FacilityReviewChanged"),
  );
  const conflicts = await Promise.allSettled([
    reviseFacilityDetails(p, c.id, {
      ...base(),
      expected_version: 1,
      changes: { structure_type: "greenhouse", detail_notes: "A" },
    }),
    reviseFacilityDetails(p, c.id, {
      ...base(),
      expected_version: 1,
      changes: { structure_type: "greenhouse", detail_notes: "B" },
    }),
  ]);
  assert.equal(conflicts.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(
    conflicts.some(
      (r) => r.status === "rejected" && r.reason.code === "VersionConflict",
    ),
  );
});
test("CS05-T21–22,T25–27,T75–76: older context review, immutable source correction and exact pin confirmation/removal", async () => {
  const p = await actor(),
    input = create({
      context_source: {
        kind: "reported_note",
        title: "SYN original",
        note: "Retain original",
      },
    });
  await createFacilityDetails(p, input);
  const change = {
      structure_type: "greenhouse",
      crop: "Peppers",
      context_observed_on: "2026-08-01",
      context_source: {
        kind: "reported_note",
        title: "SYN correction",
        note: "Replacement source",
      },
    },
    pv = await previewChange(p, input.id, {
      expected_version: 1,
      changes: change,
    });
  assert.ok(pv.acknowledgements.includes("adopt_older_observation"));
  await reviseFacilityDetails(p, input.id, {
    ...base(),
    expected_version: 1,
    changes: change,
    review: review(pv),
  });
  const ss = await sources(database(), p, input.id);
  assert.equal(ss.length, 2);
  assert.equal(ss[0].note, "Retain original");
  assert.equal(ss[1].replaces_source_id, ss[0].id);
  await assert.rejects(
    database().query(
      "UPDATE ppo.facility_sources SET note='rewrite' WHERE id=$1",
      [ss[0].id],
    ),
    code("55000"),
  );
  const pin = {
      latitude: "0",
      longitude: "0",
      state: "confirmed",
      checked_on: "2026-09-01",
      source: { kind: "reported_note", title: "SYN coordinate check" },
    },
    pp = await previewPin(p, input.id, { expected_version: 2, pin });
  await assert.rejects(
    setFacilityPin(p, input.id, { ...base(), expected_version: 2, pin }),
    code("FacilityReviewChanged"),
  );
  const cmd = { ...base(), expected_version: 2, pin, review: review(pp) };
  const accepted = await setFacilityPin(p, input.id, cmd);
  assert.deepEqual(
    (await setFacilityPin(p, input.id, cmd)).receipt,
    accepted.receipt,
  );
  const changed = { ...pin, longitude: "1" };
  await assert.rejects(
    setFacilityPin(p, input.id, {
      ...base(),
      expected_version: 3,
      pin: changed,
      review: review(pp),
    }),
    code("FacilityReviewChanged"),
  );
  await assert.rejects(
    setFacilityPin(p, input.id, { ...base(), expected_version: 3, pin }),
    code("InvalidData"),
  );
  const rm = await previewPin(p, input.id, { expected_version: 3, pin: null });
  await setFacilityPin(
    p,
    input.id,
    { ...base(), expected_version: 3, review: review(rm) },
    true,
  );
  assert.equal((await facilityWorkspace(p, input.id)).pin, null);
});
test("CS05-T29–33,T38,T42: one installed pump, three explicit served areas, no inheritance, retained ending and Asset version", async () => {
  const p = await actor(),
    prefix = "c5050002-0000-4000-8000-",
    pump = "c5050003-0000-4000-8000-000000000001",
    facility = prefix + "000000000004";
  assert.equal((await facilityEquipment(p, facility)).items.length, 0);
  for (let n = 1; n <= 3; n++)
    assert.equal(
      (await facilityEquipment(p, prefix + String(n).padStart(12, "0")))
        .items[0].id,
      pump,
    );
  const input = {
      ...base(),
      expected_version: 1,
      facility_id: facility,
      source: {
        kind: "reported_note",
        title: "SYN explicit child association",
      },
    },
    r = await addAssetServedFacility(p, pump, input);
  assert.equal(r.receipt.record_version, 2);
  assert.equal((await facilityWorkspace(p, facility)).version, 1);
  assert.deepEqual(
    (await addAssetServedFacility(p, pump, input)).receipt,
    r.receipt,
  );
  await assert.rejects(
    addAssetServedFacility(p, pump, {
      ...input,
      ...base(),
      expected_version: 2,
    }),
    code("RelationshipConflict"),
  );
  const link = (await facilityEquipment(p, facility)).items[0];
  assert.equal(link.installed, false);
  await assert.rejects(
    endAssetServedFacility(
      p,
      "80000000-0000-4000-8000-000000000001",
      link.link_id,
      { ...base(), expected_version: 1 },
    ),
    code("RecordUnavailable"),
  );
  await endAssetServedFacility(p, pump, link.link_id, {
    ...base(),
    expected_version: 2,
  });
  assert.equal((await facilityEquipment(p, facility)).items.length, 0);
  assert.equal(
    (
      await database().query(
        "SELECT count(*)::int AS n FROM ppo.asset_served_facilities WHERE asset_id=$1",
        [pump],
      )
    ).rows[0].n,
    4,
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.assets SET site_id=$2,facility_id=NULL WHERE id=$1",
      [pump, site],
    ),
    code("23514"),
  );
  assert.equal(
    (
      await database().query("SELECT facility_id FROM ppo.assets WHERE id=$1", [
        pump,
      ])
    ).rows[0].facility_id,
    prefix + "000000000006",
  );
});
test("CS05-T34–40,T52,T59,T78: server sorting/cursors, full UUID lookup beyond loaded pages, parent exclusion and scoped counts", async () => {
  const p = await actor();
  const orgPage = await registerFacilities(p, {
    organisation_id: "c5050000-0000-4000-8000-000000000001",
  });
  assert.equal(orgPage.total, 9);
  assert.ok(
    orgPage.items.every((f) => f.organisation_roles?.join() === "Operator"),
  );

  await database().query(
    `INSERT INTO ppo.facilities(id,workspace_id,company_id,site_id,name,created_by,updated_by) SELECT gen_random_uuid(),$1,$2,$3,'SYN large '||lpad(n::text,4,'0'),$4,$4 FROM generate_series(1,5000) n`,
    [workspace, company, site, p.actor_id],
  );
  const times: number[] = [];
  for (const sort of ["name", "site", "structure", "updated"]) {
    const start = performance.now(),
      first = await registerFacilities(p, { site_id: site, sort, limit: "5" }),
      second = await registerFacilities(p, {
        site_id: site,
        sort,
        limit: "5",
        cursor: first.next_cursor,
      });
    times.push(performance.now() - start);
    assert.ok(first.next_cursor);
    assert.equal(
      new Set([...first.items, ...second.items].map((i) => i.id)).size,
      10,
    );
    await assert.rejects(
      registerFacilities(p, {
        site_id: site,
        sort,
        limit: "6",
        cursor: first.next_cursor,
      }),
      code("InvalidData"),
    );
  }
  const target = (
    await database().query(
      "SELECT id FROM ppo.facilities WHERE name='SYN large 0550'",
    )
  ).rows[0].id;
  assert.equal(
    (await registerFacilities(p, { q: target })).items[0].id,
    target,
  );
  assert.equal(
    (await registerFacilities(p, { q: target.slice(0, 8) })).total,
    0,
  );
  const other = await actor("other-workspace");
  await assert.rejects(
    facilityWorkspace(other, target),
    code("RecordUnavailable"),
  );
  assert.equal((await registerFacilities(other, { q: target })).total, 0);
  const bay = "c5050002-0000-4000-8000-000000000004",
    house = "c5050002-0000-4000-8000-000000000003",
    nursery = "c5050001-0000-4000-8000-000000000001";
  const matches = await registerFacilities(p, { site_id: nursery, q: bay });
  assert.equal(matches.total, 1);
  assert.equal(matches.context_ancestors[0].id, house);
  assert.equal(matches.items[0].ancestor_path?.[0].id, house);
  assert.ok(
    !(
      await registerFacilities(p, { site_id: nursery, exclude_id: house })
    ).items.some((f) => [house, bay].includes(f.id)),
  );
  console.log(
    JSON.stringify({ case: "CS05-T59", dataset: 5000, queryPairsMs: times }),
  );
});
test("CS05-T39–41,T44–45,T79: edit-only originals, revoked access, create-only refusal and company/site isolation", async () => {
  const p = await actor(),
    input = create();
  await createFacilityDetails(p, input);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.create'",
    [p.actor_id],
  );
  const cmd = {
      ...base(),
      expected_version: 1,
      changes: { structure_type: "greenhouse", detail_notes: "Edit only" },
    },
    r = await reviseFacilityDetails(p, input.id, cmd);
  assert.deepEqual(await readOperation(p, cmd.operation_id), r.receipt);
  await assert.rejects(
    createFacilityDetails(p, create()),
    code("RecordUnavailable"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='shared.edit'",
    [p.actor_id],
  );
  await assert.rejects(
    reviseFacilityDetails(p, input.id, cmd),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readOperation(p, cmd.operation_id),
    code("RecordUnavailable"),
  );
  const siteObserver = await actor("site-observer");
  await assert.rejects(
    facilityWorkspace(siteObserver, "c5050002-0000-4000-8000-000000000001"),
    code("RecordUnavailable"),
  );
  assert.equal(
    (await facilityWorkspace(siteObserver, input.id)).can_edit,
    false,
  );
});
test("CS05-T46,T53–54: failed audit rolls back all effects; upgrade and reseed preserve identities, grants, old fields and originals", async () => {
  const p = await actor(),
    input = create({
      location_source: { kind: "reported_note", title: "SYN rollback" },
    }),
    before = await counts();
  await database().query(
    "CREATE FUNCTION ppo.cs05_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_type='Facility' THEN RAISE EXCEPTION 'SYN rollback proof'; END IF; RETURN NEW; END $$; CREATE TRIGGER cs05_fail BEFORE INSERT ON ppo.audit_events FOR EACH ROW EXECUTE FUNCTION ppo.cs05_fail_audit()",
  );
  try {
    await assert.rejects(createFacilityDetails(p, input));
    assert.deepEqual(await counts(), before);
    assert.equal(
      (
        await database().query(
          "SELECT 1 FROM ppo.business_identities WHERE id=$1",
          [input.id],
        )
      ).rowCount,
      0,
    );
  } finally {
    await database().query(
      "DROP TRIGGER cs05_fail ON ppo.audit_events; DROP FUNCTION ppo.cs05_fail_audit()",
    );
  }
  await transaction(async (c) => {
    await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
    await c.query("DROP TABLE public.ppo_migrations");
  });
  await migrate(25);
  await seed(25);
  const identityBefore = (
    await database().query("SELECT * FROM ppo.business_identities ORDER BY id")
  ).rows;
  const oldFacility = (
    await database().query(
      "SELECT to_jsonb(f) AS row FROM ppo.facilities f ORDER BY id",
    )
  ).rows;
  await migrate();
  await seed();
  await seed();
  for (const row of identityBefore)
    assert.deepEqual(
      (
        await database().query(
          "SELECT * FROM ppo.business_identities WHERE id=$1",
          [row.id],
        )
      ).rows[0],
      row,
    );
  for (const item of oldFacility) {
    const current = (
      await database().query(
        "SELECT to_jsonb(f) AS row FROM ppo.facilities f WHERE id=$1",
        [item.row.id],
      )
    ).rows[0].row;
    for (const [k, v] of Object.entries(item.row))
      assert.deepEqual(current[k], v);
    assert.equal(current.structure_type, null);
  }
  const fixture = "c5050002-0000-4000-8000-000000000001";
  await database().query(
    "UPDATE ppo.facilities SET detail_notes='SYN deliberate edit' WHERE id=$1",
    [fixture],
  );
  await seed();
  assert.equal(
    (await facilityWorkspace(await actor(), fixture)).details.detail_notes,
    "SYN deliberate edit",
  );
});
