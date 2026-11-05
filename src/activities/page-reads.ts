import type { QueryResult, QueryResultRow } from "pg";
import type { QueryClient } from "../platform/permissions";

// A list page has at most 100 rows. Keep the native source readers (and their
// authority checks), but send their independent SELECT lookups in batches on
// the page's one client. Deduplicate only requests waiting in this wave: no
// permission result is cached across awaits, pages or principals.
export function activityPageReads(client: QueryClient): QueryClient {
  type Pending = {
    values: unknown[];
    resolve: (result: QueryResult) => void;
    reject: (error: unknown) => void;
    promise: Promise<QueryResult>;
  };
  let pending = new Map<string, Map<string, Pending>>();
  let scheduled = false;
  async function flush() {
    while (pending.size) {
      const wave = pending;
      pending = new Map();
      for (const [sql, requests] of wave) {
        const entries = [...requests.values()];
        try {
          if (entries.length === 1) {
            entries[0].resolve(await client.query(sql, entries[0].values));
            continue;
          }
          const values: unknown[] = [];
          const parts = entries.map((request, index) => {
            const offset = values.length;
            values.push(...request.values);
            const query = sql.replace(
              /\$(\d+)/g,
              (_, n: string) => `$${Number(n) + offset}`,
            );
            return `SELECT ${index} AS __activity_page_slot, detail.* FROM (${query}) detail`;
          });
          const result = await client.query(parts.join(" UNION ALL "), values);
          const rows: QueryResultRow[][] = entries.map(() => []);
          for (const { __activity_page_slot: slot, ...row } of result.rows)
            rows[slot].push(row);
          entries.forEach((request, index) =>
            request.resolve({
              ...result,
              fields: result.fields.slice(1),
              rows: rows[index],
              rowCount: rows[index].length,
            }),
          );
        } catch (error) {
          entries.forEach((request) => request.reject(error));
        }
      }
    }
    scheduled = false;
  }
  // This private adapter supports only the text/value SELECT form used by the
  // detail's native readers. It cannot execute mutations or acquire a client.
  const query = (sql: string, values: unknown[] = []) => {
    if (typeof sql !== "string" || !/^\s*SELECT\b/i.test(sql))
      return Promise.reject(
        new Error("Activity page lookups must be SELECT reads."),
      );
    let requests = pending.get(sql);
    if (!requests) pending.set(sql, (requests = new Map()));
    const key = JSON.stringify(values);
    const existing = requests.get(key);
    if (existing) return existing.promise;
    let resolve!: Pending["resolve"], reject!: Pending["reject"];
    const promise = new Promise<QueryResult>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    requests.set(key, { values, resolve, reject, promise });
    if (!scheduled) {
      scheduled = true;
      setImmediate(() => {
        void flush();
      });
    }
    return promise;
  };
  return { query: query as QueryClient["query"] };
}
