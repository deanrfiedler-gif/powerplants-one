import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { AppError, unavailable } from "../../platform/errors";
import { companyContext } from "../../shared/authority";
import {
  sharedOperation,
  type OperationResult,
} from "../../platform/operations";
import {
  choice,
  common,
  commonKeys,
  instant,
  invalid,
  narrative,
  object,
  uuid,
  version,
} from "../../shared/validation";
import {
  authoriseActivityInput,
  insertActivity,
  mutateActivity,
  visibleActivity,
  activityLinks,
  type ActivityInput,
} from "../../activities/activities";
import {
  applyFindingNextAction,
  nextActionInput,
} from "../findings/next-action";
import {
  actionInput,
  allowedAction,
  createCaseInput,
  hashBytes,
  hashValue,
  pastInstant,
  sha,
  technicalText,
} from "./model";
import {
  assetContext,
  caseContext,
  caseOwner,
  findingEquipment,
  activeFinding,
  supportRoute,
} from "./context";
import { captureConfiguration, technicalEvidence } from "./pack-source";
import { fileInput, renderEvidence } from "./evidence";
import type { EscalationCase } from "./types";
export const caseCommandPrefix = "ServiceEscalation:";
const mismatch = () =>
  new AppError(
    409,
    "VersionConflict",
    "This case changed. Keep your entries and compare the current version.",
  );
type Context = Awaited<ReturnType<typeof caseContext>>;
async function event(
  c: PoolClient,
  p: Principal,
  row: EscalationCase,
  kind: string,
  at: string,
  details: Record<string, unknown>,
) {
  const id = randomUUID();
  await c.query(
    "INSERT INTO ppo.service_escalation_events(id,workspace_id,case_id,kind,occurred_at,details,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [id, p.workspace_id, row.id, kind, at, JSON.stringify(details), p.actor_id],
  );
  return id;
}
// Child changes share the case transaction; only its primary audit owns the operation ID.
// Native Activity history links back through parent_operation_id, as other composite commands do.
async function activityAudit(
  c: PoolClient,
  p: Principal,
  operation: string,
  reason: string,
  row: OperationResult,
  caseId: string,
) {
  await c.query(
    "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES($1,$2,$3,'Activity',$4,'Accepted',$5,$6)",
    [
      randomUUID(),
      p.workspace_id,
      p.actor_id,
      row.id,
      reason,
      {
        command: "ServiceEscalation:Activity",
        parent_operation_id: operation,
        case_id: caseId,
        record_version: row.version,
        ...row.audit_details,
      },
    ],
  );
}
async function finishChase(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  operation: string,
  reason: string,
) {
  if (!ctx.row.chase_activity_id) return;
  const a = await visibleActivity(c, p, ctx.row.chase_activity_id);
  if (!["Open", "InProgress"].includes(a.status)) return;
  try {
    await authoriseActivityInput(c, p, {
      ...a,
      links: await activityLinks(c, p, a.id),
    });
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    // Source-owned cancellation may be completed by a current coordinator even
    // when the original owner can no longer own work. Retain that owner/history.
    await companyContext(
      c,
      p,
      a.company_id,
      a.site_id,
      "service.work_order.edit",
    );
    await companyContext(c, p, a.company_id, a.site_id, "activity.edit");
  }
  // Source resolution cancels the reminder, not the finding or technician's next action.
  const result = await mutateActivity(
    c,
    p,
    a,
    a.version,
    { cancellation_reason: reason },
    "cancel",
  );
  await activityAudit(c, p, operation, reason, result, ctx.row.id);
}
async function caseFile(
  c: PoolClient,
  p: Principal,
  row: EscalationCase,
  value: unknown,
  replyId: string | null,
) {
  const file = fileInput(value, replyId === null),
    id = randomUUID();
  await c.query(
    "INSERT INTO ppo.service_escalation_files(id,workspace_id,case_id,reply_id,kind,media_type,content,sha256,confirmed_exclusions,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      id,
      p.workspace_id,
      row.id,
      replyId,
      replyId ? "ReplyAttachment" : "Photo",
      file.media_type,
      file.bytes,
      file.sha256,
      replyId === null,
      p.actor_id,
    ],
  );
  return {
    id,
    media_type: file.media_type,
    sha256: file.sha256,
    bytes: file.bytes.length,
  };
}
async function exactPack(
  c: PoolClient,
  p: Principal,
  ctx: Context,
  id: string,
) {
  const pack = (
    await c.query<{
      id: string;
      content_version: number;
      evidence_sha256: string;
      html_sha256: string;
      pdf_sha256: string;
      html: string;
      pdf: Buffer;
      created_at: Date;
    }>(
      "SELECT id,content_version,evidence_sha256,html_sha256,pdf_sha256,html,pdf,created_at FROM ppo.service_escalation_packs WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
      [p.workspace_id, ctx.row.id, id],
    )
  ).rows[0];
  if (!pack) throw unavailable();
  if (
    pack.content_version !== ctx.row.content_version ||
    pack.evidence_sha256 !== hashValue(await technicalEvidence(c, p, ctx))
  )
    throw new AppError(
      409,
      "EvidenceChanged",
      "Evidence changed after preparation. Prepare and review a new pack.",
    );
  if (
    hashBytes(pack.html) !== pack.html_sha256 ||
    hashBytes(pack.pdf) !== pack.pdf_sha256
  )
    throw Error("Retained pack hash mismatch");
  return pack;
}
export async function createCase(p: Principal, input: unknown) {
  const command = createCaseInput(input);
  return sharedOperation(
    p,
    command,
    `${caseCommandPrefix}Open`,
    async (c) => {
      const ctx = await findingEquipment(
        c,
        p,
        command.finding_key,
        command.asset_id,
      );
      await caseOwner(
        c,
        p,
        command.owner_id,
        command.finding_key,
        command.asset_id,
      );
      return ctx;
    },
    async (c, ctx) => {
      activeFinding(ctx);
      if (!ctx.asset.manufacturer)
        invalid(
          "asset_id",
          "Record the equipment manufacturer in Equipment first.",
        );
      return (
        await c.query<EscalationCase>(
          "INSERT INTO ppo.service_escalation_cases(id,workspace_id,company_id,site_id,asset_id,finding_key,owner_id,fault,fault_type,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *",
          [
            command.id,
            p.workspace_id,
            ctx.asset.company_id,
            ctx.asset.site_id,
            command.asset_id,
            command.finding_key,
            command.owner_id,
            command.fault,
            command.fault_type,
            p.actor_id,
          ],
        )
      ).rows[0];
    },
    "EscalationCase",
    "EscalationCaseChanged",
  );
}
export async function recordSupportRoute(
  p: Principal,
  id: string,
  input: unknown,
) {
  const raw = object(input, [
      ...commonKeys,
      "expected_version",
      "method",
      "recipient",
    ]),
    method = choice(raw.method, "method", ["Email", "Portal"] as const),
    recipient = narrative(raw.recipient, "recipient", 500);
  if (
    method === "Email" &&
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(recipient)
  )
    invalid("recipient", "Use the manufacturer's support email address.");
  if (method === "Portal") {
    let url: URL;
    try {
      url = new URL(recipient);
    } catch {
      invalid("recipient", "Use the manufacturer's HTTPS support portal.");
    }
    if (
      url!.protocol !== "https:" ||
      url!.username ||
      url!.password ||
      url!.search ||
      url!.hash
    )
      invalid(
        "recipient",
        "Use an HTTPS portal address without credentials or access tokens.",
      );
  }
  const cmd = {
    ...common(raw),
    id: uuid(id, "asset_id"),
    expected_version: version(raw.expected_version),
    method,
    recipient,
  };
  return sharedOperation(
    p,
    cmd,
    `${caseCommandPrefix}SupportRoute`,
    async (c) => {
      const asset = await assetContext(c, p, id);
      await companyContext(
        c,
        p,
        asset.company_id,
        asset.site_id,
        "shared.edit",
      );
      return asset;
    },
    async (c, asset) => {
      if (asset.version !== cmd.expected_version) throw mismatch();
      if (!asset.manufacturer)
        invalid(
          "manufacturer",
          "Record the equipment manufacturer in Equipment first.",
        );
      await c.query(
        "INSERT INTO ppo.equipment_support_routes(workspace_id,asset_id,manufacturer,method,recipient,updated_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(workspace_id,asset_id) DO UPDATE SET version=ppo.equipment_support_routes.version+1,manufacturer=excluded.manufacturer,method=excluded.method,recipient=excluded.recipient,updated_by=excluded.updated_by,updated_at=clock_timestamp()",
        [p.workspace_id, id, asset.manufacturer, method, recipient, p.actor_id],
      );
      const saved = (
        await c.query(
          "UPDATE ppo.assets SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2 RETURNING *,identity_status AS state",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      return {
        ...saved,
        audit_details: { manufacturer: asset.manufacturer, method, recipient },
      };
    },
    "Asset",
    "SharedRecordUpdated",
  );
}
export async function commandCase(p: Principal, id: string, input: unknown) {
  const parsed = actionInput(input),
    cmd: ReturnType<typeof actionInput> & { id: string } = {
      ...parsed,
      id: uuid(id, "id"),
    };
  return sharedOperation(
    p,
    cmd,
    `${caseCommandPrefix}${cmd.action}`,
    async (c) => {
      const ctx = await caseContext(c, p, id);
      if (cmd.action === "next_action") {
        await companyContext(
          c,
          p,
          ctx.row.company_id,
          ctx.row.site_id,
          "service.work_order.edit",
        );
        await companyContext(
          c,
          p,
          ctx.row.company_id,
          ctx.row.site_id,
          "activity.edit",
        );
      }
      return ctx;
    },
    async (c, ctx) => {
      const row = ctx.row;
      if (row.version !== cmd.expected_version) throw mismatch();
      if (!allowedAction(row.state, cmd.action))
        invalid(
          "action",
          "This action is unavailable in the current case state.",
        );
      const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
          .rows[0].now,
        changes: Partial<EscalationCase> = {},
        details: Record<string, unknown> = { action: cmd.action };
      const changedEvidence = () => {
        changes.content_version = row.content_version + 1;
        changes.reviewed_pack_id = null;
      };
      switch (cmd.action) {
        case "diagnose": {
          const at = pastInstant(cmd.attempted_at, "attempted_at", now);
          const diagnostic = technicalText(cmd.diagnostic, "diagnostic"),
            result = technicalText(cmd.result, "result"),
            source_reference = technicalText(
              cmd.source_reference,
              "source_reference",
              300,
            );
          details.event_id = await event(c, p, row, "Diagnostic", at, {
            diagnostic,
            result,
            source_reference,
          });
          changedEvidence();
          break;
        }
        case "photo": {
          if (cmd.confirmed_exclusions !== true)
            invalid(
              "confirmed_exclusions",
              "Review the photo and confirm it contains no customer contact details, prices or credentials.",
            );
          const count = (
            await c.query<{ count: number }>(
              "SELECT count(*)::int count FROM ppo.service_escalation_files WHERE workspace_id=$1 AND case_id=$2 AND kind='Photo'",
              [p.workspace_id, id],
            )
          ).rows[0].count;
          if (count >= 10)
            invalid(
              "photo",
              "A case can retain up to ten reviewed technical photos.",
            );
          details.file = await caseFile(
            c,
            p,
            row,
            {
              media_type: cmd.media_type,
              content_base64: cmd.content_base64,
              sha256: cmd.sha256,
            },
            null,
          );
          changedEvidence();
          break;
        }
        case "capture_configuration":
          changes.current_configuration_id = await captureConfiguration(
            c,
            p,
            ctx,
          );
          changedEvidence();
          break;
        case "prepare_pack": {
          const evidence = await technicalEvidence(c, p, ctx),
            rendered = await renderEvidence(evidence),
            packId = randomUUID();
          const revision = (
            await c.query<{ next: number }>(
              "SELECT coalesce(max(revision),0)+1 AS next FROM ppo.service_escalation_packs WHERE workspace_id=$1 AND case_id=$2",
              [p.workspace_id, id],
            )
          ).rows[0].next;
          await c.query(
            "INSERT INTO ppo.service_escalation_packs(id,workspace_id,case_id,revision,content_version,evidence,evidence_sha256,html,html_sha256,pdf,pdf_sha256,renderer_version,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
            [
              packId,
              p.workspace_id,
              id,
              revision,
              row.content_version,
              JSON.stringify(evidence),
              hashValue(evidence),
              rendered.html,
              rendered.html_sha256,
              rendered.pdf,
              rendered.pdf_sha256,
              rendered.renderer_version,
              p.actor_id,
            ],
          );
          changes.latest_pack_id = packId;
          changes.reviewed_pack_id = null;
          details.pack_id = packId;
          details.html_sha256 = rendered.html_sha256;
          details.pdf_sha256 = rendered.pdf_sha256;
          break;
        }
        case "review_pack": {
          const pack = await exactPack(c, p, ctx, uuid(cmd.pack_id, "pack_id"));
          if (pack.id !== row.latest_pack_id)
            invalid("pack_id", "Review the latest prepared pack.");
          if (
            cmd.confirmed_exclusions !== true ||
            sha(cmd.html_sha256, "html_sha256") !== pack.html_sha256 ||
            sha(cmd.pdf_sha256, "pdf_sha256") !== pack.pdf_sha256
          )
            invalid(
              "confirmed_exclusions",
              "Review both retained files and confirm their hashes and the exclusions.",
            );
          await c.query(
            "INSERT INTO ppo.service_escalation_pack_reviews(workspace_id,case_id,pack_id,html_sha256,pdf_sha256,confirmed_exclusions,reviewed_by) VALUES($1,$2,$3,$4,$5,true,$6) ON CONFLICT DO NOTHING",
            [
              p.workspace_id,
              id,
              pack.id,
              pack.html_sha256,
              pack.pdf_sha256,
              p.actor_id,
            ],
          );
          changes.reviewed_pack_id = pack.id;
          details.pack_id = pack.id;
          break;
        }
        case "record_sent": {
          const pack = await exactPack(c, p, ctx, uuid(cmd.pack_id, "pack_id"));
          if (
            row.reviewed_pack_id !== pack.id ||
            row.latest_pack_id !== pack.id
          )
            invalid(
              "pack_id",
              "Review the current evidence pack before recording it as sent.",
            );
          const route = await supportRoute(c, p, ctx.asset);
          if (
            !route ||
            cmd.method !== route.method ||
            cmd.recipient !== route.recipient
          )
            invalid(
              "recipient",
              "Choose the current maintained support route for this equipment manufacturer.",
            );
          const sent_at = pastInstant(cmd.sent_at, "sent_at", now),
            reply_expected_at = instant(
              cmd.reply_expected_at,
              "reply_expected_at",
            ),
            sent_by = uuid(cmd.sent_by, "sent_by");
          if (Date.parse(sent_at) < pack.created_at.getTime())
            invalid(
              "sent_at",
              "Sending cannot predate the reviewed evidence pack.",
            );
          if (
            Date.parse(sent_at) < row.created_at.getTime() ||
            Date.parse(reply_expected_at) <= Date.parse(sent_at)
          )
            invalid(
              "reply_expected_at",
              "The reply must be expected after the actual sending time, and sending cannot predate this case.",
            );
          await caseOwner(c, p, sent_by, row.finding_key, row.asset_id);
          await caseOwner(c, p, row.owner_id, row.finding_key, row.asset_id);
          const manufacturer_reference = narrative(
            cmd.manufacturer_reference,
            "manufacturer_reference",
            200,
          );
          const reminder: ActivityInput = {
            id: randomUUID(),
            company_id: row.company_id,
            site_id: row.site_id,
            kind: "TechnicalFollowUp",
            access_class: "RestrictedService",
            owner_id: row.owner_id,
            summary: `Chase manufacturer reply for ${row.display_number}`,
            due_at: reply_expected_at,
            due_needed: false,
            links: [
              { object_type: "Site", object_id: row.site_id },
              { object_type: "Asset", object_id: row.asset_id },
            ],
          };
          await authoriseActivityInput(c, p, reminder);
          const activity = await insertActivity(c, p, reminder);
          await activityAudit(
            c,
            p,
            cmd.operation_id,
            cmd.reason,
            activity,
            row.id,
          );
          const sent_by_name = (
            await c.query<{ display_name: string }>(
              "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, sent_by],
            )
          ).rows[0].display_name;
          changes.last_reply_id = null; // Earlier replies remain immutable events, not replies to this sending.
          changes.last_sent_id = await event(c, p, row, "Sent", sent_at, {
            pack_id: pack.id,
            html_sha256: pack.html_sha256,
            pdf_sha256: pack.pdf_sha256,
            sent_by,
            sent_by_name,
            method: route.method,
            recipient: route.recipient,
            manufacturer_reference,
            reply_expected_at,
          });
          changes.chase_activity_id = activity.id;
          changes.state = "WaitingOnManufacturer";
          details.event_id = changes.last_sent_id;
          details.chase_activity_id = activity.id;
          break;
        }
        case "record_reply": {
          const received_at = pastInstant(cmd.received_at, "received_at", now),
            sent = (
              await c.query<{ occurred_at: Date }>(
                "SELECT occurred_at FROM ppo.service_escalation_events WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
                [p.workspace_id, id, row.last_sent_id],
              )
            ).rows[0];
          if (!sent || Date.parse(received_at) < sent.occurred_at.getTime())
            invalid(
              "received_at",
              "The reply cannot predate the recorded sending time.",
            );
          if (typeof cmd.settings_change !== "boolean")
            invalid(
              "settings_change",
              "State whether the advice changes controller settings.",
            );
          if (!Array.isArray(cmd.attachments) || cmd.attachments.length > 5)
            invalid(
              "attachments",
              "Include up to five PNG, JPEG or PDF reply attachments.",
            );
          const reply = technicalText(cmd.reply, "reply", 10000),
            advice = technicalText(cmd.advice, "advice", 4000);
          changes.last_reply_id = await event(c, p, row, "Reply", received_at, {
            reply,
            advice,
            settings_change: cmd.settings_change,
            sent_id: row.last_sent_id,
          });
          const files = [];
          for (const f of cmd.attachments)
            files.push(await caseFile(c, p, row, f, changes.last_reply_id));
          await finishChase(
            c,
            p,
            ctx,
            cmd.operation_id,
            "Manufacturer reply recorded; no further chase is required for this sending.",
          );
          changes.state = "ReplyToActOn";
          details.event_id = changes.last_reply_id;
          details.files = files;
          break;
        }
        case "next_action": {
          const reply = (
            await c.query<{ details: { settings_change: boolean } }>(
              "SELECT details FROM ppo.service_escalation_events WHERE workspace_id=$1 AND case_id=$2 AND id=$3",
              [p.workspace_id, id, row.last_reply_id],
            )
          ).rows[0];
          if (
            typeof cmd.grower_approval_required !== "boolean" ||
            (reply.details.settings_change && !cmd.grower_approval_required)
          )
            invalid(
              "grower_approval_required",
              "Record that the grower's approval is required before any controller settings change.",
            );
          const instruction = technicalText(
            cmd.instruction,
            "instruction",
            1800,
          );
          const next = nextActionInput(row.finding_key, {
            schema_version: 1,
            operation_id: cmd.operation_id,
            reason: cmd.reason,
            source_token: cmd.source_token,
            expected_version: cmd.expected_finding_version,
            owner_id: cmd.owner_id,
            due_at: cmd.due_at,
            instruction: cmd.grower_approval_required
              ? `Obtain grower approval before changing controller settings. ${instruction}`
              : instruction,
            required_evidence: cmd.required_evidence,
          });
          const result = await applyFindingNextAction(c, p, next, ctx.finding);
          await activityAudit(
            c,
            p,
            cmd.operation_id,
            cmd.reason,
            result,
            row.id,
          );
          changes.next_action_id = result.id;
          changes.next_action_reply_id = row.last_reply_id;
          details.event_id = await event(
            c,
            p,
            row,
            "NextAction",
            now.toISOString(),
            {
              activity_id: result.id,
              activity_version: result.version,
              grower_approval_required: cmd.grower_approval_required,
            },
          );
          break;
        }
        case "follow_up":
          details.event_id = await event(
            c,
            p,
            row,
            "FollowUp",
            now.toISOString(),
            { question: technicalText(cmd.question, "question") },
          );
          changes.state = "Diagnosing";
          changedEvidence();
          break;
        case "close":
        case "withdraw": {
          if (
            cmd.action === "close" &&
            (!row.next_action_id ||
              row.next_action_reply_id !== row.last_reply_id)
          )
            invalid(
              "next_action",
              "Record an owned next action for this reply before closing the case.",
            );
          if (cmd.action === "close") {
            if (ctx.finding.item.action?.id !== row.next_action_id)
              invalid(
                "next_action",
                "The finding’s next action changed. Record the current action before closing.",
              );
            const owned = await visibleActivity(c, p, row.next_action_id!);
            if (owned.status === "Cancelled")
              invalid(
                "next_action",
                "The next action was cancelled. Resolve its source disposition before closing this case.",
              );
            if (["Open", "InProgress"].includes(owned.status))
              await authoriseActivityInput(c, p, {
                ...owned,
                links: await activityLinks(c, p, owned.id),
              });
          }
          changes.outcome = technicalText(cmd.outcome, "outcome");
          changes.state = cmd.action === "close" ? "Closed" : "Withdrawn";
          if (cmd.action === "withdraw")
            await finishChase(
              c,
              p,
              ctx,
              cmd.operation_id,
              "Escalation case withdrawn; the source finding is unchanged.",
            );
          details.event_id = await event(
            c,
            p,
            row,
            changes.state,
            now.toISOString(),
            { outcome: changes.outcome, finding_unchanged: true },
          );
          break;
        }
      }
      const entries = Object.entries(changes);
      const saved = (
        await c.query<EscalationCase>(
          `UPDATE ppo.service_escalation_cases SET ${entries
            .map(([key], i) => `${key}=$${i + 4}`)
            .concat(
              "version=version+1",
              "updated_at=clock_timestamp()",
              "updated_by=$3",
            )
            .join(",")} WHERE workspace_id=$1 AND id=$2 RETURNING *`,
          [
            p.workspace_id,
            id,
            p.actor_id,
            ...entries.map(([, value]) => value),
          ],
        )
      ).rows[0];
      return {
        ...saved,
        audit_details: {
          ...details,
          previous_version: row.version,
          before: { state: row.state },
          after: { state: saved.state },
        },
      };
    },
    "EscalationCase",
    "EscalationCaseChanged",
  );
}
