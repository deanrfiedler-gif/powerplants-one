import { createHash, randomBytes } from "node:crypto";
import { database, transaction } from "./database";
import { localConfig } from "./config";
import { AppError } from "./errors";
export const sessionCookie = "ppo_local_session";
export async function endSession(token:string|undefined) {
  if(token) await database().query("DELETE FROM ppo.sessions WHERE token_hash=$1",[tokenHash(token)]);
}
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export type Principal = {
  actor_id: string;
  workspace_id: string;
  display_name: string;
};
// Opaque sessions resolve actual users and grants on the server. Profile keys are a local demo choice only.
export async function createSession(profile: string, previous_token?: string) {
  localConfig();
  if (
    ![
      "coordinator",
      "observer",
      "systems",
      "other-workspace",
      "site-observer",
      "technician",
      "assigned-technician",
      "second-technician",
      "finance",
      "second-company",
      "workspace-observer",
    ].includes(profile)
  )
    throw new AppError(
      422,
      "InvalidProfile",
      "Choose an available demonstration identity.",
    );
  const token = randomBytes(32).toString("hex");
  return transaction(async (client) => {
    const result = await client.query(
      "SELECT id, workspace_id, display_name FROM ppo.users WHERE subject_id=$1 AND issuer=$2 AND active",
      [profile, "PPO-LocalSynthetic"],
    );
    const user = result.rows[0];
    if (!user)
      throw new AppError(
        503,
        "FixturesUnavailable",
        "Run the synthetic database setup.",
      );
    if (previous_token)
      await client.query("DELETE FROM ppo.sessions WHERE token_hash=$1", [
        tokenHash(previous_token),
      ]);
    await client.query(
      "INSERT INTO ppo.sessions(token_hash,workspace_id,actor_id,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '8 hours')",
      [tokenHash(token), user.workspace_id, user.id],
    );
    await client.query(
      "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES(gen_random_uuid(),$1,$2,'Session',$2,'Accepted','Local synthetic identity selected',$3)",
      [user.workspace_id, user.id, { profile }],
    );
    return {
      token,
      principal: {
        actor_id: user.id,
        workspace_id: user.workspace_id,
        display_name: user.display_name,
      } as Principal,
    };
  });
}
export async function resolveIdentity(
  token: string | undefined,
): Promise<Principal> {
  localConfig();
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new AppError(
      401,
      "AuthenticationRequired",
      "Choose a local demonstration identity.",
    );
  const result = await database().query(
    `SELECT u.id AS actor_id,u.workspace_id,u.display_name
    FROM ppo.sessions s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.actor_id)
    WHERE s.token_hash=$1 AND s.expires_at>clock_timestamp() AND u.active`,
    [tokenHash(token)],
  );
  if (!result.rows[0])
    throw new AppError(
      401,
      "AuthenticationRequired",
      "Your local session has expired. Choose an identity again.",
    );
  return result.rows[0];
}
