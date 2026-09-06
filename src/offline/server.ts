import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { database } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { syncContext } from "../platform/sync-context";
import { readOperation } from "../shared/receipts";
import {
  object,
  uuid,
  version,
  choice,
  common,
  commonKeys,
} from "../shared/validation";
import {
  hash,
  startCommand,
  entryCommand,
  attachmentCommand,
  completionCommand,
  authorityFields,
} from "../field/validation";
import { startAttendance } from "../field/start";
import { captureEntry } from "../field/entries";
import {
  initiateAttachment,
  uploadAttachment,
  finaliseAttachment,
} from "../field/attachments";
import { submitCompletion, recordResponse } from "../reports/service";
import { submitCommand, responseCommand } from "../reports/validation";
import { saveCompletionDraft } from "../field/completion";
import { acknowledgePack } from "../documents/packs";
import {
  commands,
  canonical,
  original,
  type WireOperation,
  type Outcome,
  type Authority,
} from "./protocol";

export const digest = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
const zero = "00000000-0000-4000-8000-000000000000";
export function parseOperation(input: unknown, p: Principal): WireOperation {
  const r = object(input, [
    "schema_version",
    "operation_id",
    "actor_id",
    "workspace_id",
    "appointment_id",
    "command",
    "target_id",
    "authority",
    "depends_on",
    "supersedes_operation_id",
    "payload",
    "payload_hash",
  ]);
  if (r.schema_version !== 1)
    throw new AppError(
      422,
      "PayloadVersionUnsupported",
      "This saved version needs recovery. Its original is retained on this device.",
    );
  if (r.actor_id !== p.actor_id || r.workspace_id !== p.workspace_id)
    throw unavailable();
  const a = object(r.authority, [
    "assignment_id",
    "assignment_version",
    "schedule_version",
    "scope_revision_id",
    "scope_version",
    "scope_hash",
    "issue_id",
    "issue_hash",
  ]);
  const authority: Authority = {
    assignment_id: uuid(a.assignment_id, "assignment_id"),
    assignment_version: version(a.assignment_version),
    schedule_version: version(a.schedule_version),
    scope_revision_id: uuid(a.scope_revision_id, "scope_revision_id"),
    scope_version: version(a.scope_version),
    scope_hash: hash(a.scope_hash),
    issue_id: uuid(a.issue_id, "issue_id"),
    issue_hash: hash(a.issue_hash),
  };
  if (!Array.isArray(r.depends_on) || r.depends_on.length > 30)
    throw new AppError(
      422,
      "InvalidDependencies",
      "Choose at most 30 distinct dependencies.",
    );
  const depends_on = r.depends_on.map((x) => uuid(x, "depends_on"));
  if (
    new Set(depends_on).size !== depends_on.length ||
    depends_on.includes(String(r.operation_id))
  )
    throw new AppError(
      422,
      "InvalidDependencies",
      "An operation cannot depend on itself or repeat dependencies.",
    );
  const payload = object(r.payload, Object.keys((r.payload ?? {}) as object));
  const op: WireOperation = {
    schema_version: 1,
    operation_id: uuid(r.operation_id, "operation_id"),
    actor_id: p.actor_id,
    workspace_id: p.workspace_id,
    appointment_id: uuid(r.appointment_id, "appointment_id"),
    command: choice(r.command, "command", commands),
    target_id: r.target_id === null ? null : uuid(r.target_id, "target_id"),
    authority,
    depends_on,
    supersedes_operation_id:
      r.supersedes_operation_id === null
        ? null
        : uuid(r.supersedes_operation_id, "supersedes_operation_id"),
    payload,
    payload_hash: hash(r.payload_hash),
  };
  if (digest(original(op)) !== op.payload_hash)
    throw new AppError(
      409,
      "OperationConflict",
      "The original envelope hash does not match.",
    );
  if (payload.operation_id !== op.operation_id)
    throw new AppError(
      409,
      "OperationConflict",
      "Retain the original operation ID in the payload.",
    );
  validatePayload(op);
  return op;
}
function attendancePlaceholder(op: WireOperation) {
  const value = op.payload.attendance_id;
  if (value && typeof value === "object") {
    const r = object(value, ["operation_id"]),
      id = uuid(r.operation_id, "attendance_operation_id");
    if (!op.depends_on.includes(id))
      throw new AppError(
        422,
        "InvalidDependencies",
        "Declare the provisional start dependency.",
      );
    return { ...op.payload, attendance_id: zero };
  }
  return op.payload;
}
export function validatePayload(op: WireOperation) {
  let b = attendancePlaceholder(op);
  if (
    op.command === "SubmitCompletion" &&
    b.draft_revision_id &&
    typeof b.draft_revision_id === "object"
  ) {
    const ref = object(b.draft_revision_id, ["operation_id"]),
      id = uuid(ref.operation_id, "draft_operation_id");
    if (!op.depends_on.includes(id))
      throw new AppError(
        422,
        "InvalidDependencies",
        "Declare the exact original completion-draft dependency.",
      );
    b = { ...b, draft_revision_id: zero };
  }
  if (
    [
      "Correct",
      "AttachmentUpload",
      "AttachmentFinalise",
      "Acknowledge",
      "CustomerResponse",
    ].includes(op.command)
  ) {
    if (!op.target_id) throw unavailable();
  } else if (op.target_id !== null)
    throw new AppError(
      422,
      "InvalidTarget",
      "This command has no separate target.",
    );
  switch (op.command) {
    case "Start": {
      const s = startCommand(op.appointment_id, b),
        a = op.authority;
      for (const key of [
        "assignment_id",
        "assignment_version",
        "schedule_version",
        "scope_revision_id",
        "scope_version",
        "issue_id",
        "issue_hash",
      ] as const)
        if (s[key] !== a[key])
          throw new AppError(
            409,
            "AuthorityChanged",
            "Start intent must retain the downloaded authority.",
          );
      break;
    }
    case "Capture":
    case "Correct":
      entryCommand(b, op.command === "Correct" ? op.target_id! : undefined);
      break;
    case "AttachmentInitiate":
      attachmentCommand(b);
      break;
    case "AttachmentUpload": {
      const x = object(b, [
        ...commonKeys,
        "expected_version",
        "sha256",
        "byte_count",
      ]);
      common(x);
      version(x.expected_version);
      hash(x.sha256);
      if (
        !Number.isSafeInteger(x.byte_count) ||
        Number(x.byte_count) < 1 ||
        Number(x.byte_count) > 4194304
      )
        throw new AppError(
          422,
          "InvalidImageTransfer",
          "Choose a PNG no larger than 4 MiB.",
        );
      break;
    }
    case "AttachmentFinalise": {
      const x = object(b, [...commonKeys, "expected_version"]);
      common(x);
      version(x.expected_version);
      break;
    }
    case "SubmitCompletion":
      submitCommand(op.appointment_id, b);
      break;
    case "CustomerResponse":
      responseCommand(op.target_id!, b);
      break;
    case "CompletionDraft":
      completionCommand(op.appointment_id, b);
      break;
    case "Acknowledge": {
      const x = object(b, [
        ...commonKeys,
        "assignment_id",
        "assignment_version",
        "presented_hash",
        "captured_at",
      ]);
      common(x);
      authorityFields({ ...op.authority, expected_version: 1 });
      if (
        x.assignment_id !== op.authority.assignment_id ||
        x.assignment_version !== op.authority.assignment_version ||
        x.presented_hash !== op.authority.issue_hash ||
        op.target_id !== op.authority.issue_id
      )
        throw unavailable();
      break;
    }
  }
  if (b.appointment_id !== undefined && b.appointment_id !== op.appointment_id)
    throw unavailable();
}
async function dependencies(
  c: Pick<PoolClient, "query">,
  p: Principal,
  op: WireOperation,
) {
  for (const id of op.depends_on) {
    const row = (
      await c.query(
        "SELECT s.appointment_id,s.envelope,r.result FROM ppo.sync_acceptances s JOIN ppo.operation_receipts r ON r.id=s.receipt_id WHERE s.workspace_id=$1 AND s.actor_id=$2 AND s.operation_id=$3",
        [p.workspace_id, p.actor_id, id],
      )
    ).rows[0];
    if (
      !row ||
      row.appointment_id !== op.appointment_id ||
      ["Rejected", "Quarantined"].includes(row.result.state)
    )
      throw new AppError(
        409,
        "DependencyPending",
        "A required earlier operation is unavailable or needs review; other independent work is retained.",
      );
    if (
      row.envelope.command === "AttachmentFinalise" &&
      row.result.state !== "Available"
    )
      throw new AppError(
        409,
        "DependencyPending",
        "The required exact photo is not available.",
      );
  }
}
async function resolvedPayload(p: Principal, op: WireOperation) {
  await dependencies(database(), p, op);
  const b = { ...op.payload };
  if (b.attendance_id && typeof b.attendance_id === "object") {
    const dependency = (b.attendance_id as { operation_id: string })
      .operation_id;
    const a = (
      await database().query(
        "SELECT id FROM ppo.field_attendances WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND operation_id=$4",
        [p.workspace_id, p.actor_id, op.appointment_id, dependency],
      )
    ).rows[0];
    if (!a)
      throw new AppError(
        409,
        "DependencyPending",
        "The provisional start has not been accepted.",
      );
    b.attendance_id = a.id;
  }
  if (
    op.command === "SubmitCompletion" &&
    b.draft_revision_id &&
    typeof b.draft_revision_id === "object"
  ) {
    const dependency = (b.draft_revision_id as { operation_id: string })
      .operation_id;
    const d = (
      await database().query(
        "SELECT id FROM ppo.completion_draft_revisions WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND operation_id=$4",
        [p.workspace_id, p.actor_id, op.appointment_id, dependency],
      )
    ).rows[0];
    if (!d)
      throw new AppError(
        409,
        "DependencyPending",
        "The exact original completion draft has not been accepted.",
      );
    b.draft_revision_id = d.id;
  }
  return b;
}
async function validateAuthority(
  c: PoolClient,
  p: Principal,
  op: WireOperation,
  b: Record<string, unknown>,
) {
  if (["Start", "Acknowledge"].includes(op.command)) return;
  const attendanceId =
    b.attendance_id ??
    (op.command === "CustomerResponse"
      ? (
          await c.query(
            "SELECT attendance_id FROM ppo.service_reports WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND id=$4",
            [p.workspace_id, p.actor_id, op.appointment_id, op.target_id],
          )
        ).rows[0]?.attendance_id
      : undefined) ??
    (
      await c.query(
        "SELECT attendance_id FROM ppo.field_attachments WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND id=$4",
        [p.workspace_id, p.actor_id, op.appointment_id, op.target_id],
      )
    ).rows[0]?.attendance_id;
  const a = (
    await c.query(
      "SELECT assignment_id,assignment_version,schedule_version,scope_revision_id,scope_version,scope_hash,issue_id,issue_hash FROM ppo.field_attendances WHERE workspace_id=$1 AND actor_id=$2 AND appointment_id=$3 AND id=$4",
      [p.workspace_id, p.actor_id, op.appointment_id, attendanceId],
    )
  ).rows[0];
  if (!a || canonical(a) !== canonical(op.authority))
    throw new AppError(
      409,
      "AuthorityChanged",
      "Original evidence authority differs from the accepted attendance. Preserve it for recovery.",
    );
}
export async function syncOne(
  p: Principal,
  op: WireOperation,
  transfer?: string,
) {
  const saved = (
    await database().query(
      "SELECT payload_hash FROM ppo.sync_acceptances WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
      [p.workspace_id, p.actor_id, op.operation_id],
    )
  ).rows[0];
  if (saved) {
    await readOperation(p, op.operation_id);
    if (saved.payload_hash !== op.payload_hash)
      throw new AppError(
        409,
        "OperationConflict",
        "The accepted original envelope cannot be changed, including its dependencies or lineage.",
      );
  }
  const b = await resolvedPayload(p, op);
  return syncContext.run(
    {
      operation_id: op.operation_id,
      validate: async (c) => {
        await dependencies(c, p, op);
        await validateAuthority(c, p, op, b);
        // Both paths hold the same operation/workspace locks. An original
        // preserved for restricted review cannot also enter normal acceptance.
        const recovery = (
          await c.query(
            "SELECT payload_hash FROM ppo.offline_recovery_cases WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, op.operation_id],
          )
        ).rows[0];
        if (recovery)
          throw new AppError(
            409,
            recovery.payload_hash === op.payload_hash
              ? "RecoveryDispositionRequired"
              : "OperationConflict",
            "This original is retained in restricted recovery. Its owned disposition does not authorise normal acceptance or a replacement operation.",
          );
        if (op.supersedes_operation_id) {
          const source = (
            await c.query(
              "SELECT envelope FROM ppo.sync_acceptances WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND appointment_id=$4",
              [
                p.workspace_id,
                p.actor_id,
                op.supersedes_operation_id,
                op.appointment_id,
              ],
            )
          ).rows[0]?.envelope;
          if (
            !source ||
            (op.command === "Correct"
              ? source.payload.id !== op.target_id
              : op.command === "CompletionDraft"
                ? source.command !== "CompletionDraft" ||
                  source.payload.id !== op.payload.id
                : true)
          )
            throw new AppError(
              409,
              "LineageConflict",
              "A successor must name its exact previously accepted original.",
            );
        }
        const prior = (
          await c.query(
            "SELECT payload_hash FROM ppo.sync_acceptances WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
            [p.workspace_id, p.actor_id, op.operation_id],
          )
        ).rows[0];
        if (prior && prior.payload_hash !== op.payload_hash)
          throw new AppError(
            409,
            "OperationConflict",
            "This operation already has different original content.",
          );
      },
      accepted: async (c, receipt) => {
        await c.query(
          "INSERT INTO ppo.sync_acceptances(workspace_id,actor_id,operation_id,appointment_id,envelope,payload_hash,receipt_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
          [
            p.workspace_id,
            p.actor_id,
            op.operation_id,
            op.appointment_id,
            original(op),
            op.payload_hash,
            receipt.receipt_id,
          ],
        );
      },
    },
    async () => {
      switch (op.command) {
        case "Start":
          return startAttendance(p, op.appointment_id, b);
        case "Acknowledge":
          return acknowledgePack(p, op.target_id!, b);
        case "Capture":
          return captureEntry(p, b);
        case "Correct":
          return captureEntry(p, b, op.target_id!);
        case "AttachmentInitiate":
          return initiateAttachment(p, b);
        case "AttachmentUpload": {
          if (
            typeof transfer !== "string" ||
            transfer.length > 5592408 ||
            transfer.length % 4 !== 0 ||
            !/^[A-Za-z0-9+/]*={0,2}$/.test(transfer)
          )
            throw new AppError(
              422,
              "MissingOriginalBytes",
              "The original local PNG bytes are required.",
            );
          const bytes = Buffer.from(transfer, "base64");
          if (
            bytes.length !== b.byte_count ||
            createHash("sha256").update(bytes).digest("hex") !== b.sha256
          )
            throw new AppError(
              422,
              "AttachmentHashMismatch",
              "Transferred bytes differ from the original operation.",
            );
          return uploadAttachment(p, op.target_id!, {
            operation_id: op.operation_id,
            schema_version: 1,
            reason: b.reason,
            expected_version: b.expected_version,
            content_base64: transfer,
          });
        }
        case "AttachmentFinalise":
          return finaliseAttachment(p, op.target_id!, b);
        case "SubmitCompletion":
          return submitCompletion(p, op.appointment_id, b);
        case "CustomerResponse":
          return recordResponse(p, op.target_id!, b);
        case "CompletionDraft":
          return saveCompletionDraft(p, op.appointment_id, b);
      }
    },
  );
}
export async function syncBatch(
  p: Principal,
  input: unknown,
): Promise<{ outcomes: Outcome[] }> {
  const r = object(input, ["operations", "transfers"]);
  if (
    !Array.isArray(r.operations) ||
    r.operations.length < 1 ||
    r.operations.length > 20
  )
    throw new AppError(
      422,
      "BatchLimit",
      "Send between 1 and 20 original operations.",
    );
  const transfers = object(
    r.transfers ?? {},
    Object.keys((r.transfers ?? {}) as object),
  );
  const results = new Map<number, Outcome>(),
    pending = new Map<number, WireOperation>();
  const seen = new Set<string>();
  const failure = (index: number, e: unknown, id: string) => {
    const x =
      e instanceof AppError
        ? e
        : new AppError(
            503,
            "DependencyUnavailable",
            "Outcome is uncertain. Retry the original operation after checking the connection.",
          );
    results.set(index, {
      operation_id: id,
      state:
        x.code === "DependencyPending"
          ? "Pending"
          : x.code === "OperationConflict" || x.code === "TimeOverlap"
            ? "Conflict"
            : [401, 403, 404, 409].includes(x.status) ||
                x.code === "PayloadVersionUnsupported" ||
                x.code === "StartBlocked"
              ? "ReviewRequired"
              : "Failed",
      code: x.code,
      message: x.message,
      retryable: x.status === 503,
    });
  };
  r.operations.forEach((v, i) => {
    try {
      const op = parseOperation(v, p);
      if (seen.has(op.operation_id))
        throw new AppError(
          409,
          "OperationConflict",
          "Do not repeat an operation inside one batch.",
        );
      seen.add(op.operation_id);
      pending.set(i, op);
    } catch (e) {
      failure(
        i,
        e,
        typeof v?.operation_id === "string" ? v.operation_id : `invalid-${i}`,
      );
    }
  });
  while (pending.size) {
    let progress = false;
    for (const [index, op] of pending) {
      if (
        [...pending.values()].some((parent) =>
          op.depends_on.includes(parent.operation_id),
        )
      )
        continue;
      pending.delete(index);
      progress = true;
      try {
        const { receipt } = await syncOne(
          p,
          op,
          transfers[op.operation_id] as string | undefined,
        );
        const authorityReview =
          ["Capture", "Correct"].includes(op.command) &&
          (
            await database().query(
              "SELECT authority_state FROM ppo.field_entries WHERE workspace_id=$1 AND actor_id=$2 AND id=$3",
              [p.workspace_id, p.actor_id, receipt.record_id],
            )
          ).rows[0]?.authority_state === "ReviewRequired";
        results.set(index, {
          operation_id: op.operation_id,
          state:
            authorityReview ||
            ["Rejected", "Quarantined"].includes(receipt.state)
              ? "ReviewRequired"
              : "ServerSaved",
          receipt,
          ...(authorityReview
            ? {
                code: "AuthorityReviewRequired",
                message:
                  "Server retained this factual evidence and its original receipt. Current authority needs owned service review; no extra work is authorised.",
              }
            : {}),
        });
      } catch (e) {
        failure(index, e, op.operation_id);
      }
    }
    if (!progress) {
      for (const [i, op] of pending)
        failure(
          i,
          new AppError(
            409,
            "DependencyPending",
            "Cyclic or unavailable dependency. Originals are retained for review.",
          ),
          op.operation_id,
        );
      break;
    }
  }
  return {
    outcomes: [...results.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v),
  };
}
export async function syncReceipt(p: Principal, id: string) {
  // The existing receipt service performs current command capability and record/file scope checks.
  return readOperation(p, uuid(id, "operation_id"));
}
