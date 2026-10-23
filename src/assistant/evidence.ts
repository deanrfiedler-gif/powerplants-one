import { createHash } from "node:crypto";
import { transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { canonical } from "../platform/operations";
import { unavailable } from "../platform/errors";
import { opportunityVisibility } from "../crm/context";
import { SALES_KINDS } from "../crm/validation";
import { activityVisibility } from "../activities/activities";
import { personCanReadThread, visibleThread } from "../conversations/access";
import { answerFooter, claimLine, declineBody } from "./answer";
import { readableSources, sourceKey, type SourceKey } from "./source-access";
import { agentName, envelopeLimits, type EvidenceEnvelope, type EvidenceItem, type EvidenceValue, type SourceType, type StoredClaim } from "./model";

// SQL and DTO allowlists are paired: additions to a domain row cannot enter an adapter request.
const fields: Record<SourceType, readonly string[]> = {
  Opportunity: ["display_number", "title", "stage_id", "close_outcome", "need_summary", "qualification_note", "expected_close_date"],
  Organisation: ["display_number", "display_name", "relationship_status", "sector"],
  Activity: ["kind", "activity_type", "summary", "status", "due_at", "due_needed", "starts_at", "outcome", "is_next_action"],
  Project: ["display_number", "title", "lifecycle", "target_date", "task_count", "completed_tasks", "undated_tasks",
    "unassigned_tasks", "at_risk_tasks", "overdue_milestones", "start_date", "forecast_finish",
    "baseline_revision", "baseline_finish", "next_milestone", "open_raid", "high_priority_raid", "overdue_raid"],
  ProjectTask: ["title", "phase", "status", "milestone", "start_date", "finish_date", "progress"],
  ProjectRaid: ["kind", "state", "priority", "due_at", "due_needed"],
  AcceptanceStage: ["reference", "title", "state", "closeout", "reassessment", "due"],
};
const untrusted: Partial<Record<SourceType, string[]>> = {
  Opportunity: ["title", "need_summary", "qualification_note"],
  Organisation: ["display_name", "sector"],
  Activity: ["summary", "outcome"],
  Project: ["title", "next_milestone"],
  ProjectTask: ["title"],
  AcceptanceStage: ["title"],
};
const digest = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
export const envelopeHash = (e: EvidenceEnvelope) =>
  digest(e.items.map(s => ({ type: s.type, record_id: s.record_id, source_version: s.source_version })));

export async function turnReaders(c: QueryClient, workspace: string, thread: string, actor: string) {
  const anchor = (await c.query(
    "SELECT anchor_type,anchor_id FROM ppo.conversation_threads WHERE workspace_id=$1 AND id=$2", [workspace, thread],
  )).rows[0];
  if (!anchor) throw unavailable();
  const participants = (await c.query(
    "SELECT user_id FROM ppo.conversation_participants WHERE workspace_id=$1 AND thread_id=$2 ORDER BY user_id", [workspace, thread],
  )).rows;
  const readers = new Set([actor]);
  for (const r of participants)
    if (await personCanReadThread(c, workspace, r.user_id, anchor.anchor_type, anchor.anchor_id)) readers.add(r.user_id);
  return [...readers].sort();
}

// Parent routes are real record pages; T2b adds no navigation surface.
export function sourceRoute(type: SourceType, id: string, project?: string) {
  switch (type) {
    case "Opportunity": return `/sales/opportunities/${id}`;
    case "Organisation": return `/customers/${id}`;
    case "Activity": return `/work/${id}`;
    case "Project": return `/projects/${id}`;
    case "AcceptanceStage": return `/projects/acceptance/stages/${id}`;
    case "ProjectTask":
    case "ProjectRaid": return `/projects/${project}`;
  }
}

// The same schedule and RAID arithmetic as projectFactsSql, projected without action-derived
// attention, reader-dependent owner details, source IDs or narrative fields.
const projectFields = `SELECT p.version,p.acceptance_version,p.display_number,p.title,p.lifecycle,p.target_date::text,
    t.task_count,t.completed_tasks,t.undated_tasks,t.unassigned_tasks,t.at_risk_tasks,t.overdue_milestones,t.start_date,t.forecast_finish,
    b.revision AS baseline_revision,b.finish AS baseline_finish,
    (SELECT jsonb_build_object('title',m.title,'finish_date',m.finish_date::text) FROM ppo.project_tasks m
      WHERE m.workspace_id=p.workspace_id AND m.project_id=p.id AND m.milestone AND m.status<>'Complete' AND m.finish_date IS NOT NULL
      ORDER BY m.finish_date,m.id LIMIT 1) AS next_milestone,
    r.open_raid,r.high_priority_raid,r.overdue_raid
  FROM ppo.projects p JOIN ppo.sites s ON (s.workspace_id,s.id)=(p.workspace_id,p.site_id)
  CROSS JOIN LATERAL (
    SELECT count(*)::int AS task_count,count(*) FILTER(WHERE status='Complete')::int AS completed_tasks,
      count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)::int AS undated_tasks,
      count(*) FILTER(WHERE status<>'Complete' AND owner_id IS NULL AND external_owner_id IS NULL)::int AS unassigned_tasks,
      count(*) FILTER(WHERE status='AtRisk')::int AS at_risk_tasks,
      count(*) FILTER(WHERE milestone AND status<>'Complete' AND finish_date<($3::timestamptz AT TIME ZONE s.timezone)::date)::int AS overdue_milestones,
      CASE WHEN count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)=0 THEN min(start_date)::text END AS start_date,
      CASE WHEN count(*) FILTER(WHERE start_date IS NULL OR finish_date IS NULL)=0 THEN max(finish_date)::text END AS forecast_finish
    FROM ppo.project_tasks WHERE workspace_id=p.workspace_id AND project_id=p.id
  ) t
  LEFT JOIN LATERAL (
    SELECT revision,(SELECT max(x->>'finish_date') FROM jsonb_array_elements(snapshot) x) AS finish
    FROM ppo.project_schedule_baselines WHERE workspace_id=p.workspace_id AND project_id=p.id ORDER BY revision DESC LIMIT 1
  ) b ON true
  CROSS JOIN LATERAL (
    SELECT count(*) FILTER(WHERE r.state<>'Closed')::int AS open_raid,
      count(*) FILTER(WHERE r.state<>'Closed' AND r.priority='High')::int AS high_priority_raid,
      count(*) FILTER(WHERE r.state<>'Closed' AND r.due_at<$3::timestamptz)::int AS overdue_raid
    FROM ppo.project_raid_entries e JOIN LATERAL (
      SELECT state,priority,due_at FROM ppo.project_raid_revisions WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1
    ) r ON true WHERE e.workspace_id=p.workspace_id AND e.project_id=p.id
  ) r WHERE p.workspace_id=$1 AND p.id=$2`;

async function sourceFields(c: QueryClient, workspace: string, source: SourceKey, retrieved: string, nextAction: string | null) {
  const sql: Record<SourceType, string> = {
    Opportunity: `SELECT version,display_number,title,stage_id,close_outcome,need_summary,qualification_note,expected_close_date::text
      FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2`,
    Organisation: `SELECT version,display_number,display_name,relationship_status,sector FROM ppo.organisations WHERE workspace_id=$1 AND id=$2`,
    Activity: `SELECT version,kind,activity_type,summary,status,due_at,due_needed,starts_at,outcome,coalesce(id=$3::uuid,false) AS is_next_action
      FROM ppo.activities WHERE workspace_id=$1 AND id=$2 AND access_class='Internal' AND kind=ANY($4::text[])`,
    Project: projectFields,
    ProjectTask: `SELECT version,project_id,title,phase,status,milestone,start_date::text,finish_date::text,progress
      FROM ppo.project_tasks WHERE workspace_id=$1 AND id=$2`,
    ProjectRaid: `SELECT r.version,e.project_id,e.kind,r.state,r.priority,r.due_at,r.due_needed FROM ppo.project_raid_entries e
      JOIN LATERAL (SELECT version,state,priority,due_at,due_needed FROM ppo.project_raid_revisions
        WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1) r ON true
      WHERE e.workspace_id=$1 AND e.id=$2`,
    AcceptanceStage: `SELECT version,project_id,reference,title,state,closeout,reassessment,due
      FROM ppo.acceptance_stages WHERE workspace_id=$1 AND id=$2`,
  };
  const row = (await c.query(sql[source.type], source.type === "Project"
    ? [workspace, source.record_id, retrieved] : source.type === "Activity"
      ? [workspace, source.record_id, nextAction, SALES_KINDS] : [workspace, source.record_id])).rows[0];
  if (!row) throw unavailable();
  const projected: Record<string, EvidenceValue> = {};
  for (const key of fields[source.type]) {
    const value = row[key];
    projected[key] = value instanceof Date ? value.toISOString() : value;
  }
  return {
    ...source,
    source_version: source.type === "Project" ? digest({ version: row.version, acceptance_version: row.acceptance_version, fields: projected }) : String(row.version),
    retrieved_at: retrieved,
    route: sourceRoute(source.type, source.record_id, row.project_id),
    fields: projected, untrusted_fields: untrusted[source.type] ?? [],
  };
}

// Evaluation-only freshness gate: derived Project fields can change without its row version.
// Re-read the same allowlist inside the dispatch/post transaction; never expose a stale answer.
export async function sourcesUnchanged(c: QueryClient, workspace: string, envelope: EvidenceEnvelope) {
  const retrieved = (await c.query("SELECT clock_timestamp() AS at")).rows[0].at.toISOString();
  const anchor = envelope.items[0];
  const nextAction = anchor?.type === "Opportunity" ? (await c.query(
    "SELECT next_activity_id FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2", [workspace, anchor.record_id],
  )).rows[0]?.next_activity_id ?? null : null;
  for (const item of envelope.items) {
    const current = await sourceFields(c, workspace, item, retrieved, nextAction);
    if (current.source_version !== item.source_version || canonical(current.fields) !== canonical(item.fields)) return false;
  }
  return true;
}

async function messagesFor(c: QueryClient, p: Principal, thread: string, trigger: string, readers: string[]) {
  const through = (await c.query(
    "SELECT sequence FROM ppo.conversation_messages WHERE workspace_id=$1 AND thread_id=$2 AND id=$3",
    [p.workspace_id, thread, trigger],
  )).rows[0]?.sequence;
  if (!through) throw unavailable();
  const rows = (await c.query(
    `SELECT id,body,author_kind,agent_outcome FROM ppo.conversation_messages
     WHERE workspace_id=$1 AND thread_id=$2 AND sequence<=$3 ORDER BY sequence DESC LIMIT $4`,
    [p.workspace_id, thread, through, envelopeLimits.messages + 1],
  )).rows;
  const messages = [];
  for (const m of rows.slice(0, envelopeLimits.messages).reverse()) {
    let text: string = m.body;
    if (m.author_kind === "Agent") {
      // P1 applies to evidence too: an earlier answer cannot restore a lost source's words.
      const sources = (await c.query(
        "SELECT number,record_type AS type,record_id FROM ppo.conversation_message_sources WHERE workspace_id=$1 AND message_id=$2 ORDER BY number",
        [p.workspace_id, m.id],
      )).rows as (SourceKey & { number: number })[];
      const allowed = new Set(sources.map(sourceKey));
      for (const reader of readers) {
        const open = await readableSources(c, p.workspace_id, reader, sources);
        for (const key of allowed) if (!open.has(key)) allowed.delete(key);
      }
      const claims = (await c.query(
        "SELECT ordinal,kind,text,source_numbers FROM ppo.conversation_message_claims WHERE workspace_id=$1 AND message_id=$2 ORDER BY ordinal",
        [p.workspace_id, m.id],
      )).rows as StoredClaim[];
      const safe = claims.map(claim => claim.source_numbers.every(n => {
        const source = sources.find(s => s.number === n);
        return source && allowed.has(sourceKey(source));
      }) ? claimLine(claim) : "A statement from a record you can't open").join("\n");
      text = m.agent_outcome === "CannotAnswer" ? declineBody() : safe + answerFooter(text, claims);
    } else {
      const mentions = (await c.query(
        `SELECT m.ordinal,m.kind,m.record_type,m.record_id,u.display_name FROM ppo.conversation_mentions m
         LEFT JOIN ppo.users u ON (u.workspace_id,u.id)=(m.workspace_id,m.person_id)
         WHERE m.workspace_id=$1 AND m.message_id=$2 ORDER BY m.ordinal`, [p.workspace_id, m.id],
      )).rows;
      const replacements = new Map<string, string>();
      for (const mention of mentions) {
        if (mention.kind === "Person") replacements.set(`@{${mention.ordinal}}`, mention.display_name);
        else if (mention.kind === "Agent") replacements.set(`@{${mention.ordinal}}`, agentName);
        else {
          const source: SourceKey = { type: mention.record_type, record_id: mention.record_id };
          let open = true;
          for (const reader of readers)
            if (!(await readableSources(c, p.workspace_id, reader, [source])).has(sourceKey(source))) { open = false; break; }
          const label = open ? (await c.query(
            mention.record_type === "Opportunity"
              ? "SELECT display_number FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2"
              : "SELECT display_number FROM ppo.projects WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, mention.record_id],
          )).rows[0]?.display_number : null;
          replacements.set(`#{${mention.ordinal}}`, label ?? "a record");
        }
      }
      text = text.replace(/[@#]\{\d+\}/g, token => replacements.get(token) ?? "a record");
    }
    messages.push({ text, untrusted: true as const });
  }
  return { messages, more: rows.length > envelopeLimits.messages };
}

export async function buildEnvelope(p: Principal, turn: { thread_id: string; trigger_message_id: string }): Promise<EvidenceEnvelope> {
  return transaction(async c => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const t = await visibleThread(c, p, turn.thread_id);
    const readers = await turnReaders(c, p.workspace_id, t.id, p.actor_id);
    const retrieved = (await c.query("SELECT transaction_timestamp() AS at")).rows[0].at.toISOString();
    const items: EvidenceItem[] = [], coverage: EvidenceEnvelope["coverage"] = {};
    let left_out = 0, nextAction: string | null = null;
    async function include(sources: SourceKey[]) {
      let allowed = await readableSources(c, p.workspace_id, p.actor_id, sources);
      const candidates = sources.filter(s => allowed.has(sourceKey(s)));
      for (const reader of readers) {
        const open = await readableSources(c, p.workspace_id, reader, candidates);
        allowed = new Set([...allowed].filter(key => open.has(key)));
      }
      let returned = 0;
      for (const source of candidates) {
        if (!allowed.has(sourceKey(source))) { left_out++; continue; }
        items.push({ source_id: `S${items.length + 1}`, ...await sourceFields(c, p.workspace_id, source, retrieved, nextAction) });
        returned++;
      }
      return returned;
    }
    async function list(key: keyof typeof coverage, type: SourceType, sql: string, args: unknown[], limit: number) {
      const rows = (await c.query(sql, [...args, limit + 1])).rows;
      const returned = await include(rows.slice(0, limit).map(r => ({ type, record_id: r.id })));
      coverage[key] = { returned, limit, more: rows.length > limit };
      return rows.slice(0, limit).map(r => r.id as string);
    }
    await include([{ type: t.anchor_type, record_id: t.anchor_id }]);
    if (t.anchor_type === "Opportunity") {
      const anchor = (await c.query("SELECT organisation_id,next_activity_id FROM ppo.opportunities WHERE workspace_id=$1 AND id=$2", [p.workspace_id, t.anchor_id])).rows[0];
      const org = anchor.organisation_id;
      nextAction = anchor.next_activity_id;
      await include([{ type: "Organisation", record_id: org }]);
      const siblings = await list("opportunities", "Opportunity",
        `SELECT o.id FROM ppo.opportunities o WHERE o.workspace_id=$1 AND o.organisation_id=$3 AND o.id<>$4
         AND ${opportunityVisibility("o")} ORDER BY o.updated_at DESC,o.id LIMIT $5`,
        [p.workspace_id, p.actor_id, org, t.anchor_id], envelopeLimits.opportunities);
      await list("activities", "Activity",
        `SELECT a.id FROM ppo.activities a WHERE a.workspace_id=$1 AND a.access_class='Internal' AND a.kind=ANY($5::text[])
         AND ${activityVisibility("a", true, true, true)} AND EXISTS(SELECT 1 FROM ppo.activity_links l
           WHERE l.workspace_id=a.workspace_id AND l.activity_id=a.id
           AND ((l.object_type='Organisation' AND l.object_id=$3) OR (l.object_type='Opportunity' AND l.object_id=ANY($4::uuid[]))))
         ORDER BY a.updated_at DESC,a.id LIMIT $6`,
        [p.workspace_id, p.actor_id, org, [t.anchor_id, ...siblings], SALES_KINDS], envelopeLimits.activities);
    } else {
      await list("tasks", "ProjectTask",
        "SELECT id FROM ppo.project_tasks WHERE workspace_id=$1 AND project_id=$2 ORDER BY created_at,id LIMIT $3",
        [p.workspace_id, t.anchor_id], envelopeLimits.tasks);
      await list("raid", "ProjectRaid",
        `SELECT e.id FROM ppo.project_raid_entries e JOIN LATERAL (
           SELECT state FROM ppo.project_raid_revisions WHERE workspace_id=e.workspace_id AND entry_id=e.id ORDER BY version DESC LIMIT 1
         ) r ON true WHERE e.workspace_id=$1 AND e.project_id=$2 AND r.state<>'Closed' ORDER BY e.created_at,e.id LIMIT $3`,
        [p.workspace_id, t.anchor_id], envelopeLimits.raid);
      await list("acceptance_stages", "AcceptanceStage",
        "SELECT id FROM ppo.acceptance_stages WHERE workspace_id=$1 AND project_id=$2 ORDER BY created_at,id LIMIT $3",
        [p.workspace_id, t.anchor_id], envelopeLimits.tasks);
      await list("opportunities", "Opportunity",
        `SELECT DISTINCT o.id,o.updated_at FROM ppo.sales_delivery_bindings b
         JOIN ppo.sales_handovers h ON (h.workspace_id,h.id)=(b.workspace_id,b.handover_id)
         JOIN ppo.opportunities o ON (o.workspace_id,o.id)=(h.workspace_id,h.opportunity_id)
         WHERE b.workspace_id=$1 AND b.project_id=$3 AND ${opportunityVisibility("o")} ORDER BY o.updated_at DESC,o.id LIMIT $4`,
        [p.workspace_id, p.actor_id, t.anchor_id], envelopeLimits.opportunities);
    }
    const history = await messagesFor(c, p, t.id, turn.trigger_message_id, readers);
    coverage.messages = { returned: history.messages.length, limit: envelopeLimits.messages, more: history.more };
    return { anchor_type: t.anchor_type, readers, question: history.messages.at(-1)!, messages: history.messages, items, coverage, left_out };
  });
}
