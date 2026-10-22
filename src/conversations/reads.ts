import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import { hasPermission, requireCapability } from "../platform/permissions";
import { opportunityVisibility } from "../crm/context";
import { projectVisibility } from "../projects/visibility";
import { choice, object, uuid } from "../shared/validation";
import { unavailable } from "../platform/errors";
import { assistantEnabled } from "../assistant/config";
import {
  participantWarnings,
  type HistoryWarning,
} from "./participant-warning";
import { anchorInput, listInput } from "./validation";
import {
  personCanReadThread,
  readableAnchor,
  recordOpenable,
  threadAccessSql,
  visibleThread,
} from "./access";
import { anchorTypes, type AnchorType } from "./model";
import { agentLabel, agentName, type StoredClaim, type StoredSource, type TurnReason, type TurnState } from "../assistant/model";
import { answerFooter, declineBody } from "../assistant/answer";
import { readerView } from "../assistant/reader-view";

const iso = (value: Date | null) => (value ? value.toISOString() : null);
// The anchor's own number and title. Reaching the thread already means the reader can open the record.
const anchorSql = `LEFT JOIN LATERAL (
  SELECT o.display_number,o.title FROM ppo.opportunities o WHERE t.anchor_type='Opportunity' AND o.workspace_id=t.workspace_id AND o.id=t.anchor_id
  UNION ALL SELECT pj.display_number,pj.title FROM ppo.projects pj WHERE t.anchor_type='Project' AND pj.workspace_id=t.workspace_id AND pj.id=t.anchor_id
 ) a ON true`;

export type ThreadSummary = {
  id: string;
  title: string;
  anchor: {
    type: AnchorType;
    id: string;
    display_number: string;
    title: string;
  };
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
        [
          p.workspace_id,
          p.actor_id,
          q.anchor?.type ?? null,
          q.anchor?.id ?? null,
          q.filter,
          q.limit,
        ],
      )
    ).rows;
    const items: ThreadSummary[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      anchor: {
        type: r.anchor_type,
        id: r.anchor_id,
        display_number: r.display_number,
        title: r.anchor_title,
      },
      is_main: r.is_main,
      state: r.state,
      version: r.version,
      last_sequence: Number(r.last_sequence),
      last_message_at: iso(r.last_at),
      participating: r.participating,
      unread:
        r.participating &&
        Number(r.last_sequence) > Number(r.last_read_sequence),
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
    // P1: permission checks, source labels and the drawn answer share one observation.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
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
        `SELECT m.id,m.sequence,m.author_id,u.display_name AS author_name,m.body,m.created_at,m.author_kind,m.acted_for_id,
          af.display_name AS acted_for_name,m.agent_outcome,m.adapter,m.left_out_count FROM ppo.conversation_messages m
         LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.author_id)
         LEFT JOIN ppo.users af ON (af.workspace_id,af.id)=(m.workspace_id,m.acted_for_id)
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
    const openable = new Map<
      string,
      { display_number: string; title: string } | null
    >();
    const drawn = new Map<string, unknown[]>();
    for (const m of mentionRows) {
      let entry: unknown;
      if (m.kind === "Person")
        entry = {
          ordinal: m.ordinal,
          kind: "Person",
          person_id: m.person_id,
          display_name: m.person_name,
        };
      else if (m.kind === "Agent")
        entry = { ordinal: m.ordinal, kind: "Agent", display_name: agentName };
      else {
        const key = `${m.record_type}:${m.record_id}`;
        if (!openable.has(key)) {
          const can = await recordOpenable(
            c,
            p.workspace_id,
            p.actor_id,
            m.record_type,
            m.record_id,
          );
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
          ? {
              ordinal: m.ordinal,
              kind: "Record",
              can_open: true,
              record_type: m.record_type,
              record_id: m.record_id,
              ...found,
            }
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
    const turns = (
      await c.query<{
        id: string;
        trigger_message_id: string;
        state: TurnState;
        acted_for_id: string;
        reason: TurnReason | null;
      }>(
        `SELECT id,trigger_message_id,state,acted_for_id,CASE WHEN acted_for_id=$3 THEN reason END AS reason
       FROM ppo.assistant_turns WHERE workspace_id=$1 AND thread_id=$2 ORDER BY created_at,id`,
        [p.workspace_id, t.id, p.actor_id],
      )
    ).rows;
    const drawnMessages = [];
    for (const m of messages) {
      const common = {
        id: m.id,
        sequence: m.sequence,
        author_kind: m.author_kind as "Person" | "Agent",
        author_id: m.author_id as string | null,
        author_name: m.author_kind === "Agent" ? agentLabel : m.author_name,
        created_at: m.created_at.toISOString(),
        mentions: drawn.get(m.id) ?? [],
      };
      if (m.author_kind === "Person") {
        drawnMessages.push({ ...common, body: m.body as string });
        continue;
      }
      const claims = (
        await c.query<StoredClaim>(
          "SELECT ordinal,kind,text,source_numbers FROM ppo.conversation_message_claims WHERE workspace_id=$1 AND message_id=$2 ORDER BY ordinal",
          [p.workspace_id, m.id],
        )
      ).rows;
      const sources = (
        await c.query<StoredSource>(
          "SELECT number,record_type AS type,record_id,source_version,retrieved_at FROM ppo.conversation_message_sources WHERE workspace_id=$1 AND message_id=$2 ORDER BY number",
          [p.workspace_id, m.id],
        )
      ).rows;
      const view = await readerView(
        c,
        p.workspace_id,
        p.actor_id,
        claims,
        sources,
      );
      drawnMessages.push({
        ...common,
        body:
          m.agent_outcome === "CannotAnswer"
            ? declineBody()
            : view.body + answerFooter(m.body, claims),
        acted_for: {
          user_id: m.acted_for_id as string,
          display_name: m.acted_for_name as string,
        },
        agent: {
          outcome: m.agent_outcome as "Answered" | "CannotAnswer",
          adapter: m.adapter as "Simulated" | "Claude",
          label: m.adapter as string,
          claims: view.claims,
          sources: view.sources,
          left_out: m.left_out_count as number,
        },
      });
    }
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
      messages: drawnMessages,
      turns,
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
  const input = object(value, ["anchor_type", "anchor_id", "thread_id"]);
  const anchor = anchorInput({
    anchor_type: input.anchor_type,
    anchor_id: input.anchor_id,
  });
  const thread =
    input.thread_id === undefined ? null : uuid(input.thread_id, "thread_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const scope = await readableAnchor(
      c,
      p,
      anchor.type,
      anchor.id,
      "conversation.post",
    );
    await readableAnchor(c, p, anchor.type, anchor.id, "conversation.read");
    if (thread) {
      const row = await visibleThread(c, p, thread);
      if (row.anchor_type !== anchor.type || row.anchor_id !== anchor.id)
        throw unavailable();
    }
    const candidates = (
      await c.query(
        `SELECT u.id,u.display_name FROM ppo.users u WHERE u.workspace_id=$1 AND u.active AND u.id<>$2
         AND EXISTS(SELECT 1 FROM ppo.permission_grants g WHERE g.workspace_id=u.workspace_id AND g.user_id=u.id AND g.capability='conversation.read'
          AND g.valid_from<=clock_timestamp() AND (g.valid_to IS NULL OR g.valid_to>clock_timestamp()))
         ORDER BY u.display_name,u.id LIMIT 200`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    const items: {
      id: string;
      display_name: string;
      role: string;
      history_warning?: HistoryWarning;
    }[] = [];
    for (const u of candidates)
      if (
        await personCanReadThread(
          c,
          p.workspace_id,
          u.id,
          anchor.type,
          anchor.id,
        )
      )
        items.push({
          id: u.id,
          display_name: u.display_name,
          role: "Role not recorded",
        });
    if (thread) {
      const warnings = await participantWarnings(
        c,
        p,
        thread,
        items.map((item) => item.id),
      );
      for (const item of items)
        if (warnings.has(item.id)) item.history_warning = warnings.get(item.id);
    }
    const agent =
      assistantEnabled() &&
      (await hasPermission(
        c,
        p,
        "conversation.agent.ask",
        scope.company_id,
        scope.site_id ?? undefined,
      ))
        ? { name: agentName, label: agentLabel }
        : null;
    return { items, agent };
  });
}

// The `#` picker: deals and projects the sender can open, matched on number or title. With record_type and record_id it
// returns that one record if the sender can open it (New thread's ?record= prefill, PPO-CONV-T1C-DESIGN 5.5).
export async function linkableRecords(p: Principal, value: unknown = {}) {
  const v = (value ?? {}) as {
    q?: unknown;
    record_type?: unknown;
    record_id?: unknown;
  };
  const text = typeof v.q === "string" ? v.q.trim().slice(0, 100) : "";
  const exact =
    v.record_type === undefined && v.record_id === undefined
      ? null
      : {
          type: choice(v.record_type, "record_type", anchorTypes),
          id: uuid(v.record_id, "record_id"),
        };
  return transaction(async (c) => {
    await requireCapability(c, p, "conversation.post");
    const rows = (
      await c.query(
        `(SELECT 'Opportunity' AS record_type,o.id,o.display_number,o.title FROM ppo.opportunities o WHERE o.workspace_id=$1 AND ${opportunityVisibility("o")}
           AND ($3='' OR position(lower($3) in lower(o.title))>0 OR position(lower($3) in lower(o.display_number))>0)
           AND ($4::text IS NULL OR ($4='Opportunity' AND o.id=$5::uuid)) ORDER BY o.display_number LIMIT 20)
         UNION ALL
         (SELECT 'Project',pj.id,pj.display_number,pj.title FROM ppo.projects pj WHERE pj.workspace_id=$1 AND ${projectVisibility("pj")}
           AND ($3='' OR position(lower($3) in lower(pj.title))>0 OR position(lower($3) in lower(pj.display_number))>0)
           AND ($4::text IS NULL OR ($4='Project' AND pj.id=$5::uuid)) ORDER BY pj.display_number LIMIT 20)`,
        [
          p.workspace_id,
          p.actor_id,
          text,
          exact?.type ?? null,
          exact?.id ?? null,
        ],
      )
    ).rows;
    return { items: rows };
  });
}
