import { randomUUID } from "node:crypto";
import {
  prepareCustomerMessage,
  proposeCustomerEmailTemplate,
  publishCustomerEmailTemplate,
  setMessageClassSwitch,
  type MessageClass,
  type MessageSource,
} from "../../src/communications";
import { database } from "../../src/platform/database";
import type { Principal } from "../../src/platform/identity";
import type { Capability } from "../../src/platform/permissions";
import { createProject } from "../../src/projects/service";
import { CRM } from "./crm";
import { projectInput } from "./projects";

// D-025 S2 test fixtures. Every address is synthetic (example.invalid) and the tag in its local
// part chooses the synthetic channel's simulated behaviour.
export const demand = "5c000049-0000-4000-8000-000000000001";
export const avery = CRM.person;
export const base = (reason = "SYN D-025 S2 communication core proof") => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason,
});
export async function grant(p: Principal, caps: Capability[], company = CRM.company) {
  for (const cap of caps)
    await database().query(
      `INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,scope_type,scope_id)
       SELECT $1,$2,$3,$4,'Company',$3 WHERE NOT EXISTS(SELECT 1 FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND company_id=$3 AND capability=$4 AND scope_type='Company')`,
      [p.workspace_id, p.actor_id, company, cap],
    );
}
// A current synthetic contact of the demonstration customer.
export async function contact(email: string | null, name = `SYN Contact ${email ?? "without address"}`) {
  const id = randomUUID();
  const db = database();
  await db.query(
    "INSERT INTO ppo.people(id,workspace_id,display_name,email,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$5)",
    [id, CRM.workspace, name, email, CRM.owner],
  );
  await db.query("INSERT INTO ppo.person_company_contexts(workspace_id,company_id,person_id) VALUES($1,$2,$3)", [
    CRM.workspace,
    CRM.company,
    id,
  ]);
  await db.query(
    "INSERT INTO ppo.relationships(id,workspace_id,company_id,organisation_id,person_id,role_label,valid_from,created_by,updated_by) VALUES($1,$2,$3,$4,$5,'SYN delivery contact','2026-01-01',$6,$6)",
    [randomUUID(), CRM.workspace, CRM.company, CRM.org, id, CRM.owner],
  );
  return id;
}
export const definition = (cls: MessageClass, subject = "Dispatch – your order is on its way") => ({
  schema_version: 1,
  family: "CUS-EMAIL",
  message_class: cls,
  audience: "Customer",
  subject: `[{{source.reference}}] ${subject}`,
  body: [
    "Hello {{recipient.name}},",
    "This is a synthetic message about {{source.reference}} for {{customer.name}} at {{site.name}}.",
  ],
});
// One person proposes, a second publishes the exact definition (DK-06 rules).
export async function publishTemplate(author: Principal, publisher: Principal, cls: MessageClass, subject?: string) {
  const proposed = await proposeCustomerEmailTemplate(author, {
    ...base(),
    company_id: CRM.company,
    message_class: cls,
    definition: definition(cls, subject),
  });
  const hash = (
    await database().query("SELECT definition_hash FROM ppo.customer_email_template_proposals WHERE id=$1", [
      proposed.receipt.record_id,
    ])
  ).rows[0].definition_hash;
  return publishCustomerEmailTemplate(publisher, proposed.receipt.record_id, {
    ...base(),
    definition_hash: hash,
    approval_note: "SYN wording approved once for the synthetic channel; no promotional content.",
  });
}
export async function switchOn(p: Principal, cls: MessageClass) {
  const current = (
    await database().query(
      "SELECT coalesce(max(version),0) AS v FROM ppo.customer_message_switch_events WHERE company_id=$1 AND message_class=$2",
      [CRM.company, cls],
    )
  ).rows[0].v;
  return setMessageClassSwitch(p, {
    ...base("SYN switch the class to the synthetic channel"),
    company_id: CRM.company,
    message_class: cls,
    mode: "Synthetic",
    expected_version: Number(current),
  });
}
// The synthetic test source stands in for the stage that builds each class's trigger (S3, S6).
export function testSource(
  cls: MessageClass,
  source_id: string,
  recipient: string | null,
  fact_version = 1,
): MessageSource {
  return {
    message_class: cls,
    source_type: cls === "ProjectUpdate" ? "Project" : "SupplyDemand",
    source_id,
    async resolve() {
      return { fact_version, facts: {}, recipient: { role: "SYN delivery contact", contact_id: recipient } };
    },
  };
}
export async function prepare(p: Principal, source: MessageSource, extra: Record<string, unknown> = {}) {
  const communication_id = randomUUID();
  const result = await prepareCustomerMessage(p, source, { ...base(), communication_id, ...extra });
  return { id: communication_id, ...result };
}
export async function project(p: Principal) {
  const input = projectInput();
  await createProject(p, input);
  return input.id;
}
export const latest = async (id: string) =>
  (
    await database().query(
      "SELECT state,version,hold_reason FROM ppo.customer_communication_events WHERE communication_id=$1 ORDER BY version DESC LIMIT 1",
      [id],
    )
  ).rows[0] as { state: string; version: number; hold_reason: string | null };
export const message = async (id: string) =>
  (await database().query("SELECT * FROM ppo.customer_communications WHERE id=$1", [id])).rows[0];
export const followUps = async (id: string) =>
  (
    await database().query(
      "SELECT a.id,a.kind,a.owner_id,a.status,a.summary FROM ppo.customer_communication_follow_ups f JOIN ppo.activities a ON a.id=f.activity_id WHERE f.communication_id=$1 ORDER BY f.created_at",
      [id],
    )
  ).rows;
