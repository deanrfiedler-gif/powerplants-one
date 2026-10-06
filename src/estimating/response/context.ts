import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import {
  releaseAuthority,
  releaseHash,
  releaseHistory,
} from "../release/context";
import type { ResponseEvent } from "./model";
import { responseState } from "./model";
export function responseConflict(message: string): never {
  throw new AppError(409, "ResponseConflict", message);
}
export async function responseAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  write = false,
) {
  const context = await releaseAuthority(
    c,
    p,
    id,
    write ? "Prepare" : undefined,
  );
  const releases = await releaseHistory(c, p, context.q.quote_id);
  const issue = releases.events.find(
    (e) => e.revision_id === id && e.action === "Issue",
  );
  if (!issue || !context.base) throw unavailable();
  if (!issue.manifest || releaseHash(issue.manifest) !== issue.output_hash)
    responseConflict("Original issued manifest does not match its hash.");
  const currentIssue = releases.events
    .filter((e) => e.action === "Issue")
    .at(-1)!;
  return {
    ...context,
    base: context.base,
    issue,
    currentIssue,
    current: currentIssue.id === issue.id,
  };
}
export async function responseHistory(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const events = (
    await c.query<ResponseEvent>(
      "SELECT * FROM ppo.quote_response_events WHERE workspace_id=$1 AND revision_id=$2 ORDER BY sequence",
      [p.workspace_id, id],
    )
  ).rows;
  return { events, sequence: events.at(-1)?.sequence ?? 0 };
}
export async function responseReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<ResponseEvent>(
      "SELECT * FROM ppo.quote_response_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) throw unavailable();
  await responseAuthority(c, p, id, true);
  return e;
}
export async function responseContext(
  c: QueryClient,
  p: Principal,
  id: string,
) {
  const a = await responseAuthority(c, p, id),
    h = await responseHistory(c, p, id);
  return { ...a, ...h, state: responseState(h.events, a.current) };
}
