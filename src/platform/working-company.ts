import { AsyncLocalStorage } from "node:async_hooks";
import type { Principal } from "./identity";
import type { QueryClient } from "./permissions";

// NR-18: the company a signed-in person has chosen to work in, for the current request only.
// The servers open an empty scope for each request; resolving the identity fills it. It narrows
// record access and never widens it. Each scope names its actor, so a check for anyone else is
// unaffected. Code outside a request (jobs, seeds, tests) has no scope and sees no narrowing.
// Next's development bundler can load another copy of this module, so the storage is shared
// through a process-wide key, as the proof diagnostics do.
type Store = { actor_id?: string; company_id?: string };
const scopeKey = Symbol.for("ppo.working-company.v1");
const shared = globalThis as typeof globalThis & { [scopeKey]?: AsyncLocalStorage<Store> };
const storage = shared[scopeKey] ??= new AsyncLocalStorage<Store>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const valid = (actor_id: string, company_id: string | null) =>
  company_id && uuid.test(actor_id) && uuid.test(company_id) ? { actor_id, company_id } : {};

export function withRequestScope<T>(work: () => T): T {
  return storage.run({}, work);
}
export function enterWorkingCompany(actor_id: string, company_id: string | null) {
  const current = storage.getStore();
  if (!current) return;
  delete current.actor_id;
  delete current.company_id;
  Object.assign(current, valid(actor_id, company_id));
}
export function withWorkingCompany<T>(actor_id: string, company_id: string | null, work: () => T): T {
  return storage.run(valid(actor_id, company_id), work);
}
export function workingCompanyFor(actor_id: string) {
  const current = storage.getStore();
  return current?.company_id && current.actor_id === actor_id ? current.company_id : null;
}
// A condition for scopeSql, whose grant alias g belongs to the $2 actor. Both values are
// validated UUIDs, never request text.
export function workingCompanyCondition(company: string) {
  const current = storage.getStore();
  return current?.actor_id && current.company_id
    ? `\n    AND (g.user_id<>'${current.actor_id}'::uuid OR ${company} IS NULL OR ${company}='${current.company_id}'::uuid)`
    : "";
}
// The stored choice, only while the person's current grants still reach that company. A schema
// without the table (older installations) has no choice.
export async function loadWorkingCompany(client: QueryClient, p: Principal) {
  try {
    const result = await client.query<{ company_id: string }>(
      `SELECT w.company_id FROM ppo.working_companies w
       WHERE w.workspace_id=$1 AND w.user_id=$2 AND EXISTS(
         SELECT 1 FROM ppo.permission_grants g JOIN ppo.users u ON (u.workspace_id,u.id)=(g.workspace_id,g.user_id)
         WHERE g.workspace_id=w.workspace_id AND g.user_id=w.user_id AND u.active
         AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp())
         AND (g.scope_type='Workspace' OR g.company_id=w.company_id))`,
      [p.workspace_id, p.actor_id],
    );
    return result.rows[0]?.company_id ?? null;
  } catch (error) {
    if ((error as { code?: string }).code === "42P01") return null;
    throw error;
  }
}
