import { createHash, randomBytes } from "node:crypto";
import * as oidc from "openid-client";
import { database, transaction } from "./database";
import { demoConfig } from "./demo-config";
import { AppError } from "./errors";
import type { PoolClient } from "pg";

export const loginCookie = "__Host-ppo_demo_login";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
let discovery: Promise<oidc.Configuration> | undefined;
async function client() {
  const c = demoConfig();
  discovery ??= oidc.discovery(new URL(`https://login.microsoftonline.com/${c.tenant_id}/v2.0`),
    c.client_id, c.client_secret).then(config => {
      oidc.enableNonRepudiationChecks(config);
      return config;
    }).catch(error => { discovery = undefined; throw error; });
  return discovery;
}

export function verifiedDemoObject(claims: Record<string, unknown>, tenant: string): string {
  if (claims.iss !== `https://login.microsoftonline.com/${tenant}/v2.0` || claims.tid !== tenant ||
      typeof claims.oid !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.oid))
    throw new AppError(403, "DemoAccessDenied", "This account cannot access the private demo.");
  return claims.oid.toLowerCase();
}

export async function beginDemoLogin() {
  const config = await client(), c = demoConfig();
  const token = randomBytes(32).toString("hex"), state = oidc.randomState(), nonce = oidc.randomNonce();
  const verifier = oidc.randomPKCECodeVerifier();
  await transaction(async db => {
    await db.query("DELETE FROM ppo.demo_login_attempts WHERE expires_at<=clock_timestamp()");
    await db.query("INSERT INTO ppo.demo_login_attempts VALUES($1,$2,$3,$4,clock_timestamp()+interval '10 minutes')",
      [hash(token), state, nonce, verifier]);
  });
  const url = oidc.buildAuthorizationUrl(config, {
    redirect_uri: `${c.origin}/auth/callback`, scope: "openid profile", response_mode: "query",
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier), code_challenge_method: "S256", state, nonce,
    prompt: "select_account",
  });
  return { token, url: url.href };
}

export async function finishDemoLogin(url: URL, loginToken: string | undefined, previousToken?: string) {
  if (!loginToken || !/^[a-f0-9]{64}$/.test(loginToken)) throw new AppError(401, "LoginExpired", "Start sign-in again.");
  // Consume before exchange so a callback cannot be replayed.
  const attempt = await database().query(
    "DELETE FROM ppo.demo_login_attempts WHERE token_hash=$1 AND expires_at>clock_timestamp() RETURNING state,nonce,verifier",
    [hash(loginToken)],
  );
  const a = attempt.rows[0];
  if (!a) throw new AppError(401, "LoginExpired", "Start sign-in again.");
  const config = await client(), c = demoConfig();
  const tokens = await exchangeDemoAuthorization(config, url, {
    expectedState: a.state, expectedNonce: a.nonce, pkceCodeVerifier: a.verifier, idTokenExpected: true,
  });
  const claims = tokens.claims();
  if (!claims) throw new AppError(401, "AuthenticationRequired", "Start sign-in again.");
  const objectId = verifiedDemoObject(claims, c.tenant_id);
  return transaction(db => createInvitedSession(db, c.tenant_id, objectId, previousToken));
}

export async function createInvitedSession(db: PoolClient, tenant: string, objectId: string, previousToken?: string) {
  const token = randomBytes(32).toString("hex");
  // Share the operator's mapping lock without requiring UPDATE on access tables.
  await db.query("SELECT pg_advisory_xact_lock(10001)");
  const result = await db.query(
    `SELECT u.id,u.workspace_id FROM ppo.demo_testers t JOIN ppo.users u ON (u.workspace_id,u.id)=(t.workspace_id,t.user_id)
     WHERE t.tenant_id=$1 AND t.object_id=$2 AND t.enabled AND t.expires_at>clock_timestamp()
     AND u.active AND u.issuer='PPO-EntraDemo'`, [tenant, objectId]);
  const user = result.rows[0];
  if (!user) throw new AppError(403, "DemoAccessDenied", "Ask the demo owner to add your account to the tester list.");
  if (previousToken) await db.query("DELETE FROM ppo.sessions WHERE token_hash=$1", [hash(previousToken)]);
  await db.query("INSERT INTO ppo.sessions VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')", [hash(token), user.workspace_id, user.id]);
  await db.query("INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES(gen_random_uuid(),$1,$2,'Session',$2,'Accepted','Invited demo tester signed in','{}')", [user.workspace_id, user.id]);
  return token;
}

export async function exchangeDemoAuthorization(config: oidc.Configuration, url: URL, checks: Parameters<typeof oidc.authorizationCodeGrant>[2]) {
  try {
    return await oidc.authorizationCodeGrant(config, url, checks);
  } catch (error) {
    // The library validates state before classifying an authorization error.
    // Never interpret raw callback descriptions or state/nonce failures as cancellation.
    if (error instanceof oidc.AuthorizationResponseError && error.error === "access_denied")
      throw new AppError(401, "LoginCancelled", "Sign-in was cancelled.");
    throw error;
  }
}
