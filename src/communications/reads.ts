import { transaction } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { visible } from "../shared/reads";
import { invalid, object, uuid } from "../shared/validation";
import { awaitingAction, classRules, displayState, type HoldReason, type State } from "./model";
import { canReadSource, readSource, type Communication } from "./records";

// R3: a message is evidence, not a task. Anyone who can read its source record can read it,
// because it holds only customer-safe content. Each row is checked through the source's own module.
type Row = Communication & {
  state: State;
  version: number;
  hold_reason: HoldReason | null;
  last_event_at: Date;
  prepared_by_name: string;
  owner_name: string;
  sender_name: string | null;
  follow_up_id: string | null;
  follow_up_status: string | null;
};
const select = `SELECT c.*,l.state,l.version,l.hold_reason,l.occurred_at AS last_event_at,pu.display_name AS prepared_by_name,ou.display_name AS owner_name,
 (SELECT u.display_name FROM ppo.customer_communication_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id)
  WHERE e.workspace_id=c.workspace_id AND e.communication_id=c.id AND e.action='Confirm' ORDER BY e.version DESC LIMIT 1) AS sender_name,
 f.activity_id AS follow_up_id,f.status AS follow_up_status
 FROM ppo.customer_communications c
 JOIN LATERAL (SELECT state,version,hold_reason,occurred_at FROM ppo.customer_communication_events e WHERE e.workspace_id=c.workspace_id AND e.communication_id=c.id ORDER BY version DESC LIMIT 1) l ON true
 JOIN ppo.users pu ON (pu.workspace_id,pu.id)=(c.workspace_id,c.prepared_by)
 JOIN ppo.users ou ON (ou.workspace_id,ou.id)=(c.workspace_id,c.owner_id)
 LEFT JOIN LATERAL (SELECT x.activity_id,a.status FROM ppo.customer_communication_follow_ups x JOIN ppo.activities a ON (a.workspace_id,a.id)=(x.workspace_id,x.activity_id)
  WHERE x.workspace_id=c.workspace_id AND x.communication_id=c.id ORDER BY x.created_at DESC LIMIT 1) f ON true`;
function summary(r: Row) {
  const rule = classRules[r.message_class];
  return {
    id: r.id,
    message_class: r.message_class,
    code: rule.code,
    label: rule.label,
    review: r.review_class,
    state: r.state,
    version: r.version,
    hold_reason: r.hold_reason,
    display_state: displayState(r.state, r.hold_reason),
    // Every outcome on this channel is simulated; nothing has reached a customer.
    channel: r.channel,
    simulated: true,
    subject: r.subject,
    recipient: {
      role: r.recipient_role,
      contact_id: r.recipient_contact_id,
      name: r.recipient_name,
      address: r.recipient_address,
    },
    source: { type: r.source_type, id: r.source_id, reference: r.source_reference, fact_version: r.source_fact_version },
    organisation_id: r.organisation_id,
    site_id: r.site_id,
    correction: r.correction,
    supersedes_id: r.supersedes_id,
    content_hash: r.content_hash,
    prepared_at: r.created_at.toISOString(),
    prepared_by: r.prepared_by_name,
    sent_by: r.sender_name,
    owner: { id: r.owner_id, name: r.owner_name },
    follow_up: r.follow_up_id ? { activity_id: r.follow_up_id, status: r.follow_up_status } : null,
    last_event_at: r.last_event_at.toISOString(),
  };
}
async function readable(c: QueryClient, p: Principal, rows: Row[]) {
  const seen = new Map<string, boolean>();
  const out: Row[] = [];
  for (const r of rows) {
    const key = `${r.source_type}:${r.source_id}`;
    if (!seen.has(key)) seen.set(key, await canReadSource(c, p, r.source_type, r.source_id));
    if (seen.get(key)) out.push(r);
  }
  return out;
}
// The customer, project and order timelines: exactly one of the three filters.
export async function listCustomerCommunications(p: Principal, query: Record<string, string>) {
  const q = object(query, ["organisation_id", "project_id", "demand_id"]);
  const given = (["organisation_id", "project_id", "demand_id"] as const).filter((k) => q[k] !== undefined);
  if (given.length !== 1) invalid("query", "Give exactly one of organisation_id, project_id or demand_id.");
  const key = given[0],
    id = uuid(q[key], key);
  return transaction(async (c) => {
    let where: string;
    if (key === "organisation_id") {
      await visible(c, p, "Organisation", id);
      where = "c.organisation_id=$2";
    } else {
      await readSource(c, p, key === "project_id" ? "Project" : "SupplyDemand", id);
      where = `c.source_type='${key === "project_id" ? "Project" : "SupplyDemand"}' AND c.source_id=$2`;
    }
    const rows = (
      await c.query(`${select} WHERE c.workspace_id=$1 AND ${where} ORDER BY c.created_at DESC,c.id LIMIT 200`, [p.workspace_id, id])
    ).rows as Row[];
    return { items: (await readable(c, p, rows)).map(summary), channel: "Synthetic", simulated: true };
  });
}
export async function readCustomerCommunication(p: Principal, id: string) {
  const key = uuid(id, "id");
  return transaction(async (c) => {
    const row = (await c.query(`${select} WHERE c.workspace_id=$1 AND c.id=$2`, [p.workspace_id, key])).rows[0] as Row | undefined;
    if (!row || !(await readable(c, p, [row])).length) throw unavailable();
    const events = (
      await c.query(
        `SELECT e.version,e.state,e.action,e.hold_reason,e.provider_message_id,e.reason,e.evidence,e.occurred_at,u.display_name AS actor
         FROM ppo.customer_communication_events e JOIN ppo.users u ON (u.workspace_id,u.id)=(e.workspace_id,e.actor_id)
         WHERE e.workspace_id=$1 AND e.communication_id=$2 ORDER BY e.version`,
        [p.workspace_id, key],
      )
    ).rows;
    const follow_ups = (
      await c.query(
        `SELECT f.activity_id,f.event_version,a.status,a.owner_id FROM ppo.customer_communication_follow_ups f JOIN ppo.activities a ON (a.workspace_id,a.id)=(f.workspace_id,f.activity_id)
         WHERE f.workspace_id=$1 AND f.communication_id=$2 ORDER BY f.created_at,f.activity_id`,
        [p.workspace_id, key],
      )
    ).rows;
    return {
      ...summary(row),
      body: row.body,
      facts: row.facts,
      template: row.template_id ? { id: row.template_id, version: row.template_version, definition_hash: row.template_hash } : null,
      history: events.map((e) => ({
        version: e.version,
        state: e.state,
        action: e.action,
        hold_reason: e.hold_reason,
        display_state: displayState(e.state, e.hold_reason),
        provider_message_id: e.provider_message_id,
        actor: e.actor,
        reason: e.reason,
        evidence: e.evidence,
        occurred_at: e.occurred_at.toISOString(),
      })),
      follow_ups,
    };
  });
}
// R5's outbound queue: prepared messages waiting for a named sender, and every held, failed or
// unknown message, optionally only those whose follow-up the caller owns.
export async function customerCommunicationQueue(p: Principal, query: Record<string, string>) {
  const q = object(query, ["owner"]);
  if (q.owner !== undefined && q.owner !== "me") invalid("owner", "Use owner=me or leave it out.");
  return transaction(async (c) => {
    const rows = (
      await c.query(
        `${select} WHERE c.workspace_id=$1 AND l.state=ANY($2::text[]) ${q.owner ? "AND c.owner_id=$3" : ""} ORDER BY l.occurred_at,c.id LIMIT 200`,
        q.owner ? [p.workspace_id, awaitingAction, p.actor_id] : [p.workspace_id, awaitingAction],
      )
    ).rows as Row[];
    return { items: (await readable(c, p, rows)).map(summary), channel: "Synthetic", simulated: true };
  });
}
