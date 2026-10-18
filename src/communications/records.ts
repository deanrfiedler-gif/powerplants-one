import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { insertActivity, type ActivityInput } from "../activities/activities";
import { AppError, unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { projectRow } from "../projects/service";
import { supplyRecord } from "../supply/context";
import {
  classRules,
  holdSummary,
  type HoldReason,
  type MessageClass,
  type SourceType,
  type State,
} from "./model";

export const conflict = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};
export async function insertRow(
  c: QueryClient,
  table: string,
  fields: Record<string, unknown>,
) {
  const e = Object.entries(fields);
  return (
    await c.query(
      `INSERT INTO ppo.${table}(${e.map((x) => x[0]).join(",")}) VALUES(${e.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
      e.map((x) => x[1]),
    )
  ).rows[0];
}
export type Communication = {
  id: string;
  workspace_id: string;
  company_id: string;
  site_id: string | null;
  organisation_id: string;
  message_class: MessageClass;
  review_class: "Factual" | "Reviewed";
  source_type: SourceType;
  source_id: string;
  source_reference: string;
  source_fact_version: number;
  recipient_role: string;
  recipient_contact_id: string | null;
  recipient_name: string | null;
  recipient_address: string | null;
  template_id: string | null;
  template_version: number | null;
  template_hash: string | null;
  facts: Record<string, string | null>;
  subject: string | null;
  body: string | null;
  content_hash: string | null;
  correction: boolean;
  supersedes_id: string | null;
  channel: "Synthetic";
  owner_id: string;
  prepared_by: string;
  operation_id: string;
  created_at: Date;
};
export type LedgerEvent = {
  id: string;
  version: number;
  state: State;
  action: string;
  hold_reason: HoldReason | null;
  provider_message_id: string | null;
  actor_id: string;
  reason: string;
  evidence: string;
  occurred_at: Date;
};
export async function communication(c: QueryClient, w: string, id: string) {
  const row = (
    await c.query(
      "SELECT * FROM ppo.customer_communications WHERE workspace_id=$1 AND id=$2",
      [w, id],
    )
  ).rows[0] as Communication | undefined;
  if (!row) throw unavailable();
  return row;
}
export async function latestEvent(c: QueryClient, w: string, id: string) {
  return (
    await c.query(
      "SELECT * FROM ppo.customer_communication_events WHERE workspace_id=$1 AND communication_id=$2 ORDER BY version DESC LIMIT 1",
      [w, id],
    )
  ).rows[0] as LedgerEvent;
}
export async function appendEvent(
  c: QueryClient,
  actor: Principal,
  m: Communication,
  e: {
    version: number;
    state: State;
    action: "Prepare" | "Confirm" | "Hold" | "Withdraw" | "Record" | "Reconcile";
    operation_id?: string;
    hold_reason?: HoldReason | null;
    provider_message_id?: string | null;
    reason: string;
    evidence: string;
  },
) {
  return (await insertRow(c, "customer_communication_events", {
    id: randomUUID(),
    workspace_id: m.workspace_id,
    communication_id: m.id,
    version: e.version,
    state: e.state,
    action: e.action,
    hold_reason: e.hold_reason ?? null,
    provider_message_id: e.provider_message_id ?? null,
    actor_id: actor.actor_id,
    operation_id: e.operation_id ?? randomUUID(),
    reason: e.reason.slice(0, 2000),
    evidence: e.evidence.slice(0, 2000),
  })) as LedgerEvent;
}

// The source record behind a message, read through its own module so R3 holds: anyone who can
// read the source can read its messages, and nobody else.
export type SourceRecord = {
  type: SourceType;
  id: string;
  company_id: string;
  site_id: string | null;
  organisation_id: string;
  reference: string;
  owner_id: string;
};
export async function readSource(
  c: QueryClient,
  p: Principal,
  type: SourceType,
  id: string,
): Promise<SourceRecord> {
  if (type === "Project") {
    const r = await projectRow(c, p, id);
    return {
      type,
      id: r.id,
      company_id: r.company_id,
      site_id: r.site_id,
      organisation_id: r.organisation_id,
      reference: r.display_number,
      // R5: the project coordinator owns the follow-up.
      owner_id: r.coordinator_id,
    };
  }
  const r = await supplyRecord(c, p, id);
  const customer = (r.data as Record<string, unknown>).customer_id;
  if (r.kind !== "Demand" || typeof customer !== "string") throw unavailable();
  return {
    type,
    id: r.id,
    company_id: r.company_id,
    site_id: r.site_id ?? null,
    organisation_id: customer,
    reference: r.reference,
    // R5: the supply coordinator who owns the demand owns the follow-up.
    owner_id: r.owner_id,
  };
}
export async function canReadSource(
  c: QueryClient,
  p: Principal,
  type: SourceType,
  id: string,
) {
  try {
    await readSource(c, p, type, id);
    return true;
  } catch (e) {
    if (e instanceof AppError && [403, 404].includes(e.status)) return false;
    throw e;
  }
}

export async function switchMode(
  c: QueryClient,
  w: string,
  company: string,
  cls: MessageClass,
): Promise<"Off" | "Synthetic"> {
  return (
    (
      await c.query(
        "SELECT mode FROM ppo.customer_message_switch_events WHERE workspace_id=$1 AND company_id=$2 AND message_class=$3 ORDER BY version DESC LIMIT 1",
        [w, company, cls],
      )
    ).rows[0]?.mode ?? "Off"
  );
}
export async function noticePreference(
  c: QueryClient,
  w: string,
  company: string,
  person: string,
  cls: MessageClass,
): Promise<"Allowed" | "DoNotNotify" | null> {
  return (
    (
      await c.query(
        "SELECT preference FROM ppo.contact_notice_preferences WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3 AND message_class=$4 ORDER BY version DESC LIMIT 1",
        [w, company, person, cls],
      )
    ).rows[0]?.preference ?? null
  );
}
type Recipient = { id: string; display_name: string; email: string | null };
// R1 and R2: a current, active contact of the record's own customer, not suppressed, with an address.
export async function recipientCheck(
  c: QueryClient,
  w: string,
  m: Pick<Communication, "company_id" | "organisation_id" | "message_class">,
  contactId: string | null,
): Promise<{ hold: HoldReason | null; person: Recipient | null }> {
  if (!contactId) return { hold: "NoRecipient", person: null };
  const row = (
    await c.query(
      `SELECT p.id,p.display_name,p.email,p.active AND EXISTS(SELECT 1 FROM ppo.relationships r WHERE r.workspace_id=p.workspace_id AND r.person_id=p.id
       AND r.company_id=$3 AND r.organisation_id=$4 AND r.valid_from<=current_date AND (r.valid_to IS NULL OR r.valid_to>current_date)) AS current
       FROM ppo.people p WHERE p.workspace_id=$1 AND p.id=$2`,
      [w, contactId, m.company_id, m.organisation_id],
    )
  ).rows[0] as (Recipient & { current: boolean }) | undefined;
  if (!row) return { hold: "RecipientNotCurrent", person: null };
  const person: Recipient = { id: row.id, display_name: row.display_name, email: row.email };
  if (!row.current) return { hold: "RecipientNotCurrent", person };
  if (
    (await noticePreference(c, w, m.company_id, contactId, m.message_class)) ===
    "DoNotNotify"
  )
    return { hold: "DoNotNotify", person };
  if (!person.email) return { hold: "MissingAddress", person };
  return { hold: null, person };
}
// Checked again at confirmation and before every hand-over: switching a class off stops it at once.
export async function gate(c: QueryClient, m: Communication) {
  if ((await switchMode(c, m.workspace_id, m.company_id, m.message_class)) !== "Synthetic")
    return "ClassSwitchedOff" as const;
  const r = await recipientCheck(c, m.workspace_id, m, m.recipient_contact_id);
  if (r.hold === "MissingAddress") return "RecipientChanged" as const;
  if (r.hold) return r.hold;
  if (r.person!.email !== m.recipient_address || r.person!.display_name !== m.recipient_name)
    return "RecipientChanged" as const;
  return null;
}

// R5 / TR-03: one owned CustomerContact follow-up stays open for a held, failed or unknown message.
// The service creates it on the owner's behalf; the owner was checked when the message was prepared.
// An Activity audit event lets the existing Owned work notices reach the owner.
export async function followUp(
  c: PoolClient,
  actor: Principal,
  m: Communication,
  version: number,
  state: State,
  hold: HoldReason | null,
) {
  if (
    (
      await c.query(
        "SELECT 1 FROM ppo.customer_communication_follow_ups f JOIN ppo.activities a ON (a.workspace_id,a.id)=(f.workspace_id,f.activity_id) WHERE f.workspace_id=$1 AND f.communication_id=$2 AND a.status IN ('Open','InProgress')",
        [m.workspace_id, m.id],
      )
    ).rowCount
  )
    return null;
  const what =
    state === "Held"
      ? `held, not sent: ${holdSummary(hold!)}`
      : state === "Failed"
        ? "failed and was not delivered"
        : "has an unknown outcome; reconcile before any retry";
  const input: ActivityInput = {
    id: randomUUID(),
    company_id: m.company_id,
    site_id: m.site_id,
    kind: "CustomerContact",
    owner_id: m.owner_id,
    summary: `${m.source_reference} · ${classRules[m.message_class].label} to ${m.recipient_name ?? "the customer"} ${what} · Contact the customer another way if needed`.slice(0, 2000),
    due_at: null,
    due_needed: true,
    access_class: "RestrictedService",
    links: [
      m.site_id
        ? { object_type: "Site", object_id: m.site_id }
        : { object_type: "Organisation", object_id: m.organisation_id },
      ...(m.source_type === "Project"
        ? [{ object_type: "Project" as const, object_id: m.source_id }]
        : []),
    ],
  };
  await insertActivity(c, actor, input);
  await insertRow(c, "customer_communication_follow_ups", {
    workspace_id: m.workspace_id,
    communication_id: m.id,
    activity_id: input.id,
    event_version: version,
  });
  await c.query(
    "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES($1,$2,$3,'Activity',$4,'Accepted',$5,$6)",
    [
      randomUUID(),
      m.workspace_id,
      actor.actor_id,
      input.id,
      "Customer message follow-up",
      { command: "CustomerMessageFollowUp", record_version: 1, communication_id: m.id, state },
    ],
  );
  return input.id;
}
