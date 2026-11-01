import { randomUUID } from "node:crypto";
import { transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { id } from "./packs";

// New v3 journeys need dates inside the real confirmation window. Give each
// independent fixture its own synthetic resources, retaining the seeded users,
// published calendar and verified skill evidence. Existing resources and their
// reservations remain untouched; no production source or clock is overridden.
export async function siteReadinessFixtureCrew() {
  // Browser workers do not inherit the server launcher's env-file loading.
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable test database only");
  return transaction(async (c) => {
    const ids: string[] = [];
    for (const n of [9, 2]) {
      const resource = randomUUID();
      ids.push(resource);
      await c.query(
        `INSERT INTO ppo.resources SELECT (jsonb_populate_record(NULL::ppo.resources,
        to_jsonb(r)||jsonb_build_object('id',$1::text,'status','Draft','name','SYN isolated readiness crew '||$1::text))).*
        FROM ppo.resources r WHERE id=$2`,
        [resource, id("a4", n)],
      );
      await c.query(
        `INSERT INTO ppo.resource_sites SELECT workspace_id,company_id,site_id,$1
        FROM ppo.resource_sites WHERE resource_id=$2`,
        [resource, id("a4", n)],
      );
      const evidence = (
        await c.query(
          "SELECT * FROM ppo.resource_evidence WHERE resource_id=$1",
          [id("a4", n)],
        )
      ).rows;
      const evidenceIds = new Map<string, string>();
      for (const row of evidence) {
        const copy = randomUUID();
        evidenceIds.set(row.id, copy);
        await c.query(
          `INSERT INTO ppo.resource_evidence SELECT (jsonb_populate_record(NULL::ppo.resource_evidence,
          to_jsonb(e)||jsonb_build_object('id',$1::text,'resource_id',$2::text))).*
          FROM ppo.resource_evidence e WHERE id=$3`,
          [copy, resource, row.id],
        );
      }
      for (const row of (
        await c.query("SELECT * FROM ppo.skill_evidence WHERE resource_id=$1", [
          id("a4", n),
        ])
      ).rows)
        await c.query(
          `INSERT INTO ppo.skill_evidence SELECT (jsonb_populate_record(NULL::ppo.skill_evidence,
          to_jsonb(s)||jsonb_build_object('id',$1::text,'resource_id',$2::text,'evidence_ref',$3::text))).*
          FROM ppo.skill_evidence s WHERE id=$4`,
          [
            randomUUID(),
            resource,
            row.evidence_ref ? evidenceIds.get(row.evidence_ref) : null,
            row.id,
          ],
        );
      await c.query("UPDATE ppo.resources SET status='Published' WHERE id=$1", [
        resource,
      ]);
    }
    return ids;
  });
}
