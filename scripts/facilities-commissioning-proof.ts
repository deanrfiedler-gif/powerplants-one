import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";
import { createSession } from "../src/platform/identity";
import {
  addAssetServedFacility,
  reviseFacilityDetails,
} from "../src/shared/facilities/commands";
import { facilityWorkspace } from "../src/shared/facilities/reads";
import {
  commissioningScenarioIds,
  seedCommissioningScenario,
} from "../tests/helpers/engineering-commissioning";
import type { SignIn, Call } from "../tests/helpers/engineering-materials";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Synthetic test database only");
const origin = localConfig().origin;
const signIn: SignIn = async (profile) => {
  const session = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(session.status, 200);
  const cookie = session.headers.get("set-cookie")!.split(";")[0];
  const call: Call = async (path, body) => {
    const r = await fetch(`${origin}/api/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: { origin, cookie, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, body: await r.json() };
  };
  return call;
};
try {
  const built = await seedCommissioningScenario(
    signIn,
    commissioningScenarioIds(false),
  );
  const capture = async () =>
    (
      await database().query(
        "SELECT to_jsonb(r) AS row FROM ppo.commissioning_releases r WHERE state='Issued' ORDER BY id",
      )
    ).rows;
  const before = await capture();
  assert.ok(
    before.length >= 2,
    "Proof requires actual issued synthetic releases, not an empty table",
  );
  const p = (await createSession("coordinator")).principal;
  const facility = "c5050002-0000-4000-8000-000000000001",
    f = await facilityWorkspace(p, facility);
  const base = () => ({
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN CS-05 preservation of issued commissioning basis",
  });
  await reviseFacilityDetails(p, facility, {
    ...base(),
    expected_version: f.version,
    changes: {
      structure_type: f.details.structure_type,
      detail_notes: `SYN independent metadata observation ${randomUUID()}`,
    },
  });
  const pump = "c5050003-0000-4000-8000-000000000001",
    asset = (
      await database().query("SELECT version FROM ppo.assets WHERE id=$1", [
        pump,
      ])
    ).rows[0];
  await addAssetServedFacility(p, pump, {
    ...base(),
    expected_version: asset.version,
    facility_id: "c5050002-0000-4000-8000-000000000005",
    source: {
      kind: "reported_note",
      title: "SYN explicit pump service observation",
    },
  });
  const after = await capture();
  assert.deepEqual(after, before);
  const hash = (v: unknown) =>
    createHash("sha256").update(JSON.stringify(v)).digest("hex");
  const result = {
    case: "CS05-T50",
    at: new Date().toISOString(),
    package_id: built.package_id,
    issued_releases: before.length,
    before_sha256: hash(before),
    after_sha256: hash(after),
    result:
      "Exact issued release rows, manifests, approval source state and hashes unchanged after canonical Facility edit and explicit service-link addition",
    boundary:
      "Existing EN-08 free-text served areas remain independent; no inferred canonical relationship or technical acceptance",
  };
  await writeFile(
    process.env.PPO_FACILITIES_COMMISSIONING_EVIDENCE ??
      "verification-evidence/facilities-commissioning.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} finally {
  await closeDatabase();
}
