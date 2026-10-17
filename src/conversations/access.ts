import type { Principal } from "../platform/identity";
import { unavailable } from "../platform/errors";
import { requireCapability, scopeSql, type QueryClient } from "../platform/permissions";
import { opportunityVisibility } from "../crm/context";
import { projectVisibility } from "../projects/visibility";
import type { AnchorType } from "./model";

export type ConversationCapability = "conversation.read" | "conversation.post";

// T1-1: a person reads a thread when they can read its anchor record and hold the conversation capability in
// that record's scope. Both facts are re-evaluated on every read, so a person who later loses the record loses
// the thread, with no stored copy of the record's content. SQL parameters follow scopeSql: $1 workspace, $2 person.
export function anchorAccessSql(
  type: string,
  id: string,
  workspace: string,
  capability: ConversationCapability,
) {
  return `((${type}='Opportunity' AND EXISTS(SELECT 1 FROM ppo.opportunities o WHERE o.workspace_id=${workspace} AND o.id=${id}
      AND ${opportunityVisibility("o")} AND ${scopeSql("o.company_id", "o.site_id", capability)}))
    OR (${type}='Project' AND EXISTS(SELECT 1 FROM ppo.projects pj WHERE pj.workspace_id=${workspace} AND pj.id=${id}
      AND ${projectVisibility("pj")} AND ${scopeSql("pj.company_id", "pj.site_id", capability)})))`;
}
export const threadAccessSql = (alias: string, capability: ConversationCapability) =>
  anchorAccessSql(`${alias}.anchor_type`, `${alias}.anchor_id`, `${alias}.workspace_id`, capability);

export type Anchor = {
  type: AnchorType;
  id: string;
  company_id: string;
  site_id: string | null;
  display_number: string;
  title: string;
};
export type ThreadRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  anchor_type: AnchorType;
  anchor_id: string;
  title: string;
  is_main: boolean;
  state: "Open" | "Resolved";
  version: number;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_by: string;
  created_at: Date;
};

// The actor opens the anchor record and holds the conversation capability there, else it is unavailable.
export async function readableAnchor(
  c: QueryClient,
  p: Principal,
  type: AnchorType,
  id: string,
  capability: ConversationCapability,
): Promise<Anchor> {
  await requireCapability(c, p, capability);
  const sql =
    type === "Opportunity"
      ? `SELECT o.company_id,o.site_id,o.display_number,o.title FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.id=$3 AND ${opportunityVisibility("o")} AND ${scopeSql("o.company_id", "o.site_id", capability)}`
      : `SELECT pj.company_id,pj.site_id,pj.display_number,pj.title FROM ppo.projects pj WHERE pj.workspace_id=$1 AND pj.id=$3 AND ${projectVisibility("pj")} AND ${scopeSql("pj.company_id", "pj.site_id", capability)}`;
  const row = (await c.query(sql, [p.workspace_id, p.actor_id, id])).rows[0];
  if (!row) throw unavailable();
  return { type, id, ...row };
}
// Can this person open the record? No conversation capability is required: used for `#` links, where the
// sender must be able to open what they link and each reader is shown the target from their own access.
export async function recordOpenable(
  c: QueryClient,
  workspace: string,
  person: string,
  type: AnchorType,
  id: string,
) {
  const sql =
    type === "Opportunity"
      ? `SELECT 1 FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.id=$3 AND ${opportunityVisibility("o")}`
      : `SELECT 1 FROM ppo.projects pj WHERE pj.workspace_id=$1 AND pj.id=$3 AND ${projectVisibility("pj")}`;
  return (await c.query(sql, [workspace, person, id])).rowCount !== 0;
}
// T1-3: only a person who can already read the record, and holds the read capability, can be tagged.
export async function personCanReadThread(
  c: QueryClient,
  workspace: string,
  person: string,
  type: AnchorType,
  id: string,
) {
  const active = await c.query("SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active", [workspace, person]);
  if (!active.rowCount) return false;
  const sql = `SELECT ${anchorAccessSql("$3::text", "$4::uuid", "$1", "conversation.read")} AS ok`;
  return (await c.query(sql, [workspace, person, type, id])).rows[0].ok === true;
}
export async function visibleThread(
  c: QueryClient,
  p: Principal,
  id: string,
  capability: ConversationCapability = "conversation.read",
  lock = false,
): Promise<ThreadRow> {
  await requireCapability(c, p, capability);
  const row = (
    await c.query<ThreadRow>(
      `SELECT t.* FROM ppo.conversation_threads t WHERE t.workspace_id=$1 AND t.id=$3 AND ${threadAccessSql("t", capability)}${lock ? " FOR UPDATE OF t" : ""}`,
      [p.workspace_id, p.actor_id, id],
    )
  ).rows[0];
  if (!row) throw unavailable();
  return row;
}
// A stored receipt names a thread, a message or an ask: disclose it only to a person who can still read the thread.
export async function conversationReceiptAuthority(
  c: QueryClient,
  p: Principal,
  objectType: string,
  recordId: string,
) {
  const thread =
    objectType === "ConversationThread"
      ? recordId
      : (
          await c.query(
            objectType === "ConversationMessage"
              ? "SELECT thread_id AS id FROM ppo.conversation_messages WHERE workspace_id=$1 AND id=$2"
              : "SELECT thread_id AS id FROM ppo.conversation_asks WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, recordId],
          )
        ).rows[0]?.id;
  if (!thread) throw unavailable();
  await visibleThread(c, p, thread);
}
