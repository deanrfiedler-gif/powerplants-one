import assert from "node:assert/strict";
import { test, beforeEach, after } from "node:test";
import { randomUUID } from "node:crypto";
import { localConfig } from "../../src/platform/config";
import { database, closeDatabase } from "../../src/platform/database";
import { reset } from "../../scripts/database";
import {
  listPacks,
  visitsWithoutPack,
  readPack,
  revisePack,
  createPack,
} from "../../src/documents/packs";
import {
  principal,
  prepared,
  confirmed,
  issued,
  content,
  base,
  id,
} from "../helpers/packs";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use the disposable test database.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);

test("register projection agrees with the permitted saved revision and live readiness", async () => {
  const pack = await prepared(),
    p = await principal();
  const row = (await listPacks(p)).items.find((r) => r.id === pack.id)!;
  const revision = pack.revisions.find(
    (r: { id: string }) => r.id === pack.current_revision_id,
  )!;
  assert.equal(row.revision, revision.revision);
  assert.equal(row.title, pack.section_view?.scope?.summary);
  assert.equal(row.customer, revision.snapshot.customer.name);
  assert.equal(row.site, revision.snapshot.site.name);
  assert.equal(row.prepared_by, p.actor_id);
  assert.equal(row.dispatch_hold, pack.readiness.dispatch_hold);
  assert.equal(row.readiness?.total, pack.criteria?.length);
  assert.equal(row.recipients, null);
  assert(!("snapshot" in row));
  assert(!("notes" in row));
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='pack.read'",
    [p.actor_id],
  );
  assert.deepEqual((await listPacks(p)).items, []);
});

test("visits without packs require confirmation and prepare permission; existing packs are excluded", async () => {
  const p = await principal();
  assert(!(await visitsWithoutPack(p)).items.some((v) => v.id === id("a8", 9)));
  const appointment = await confirmed();
  const visit = (await visitsWithoutPack(p)).items.find(
    (v) => v.id === appointment.id,
  );
  assert(visit);
  assert(visit.site_name.startsWith("SYN"));
  await createPack(p, {
    ...base(),
    id: randomUUID(),
    appointment_id: appointment.id,
    expected_appointment_version: appointment.version,
    content: content(),
  });
  assert(
    !(await visitsWithoutPack(p)).items.some((v) => v.id === appointment.id),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='pack.prepare'",
    [p.actor_id],
  );
  assert.deepEqual((await visitsWithoutPack(p)).items, []);
});

test("technician register cannot expose a draft successor, its preparer or staff readiness", async () => {
  const { p, pack } = await issued();
  const current = pack.revisions.find(
    (r: { id: string }) => r.id === pack.current_revision_id,
  )!;
  await revisePack(p, pack.id, {
    ...base(),
    expected_version: pack.version,
    content: {
      ...content(),
      sections: {
        ...content().sections,
        scope: "SYN private successor sentinel",
      },
    },
  });
  const tech = await principal("assigned-technician");
  const detail = (await readPack(tech, pack.id)).items[0];
  const row = (await listPacks(tech)).items.find((r) => r.id === pack.id)!;
  assert(row);
  assert.equal(row.current_revision_id, detail.current_revision_id);
  assert.equal(row.current_revision_id, current.id);
  assert.equal(row.prepared_by, null);
  assert.equal(row.prepared_by_name, null);
  assert.equal(row.readiness, null);
  assert.equal(row.job_state, null);
  assert(!JSON.stringify(row).includes("private successor sentinel"));
  assert(!(await visitsWithoutPack(p)).items.some((v) => v.id === id("a8", 9)));
});
