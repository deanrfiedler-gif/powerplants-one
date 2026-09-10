import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { syntheticEmailSamples } from "../src/email/provider";

function fixtureId(owner: string, key: string) {
  const bytes = createHash("sha256")
    .update(`ppo-demo-mailbox-v1/${owner}/${key}`)
    .digest();
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = bytes.subarray(0, 16).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Operator-only, under reconcileTesters' transaction/advisory lock. Re-running
// invitations never changes existing sources, links, follow-ups or meeting dates.
export async function seedTesterMailbox(
  c: PoolClient,
  workspace: string,
  company: string,
  owner: string,
  now = new Date(),
) {
  const day = new Date(now.getTime() + 10 * 3600000).toISOString().slice(0, 10);
  for (const [source, subject, body] of syntheticEmailSamples) {
    const id = fixtureId(owner, source);
    await c.query(
      `INSERT INTO ppo.email_messages
      (id,workspace_id,company_id,owner_id,provider,provider_id,created_by,updated_by,sender_name,sender_address,subject,body_text,received_at)
      SELECT $1,$2,$3,$4,'Synthetic',$5,$4,$4,'Casey Rowan','casey@banksia.example',$6,$7,$8
      WHERE NOT EXISTS(SELECT 1 FROM ppo.email_messages WHERE workspace_id=$2 AND id=$1)`,
      [
        id,
        workspace,
        company,
        owner,
        `demo-v1/${source}`,
        subject,
        body,
        `${day}T08:00:00+10:00`,
      ],
    );
  }
  for (const [key, title, start, end, privateEvent] of [
    ["scope-review", "Irrigation scope review", "10:00", "10:30", false],
    ["personal", "Personal appointment", "12:30", "13:00", true],
  ] as const) {
    await c.query(
      `INSERT INTO ppo.email_calendar_events
      (id,workspace_id,company_id,owner_id,provider,title,starts_at,ends_at,private)
      VALUES($1,$2,$3,$4,'Synthetic',$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`,
      [
        fixtureId(owner, key),
        workspace,
        company,
        owner,
        title,
        `${day}T${start}:00+10:00`,
        `${day}T${end}:00+10:00`,
        privateEvent,
      ],
    );
  }
}
