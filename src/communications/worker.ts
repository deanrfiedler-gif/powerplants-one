import type { PoolClient } from "pg";
import {
  ChannelOutcomeUnknown,
  type ChannelSubmission,
  type CustomerMessageChannel,
} from "../adapters/contracts";
import { customerMessageChannel } from "../adapters/synthetic-mailbox";
import { database, transaction } from "../platform/database";
import type { Principal } from "../platform/identity";
import {
  appendEvent,
  communication,
  followUp,
  gate,
  latestEvent,
  type Communication,
} from "./records";

// Drains confirmed customer messages from ppo.outbox_jobs: one job per sender's confirmation.
// A job whose lease expired mid hand-over is never resubmitted: its message becomes OutcomeUnknown
// and a person reconciles it against the channel first (R4, R8).
type Claim = { job_id: string; lease_until: Date; m: Communication; sender: Principal; version: number };
const kind = "CustomerMessageConfirmed";
async function lockJob(c: PoolClient, id: string) {
  const job = (
    await c.query("SELECT * FROM ppo.outbox_jobs WHERE id=$1 AND kind=$2 FOR UPDATE SKIP LOCKED", [id, kind])
  ).rows[0];
  if (job)
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [job.workspace_id]);
  return job;
}
const finish = (c: PoolClient, id: string, status: string, code: string | null) =>
  c.query("UPDATE ppo.outbox_jobs SET status=$2,error_code=$3,lease_until=null WHERE id=$1", [id, status, code]);
async function claim(id: string): Promise<Claim | null> {
  return transaction(async (c) => {
    const job = await lockJob(c, id);
    if (!job) return null;
    const runnable =
      (["Ready", "Retry"].includes(job.status) && (!job.next_attempt_at || job.next_attempt_at <= new Date())) ||
      (job.status === "Running" && job.lease_until && job.lease_until < new Date());
    if (!runnable) return null;
    const sender: Principal = {
      workspace_id: job.workspace_id,
      actor_id: job.actor_id,
      display_name: "Named sender",
    };
    const m = await communication(c, job.workspace_id, job.payload.record_id);
    const latest = await latestEvent(c, m.workspace_id, m.id);
    if (job.status === "Running") {
      if (latest.state === "Queued") {
        const e = await appendEvent(c, sender, m, {
          version: latest.version + 1,
          state: "OutcomeUnknown",
          action: "Record",
          reason: "The hand-over was interrupted before its result was recorded.",
          evidence: "The worker's lease expired; whether the channel accepted the message is unknown. Reconcile before any retry.",
        });
        await followUp(c, sender, m, e.version, "OutcomeUnknown", null);
      }
      await finish(c, id, "OutcomeUnknown", "HandOverInterrupted");
      return null;
    }
    // A confirmation that held the message, or one already withdrawn, has nothing to hand over.
    if (latest.state !== "Queued") {
      await finish(c, id, latest.state === "Held" ? "Blocked" : "Done", latest.hold_reason);
      return null;
    }
    const hold = await gate(c, m);
    if (hold) {
      const e = await appendEvent(c, sender, m, {
        version: latest.version + 1,
        state: "Held",
        action: "Hold",
        hold_reason: hold,
        reason: "Checked again before hand-over.",
        evidence: "Held by the worker before any hand-over to the channel.",
      });
      await followUp(c, sender, m, e.version, "Held", hold);
      await finish(c, id, "Blocked", hold);
      return null;
    }
    const lease = (
      await c.query(
        "UPDATE ppo.outbox_jobs SET status='Running',attempts=attempts+1,lease_until=clock_timestamp()+interval '2 minutes',error_code=null WHERE id=$1 RETURNING lease_until",
        [id],
      )
    ).rows[0].lease_until as Date;
    return { job_id: id, lease_until: lease, m, sender, version: latest.version };
  });
}
async function record(claimed: Claim, result: ChannelSubmission | { outcome: "Unknown"; detail: string }) {
  await transaction(async (c) => {
    const job = await lockJob(c, claimed.job_id);
    // A worker that lost its lease records nothing; the reclaiming worker made the outcome unknown.
    if (!job || job.status !== "Running" || job.lease_until?.getTime() !== claimed.lease_until.getTime()) return;
    const m = claimed.m;
    const latest = await latestEvent(c, m.workspace_id, m.id);
    if (latest.state !== "Queued" || latest.version !== claimed.version) return;
    const base = { version: latest.version + 1, action: "Record" as const };
    if (result.outcome === "Submitted") {
      await appendEvent(c, claimed.sender, m, {
        ...base,
        state: "Submitted",
        provider_message_id: result.provider_message_id,
        reason: "Handed to the synthetic channel.",
        evidence: `The synthetic channel accepted the message as ${result.provider_message_id}. Accepted is not sent.`,
      });
      await finish(c, job.id, "Done", null);
    } else if (result.outcome === "Failed") {
      const e = await appendEvent(c, claimed.sender, m, {
        ...base,
        state: "Failed",
        reason: "The synthetic channel refused the message.",
        evidence: `${result.error_code}: ${result.detail}`,
      });
      await followUp(c, claimed.sender, m, e.version, "Failed", null);
      await finish(c, job.id, "Done", result.error_code);
    } else {
      const e = await appendEvent(c, claimed.sender, m, {
        ...base,
        state: "OutcomeUnknown",
        reason: "The hand-over's result is unknown.",
        evidence: `${result.detail} Reconcile before any retry.`,
      });
      await followUp(c, claimed.sender, m, e.version, "OutcomeUnknown", null);
      await finish(c, job.id, "OutcomeUnknown", "HandOverUnknown");
    }
  });
}
export async function processCustomerMessageJob(
  id: string,
  channel: CustomerMessageChannel = customerMessageChannel(),
) {
  const claimed = await claim(id);
  if (!claimed) return false;
  const { m } = claimed;
  let result: ChannelSubmission | { outcome: "Unknown"; detail: string };
  try {
    result = await channel.submit({
      workspace_id: m.workspace_id,
      communication_id: m.id,
      to: { name: m.recipient_name!, address: m.recipient_address! },
      subject: m.subject!,
      body: m.body!,
      content_hash: m.content_hash!,
    });
  } catch (e) {
    result = {
      outcome: "Unknown",
      detail: e instanceof ChannelOutcomeUnknown ? e.message : "The channel failed without a known result.",
    };
  }
  await record(claimed, result);
  return true;
}
// Sent Items, non-delivery reports and delivery evidence move a handed-over message forward.
// Silence never becomes Delivered.
export async function observeCustomerMessages(
  channel: CustomerMessageChannel = customerMessageChannel(),
  limit = 50,
) {
  const rows = (
    await database().query(
      `SELECT c.workspace_id,c.id FROM ppo.customer_communications c JOIN LATERAL (SELECT state,occurred_at FROM ppo.customer_communication_events e
       WHERE e.workspace_id=c.workspace_id AND e.communication_id=c.id ORDER BY version DESC LIMIT 1) l ON true
       WHERE l.state='Submitted' OR (l.state='Sent' AND l.occurred_at>clock_timestamp()-interval '14 days') ORDER BY l.occurred_at,c.id LIMIT $1`,
      [limit],
    )
  ).rows as { workspace_id: string; id: string }[];
  let moved = 0;
  for (const row of rows) {
    const o = await channel.observe(row.workspace_id, row.id);
    if (!o.found) continue;
    moved += await transaction(async (c) => {
      await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [row.workspace_id]);
      const m = await communication(c, row.workspace_id, row.id);
      const sender: Principal = {
        workspace_id: m.workspace_id,
        actor_id: (
          await c.query(
            "SELECT actor_id FROM ppo.customer_communication_events WHERE workspace_id=$1 AND communication_id=$2 AND action='Confirm' ORDER BY version DESC LIMIT 1",
            [m.workspace_id, m.id],
          )
        ).rows[0].actor_id,
        display_name: "Named sender",
      };
      let latest = await latestEvent(c, m.workspace_id, m.id);
      let changes = 0;
      if (latest.state === "Submitted") {
        latest = await appendEvent(c, sender, m, {
          version: latest.version + 1,
          state: "Sent",
          action: "Record",
          provider_message_id: o.provider_message_id,
          reason: "The channel's sent copy was found.",
          evidence: `Copy ${o.provider_message_id} found in the synthetic Sent Items by PPO's message identifier.`,
        });
        changes++;
      }
      if (latest.state === "Sent" && o.failed) {
        const e = await appendEvent(c, sender, m, {
          version: latest.version + 1,
          state: "Failed",
          action: "Record",
          provider_message_id: o.provider_message_id,
          reason: "A non-delivery report was matched to this message.",
          evidence: o.failed.detail,
        });
        await followUp(c, sender, m, e.version, "Failed", null);
        changes++;
      } else if (latest.state === "Sent" && o.delivered) {
        await appendEvent(c, sender, m, {
          version: latest.version + 1,
          state: "Delivered",
          action: "Record",
          provider_message_id: o.provider_message_id,
          reason: "Positive delivery evidence was recorded.",
          evidence: "The synthetic message trace shows the recipient's server accepted it. This is not a read receipt.",
        });
        changes++;
      }
      return changes;
    });
  }
  return moved;
}
export async function runCustomerMessageJobs(limit = 10) {
  const channel = customerMessageChannel();
  const jobs = (
    await database().query(
      `SELECT id FROM ppo.outbox_jobs WHERE kind=$1 AND ((status IN ('Ready','Retry') AND (next_attempt_at IS NULL OR next_attempt_at<=clock_timestamp()))
       OR (status='Running' AND lease_until<clock_timestamp())) ORDER BY created_at,id LIMIT $2`,
      [kind, limit],
    )
  ).rows as { id: string }[];
  let handed = 0;
  for (const j of jobs) if (await processCustomerMessageJob(j.id, channel)) handed++;
  return { examined: jobs.length, handed, observed: await observeCustomerMessages(channel) };
}
