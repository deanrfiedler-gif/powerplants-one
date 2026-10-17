import { database } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { threadAccessSql } from "./access";

// T1-7: notices are a pull projection from the durable audit log, as projectActivityNotices does for Activities.
// The audit details carry identifiers only, so a notice records which event, thread and sequence, never message
// text. The recipient's current access to the thread is checked as the notice is made and again when it is read.
// The existing `Mentions` category is the producer-less category of the SH-03 inbox design. A person is not notified
// of their own message; a deadline step notifies the asked person or the asker whoever recorded it.
export async function projectConversationNotices(p: Principal) {
  const c = database();
  await requireCapability(c, p, "conversation.read");
  await c.query(
    `INSERT INTO ppo.notification_events(workspace_id,recipient_id,event_id,source_type,source_id,source_version,event_at,category,reason)
     SELECT e.workspace_id,$2::uuid,e.id,'Conversation',t.id,(e.details->>'sequence')::integer,e.occurred_at,'Mentions',
      CASE WHEN e.object_type='ConversationAsk' THEN CASE e.details->>'step' WHEN 'Remind' THEN 'Reminder' ELSE 'AskOverdue' END
       WHEN e.details->'asked' @> to_jsonb($2::text) THEN 'Ask' ELSE 'Mention' END
     FROM ppo.audit_events e JOIN ppo.conversation_threads t ON (t.workspace_id,t.id)=(e.workspace_id,(e.details->>'thread_id')::uuid)
     WHERE e.workspace_id=$1 AND e.outcome='Accepted' AND (e.actor_id<>$2::uuid OR e.object_type='ConversationAsk')
      AND ((e.object_type IN ('ConversationThread','ConversationMessage') AND (e.details->'asked' @> to_jsonb($2::text) OR e.details->'mentioned' @> to_jsonb($2::text)))
       OR (e.object_type='ConversationAsk' AND ((e.details->>'step'='Remind' AND e.details->>'asked_id'=$2::text) OR (e.details->>'step'='TellAsker' AND e.details->>'asker_id'=$2::text))))
      AND ${threadAccessSql("t", "conversation.read")}
     ON CONFLICT(workspace_id,recipient_id,event_id) DO NOTHING`,
    [p.workspace_id, p.actor_id],
  );
}

export type ConversationNotice = {
  id: string;
  event_at: string;
  thread_id: string;
  sequence: number | null;
  reason: "Mention" | "Ask" | "Reminder" | "AskOverdue";
  is_read: boolean;
  archived: boolean;
  category: "Mentions";
};
// The viewer's conversation notices, each joined to the thread under the viewer's present access. A notice for a
// thread the viewer can no longer read is not returned, so a lost record takes its notices with it.
export async function conversationNotices(p: Principal, limit = 100) {
  await projectConversationNotices(p);
  const rows = (
    await database().query(
      `SELECT n.id,n.event_at,n.source_id AS thread_id,n.source_version AS sequence,n.reason,coalesce(s.is_read,false) AS is_read,coalesce(s.archived,false) AS archived
       FROM ppo.notification_events n LEFT JOIN ppo.notification_states s ON (s.workspace_id,s.user_id,s.notification_id)=(n.workspace_id,n.recipient_id,n.id)
       JOIN ppo.conversation_threads t ON (t.workspace_id,t.id)=(n.workspace_id,n.source_id)
       WHERE n.workspace_id=$1 AND n.recipient_id=$2 AND n.source_type='Conversation' AND ${threadAccessSql("t", "conversation.read")}
       ORDER BY n.event_at DESC,n.id LIMIT $3`,
      [p.workspace_id, p.actor_id, Math.min(Math.max(limit, 1), 500)],
    )
  ).rows;
  return rows.map(
    (r): ConversationNotice => ({
      id: r.id,
      event_at: r.event_at.toISOString(),
      thread_id: r.thread_id,
      sequence: r.sequence,
      reason: r.reason,
      is_read: r.is_read,
      archived: r.archived,
      category: "Mentions",
    }),
  );
}
