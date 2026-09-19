import { randomUUID } from "node:crypto";
import type pg from "pg";
import { packReviewerCapabilities } from "../src/platform/demo-roles";
import { demoCompany, demoWorkspace } from "./demo-runtime";

export async function ensurePackReviewer(
  c: pg.PoolClient,
  tenant: string,
  objectId: string,
  expiresAt: string | Date,
) {
  const subject = `${tenant}/${objectId}/pack-reviewer`;
  const user = await c.query(
    `INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name)
     VALUES($1,$2,'PPO-EntraDemoRole',$3,'SYN Hosted Pack Reviewer')
     ON CONFLICT(issuer,subject_id) DO UPDATE SET active=true RETURNING id`,
    [randomUUID(), demoWorkspace, subject],
  );
  const id = user.rows[0].id;
  await c.query("UPDATE ppo.users SET display_name=$2 WHERE id=$1", [id, `SYN Pack reviewer ${id.slice(0, 6)}`]);
  await c.query(
    `INSERT INTO ppo.demo_tester_roles(tenant_id,object_id,role_key,workspace_id,user_id,enabled,expires_at)
     VALUES($1,$2,'pack-reviewer',$3,$4,true,$5)
     ON CONFLICT(tenant_id,object_id,role_key) DO UPDATE
       SET enabled=true,expires_at=excluded.expires_at`,
    [tenant, objectId, demoWorkspace, id, expiresAt],
  );
  await c.query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2", [demoWorkspace, id]);
  for (const capability of packReviewerCapabilities) await c.query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_id,valid_to) VALUES($1,$2,$3,$4,$3,$5)",
    [demoWorkspace, id, demoCompany, capability, expiresAt],
  );
  return id as string;
}
