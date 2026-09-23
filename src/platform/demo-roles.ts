import type { QueryClient } from "./permissions";
import type { Principal } from "./identity";
import { tokenHash } from "./identity";
import { AppError } from "./errors";

export const packReviewerCapabilities = [
  "shared.read",
  "schedule.read",
  "service.work_order.read",
  "service.ticket.read",
  "pack.read",
  "pack.prepare",
  "pack.check",
] as const;

export const hostedRoleKeys = ["tester", "pack-reviewer"] as const;
export type HostedRoleKey = (typeof hostedRoleKeys)[number];

type Membership = {
  tenant_id: string;
  object_id: string;
  workspace_id: string;
  current_role: HostedRoleKey;
};

export async function readHostedMembership(
  client: QueryClient,
  token: string | undefined,
  tenant: string,
): Promise<Membership> {
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new AppError(401, "AuthenticationRequired", "Sign in to the private demo.");
  const result = await client.query(
    `SELECT t.tenant_id,t.object_id,t.workspace_id,'tester'::text AS current_role
     FROM ppo.sessions s JOIN ppo.demo_testers t ON (t.workspace_id,t.user_id)=(s.workspace_id,s.actor_id)
     JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
     WHERE s.token_hash=$1 AND s.expires_at>clock_timestamp() AND t.tenant_id=$2
       AND t.enabled AND t.expires_at>clock_timestamp() AND u.active AND u.issuer='PPO-EntraDemo'
     UNION ALL
     SELECT t.tenant_id,t.object_id,t.workspace_id,r.role_key AS current_role
     FROM ppo.sessions s JOIN ppo.demo_tester_roles r ON (r.workspace_id,r.user_id)=(s.workspace_id,s.actor_id)
     JOIN ppo.demo_testers t ON (t.tenant_id,t.object_id)=(r.tenant_id,r.object_id)
     JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id)
     WHERE s.token_hash=$1 AND s.expires_at>clock_timestamp() AND r.tenant_id=$2
       AND r.enabled AND r.expires_at>clock_timestamp() AND t.enabled AND t.expires_at>clock_timestamp()
       AND u.active AND u.issuer='PPO-EntraDemoRole'`,
    [tokenHash(token), tenant],
  );
  if (result.rowCount !== 1)
    throw new AppError(401, "AuthenticationRequired", "Your demo access has expired or been removed. Sign in again or contact the demo owner.");
  return result.rows[0] as Membership;
}

export async function readHostedRoles(
  client: QueryClient,
  token: string | undefined,
  tenant: string,
) {
  const current = await readHostedMembership(client, token, tenant);
  const roles = await client.query(
    `SELECT role_key FROM ppo.demo_tester_roles r JOIN ppo.users u
       ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id)
     WHERE r.tenant_id=$1 AND r.object_id=$2 AND r.workspace_id=$3
       AND r.enabled AND r.expires_at>clock_timestamp() AND u.active
     ORDER BY role_key`,
    [current.tenant_id, current.object_id, current.workspace_id],
  );
  return {
    current: current.current_role,
    available: ["tester", ...roles.rows.map((row) => row.role_key)] as HostedRoleKey[],
  };
}

export async function switchHostedRole(
  client: QueryClient,
  token: string | undefined,
  tenant: string,
  role: HostedRoleKey,
): Promise<Principal> {
  if (!hostedRoleKeys.includes(role))
    throw new AppError(422, "InvalidRole", "Choose an available hosted demonstration role.");
  const current = await readHostedMembership(client, token, tenant);
  const target = role === "tester"
    ? await client.query(
        `SELECT u.id,u.workspace_id,u.display_name FROM ppo.demo_testers t
         JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
         WHERE t.tenant_id=$1 AND t.object_id=$2 AND t.workspace_id=$3
           AND t.enabled AND t.expires_at>clock_timestamp() AND u.active AND u.issuer='PPO-EntraDemo'`,
        [current.tenant_id, current.object_id, current.workspace_id],
      )
    : await client.query(
        `SELECT u.id,u.workspace_id,u.display_name FROM ppo.demo_tester_roles r
         JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.user_id)
         WHERE r.tenant_id=$1 AND r.object_id=$2 AND r.workspace_id=$3 AND r.role_key=$4
           AND r.enabled AND r.expires_at>clock_timestamp() AND u.active AND u.issuer='PPO-EntraDemoRole'`,
        [current.tenant_id, current.object_id, current.workspace_id, role],
      );
  const user = target.rows[0];
  if (!user)
    throw new AppError(403, "RoleUnavailable", "This hosted demonstration role is unavailable.");
  const switched = await client.query(
    "UPDATE ppo.sessions SET actor_id=$2 WHERE token_hash=$1 AND expires_at>clock_timestamp()",
    [tokenHash(token!), user.id],
  );
  if (switched.rowCount !== 1)
    throw new AppError(401, "AuthenticationRequired", "Your demo session expired before the role could be changed.");
  await client.query(
    "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES(gen_random_uuid(),$1,$2,'Session',$2,'Accepted','Hosted demo role selected',$3)",
    [user.workspace_id, user.id, { role }],
  );
  return { actor_id: user.id, workspace_id: user.workspace_id, display_name: user.display_name };
}
