import { randomBytes, randomUUID, createHash } from "node:crypto";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import {
  requireCapability,
  hasPermission,
  type QueryClient,
} from "../platform/permissions";
import {
  lockOperation,
  recordOperation,
  sharedOperation,
} from "../platform/operations";
import {
  common,
  commonKeys,
  object,
  uuid,
  narrative,
  choice,
} from "../shared/validation";
import { readReport, presentationBytes } from "../reports/service";
import { readFieldJob } from "../field/reads";
import { fieldContext } from "../field/context";
import { insertActivity } from "../activities/activities";
import { documentStore } from "../documents/store";
import { inspectPng } from "../field/media";
import { verifiedAttachmentBytes } from "../field/attachments";
import { parseOperation, digest } from "./server";
import { canonical, original, type Authority } from "./protocol";

const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function downloadContext(
  p: Principal,
  id: string,
  input: unknown,
) {
  object(input, []);
  const job = (await readFieldJob(p, uuid(id, "appointment_id"))).items[0];
  if (!job.pack?.current_issue_id || !job.pack.output_hash)
    throw new AppError(
      422,
      "IssuedContextRequired",
      "Prepare an exact issued pack before downloading this job.",
    );
  const a = job.attendance;
  const authority: Authority = a
    ? {
        assignment_id: a.assignment_id,
        assignment_version: a.assignment_version,
        schedule_version: a.schedule_version,
        scope_revision_id: a.scope_revision_id,
        scope_version: a.scope_version,
        scope_hash: a.scope_hash,
        issue_id: a.issue_id,
        issue_hash: a.issue_hash,
      }
    : {
        assignment_id: job.assignment.id,
        assignment_version: job.assignment_version,
        schedule_version: job.schedule_version,
        scope_revision_id: job.scope_revision_id,
        scope_version: job.scope_version,
        scope_hash: job.scope.hash,
        issue_id: job.pack.current_issue_id,
        issue_hash: job.pack.output_hash,
      };
  const token = randomBytes(32).toString("hex"),
    idGrant = randomUUID();
  await transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const { a: current, w } = await fieldContext(c, p, id);
    if (current.version !== job.version)
      throw new AppError(
        409,
        "VersionConflict",
        "The job changed while downloading. Refresh it before trying again.",
      );
    await requireCapability(c, p, "field.capture.own");
    if (
      !(await hasPermission(
        c,
        p,
        "field.capture.own",
        current.company_id,
        current.site_id,
      ))
    )
      throw unavailable();
    await c.query(
      "INSERT INTO ppo.offline_recovery_grants(id,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,token_hash,authority,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,clock_timestamp()+interval '7 days')",
      [
        idGrant,
        p.workspace_id,
        p.actor_id,
        current.company_id,
        current.site_id,
        id,
        w.service_owner_id,
        tokenHash(token),
        authority,
      ],
    );
    await c.query(
      "INSERT INTO ppo.audit_events(id,workspace_id,actor_id,object_type,object_id,outcome,reason,details) VALUES($1,$2,$3,'Appointment',$4,'Accepted','Synthetic offline recovery capability prepared',$5)",
      [
        randomUUID(),
        p.workspace_id,
        p.actor_id,
        id,
        {
          grant_id: idGrant,
          authority_hash: digest(authority),
          synthetic: true,
        },
      ],
    );
  });
  const report_presentations = [];
  if (
    job.report &&
    (await hasPermission(
      database(),
      p,
      "report.read",
      (await fieldContext(database(), p, id)).a.company_id,
      job.site.id,
    ))
  ) {
    const report = (await readReport(p, job.report.id)).items[0];
    if (["Reviewed", "Issued"].includes(report.status) && report.can_respond)
      for (const v of report.presentations
        .filter(
          (v: { revision_id: string }) =>
            v.revision_id === report.revisions[0].id,
        )
        .slice(0, 2)) {
        const b = await presentationBytes(p, report.id, v.id);
        if (Buffer.byteLength(b.html) > 1048576)
          throw new AppError(
            422,
            "ReportCacheLimit",
            "This exact presentation exceeds the bounded offline size. Use its online presentation.",
          );
        report_presentations.push({
          id: v.id,
          report_id: report.id,
          report_version: report.version,
          revision_id: v.revision_id,
          kind: v.kind,
          content_hash: v.content_hash,
          html: b.html,
          created_at: v.created_at,
        });
      }
  }
  // The existing purpose-built service DTO has no Finance or internal metadata. Retain only own captures.
  return {
    owner: p,
    report_presentations,
    verified_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    authority,
    recovery: {
      id: idGrant,
      token,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    job: {
      ...job,
      entries: job.entries.filter((e) => e.actor_id === p.actor_id),
      attachments: job.attachments.filter((e) => e.actor_id === p.actor_id),
      follow_ups: [],
      online_only: false,
    },
  };
}
async function active(c: QueryClient, p: Principal) {
  if (
    !(
      await c.query(
        "SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
        [p.workspace_id, p.actor_id],
      )
    ).rowCount
  )
    throw new AppError(
      401,
      "AuthenticationRequired",
      "Re-authentication is required. Original local evidence remains retained.",
    );
}
async function recoveryGrant(
  c: QueryClient,
  p: Principal,
  id: string,
  token: unknown,
) {
  await active(c, p);
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
    throw unavailable();
  const grant = (
    await c.query(
      "SELECT * FROM ppo.offline_recovery_grants WHERE workspace_id=$1 AND actor_id=$2 AND id=$3 AND token_hash=$4 AND expires_at>clock_timestamp()",
      [p.workspace_id, p.actor_id, uuid(id, "grant_id"), tokenHash(token)],
    )
  ).rows[0];
  if (!grant) throw unavailable();
  return grant;
}
function minimal(row: Record<string, unknown>, disposition = "ReviewRequired") {
  return {
    case_id: row.id,
    operation_id: row.operation_id,
    payload_hash: row.payload_hash,
    recovery_receipt_id: row.receipt_id,
    received_at: row.received_at,
    disposition,
    normal_acceptance: false,
  };
}
export async function preserveRecovery(p: Principal, input: unknown) {
  const r = object(input, ["grant_id", "token", "operation", "content_base64"]),
    op = parseOperation(r.operation, p);
  if (["Start", "Acknowledge"].includes(op.command))
    throw new AppError(
      422,
      "EvidenceOnly",
      "A rejected authority intent stays local. Recovery accepts factual evidence, not permission to start or acknowledge.",
    );
  return transaction(async (c) => {
    await lockOperation(c, p, op.operation_id);
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const grant = await recoveryGrant(c, p, String(r.grant_id), r.token);
    if (
      grant.appointment_id !== op.appointment_id ||
      canonical(grant.authority) !== canonical(op.authority)
    )
      throw unavailable();
    const prior = (
      await c.query(
        "SELECT * FROM ppo.offline_recovery_cases WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, op.operation_id],
      )
    ).rows[0];
    if (prior) {
      if (prior.payload_hash !== op.payload_hash)
        throw new AppError(
          409,
          "OperationConflict",
          "This recovery identity has different original content.",
        );
      return minimal(prior);
    }
    // Recovery cannot create a second equivalent accepted capture after a lost response.
    const accepted = (
      await c.query(
        "SELECT payload_hash FROM ppo.sync_acceptances WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, op.operation_id],
      )
    ).rows[0];
    if (accepted)
      throw new AppError(
        409,
        accepted.payload_hash === op.payload_hash
          ? "AlreadyAccepted"
          : "OperationConflict",
        "This original already has a server outcome. Current normal permissions are required to recover its normal receipt; no duplicate recovery copy was created.",
      );
    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.users WHERE workspace_id=$1 AND id=$2 AND active",
          [p.workspace_id, grant.owner_id],
        )
      ).rowCount
    )
      throw new AppError(
        422,
        "RecoveryOwnerUnavailable",
        "Retain the original locally until a service owner can receive it.",
      );
    let byteHash: string | null = null,
      byteCount: number | null = null,
      storageId: string | null = null;
    if (op.command === "AttachmentUpload") {
      if (
        typeof r.content_base64 !== "string" ||
        r.content_base64.length > 5592408 ||
        r.content_base64.length % 4 !== 0 ||
        !/^[A-Za-z0-9+/]*={0,2}$/.test(r.content_base64)
      )
        throw new AppError(
          422,
          "MissingOriginalBytes",
          "The complete original PNG is required.",
        );
      const bytes = Buffer.from(r.content_base64, "base64");
      byteHash = tokenHashBytes(bytes);
      byteCount = bytes.length;
      if (byteHash !== op.payload.sha256 || byteCount !== op.payload.byte_count)
        throw new AppError(
          422,
          "AttachmentHashMismatch",
          "Recovery bytes differ from the saved original.",
        );
      inspectPng(bytes);
      storageId = op.operation_id;
      await documentStore().store(
        { ...p, operation_id: storageId },
        bytes,
        byteHash,
      );
      await verifiedAttachmentBytes(p, {
        storage_item_id: storageId,
        content_hash: byteHash,
        byte_count: byteCount,
      });
    } else if (r.content_base64 !== undefined)
      throw new AppError(
        422,
        "UnexpectedBytes",
        "Only an original photo transfer can include bytes.",
      );
    const activity = await insertActivity(c, p, {
      id: randomUUID(),
      company_id: grant.company_id,
      site_id: grant.site_id,
      kind: "TechnicalFollowUp",
      owner_id: grant.owner_id,
      summary:
        "SYN offline evidence requires restricted service-owner disposition. Contact the technician before further work.",
      due_at: null,
      due_needed: true,
      access_class: "RestrictedService",
      links: [{ object_type: "Site", object_id: grant.site_id }],
    });
    // A separate server-owned operation records quarantine, never consumes the original business operation ID.
    const receipt = await recordOperation(
      c,
      p,
      {
        operation_id: randomUUID(),
        reason: "Preserve original synthetic offline evidence for owned review",
      },
      {
        id: activity.id,
        version: activity.version,
        state: activity.state,
        updated_at: activity.updated_at,
      },
      "Activity",
      "ActivityCreated",
      op.payload_hash,
      {
        command: "PreserveOfflineRecovery",
        original_operation_id: op.operation_id,
        grant_id: grant.id,
      },
    );
    const row = (
      await c.query(
        "INSERT INTO ppo.offline_recovery_cases(id,workspace_id,actor_id,operation_id,grant_id,activity_id,receipt_id,envelope,payload_hash,byte_hash,byte_count,storage_item_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
        [
          randomUUID(),
          p.workspace_id,
          p.actor_id,
          op.operation_id,
          grant.id,
          activity.id,
          receipt.receipt_id,
          original(op),
          op.payload_hash,
          byteHash,
          byteCount,
          storageId,
        ],
      )
    ).rows[0];
    return minimal(row);
  });
}
const tokenHashBytes = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
export async function ownRecovery(p: Principal, id: string) {
  const c = database();
  await active(c, p);
  const row = (
    await c.query(
      "SELECT id,operation_id,payload_hash,receipt_id,received_at FROM ppo.offline_recovery_cases WHERE workspace_id=$1 AND actor_id=$2 AND id=$3",
      [p.workspace_id, p.actor_id, uuid(id, "case_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const d = (
    await c.query(
      "SELECT disposition FROM ppo.offline_recovery_dispositions WHERE workspace_id=$1 AND case_id=$2 ORDER BY received_at DESC,id DESC LIMIT 1",
      [p.workspace_id, id],
    )
  ).rows[0];
  return minimal(row, d?.disposition);
}
async function ownerCase(c: QueryClient, p: Principal, id: string) {
  await requireCapability(c, p, "service.work_order.edit");
  const row = (
    await c.query(
      "SELECT r.*,g.owner_id,g.company_id,g.site_id,g.appointment_id FROM ppo.offline_recovery_cases r JOIN ppo.offline_recovery_grants g ON g.id=r.grant_id WHERE r.workspace_id=$1 AND r.id=$2 AND g.owner_id=$3",
      [p.workspace_id, uuid(id, "case_id"), p.actor_id],
    )
  ).rows[0];
  if (
    !row ||
    !(await hasPermission(
      c,
      p,
      "service.work_order.edit",
      row.company_id,
      row.site_id,
    )) ||
    !(await hasPermission(
      c,
      p,
      "activity.edit",
      row.company_id,
      row.site_id,
    )) ||
    !(await hasPermission(c, p, "activity.read", row.company_id, row.site_id))
  )
    throw unavailable();
  return row;
}
export async function listRecovery(p: Principal) {
  await requireCapability(database(), p, "service.work_order.edit");
  const candidates = (
      await database().query(
        "SELECT r.id FROM ppo.offline_recovery_cases r JOIN ppo.offline_recovery_grants g ON g.id=r.grant_id WHERE r.workspace_id=$1 AND g.owner_id=$2 ORDER BY r.received_at DESC LIMIT 100",
        [p.workspace_id, p.actor_id],
      )
    ).rows,
    items = [];
  for (const candidate of candidates)
    try {
      items.push(await reviewRecovery(p, candidate.id));
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  return { items };
}
export async function reviewRecovery(p: Principal, id: string) {
  const r = await ownerCase(database(), p, id);
  const dispositions = (
    await database().query(
      "SELECT disposition,reason,received_at,actor_id FROM ppo.offline_recovery_dispositions WHERE workspace_id=$1 AND case_id=$2 ORDER BY received_at,id",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    ...minimal(r),
    actor_id: r.actor_id,
    appointment_id: r.appointment_id,
    owner_id: r.owner_id,
    activity_id: r.activity_id,
    envelope: r.envelope,
    byte_hash: r.byte_hash,
    byte_count: r.byte_count,
    dispositions,
  };
}
export async function recoveryBytes(p: Principal, id: string) {
  const row = await ownerCase(database(), p, id);
  if (!row.storage_item_id) throw unavailable();
  return verifiedAttachmentBytes(p, {
    storage_item_id: row.storage_item_id,
    content_hash: row.byte_hash,
    byte_count: row.byte_count,
  });
}
export async function dispositionRecovery(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [...commonKeys, "disposition", "note"]),
    cmd = {
      ...common(r),
      case_id: uuid(id, "case_id"),
      disposition: choice(r.disposition, "disposition", [
        "RetainedForReview",
        "ClarificationRequired",
      ] as const),
      note: narrative(r.note, "note", 2000),
    };
  return sharedOperation(
    p,
    cmd,
    "DispositionOfflineRecovery",
    (c) => ownerCase(c, p, id),
    async (c, row) => {
      await c.query(
        "INSERT INTO ppo.offline_recovery_dispositions(id,workspace_id,case_id,actor_id,disposition,reason) VALUES($1,$2,$3,$4,$5,$6)",
        [
          randomUUID(),
          p.workspace_id,
          id,
          p.actor_id,
          cmd.disposition,
          cmd.note,
        ],
      );
      const activity = (
        await c.query(
          "SELECT id,version,updated_at FROM ppo.activities WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, row.activity_id],
        )
      ).rows[0];
      return {
        ...activity,
        state: cmd.disposition,
        audit_details: { case_id: id, disposition: cmd.disposition },
      };
    },
    "Activity",
    "ActivityUpdated",
  );
}
