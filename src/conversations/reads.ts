import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { requireCapability } from "../platform/permissions";
import { opportunityVisibility } from "../crm/context";
import { projectVisibility } from "../projects/visibility";
import { uuid } from "../shared/validation";
import { anchorInput, listInput } from "./validation";
import {
  personCanReadThread,
  readableAnchor,
  recordOpenable,
  threadAccessSql,
  visibleThread,
} from "./access";
import type { AnchorType } from "./model";

const iso = (value: Date | null) => (value ? value.toISOString() : null);
// The anchor's own number and title. Reaching the thread already means the reader can open the record.
const anchorSql = `LEFT JOIN LATERAL (
  SELECT o.display_number,o.title FROM ppo.opportunities o WHERE t.anchor_type='Opportunity' AND o.workspace_id=t.workspace_id AND o.id=t.anchor_id
  UNION ALL SELECT pj.display_number,pj.title FROM ppo.projects pj WHERE t.anchor_type='Project' AND pj.workspace_id=t.workspace_id AND pj.id=t.anchor_id
 ) a ON true`;

export type ThreadSummary = {
  id: string;
  title: string;
  anchor: { type: AnchorType; id: string; display_number: string; title: string };
  is_main: boolean;
  state: "Open" | "Resolved";
  version: number;
  last_sequence: number;
  last_message_at: string | null;
  participating: boolean;
  unread: boolean;
  waiting_on_you: number;
  mentions_you: boolean;
};

// The sidebar (threads the viewer takes part in) or, with an anchor, every thread the viewer can read on that record
// (the record page, Q4). Threads on records the viewer cannot open are never counted or named.
export async function listThreads(p: Principal, value: unknown = {}) {
  const q = listInput(value);
  return transaction(async (c) => {
    await requireCapability(c, p, "conversation.read");
    const rows = (
      await c.query(
        `SELECT t.id,t.title,t.anchor_type,t.anchor_id,t.is_main,t.state,t.version,t.created_at,a.display_number,a.title AS anchor_title,
          coalesce(m.last_sequence,0) AS last_sequence,m.last_at,part.user_id IS NOT NULL AS participating,coalesce(part.last_read_sequence,0) AS last_read_sequence,
          coalesce(w.n,0) AS waiting,coalesce(mn.n,0) AS mentioned
         FROM ppo.conversation_threads t ${anchorSql}
         LEFT JOIN LATERAL (SELECT max(sequence) AS last_sequence,max(created_at) AS last_at FROM ppo.conversation_messages x WHERE x.workspace_id=t.workspace_id AND x.thread_id=t.id) m ON true
         LEFT JOIN ppo.conversation_participants part ON (part.workspace_id,part.thread_id,part.user_id)=(t.workspace_id,t.id,$2)
         LEFT JOIN LATERAL (SELECT count(*) AS n FROM ppo.conversation_asks k WHERE k.workspace_id=t.workspace_id AND k.thread_id=t.id AND k.asked_id=$2 AND k.state='Open') w ON true
         LEFT JOIN LATERAL (SELECT count(*) AS n FROM ppo.conversation_mentions mm JOIN ppo.conversation_messages mx ON (mx.workspace_id,mx.id)=(mm.workspace_id,mm.message_id)
           WHERE mx.workspace_id=t.workspace_id AND mx.thread_id=t.id AND mm.kind='Person' AND mm.person_id=$2) mn ON true
         WHERE t.workspace_id=$1 AND ${threadAccessSql("t", "conversation.read")}
          AND ($3::text IS NULL OR (t.anchor_type=$3 AND t.anchor_id=$4::uuid))
          AND ($3::text IS NOT NULL OR part.user_id IS NOT NULL)
          AND ($5='All' OR ($5='WaitingOnYou' AND coalesce(w.n,0)>0) OR ($5='Mentions' AND coalesce(mn.n,0)>0))
         ORDER BY coalesce(m.last_at,t.created_at) DESC,t.id LIMIT $6`,
        [p.workspace_id, p.actor_id, q.anchor?.type ?? null, q.anchor?.id ?? null, q.filter, q.limit],
      )
    ).rows;
    const items: ThreadSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      anchor: { type: r.anchor_type, id: r.anchor_id, display_number: r.display_number, title: r.anchor_title },
      is_main: r.is_main,
      state: r.state,
      version: r.version,
      last_sequence: Number(r.last_sequence),
      last_message_at: iso(r.last_at),
      participating: r.participating,
      unread: r.participating && Number(r.last_sequence) > Number(r.last_read_sequence),
      waiting_on_you: Number(r.waiting),
      mentions_you: Number(r.mentioned) > 0,
    }));
    return { items, count: items.length };
  });
}

// D7: the badge counts threads the viewer takes part in that hold a message they have not read, which covers
// mentions, asks and replies alike. Cards waiting for approval join it at T7.
export async function conversationBadge(p: Principal) {
  return transaction(async (c) => {
    await requireCapability(c, p, "conversation.read");
    const row = (
      await c.query(
        `SELECT count(*) AS n FROM ppo.conversation_threads t
         JOIN ppo.conversation_participants part ON (part.workspace_id,part.thread_id,part.user_id)=(t.workspace_id,t.id,$2)
         WHERE t.workspace_id=$1 AND ${threadAccessSql("t", "conversation.read")}
          AND coalesce((SELECT max(sequence) FROM ppo.conversation_messages x WHERE x.workspace_id=t.workspace_id AND x.thread_id=t.id),0)>part.last_read_sequence`,
        [p.workspace_id, p.actor_id],
      )
    ).rows[0];
    return { unread_threads: Number(row.n) };
  });
}

// One thread with its messages, participants, asks and mentions drawn for this reader (T1-4): a record the reader
// cannot open carries no type, ID, number or title.
export async function readThread(p: Principal, id: string) {
  return transaction(async (c) => {
    const t = await visibleThread(c, p, uuid(id, "thread_id"));
    const anchor = (
      await c.query(
        t.anchor_type === "Opportunity"
          ? "SELECT display_number,title FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2"
          : "SELECT display_number,title FROM ppo.projects WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, t.anchor_id],
      )
    ).rows[0];
    const participants = (
      await c.query(
        `SELECT part.user_id,u.display_name,part.role,part.last_read_sequence FROM ppo.conversation_participants part
         JOIN ppo.users u ON (u.workspace_id,u.id)=(part.workspace_id,part.user_id)
         WHERE part.workspace_id=$1 AND part.thread_id=$2 ORDER BY part.added_at,part.user_id`,
        [p.workspace_id, t.id],
      )
    ).rows;
    const messages = (
      await c.query(
        `SELECT m.id,m.sequence,m.author_id,u.display_name AS author_name,m.body,m.created_at FROM ppo.conversation_messages m
         JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.author_id)
         WHERE m.workspace_id=$1 AND m.thread_id=$2 ORDER BY m.sequence`,
        [p.workspace_id, t.id],
      )
    ).rows;
    const mentionRows = (
      await c.query(
        `SELECT mm.message_id,mm.ordinal,mm.kind,mm.person_id,pu.display_name AS person_name,mm.record_type,mm.record_id
         FROM ppo.conversation_mentions mm JOIN ppo.conversation_messages mx ON (mx.workspace_id,mx.id)=(mm.workspace_id,mm.message_id)
         LEFT JOIN ppo.users pu ON (pu.workspace_id,pu.id)=(mm.workspace_id,mm.person_id)
         WHERE mm.workspace_id=$1 AND mx.thread_id=$2 ORDER BY mm.message_id,mm.ordinal`,
        [p.workspace_id, t.id],
      )
    ).rows;
    const openable = new Map<string, { display_number: string; title: string } | null>();
    const drawn = new Map<string, unknown[]>();
    for (const m of mentionRows) {
      let entry: unknown;
      if (m.kind === "Person") entry = { ordinal: m.ordinal, kind: "Person", person_id: m.person_id, display_name: m.person_name };
      else {
        const key = `${m.record_type}:${m.record_id}`;
        if (!openable.has(key)) {
          const can = await recordOpenable(c, p.workspace_id, p.actor_id, m.record_type, m.record_id);
          openable.set(
            key,
            can
              ? (
                  await c.query(
                    m.record_type === "Opportunity"
                      ? "SELECT display_number,title FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2"
                      : "SELECT display_number,title FROM ppo.projects WHERE workspace_id=$1 AND id=$2",
                    [p.workspace_id, m.record_id],
                  )
                ).rows[0]
              : null,
          );
        }
        const found = openable.get(key);
        entry = found
          ? { ordinal: m.ordinal, kind: "Record", can_open: true, record_type: m.record_type, record_id: m.record_id, ...found }
          : { ordinal: m.ordinal, kind: "Record", can_open: false };
      }
      drawn.set(m.message_id, [...(drawn.get(m.message_id) ?? []), entry]);
    }
    const asks = (
      await c.query(
        `SELECT k.id,k.message_id,k.ordinal,k.asker_id,ar.display_name AS asker_name,k.asked_id,ad.display_name AS asked_name,k.question,k.reply_by::text AS reply_by,
          k.state,k.version,k.closed_at,k.closing_message_id,k.reminded_at,k.asker_told_at
         FROM ppo.conversation_asks k JOIN ppo.users ar ON (ar.workspace_id,ar.id)=(k.workspace_id,k.asker_id)
         JOIN ppo.users ad ON (ad.workspace_id,ad.id)=(k.workspace_id,k.asked_id)
         WHERE k.workspace_id=$1 AND k.thread_id=$2 ORDER BY k.created_at,k.id`,
        [p.workspace_id, t.id],
      )
    ).rows;
    return {
      id: t.id,
      title: t.title,
      state: t.state,
      version: t.version,
      is_main: t.is_main,
      anchor: { type: t.anchor_type, id: t.anchor_id, ...anchor },
      created_by: t.created_by,
      created_at: t.created_at.toISOString(),
      resolved_at: iso(t.resolved_at),
      participants: participants.map((r) => ({
        user_id: r.user_id,
        display_name: r.display_name,
        role: r.role,
        last_read_sequence: r.last_read_sequence,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        sequence: m.sequence,
        author_id: m.author_id,
        author_name: m.author_name,
        body: m.body,
        created_at: m.created_at.toISOString(),
        mentions: drawn.get(m.id) ?? [],
      })),
      asks: asks.map((k) => ({
        id: k.id,
        message_id: k.message_id,
        ordinal: k.ordinal,
        asker_id: k.asker_id,
        asker_name: k.asker_name,
        asked_id: k.asked_id,
        asked_name: k.asked_name,
        question: k.question,
        reply_by: k.reply_by,
        state: k.state,
        version: k.version,
        closed_at: iso(k.closed_at),
        closing_message_id: k.closing_message_id,
        reminded_at: iso(k.reminded_at),
        asker_told_at: iso(k.asker_told_at),
      })),
    };
  });
}

// T1-3: the `@` picker lists only people who can already read the record and hold the read capability.
export async function mentionablePeople(p: Principal, value: unknown) {
  const anchor = anchorInput(value);
  return transaction(async (c) => {
    await readableAnchor(c, p, anchor.type, anchor.id, "conversation.post");
    const candidates = (
      await c.query(
        `SELECT u.id,u.display_name FROM ppo.users u WHERE u.workspace_id=$1 AND u.active AND u.id<>$2
         AND EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=u.workspace_id AND g.user_id=u.id AND g.capability='conversation.read'
          AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()))
         ORDER BY u.display_name,u.id LIMIT 200`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    const items: { id: string; display_name: string }[] = [];
    for (const u of candidates)
      if (await personCanReadThread(c, p.workspace_id, u.id, anchor.type, anchor.id)) items.push({ id: u.id, display_name: u.display_name });
    return { items };
  });
}

// The `#` picker: deals and projects the sender can open, matched on number or title.
export async function linkableRecords(p: Principal, value: unknown = {}) {
  const text = typeof (value as { q?: unknown })?.q === "string" ? ((value as { q: string }).q.trim().slice(0, 100)) : "";
  return transaction(async (c) => {
    await requireCapability(c, p, "conversation.post");
    const rows = (
      await c.query(
        `(SELECT 'Opportunity' AS record_type,o.id,o.display_number,o.title FROM ppo.opportunities o WHERE o.workspace_id=$1 AND ${opportunityVisibility("o")}
           AND ($3='' OR position(lower($3) in lower(o.title))>0 OR position(lower($3) in lower(o.display_number))>0) ORDER BY o.display_number LIMIT 20)
         UNION ALL
         (SELECT 'Project',pj.id,pj.display_number,pj.title FROM ppo.projects pj WHERE pj.workspace_id=$1 AND ${projectVisibility("pj")}
           AND ($3='' OR position(lower($3) in lower(pj.title))>0 OR position(lower($3) in lower(pj.display_number))>0) ORDER BY pj.display_number LIMIT 20)`,
        [p.workspace_id, p.actor_id, text],
      )
    ).rows;
    return { items: rows };
  });
}
