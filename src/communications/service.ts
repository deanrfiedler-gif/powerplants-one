import type { PoolClient } from "pg";
import { customerMessageChannel } from "../adapters/synthetic-mailbox";
import type { ChannelObservation } from "../adapters/contracts";
import { AppError } from "../platform/errors";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { scopedOwner, companyContext } from "../shared/authority";
import {
  common,
  commonKeys,
  invalid,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { classRules, type MessageClass, type SourceType, type HoldReason } from "./model";
import {
  appendEvent,
  communication,
  conflict,
  followUp,
  gate,
  insertRow,
  latestEvent,
  readSource,
  recipientCheck,
  switchMode,
  type Communication,
  type SourceRecord,
} from "./records";
import { contentHash, render, type TemplateDefinition } from "./templates";

// C1: every customer message is requested from this service; no module calls a channel itself.
// The requesting module supplies what only it knows. S2 ships no source: M1/M2 arrive in S3,
// M3 in S5 and M4 in S6. The core reads the source record itself (R3) and derives the follow-up owner.
export type ResolvedFacts = {
  // The version of the facts this message states (R8): a changed fact makes a successor message.
  fact_version: number;
  // Class facts beyond the shared bindings, keyed by allowlisted binding (none exist in S2).
  facts: Readonly<Record<string, string | null>>;
  // R1: the named role on the source record, and the contact it names (null when nobody is named).
  recipient: { role: string; contact_id: string | null };
};
export type MessageSource = {
  message_class: MessageClass;
  source_type: SourceType;
  source_id: string;
  // Authorises the caller for this class's trigger, inside the preparation transaction.
  resolve(c: PoolClient, p: Principal, source: SourceRecord): Promise<ResolvedFacts>;
};

async function allowlist(c: PoolClient, cls: MessageClass) {
  return (
    await c.query(
      "SELECT binding FROM ppo.customer_email_bindings WHERE message_class=$1 ORDER BY binding",
      [cls],
    )
  ).rows.map((r) => r.binding as string);
}
export async function currentTemplate(c: PoolClient, w: string, company: string, cls: MessageClass) {
  return (
    await c.query(
      "SELECT id,version,definition,definition_hash FROM ppo.customer_email_templates WHERE workspace_id=$1 AND company_id=$2 AND message_class=$3 ORDER BY version DESC LIMIT 1",
      [w, company, cls],
    )
  ).rows[0] as { id: string; version: number; definition: string; definition_hash: string } | undefined;
}
async function named(c: PoolClient, w: string, table: "organisations" | "sites", id: string | null) {
  if (!id) return null;
  return ((await c.query(`SELECT display_name FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`, [w, id])).rows[0]?.display_name as string) ?? null;
}

// PPO drafts the message from the source record: content, recipient and template are fixed here.
export async function prepareCustomerMessage(
  p: Principal,
  source: MessageSource,
  input: unknown,
) {
  const r = object(input, [...commonKeys, "communication_id", "supersedes_id"]);
  const cmd = {
    ...common(r),
    communication_id: uuid(r.communication_id, "communication_id"),
    supersedes_id: optionalId(r.supersedes_id, "supersedes_id"),
    message_class: source.message_class,
    source_type: source.source_type,
    source_id: uuid(source.source_id, "source_id"),
  };
  const rule = classRules[cmd.message_class];
  if (rule.source_type !== cmd.source_type)
    invalid("source_type", "This message class is not prepared from that kind of record.");
  return sharedOperation(
    p,
    cmd,
    "PrepareCustomerMessage",
    async (c) => {
      const record = await readSource(c, p, cmd.source_type, cmd.source_id);
      const resolved = await source.resolve(c, p, record);
      // The owner must be able to see the follow-up the service may open for them.
      await scopedOwner(c, p, record.owner_id, record.company_id, record.site_id ?? undefined, "activity.read");
      return { record, resolved };
    },
    async (c, { record, resolved }) => {
      const w = p.workspace_id;
      if ((await switchMode(c, w, record.company_id, cmd.message_class)) === "Off")
        conflict("MessageClassOff", `${rule.label} messages are switched off for this company. Nothing was prepared.`);
      if (!Number.isSafeInteger(resolved.fact_version) || resolved.fact_version < 1)
        invalid("fact_version", "A positive source fact version is required.");
      const bindings = await allowlist(c, cmd.message_class);
      for (const key of Object.keys(resolved.facts))
        if (!bindings.includes(key) || ["customer.name", "recipient.name", "site.name", "source.reference"].includes(key))
          invalid("facts", `${key} is not a class fact this template family can bind.`);
      const named_contact = resolved.recipient.contact_id ? uuid(resolved.recipient.contact_id, "recipient.contact_id") : null;
      const recipient = await recipientCheck(c, w, { ...record, message_class: cmd.message_class }, named_contact);
      const contact = recipient.person?.id ?? null;
      const existing = (
        await c.query(
          `SELECT c.id FROM ppo.customer_communications c WHERE c.workspace_id=$1 AND c.message_class=$2 AND c.source_type=$3 AND c.source_id=$4
           AND c.source_fact_version=$5 AND c.recipient_contact_id IS NOT DISTINCT FROM $6::uuid AND ppo.customer_communication_latest(c.workspace_id,c.id)<>'Withdrawn'`,
          [w, cmd.message_class, cmd.source_type, cmd.source_id, resolved.fact_version, contact],
        )
      ).rows[0];
      if (existing)
        conflict("MessageAlreadyPrepared", "A message for this fact and recipient already exists. Withdraw it before preparing another.");
      if (cmd.supersedes_id) {
        const prior = (
          await c.query(
            "SELECT c.*,ppo.customer_communication_latest(c.workspace_id,c.id) AS state FROM ppo.customer_communications c WHERE c.workspace_id=$1 AND c.id=$2",
            [w, cmd.supersedes_id],
          )
        ).rows[0];
        if (
          !prior || prior.message_class !== cmd.message_class || prior.source_id !== cmd.source_id ||
          prior.recipient_contact_id !== contact || prior.source_fact_version >= resolved.fact_version ||
          !["Submitted", "Sent", "Delivered"].includes(prior.state)
        )
          conflict("CorrectionNotApplicable", "A correction succeeds a sent message about an earlier version of the same fact.");
      }
      let hold: HoldReason | null = recipient.hold;
      const template = await currentTemplate(c, w, record.company_id, cmd.message_class);
      if (!template) hold ??= "TemplateUnavailable";
      const facts: Record<string, string | null> = {
        "customer.name": await named(c, w, "organisations", record.organisation_id),
        "recipient.name": recipient.person?.display_name ?? null,
        "site.name": await named(c, w, "sites", record.site_id),
        "source.reference": record.reference,
        ...resolved.facts,
      };
      const rendered = template
        ? render(JSON.parse(template.definition) as TemplateDefinition, facts, Boolean(cmd.supersedes_id))
        : null;
      if (rendered?.missing.length) hold ??= "MissingData";
      const address = recipient.person?.email ?? null;
      const m = (await insertRow(c, "customer_communications", {
        id: cmd.communication_id,
        workspace_id: w,
        company_id: record.company_id,
        site_id: record.site_id,
        organisation_id: record.organisation_id,
        message_class: cmd.message_class,
        review_class: rule.review,
        source_type: cmd.source_type,
        source_id: cmd.source_id,
        source_reference: record.reference,
        source_fact_version: resolved.fact_version,
        recipient_role: resolved.recipient.role,
        recipient_contact_id: contact,
        recipient_name: recipient.person?.display_name ?? null,
        recipient_address: address,
        template_id: rendered?.body ? template!.id : null,
        template_version: rendered?.body ? template!.version : null,
        template_hash: rendered?.body ? template!.definition_hash : null,
        facts,
        subject: rendered?.subject ?? null,
        body: rendered?.body ?? null,
        content_hash: rendered?.body ? contentHash(address, rendered.subject, rendered.body) : null,
        correction: Boolean(cmd.supersedes_id),
        supersedes_id: cmd.supersedes_id,
        owner_id: record.owner_id,
        prepared_by: p.actor_id,
        operation_id: cmd.operation_id,
      })) as Communication;
      const state = hold ? "Held" : "Prepared";
      const event = await appendEvent(c, p, m, {
        version: 1,
        state,
        action: "Prepare",
        operation_id: cmd.operation_id,
        hold_reason: hold,
        reason: cmd.reason,
        evidence: hold
          ? `Drafted by PPO from ${record.reference} fact version ${resolved.fact_version}; held before any hand-over.`
          : `Drafted by PPO from ${record.reference} fact version ${resolved.fact_version} with template version ${template!.version}; waiting for a named sender.`,
      });
      const follow_up_id = hold ? await followUp(c, p, m, 1, "Held", hold) : null;
      return {
        id: m.id,
        version: 1,
        state,
        updated_at: event.occurred_at,
        audit_details: {
          message_class: m.message_class,
          source_type: m.source_type,
          source_id: m.source_id,
          source_fact_version: m.source_fact_version,
          recipient_contact_id: m.recipient_contact_id,
          template_id: m.template_id,
          template_version: m.template_version,
          content_hash: m.content_hash,
          hold_reason: hold,
          follow_up_id,
          channel: "Synthetic",
        },
      };
    },
    "CustomerCommunication",
    "CustomerMessagePrepared",
  );
}

// The sender reads the record through its source and holds the send duty and the class's working duty.
async function senderContext(c: PoolClient, p: Principal, id: string) {
  const m = await communication(c, p.workspace_id, uuid(id, "id"));
  await readSource(c, p, m.source_type, m.source_id);
  await companyContext(c, p, m.company_id, m.site_id, "customer_message.send");
  await companyContext(c, p, m.company_id, m.site_id, classRules[m.message_class].working);
  return m;
}
async function expectedLatest(c: PoolClient, m: Communication, expected: number) {
  const latest = await latestEvent(c, m.workspace_id, m.id);
  if (latest.version !== expected)
    throw new AppError(409, "VersionConflict", "This message changed. Review its saved state.");
  return latest;
}

// C2 as changed on 16 October: a named person sends. The sender confirms the exact prepared content.
export async function confirmCustomerMessage(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "expected_version", "content_hash"]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    content_hash:
      typeof r.content_hash === "string" && /^[a-f0-9]{64}$/.test(r.content_hash)
        ? r.content_hash
        : invalid("content_hash", "Confirm the exact content hash of the prepared message."),
  };
  return sharedOperation(
    p,
    cmd,
    "ConfirmCustomerMessage",
    (c) => senderContext(c, p, cmd.id),
    async (c, m) => {
      const latest = await expectedLatest(c, m, cmd.expected_version);
      if (latest.state !== "Prepared")
        conflict("MessageNotPrepared", "Only a prepared message can be confirmed for sending.");
      if (m.content_hash !== cmd.content_hash)
        conflict("ContentChanged", "The prepared content differs from what you reviewed.");
      if (m.review_class === "Reviewed" && m.prepared_by === p.actor_id)
        conflict("IndependentSenderRequired", "A reviewed message is sent by someone other than the person who prepared it.");
      const hold = await gate(c, m);
      const event = await appendEvent(c, p, m, {
        version: latest.version + 1,
        state: hold ? "Held" : "Queued",
        action: hold ? "Hold" : "Confirm",
        operation_id: cmd.operation_id,
        hold_reason: hold,
        reason: cmd.reason,
        evidence: hold
          ? "Checked again at confirmation; held before any hand-over."
          : `${p.display_name} confirmed content ${m.content_hash} for the synthetic channel.`,
      });
      const follow_up_id = hold ? await followUp(c, p, m, event.version, "Held", hold) : null;
      return {
        id: m.id,
        version: event.version,
        state: event.state,
        updated_at: event.occurred_at,
        audit_details: { content_hash: m.content_hash, hold_reason: hold, follow_up_id, channel: "Synthetic" },
      };
    },
    "CustomerCommunication",
    "CustomerMessageConfirmed",
  );
}

export async function withdrawCustomerMessage(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "expected_version"]);
  const cmd = { ...common(r), id: uuid(id, "id"), expected_version: version(r.expected_version) };
  return sharedOperation(
    p,
    cmd,
    "WithdrawCustomerMessage",
    (c) => senderContext(c, p, cmd.id),
    async (c, m) => {
      const latest = await expectedLatest(c, m, cmd.expected_version);
      if (!["Prepared", "Held"].includes(latest.state))
        conflict("MessageNotWithdrawable", "Only a prepared or held message can be withdrawn; it was never handed over.");
      const event = await appendEvent(c, p, m, {
        version: latest.version + 1,
        state: "Withdrawn",
        action: "Withdraw",
        operation_id: cmd.operation_id,
        reason: cmd.reason,
        evidence: `Withdrawn from ${latest.state} before any hand-over.`,
      });
      return { id: m.id, version: event.version, state: "Withdrawn", updated_at: event.occurred_at };
    },
    "CustomerCommunication",
    "CustomerMessageWithdrawn",
  );
}

// R4/R8: an unknown outcome is reconciled against the channel's own record before any retry.
export async function reconcileCustomerMessage(p: Principal, id: string, input: unknown) {
  const r = object(input, [...commonKeys, "expected_version"]);
  const cmd = { ...common(r), id: uuid(id, "id"), expected_version: version(r.expected_version) };
  let observation: ChannelObservation | null = null;
  return sharedOperation(
    p,
    cmd,
    "ReconcileCustomerMessage",
    async (c) => {
      const m = await senderContext(c, p, cmd.id);
      // The channel is searched once per command, before any state is written.
      observation ??= await customerMessageChannel().observe(m.workspace_id, m.id);
      return m;
    },
    async (c, m) => {
      const latest = await expectedLatest(c, m, cmd.expected_version);
      if (latest.state !== "OutcomeUnknown")
        conflict("MessageNotUnknown", "Only a message with an unknown outcome is reconciled.");
      const o = observation!;
      const state = !o.found ? "Queued" : o.failed ? "Failed" : "Sent";
      const event = await appendEvent(c, p, m, {
        version: latest.version + 1,
        state,
        action: "Reconcile",
        operation_id: cmd.operation_id,
        provider_message_id: o.found ? o.provider_message_id : null,
        reason: cmd.reason,
        evidence: !o.found
          ? "The synthetic channel holds no copy of this message, so it was never accepted; queued again."
          : o.failed
            ? `The synthetic channel's copy ${o.provider_message_id} has a non-delivery report: ${o.failed.detail}`
            : `The synthetic channel's copy ${o.provider_message_id} was found in Sent Items.`,
      });
      if (state === "Queued")
        await c.query(
          "UPDATE ppo.outbox_jobs SET status='Retry',next_attempt_at=clock_timestamp(),lease_until=null,error_code=null WHERE workspace_id=$1 AND kind='CustomerMessageConfirmed' AND payload->>'record_id'=$2",
          [m.workspace_id, m.id],
        );
      const follow_up_id = state === "Failed" ? await followUp(c, p, m, event.version, "Failed", null) : null;
      return {
        id: m.id,
        version: event.version,
        state,
        updated_at: event.occurred_at,
        audit_details: { provider_message_id: o.found ? o.provider_message_id : null, follow_up_id, channel: "Synthetic" },
      };
    },
    "CustomerCommunication",
    "CustomerMessageReconciled",
  );
}
