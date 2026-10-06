import { createHash } from "node:crypto";
import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import { responseAuthority } from "../response/context";
// Only explicitly bounded, workspace-locked reads get this temporary client.
// Never attach authority state to a pooled connection or use this in mutation.
const sourceReads = new WeakMap<
  QueryClient,
  {
    workspace: string;
    actor: string;
    revisions: Set<string>;
  }
>();
export async function conversionReadClient(
  c: QueryClient,
  p: Principal,
): Promise<QueryClient> {
  const layout = (
    await c.query(
      `SELECT md5(coalesce(string_agg(concat_ws(':',r.oid,a.attnum,a.attname,a.atttypid,a.atttypmod,a.attcollation),',' ORDER BY r.oid,a.attnum),'')) AS layout
       FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_class r ON r.relnamespace=n.oid
       JOIN pg_catalog.pg_attribute a ON a.attrelid=r.oid
       WHERE n.nspname='ppo' AND r.relkind IN ('r','p','v','m','f','c')
       AND a.attnum>0 AND NOT a.attisdropped`,
    )
  ).rows[0].layout;
  // Reuse SQL parsing/plans, never results. Every execution still evaluates
  // current parameters, authority and clock_timestamp() on PostgreSQL.
  // Actual relation layouts separate result shapes, including reserved-gap
  // upgrades and rebuilt schemas. Catalog metadata needs no ledger privilege.
  const names = new Map<string, string>();
  const read: QueryClient = {
    query: ((...args: unknown[]) => {
      const [sql, values] = args;
      if (
        typeof sql !== "string" ||
        !/^\s*SELECT\b/i.test(sql) ||
        args.length > 2 ||
        (values !== undefined && !Array.isArray(values))
      )
        return Reflect.apply(c.query, c, args);
      let name = names.get(sql);
      if (!name) {
        name = `ppo-es07-${createHash("sha256").update(layout).update("\n").update(sql).digest("hex").slice(0, 48)}`;
        names.set(sql, name);
      }
      return c.query({ name, text: sql, values });
    }) as QueryClient["query"],
  };
  sourceReads.set(read, {
    workspace: p.workspace_id,
    actor: p.actor_id,
    revisions: new Set(),
  });
  return read;
}
// Native target routes and their original receipts cannot bypass the source's current authority.
export async function conversionSourceAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.quote_conversion_targets') present",
      )
    ).rows[0].present
  )
    return;
  const link = (
    await c.query(
      "SELECT revision_id FROM ppo.quote_conversion_targets WHERE workspace_id=$1 AND target_id=$2",
      [p.workspace_id, target],
    )
  ).rows[0];
  if (link) {
    const scope = sourceReads.get(c);
    const sameActor =
      scope?.workspace === p.workspace_id && scope.actor === p.actor_id;
    if (!sameActor || !scope.revisions.has(link.revision_id)) {
      await responseAuthority(c, p, link.revision_id);
      if (sameActor) scope.revisions.add(link.revision_id);
    }
  }
}
